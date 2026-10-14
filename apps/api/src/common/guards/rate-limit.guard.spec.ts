import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RateLimit } from "../decorators/rate-limit.decorator.js";
import { RateLimitGuard } from "./rate-limit.guard.js";

class TestController {
  @RateLimit({ limit: 1, windowMs: 60_000 })
  endpoint() {}
}

describe("RateLimitGuard", () => {
  let guard: RateLimitGuard;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [Reflector, RateLimitGuard],
    }).compile();
    guard = module.get(RateLimitGuard);
  });

  it("resolves Reflector injection and enforces route metadata", () => {
    const setHeader = vi.fn();
    const request = {
      method: "GET",
      ip: "127.0.0.1",
      path: "/test",
      route: { path: "/test" },
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({ setHeader }),
      }),
      getHandler: () => TestController.prototype.endpoint,
      getClass: () => TestController,
    } as never;

    expect(guard.canActivate(context)).toBe(true);
    expect(() => guard.canActivate(context)).toThrowError(
      "Too many requests. Try again shortly.",
    );
    expect(setHeader).toHaveBeenCalledWith("RateLimit-Limit", "1");
  });
});
