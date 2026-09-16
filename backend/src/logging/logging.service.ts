import {
  Injectable,
  LoggerService as NestLoggerService,
  Scope,
} from '@nestjs/common';
import pino from 'pino';
import { ConfigService } from '@nestjs/config';
import { hostname } from 'os';
import { OtelLogStream } from './transports/otel.transport';
import { ColoredStderrStream } from './transports/console.transport';

export type LogLevel =
  'danger' | 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
export type LogTransport = 'stderr' | 'otel' | 'both';

const ANSI_RED = '\x1b[31m';
const ANSI_RESET = '\x1b[0m';

/**
 * LoggingService — wrapper berbasis pino dengan dukungan multi-transport.
 *
 * Level custom `danger` → merah di stderr (unknown endpoint / suspicious traffic).
 */
@Injectable({ scope: Scope.DEFAULT })
export class LoggingService implements NestLoggerService {
  private readonly logger: pino.Logger;
  private readonly serviceName: string;

  constructor(configService: ConfigService) {
    const level = configService.get<string>('LOG_LEVEL') ?? 'info';
    const transport =
      configService.get<LogTransport>('LOG_TRANSPORT') ?? 'otel';
    this.serviceName =
      configService.get<string>('OTEL_SERVICE_NAME') ?? 'api-template';

    const resolvedLevel =
      level === 'http' || level === 'verbose' || level === 'silly'
        ? level === 'http'
          ? 'info'
          : level === 'verbose'
            ? 'debug'
            : 'trace'
        : level === 'danger'
          ? 'error'
          : level;

    const streams: pino.StreamEntry[] = [];

    if (transport === 'stderr' || transport === 'both') {
      streams.push({ stream: new ColoredStderrStream() });
    }

    if (transport === 'otel' || transport === 'both') {
      streams.push({ stream: new OtelLogStream() });
    }

    if (streams.length === 0) {
      streams.push({ stream: new ColoredStderrStream() });
    }

    this.logger = pino(
      {
        level: resolvedLevel,
        name: this.serviceName,
        base: {
          pid: process.pid,
          hostname: hostname(),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
          level(label) {
            return { level: label };
          },
        },
      },
      pino.multistream(streams, { dedupe: true }),
    );
  }

  log(message: any, context?: string): void {
    this.logger.info({ context }, message);
  }

  error(message: any, trace?: string, context?: string): void {
    this.logger.error({ context, trace }, message);
  }

  warn(message: any, context?: string): void {
    this.logger.warn({ context }, message);
  }

  debug(message: any, context?: string): void {
    this.logger.debug({ context }, message);
  }

  verbose(message: any, context?: string): void {
    this.logger.trace({ context }, message);
  }

  info(message: any, context?: string): void {
    this.logger.info({ context }, message);
  }

  http(message: any, context?: string): void {
    this.logger.info({ context, http: true }, message);
  }

  fatal(message: any, trace?: string, context?: string): void {
    this.logger.fatal({ context, trace }, message);
  }

  /**
   * Level custom `danger` (merah di stderr).
   * Write langsung ke stderr — tidak lewat pino.
   */
  danger(message: any, context?: string): void {
    const msg = typeof message === 'string' ? message : JSON.stringify(message);
    const line = JSON.stringify({
      level: 'danger',
      time: new Date().toISOString(),
      pid: process.pid,
      hostname: hostname(),
      name: this.serviceName,
      context: context ?? 'Danger',
      danger: true,
      msg,
    });

    process.stderr.write(`${ANSI_RED}${line}${ANSI_RESET}\n`);
  }

  getPinoLogger(): pino.Logger {
    return this.logger;
  }
}
