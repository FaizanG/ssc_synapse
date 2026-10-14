import { describe, expect, it, vi } from "vitest";

import { HealthController } from "./health.controller.js";

describe("HealthController", () => {
  it("returns process liveness without checking dependencies", () => {
    const controller = new HealthController({} as never);
    expect(controller.live()).toMatchObject({
      status: "ok",
      service: "ssc-synapse-api",
    });
  });

  it("reports readiness when PostgreSQL responds", async () => {
    const prisma = { $queryRaw: vi.fn().mockResolvedValue([{ one: 1 }]) };
    const controller = new HealthController(prisma as never);
    await expect(controller.ready()).resolves.toMatchObject({
      status: "ready",
      database: "connected",
    });
  });
});
