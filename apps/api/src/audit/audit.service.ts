import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "../generated/prisma/client.js";

import { PrismaService } from "../database/prisma.service.js";

type AuditInput = {
  businessId: string;
  actorId?: string;
  sessionId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  beforeSummary?: Prisma.InputJsonValue;
  afterSummary?: Prisma.InputJsonValue;
  ipHash?: string;
  correlationId?: string;
};

@Injectable()
export class AuditService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  record(input: AuditInput) {
    return this.prisma.auditLog.create({ data: input });
  }
}
