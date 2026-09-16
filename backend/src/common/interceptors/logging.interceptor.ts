import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { FastifyReply, FastifyRequest } from 'fastify';
import { LoggingService } from '../../logging/logging.service';

/**
 * LoggingInterceptor — mencatat tiap HTTP request masuk & durasi respon.
 * Level: info (http). Ikut transport yang dipilih via LoggingService.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const method = request.method;
    const url =
      (request as FastifyRequest & { originalUrl?: string }).originalUrl ??
      request.url;
    const start = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = this.elapsedMs(start);
          const status = context
            .switchToHttp()
            .getResponse<FastifyReply>().statusCode;
          this.loggingService.http(
            `${method} ${url} -> ${status} (${durationMs}ms)`,
            'HTTP',
          );
        },
        error: (err: unknown) => {
          const durationMs = this.elapsedMs(start);
          const status =
            err && typeof err === 'object' && 'status' in err
              ? ((err as { status?: number }).status ?? 500)
              : 500;
          this.loggingService.error(
            `${method} ${url} -> ${status} (${durationMs}ms)`,
            err instanceof Error ? err.stack : undefined,
            'HTTP',
          );
        },
      }),
    );
  }

  private elapsedMs(start: bigint): string {
    const nanos = process.hrtime.bigint() - start;
    return (Number(nanos) / 1e6).toFixed(2);
  }
}
