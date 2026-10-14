import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type { CookieOptions, Request, Response } from "express";

import { CurrentActor } from "../common/decorators/current-actor.decorator.js";
import { RequirePermissions } from "../common/decorators/permissions.decorator.js";
import { Public } from "../common/decorators/public.decorator.js";
import { RateLimit } from "../common/decorators/rate-limit.decorator.js";
import type { ActorContext } from "../common/types/actor-context.js";
import { getEnvironment } from "../config/environment.js";
import { AuthService } from "./auth.service.js";
import {
  AcceptInvitationDto,
  CreateInvitationDto,
} from "./dto/invitation.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from "./dto/password-reset.dto.js";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Public()
  @RateLimit({ limit: 5, windowMs: 60_000 })
  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Authenticate and create a rotating session" })
  async login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(dto, this.metadata(request));
    this.setSessionCookies(response, result.session);
    return {
      user: result.user,
      business: result.business,
      expiresInSeconds: result.session.accessExpiresInSeconds,
    };
  }

  @Public()
  @RateLimit({ limit: 10, windowMs: 60_000 })
  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({
    summary: "Rotate the refresh token and issue a new access token",
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.refresh(
      request.cookies?.ssc_refresh as string | undefined,
      this.metadata(request),
    );
    this.setSessionCookies(response, session);
    return {
      refreshed: true,
      expiresInSeconds: session.accessExpiresInSeconds,
    };
  }

  @Post("logout")
  @HttpCode(204)
  async logout(
    @CurrentActor() actor: ActorContext,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(actor, this.metadata(request));
    this.clearSessionCookies(response);
  }

  @Get("me")
  current(@CurrentActor() actor: ActorContext) {
    return this.auth.current(actor);
  }

  @Public()
  @Post("password-reset/request")
  @HttpCode(202)
  @RateLimit({ limit: 3, windowMs: 60_000 })
  requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.auth.requestPasswordReset(dto.email);
  }

  @Public()
  @Post("password-reset/complete")
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.password);
  }

  @Post("invitations")
  @RequirePermissions("users.manage")
  createInvitation(
    @CurrentActor() actor: ActorContext,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.auth.createInvitation(actor, dto);
  }

  @Public()
  @Post("invitations/accept")
  @HttpCode(200)
  acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.auth.acceptInvitation(dto);
  }

  private metadata(request: Request) {
    return {
      ip: request.ip,
      userAgent: request.header("user-agent")?.slice(0, 500),
      correlationId: request.correlationId,
    };
  }

  private setSessionCookies(
    response: Response,
    session: {
      accessToken: string;
      refreshToken: string;
      csrfToken: string;
      accessExpiresInSeconds: number;
      refreshExpiresAt: Date;
    },
  ) {
    const environment = getEnvironment();
    const common: CookieOptions = {
      secure: environment.NODE_ENV === "production",
      sameSite: "lax",
      domain: environment.COOKIE_DOMAIN,
    };
    response.cookie("ssc_access", session.accessToken, {
      ...common,
      httpOnly: true,
      path: "/",
      maxAge: session.accessExpiresInSeconds * 1000,
    });
    response.cookie("ssc_refresh", session.refreshToken, {
      ...common,
      httpOnly: true,
      path: "/api/v1/auth",
      expires: session.refreshExpiresAt,
    });
    response.cookie("ssc_csrf", session.csrfToken, {
      ...common,
      httpOnly: false,
      path: "/",
      expires: session.refreshExpiresAt,
    });
  }

  private clearSessionCookies(response: Response) {
    const environment = getEnvironment();
    const common: CookieOptions = {
      secure: environment.NODE_ENV === "production",
      sameSite: "lax",
      domain: environment.COOKIE_DOMAIN,
    };
    response.clearCookie("ssc_access", { ...common, path: "/" });
    response.clearCookie("ssc_refresh", { ...common, path: "/api/v1/auth" });
    response.clearCookie("ssc_csrf", { ...common, path: "/" });
  }
}
