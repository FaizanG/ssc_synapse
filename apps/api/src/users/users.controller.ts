import { Controller, Get, Inject, Param, ParseUUIDPipe } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CurrentActor } from "../common/decorators/current-actor.decorator.js";
import { RequirePermissions } from "../common/decorators/permissions.decorator.js";
import type { ActorContext } from "../common/types/actor-context.js";
import { PrismaService } from "../database/prisma.service.js";

@ApiTags("users")
@Controller("users")
@RequirePermissions("users.manage")
export class UsersController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  async list(@CurrentActor() actor: ActorContext) {
    return this.prisma.businessMembership.findMany({
      where: { businessId: actor.businessId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        title: true,
        financialVisibility: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            lastLoginAt: true,
          },
        },
        roles: {
          select: { role: { select: { id: true, key: true, name: true } } },
        },
      },
    });
  }

  @Get(":id")
  async get(
    @CurrentActor() actor: ActorContext,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.prisma.businessMembership.findFirstOrThrow({
      where: { id, businessId: actor.businessId },
      select: {
        id: true,
        status: true,
        title: true,
        financialVisibility: true,
        joinedAt: true,
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            lastLoginAt: true,
          },
        },
        roles: {
          select: { role: { select: { id: true, key: true, name: true } } },
        },
      },
    });
  }
}
