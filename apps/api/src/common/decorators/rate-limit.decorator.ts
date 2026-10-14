import { SetMetadata } from "@nestjs/common";

export const RATE_LIMIT_KEY = "ssc:rateLimit";
export type RateLimitPolicy = { limit: number; windowMs: number };
export const RateLimit = (policy: RateLimitPolicy) =>
  SetMetadata(RATE_LIMIT_KEY, policy);
