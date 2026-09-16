import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { fail } from '../response.util';
import { LoggingService } from '../../logging/logging.service';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly loggingService: LoggingService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let data: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if (response && typeof response === 'object') {
        const body = response as {
          message?: string | string[];
          data?: unknown;
        };
        if ('message' in body) {
          const raw = body.message;
          message = Array.isArray(raw)
            ? raw.join(', ')
            : String(raw ?? message);
        }
        if ('data' in body && body.data !== undefined) {
          data = body.data;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const path =
      (request as FastifyRequest & { originalUrl?: string }).originalUrl ??
      request.url;
    // Hanya route yang benar-benar tidak terdaftar ("Cannot GET /...")
    // Nest+Fastify setNotFoundHandler bawaan sudah melempar pola pesan ini.
    const isUnknownRoute =
      status === HttpStatus.NOT_FOUND &&
      /^Cannot\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/i.test(message);

    if (isUnknownRoute) {
      this.loggingService.danger(
        `${request.method} ${path} — ${message}`,
        'UnknownRoute',
      );
    } else if (Number(status) >= 500) {
      this.loggingService.error(
        message,
        exception instanceof Error ? exception.stack : undefined,
        `${request.method} ${path}`,
      );
    } else {
      this.loggingService.warn(message, `${request.method} ${path}`);
    }

    reply.status(status).send(fail(message, data));
  }
}
