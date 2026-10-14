import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

type ExceptionResponse =
  string | { message?: string | string[]; error?: string; code?: string };

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();
    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const source = isHttpException
      ? (exception.getResponse() as ExceptionResponse)
      : undefined;
    const sourceMessage = typeof source === "string" ? source : source?.message;
    const message = Array.isArray(sourceMessage)
      ? "The request contains invalid values."
      : (sourceMessage ??
        (status === 500
          ? "An unexpected error occurred."
          : "The request could not be completed."));
    const code =
      typeof source === "object" && source?.code
        ? source.code
        : `HTTP_${status}`;

    if (!isHttpException) {
      this.logger.error({
        message: "Unhandled request error",
        correlationId: request.correlationId,
        path: request.path,
        method: request.method,
        exception,
      });
    }

    response.status(status).json({
      code,
      message,
      details: Array.isArray(sourceMessage) ? sourceMessage : undefined,
      correlationId: request.correlationId,
      timestamp: new Date().toISOString(),
    });
  }
}
