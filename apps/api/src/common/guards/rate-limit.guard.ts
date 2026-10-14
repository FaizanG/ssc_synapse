import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";

import {
  RATE_LIMIT_KEY,
  type RateLimitPolicy,
} from "../decorators/rate-limit.decorator.js";

type Bucket = { count: number; resetsAt: number };

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();
  private readonly defaultPolicy: RateLimitPolicy = {
    limit: 120,
    windowMs: 60_000,
  };

  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context
      .switchToHttp()
      .getResponse<{ setHeader(name: string, value: string): void }>();
    const policy =
      this.reflector.getAllAndOverride<RateLimitPolicy>(RATE_LIMIT_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? this.defaultPolicy;
    const identity = request.actor?.userId ?? request.ip ?? "unknown";
    const route = `${request.method}:${request.route?.path ?? request.path}`;
    const key = `${identity}:${route}`;
    const now = Date.now();
    const current = this.buckets.get(key);
    const bucket =
      !current || current.resetsAt <= now
        ? { count: 0, resetsAt: now + policy.windowMs }
        : current;
    bucket.count += 1;
    this.buckets.set(key, bucket);

    response.setHeader("RateLimit-Limit", String(policy.limit));
    response.setHeader(
      "RateLimit-Remaining",
      String(Math.max(0, policy.limit - bucket.count)),
    );
    response.setHeader(
      "RateLimit-Reset",
      String(Math.ceil(bucket.resetsAt / 1000)),
    );

    if (this.buckets.size > 10_000) {
      for (const [bucketKey, value] of this.buckets)
        if (value.resetsAt <= now) this.buckets.delete(bucketKey);
    }
    if (bucket.count > policy.limit) {
      throw new HttpException(
        {
          code: "RATE_LIMITED",
          message: "Too many requests. Try again shortly.",
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
