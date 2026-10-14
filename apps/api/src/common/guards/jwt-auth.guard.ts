import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";

import { IS_PUBLIC_KEY } from "../decorators/public.decorator.js";
import { PrismaService } from "../../database/prisma.service.js";
import { getEnvironment } from "../../config/environment.js";

type AccessTokenPayload = {
  sub: string;
  businessId: string;
  membershipId: string;
  sessionId: string;
  type: "access";
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;

    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.ssc_access as string | undefined;
    if (!token)
      throw new UnauthorizedException({
        code: "AUTH_REQUIRED",
        message: "Authentication is required.",
      });

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: getEnvironment().JWT_ACCESS_SECRET,
      });
    } catch {
      throw new UnauthorizedException({
        code: "INVALID_SESSION",
        message: "The session is invalid or expired.",
      });
    }

    if (payload.type !== "access")
      throw new UnauthorizedException({
        code: "INVALID_SESSION",
        message: "The session is invalid.",
      });

    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sessionId },
    });
    if (
      !session ||
      session.userId !== payload.sub ||
      session.businessId !== payload.businessId ||
      session.membershipId !== payload.membershipId ||
      session.revokedAt ||
      session.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException({
        code: "INVALID_SESSION",
        message: "The session is invalid or expired.",
      });
    }

    const membership = await this.prisma.businessMembership.findFirst({
      where: {
        id: payload.membershipId,
        businessId: payload.businessId,
        userId: payload.sub,
        status: "ACTIVE",
        business: { status: "ACTIVE" },
        user: { status: "ACTIVE" },
      },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });
    if (!membership)
      throw new UnauthorizedException({
        code: "MEMBERSHIP_INACTIVE",
        message: "Business access is inactive.",
      });

    request.actor = {
      userId: payload.sub,
      businessId: payload.businessId,
      membershipId: payload.membershipId,
      sessionId: payload.sessionId,
      permissions: [
        ...new Set(
          membership.roles.flatMap(({ role }) =>
            role.permissions.map(({ permission }) => permission.key),
          ),
        ),
      ],
    };
    return true;
  }
}
