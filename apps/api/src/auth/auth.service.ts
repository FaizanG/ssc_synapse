import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { hash, verify } from "argon2";

import {
  LoginOutcome,
  MembershipStatus,
  UserStatus,
} from "../generated/prisma/client.js";
import { AuditService } from "../audit/audit.service.js";
import type { ActorContext } from "../common/types/actor-context.js";
import { getEnvironment } from "../config/environment.js";
import { PrismaService } from "../database/prisma.service.js";
import type {
  AcceptInvitationDto,
  CreateInvitationDto,
} from "./dto/invitation.dto.js";
import type { LoginDto } from "./dto/login.dto.js";

type RequestMetadata = {
  ip?: string;
  userAgent?: string;
  correlationId?: string;
};

type SessionResult = {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  accessExpiresInSeconds: number;
  refreshExpiresAt: Date;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwt: JwtService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async login(dto: LoginDto, metadata: RequestMetadata) {
    const emailNormalized = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { emailNormalized },
      include: {
        memberships: {
          include: {
            business: true,
            roles: {
              include: {
                role: {
                  include: { permissions: { include: { permission: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (
      !user?.passwordHash ||
      !(await verify(user.passwordHash, dto.password))
    ) {
      await this.recordLoginAttempt(
        emailNormalized,
        LoginOutcome.INVALID_CREDENTIALS,
        metadata,
        user?.id,
      );
      throw new UnauthorizedException({
        code: "INVALID_CREDENTIALS",
        message: "The email or password is incorrect.",
      });
    }
    if (user.status !== UserStatus.ACTIVE) {
      await this.recordLoginAttempt(
        emailNormalized,
        LoginOutcome.ACCOUNT_DISABLED,
        metadata,
        user.id,
      );
      throw new UnauthorizedException({
        code: "ACCOUNT_DISABLED",
        message: "This account is not active.",
      });
    }

    const memberships = user.memberships.filter(
      (membership) =>
        membership.status === MembershipStatus.ACTIVE &&
        membership.business.status === "ACTIVE",
    );
    const membership = dto.businessSlug
      ? memberships.find(({ business }) => business.slug === dto.businessSlug)
      : memberships.length === 1
        ? memberships[0]
        : undefined;

    if (!membership) {
      await this.recordLoginAttempt(
        emailNormalized,
        LoginOutcome.BUSINESS_NOT_FOUND,
        metadata,
        user.id,
      );
      if (!dto.businessSlug && memberships.length > 1) {
        throw new ConflictException({
          code: "BUSINESS_SELECTION_REQUIRED",
          message: "Enter the business code for this account.",
        });
      }
      throw new UnauthorizedException({
        code: "BUSINESS_ACCESS_DENIED",
        message: "Business access is not active.",
      });
    }

    const session = await this.createSession(
      user.id,
      membership.businessId,
      membership.id,
      metadata,
    );
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
      this.prisma.loginAttempt.create({
        data: {
          businessId: membership.businessId,
          userId: user.id,
          identifierNormalized: emailNormalized,
          outcome: LoginOutcome.SUCCESS,
          ipHash: this.hashSensitive(metadata.ip),
          userAgent: metadata.userAgent,
        },
      }),
    ]);
    await this.audit.record({
      businessId: membership.businessId,
      actorId: user.id,
      sessionId: this.sessionIdFromRefreshToken(session.refreshToken),
      action: "auth.login",
      entityType: "User",
      entityId: user.id,
      ipHash: this.hashSensitive(metadata.ip),
      correlationId: metadata.correlationId,
    });

    return {
      session,
      user: { id: user.id, fullName: user.fullName, email: user.email },
      business: {
        id: membership.business.id,
        slug: membership.business.slug,
        name: membership.business.displayName,
      },
    };
  }

  async refresh(
    refreshToken: string | undefined,
    metadata: RequestMetadata,
  ): Promise<SessionResult> {
    if (!refreshToken)
      throw new UnauthorizedException({
        code: "REFRESH_REQUIRED",
        message: "The session cannot be refreshed.",
      });
    const sessionId = this.sessionIdFromRefreshToken(refreshToken);
    const session = await this.prisma.authSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "The session cannot be refreshed.",
      });
    }

    const suppliedHash = this.sha256(refreshToken);
    const supplied = Buffer.from(suppliedHash);
    const stored = Buffer.from(session.tokenHash);
    if (
      supplied.length !== stored.length ||
      !timingSafeEqual(supplied, stored)
    ) {
      await this.prisma.authSession.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: "refresh-token-reuse" },
      });
      throw new UnauthorizedException({
        code: "REFRESH_TOKEN_REUSED",
        message: "The session has been revoked.",
      });
    }

    const membership = await this.prisma.businessMembership.findFirst({
      where: {
        id: session.membershipId,
        userId: session.userId,
        businessId: session.businessId,
        status: MembershipStatus.ACTIVE,
      },
      include: { business: true, user: true },
    });
    if (
      !membership ||
      membership.business.status !== "ACTIVE" ||
      membership.user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException({
        code: "MEMBERSHIP_INACTIVE",
        message: "Business access is inactive.",
      });
    }

    const secret = randomBytes(32).toString("base64url");
    const rotatedRefreshToken = `${session.id}.${secret}`;
    const update = await this.prisma.authSession.updateMany({
      where: { id: session.id, tokenHash: session.tokenHash, revokedAt: null },
      data: {
        tokenHash: this.sha256(rotatedRefreshToken),
        lastRotatedAt: new Date(),
        ipHash: this.hashSensitive(metadata.ip),
        userAgent: metadata.userAgent,
      },
    });
    if (update.count !== 1)
      throw new UnauthorizedException({
        code: "REFRESH_CONFLICT",
        message: "Retry sign in.",
      });

    return this.buildSessionResult(
      session.id,
      session.userId,
      session.businessId,
      session.membershipId,
      rotatedRefreshToken,
      session.expiresAt,
    );
  }

  async logout(actor: ActorContext, metadata: RequestMetadata) {
    await this.prisma.authSession.updateMany({
      where: { id: actor.sessionId, userId: actor.userId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: "user-logout" },
    });
    await this.audit.record({
      businessId: actor.businessId,
      actorId: actor.userId,
      sessionId: actor.sessionId,
      action: "auth.logout",
      entityType: "AuthSession",
      entityId: actor.sessionId,
      ipHash: this.hashSensitive(metadata.ip),
      correlationId: metadata.correlationId,
    });
  }

  async current(actor: ActorContext) {
    const membership = await this.prisma.businessMembership.findFirstOrThrow({
      where: {
        id: actor.membershipId,
        businessId: actor.businessId,
        userId: actor.userId,
      },
      include: {
        user: true,
        business: true,
        roles: { include: { role: true } },
      },
    });
    return {
      user: {
        id: membership.user.id,
        email: membership.user.email,
        fullName: membership.user.fullName,
      },
      business: {
        id: membership.business.id,
        slug: membership.business.slug,
        name: membership.business.displayName,
      },
      membership: {
        id: membership.id,
        roles: membership.roles.map(({ role }) => ({
          id: role.id,
          key: role.key,
          name: role.name,
        })),
      },
      permissions: actor.permissions,
    };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { emailNormalized: email.trim().toLowerCase() },
    });
    if (!user || user.status !== UserStatus.ACTIVE) return { accepted: true };

    const token = randomBytes(32).toString("base64url");
    await this.prisma.$transaction(async (transaction) => {
      await transaction.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });
      await transaction.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: this.sha256(token),
          expiresAt: new Date(Date.now() + 30 * 60_000),
        },
      });
      await transaction.outboxMessage.create({
        data: {
          eventType: "auth.password_reset_requested",
          aggregateType: "User",
          aggregateId: user.id,
          payload: { userId: user.id, email: user.email, token },
        },
      });
    });
    return {
      accepted: true,
      ...(getEnvironment().NODE_ENV === "development"
        ? { developmentToken: token }
        : {}),
    };
  }

  async resetPassword(token: string, password: string) {
    const reset = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.sha256(token) },
    });
    if (!reset || reset.usedAt || reset.expiresAt <= new Date()) {
      throw new UnauthorizedException({
        code: "RESET_TOKEN_INVALID",
        message: "The reset link is invalid or expired.",
      });
    }
    const passwordHash = await hash(password);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { passwordHash, status: UserStatus.ACTIVE },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.authSession.updateMany({
        where: { userId: reset.userId, revokedAt: null },
        data: { revokedAt: new Date(), revokeReason: "password-reset" },
      }),
    ]);
    return { reset: true };
  }

  async createInvitation(actor: ActorContext, dto: CreateInvitationDto) {
    const roles = await this.prisma.role.findMany({
      where: {
        id: { in: dto.roleIds },
        OR: [{ businessId: null }, { businessId: actor.businessId }],
      },
    });
    if (roles.length !== new Set(dto.roleIds).size) {
      throw new ConflictException({
        code: "INVALID_INVITATION_ROLES",
        message: "One or more roles cannot be assigned.",
      });
    }

    const token = randomBytes(32).toString("base64url");
    const invitation = await this.prisma.$transaction(async (transaction) => {
      await transaction.userInvitation.updateMany({
        where: {
          businessId: actor.businessId,
          emailNormalized: dto.email.trim().toLowerCase(),
          status: "PENDING",
        },
        data: { status: "REVOKED" },
      });
      const created = await transaction.userInvitation.create({
        data: {
          businessId: actor.businessId,
          email: dto.email.trim(),
          emailNormalized: dto.email.trim().toLowerCase(),
          fullName: dto.fullName.trim(),
          tokenHash: this.sha256(token),
          invitedById: actor.userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000),
          roles: { create: roles.map((role) => ({ roleId: role.id })) },
        },
      });
      await transaction.outboxMessage.create({
        data: {
          businessId: actor.businessId,
          eventType: "auth.user_invited",
          aggregateType: "UserInvitation",
          aggregateId: created.id,
          payload: { invitationId: created.id, email: created.email, token },
        },
      });
      return created;
    });
    await this.audit.record({
      businessId: actor.businessId,
      actorId: actor.userId,
      sessionId: actor.sessionId,
      action: "user.invite",
      entityType: "UserInvitation",
      entityId: invitation.id,
      afterSummary: { email: invitation.email, roleIds: dto.roleIds },
    });
    return {
      id: invitation.id,
      expiresAt: invitation.expiresAt,
      ...(getEnvironment().NODE_ENV === "development"
        ? { developmentToken: token }
        : {}),
    };
  }

  async acceptInvitation(dto: AcceptInvitationDto) {
    const invitation = await this.prisma.userInvitation.findUnique({
      where: { tokenHash: this.sha256(dto.token) },
      include: { roles: true },
    });
    if (
      !invitation ||
      invitation.status !== "PENDING" ||
      invitation.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException({
        code: "INVITATION_INVALID",
        message: "The invitation is invalid or expired.",
      });
    }
    const passwordHash = await hash(dto.password);
    const membership = await this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.upsert({
        where: { emailNormalized: invitation.emailNormalized },
        update: {
          status: UserStatus.ACTIVE,
          passwordHash,
          fullName: invitation.fullName ?? invitation.email,
        },
        create: {
          email: invitation.email,
          emailNormalized: invitation.emailNormalized,
          fullName: invitation.fullName ?? invitation.email,
          passwordHash,
          status: UserStatus.ACTIVE,
        },
      });
      const createdMembership = await transaction.businessMembership.upsert({
        where: {
          businessId_userId: {
            businessId: invitation.businessId,
            userId: user.id,
          },
        },
        update: { status: MembershipStatus.ACTIVE, joinedAt: new Date() },
        create: {
          businessId: invitation.businessId,
          userId: user.id,
          status: MembershipStatus.ACTIVE,
          joinedAt: new Date(),
        },
      });
      await transaction.membershipRole.createMany({
        data: invitation.roles.map(({ roleId }) => ({
          membershipId: createdMembership.id,
          roleId,
        })),
        skipDuplicates: true,
      });
      await transaction.userInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      });
      return createdMembership;
    });
    return { accepted: true, membershipId: membership.id };
  }

  private async createSession(
    userId: string,
    businessId: string,
    membershipId: string,
    metadata: RequestMetadata,
  ) {
    const id = randomUUID();
    const secret = randomBytes(32).toString("base64url");
    const refreshToken = `${id}.${secret}`;
    const environment = getEnvironment();
    const expiresAt = new Date(
      Date.now() + environment.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60_000,
    );
    await this.prisma.authSession.create({
      data: {
        id,
        userId,
        businessId,
        membershipId,
        familyId: randomUUID(),
        tokenHash: this.sha256(refreshToken),
        expiresAt,
        ipHash: this.hashSensitive(metadata.ip),
        userAgent: metadata.userAgent,
      },
    });
    return this.buildSessionResult(
      id,
      userId,
      businessId,
      membershipId,
      refreshToken,
      expiresAt,
    );
  }

  private async buildSessionResult(
    sessionId: string,
    userId: string,
    businessId: string,
    membershipId: string,
    refreshToken: string,
    refreshExpiresAt: Date,
  ): Promise<SessionResult> {
    const environment = getEnvironment();
    const accessToken = await this.jwt.signAsync(
      { sub: userId, businessId, membershipId, sessionId, type: "access" },
      {
        secret: environment.JWT_ACCESS_SECRET,
        expiresIn: environment.ACCESS_TOKEN_TTL_SECONDS,
      },
    );
    return {
      accessToken,
      refreshToken,
      csrfToken: randomBytes(24).toString("base64url"),
      accessExpiresInSeconds: environment.ACCESS_TOKEN_TTL_SECONDS,
      refreshExpiresAt,
    };
  }

  private sessionIdFromRefreshToken(token: string) {
    const [id, secret, extra] = token.split(".");
    if (!id || !secret || extra || !/^[0-9a-f-]{36}$/i.test(id)) {
      throw new UnauthorizedException({
        code: "INVALID_REFRESH_TOKEN",
        message: "The session token is invalid.",
      });
    }
    return id;
  }

  private sha256(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }

  private hashSensitive(value: string | undefined) {
    return value
      ? createHmac("sha256", getEnvironment().JWT_ACCESS_SECRET)
          .update(value)
          .digest("hex")
      : undefined;
  }

  private recordLoginAttempt(
    identifierNormalized: string,
    outcome: LoginOutcome,
    metadata: RequestMetadata,
    userId?: string,
  ) {
    return this.prisma.loginAttempt.create({
      data: {
        identifierNormalized,
        outcome,
        userId,
        ipHash: this.hashSensitive(metadata.ip),
        userAgent: metadata.userAgent,
      },
    });
  }
}
