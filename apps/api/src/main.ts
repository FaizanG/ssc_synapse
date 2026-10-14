import "dotenv/config";
import "reflect-metadata";

import { Logger, ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";

import { AppModule } from "./app.module.js";
import { ApiExceptionFilter } from "./common/filters/http-exception.filter.js";
import { getEnvironment } from "./config/environment.js";

async function bootstrap() {
  const environment = getEnvironment();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  if (environment.TRUST_PROXY)
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.useLogger(["error", "warn", "log"]);
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: environment.FRONTEND_URL,
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "X-Correlation-ID",
      "Idempotency-Key",
    ],
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  });
  app.setGlobalPrefix(environment.API_PREFIX, {
    exclude: ["health/live", "health/ready"],
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks();

  if (environment.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("SSC Synapse API")
      .setDescription("Catering and event management REST API")
      .setVersion("1.0")
      .addCookieAuth("ssc_access")
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document, {
      jsonDocumentUrl: "docs/openapi.json",
    });
  }

  await app.listen(environment.PORT, "0.0.0.0");
  Logger.log(
    `SSC Synapse API listening on port ${environment.PORT}`,
    "Bootstrap",
  );
}

void bootstrap();
