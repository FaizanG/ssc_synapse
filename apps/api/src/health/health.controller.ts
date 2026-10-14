import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
  VERSION_NEUTRAL,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { Public } from "../common/decorators/public.decorator.js";
import { PrismaService } from "../database/prisma.service.js";

@ApiTags("health")
@Public()
@Controller({ path: "health", version: VERSION_NEUTRAL })
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get("live")
  @ApiOperation({ summary: "Process liveness probe" })
  live() {
    return {
      status: "ok",
      service: "ssc-synapse-api",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("ready")
  @ApiOperation({ summary: "Database-backed readiness probe" })
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: "ready",
        database: "connected",
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        code: "DATABASE_UNAVAILABLE",
        message: "The database is unavailable.",
      });
    }
  }
}
