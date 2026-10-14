import { afterEach, describe, expect, it } from "vitest";

import { environmentSchema } from "./environment.js";

describe("environmentSchema", () => {
  afterEach(() => {
    delete process.env.COOKIE_DOMAIN;
  });

  it("parses a valid minimum environment", () => {
    const environment = environmentSchema.parse({
      FRONTEND_URL: "http://localhost:3000",
      DATABASE_URL: "postgresql://localhost/ssc_synapse",
      JWT_ACCESS_SECRET: "a".repeat(32),
    });

    expect(environment.PORT).toBe(4000);
    expect(environment.TRUST_PROXY).toBe(false);
    expect(environment.COOKIE_DOMAIN).toBeUndefined();
  });

  it("rejects short signing secrets", () => {
    expect(() =>
      environmentSchema.parse({
        FRONTEND_URL: "http://localhost:3000",
        DATABASE_URL: "postgresql://localhost/ssc_synapse",
        JWT_ACCESS_SECRET: "unsafe",
      }),
    ).toThrow();
  });
});
