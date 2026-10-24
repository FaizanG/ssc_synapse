import {
  MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from "@nestjs/common";
import { APP_GUARD, Reflector } from "@nestjs/core";

import { AuditModule } from "./audit/audit.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { CsrfGuard } from "./common/guards/csrf.guard.js";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard.js";
import { PermissionsGuard } from "./common/guards/permissions.guard.js";
import { RateLimitGuard } from "./common/guards/rate-limit.guard.js";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware.js";
import { DatabaseModule } from "./database/database.module.js";
import { HealthModule } from "./health/health.module.js";
import { InvoicesModule } from "./invoices/invoices.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    DatabaseModule,
    AuditModule,
    AuthModule,
    HealthModule,
    UsersModule,
    InvoicesModule,
  ],
  providers: [
    Reflector,
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware)
      .forRoutes({ path: "{*path}", method: RequestMethod.ALL });
  }
}
