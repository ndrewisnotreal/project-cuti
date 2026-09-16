import { Writable } from 'stream';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import type { AnyValue, AnyValueMap } from '@opentelemetry/api-logs';
import { isOtelActive } from '../otel/tracing';

/**
 * Pino level (angka / label) → OTel SeverityNumber.
 * Pino: trace=10, debug=20, info=30, warn=40, error=50, danger=55, fatal=60
 */
const LEVEL_TO_SEVERITY: Record<number | string, SeverityNumber> = {
  10: SeverityNumber.TRACE,
  20: SeverityNumber.DEBUG,
  30: SeverityNumber.INFO,
  40: SeverityNumber.WARN,
  50: SeverityNumber.ERROR,
  55: SeverityNumber.ERROR,
  60: SeverityNumber.FATAL,
  trace: SeverityNumber.TRACE,
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
  danger: SeverityNumber.ERROR,
  fatal: SeverityNumber.FATAL,
};

const LEVEL_TO_TEXT: Record<number | string, string> = {
  10: 'TRACE',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARN',
  50: 'ERROR',
  55: 'DANGER',
  60: 'FATAL',
  trace: 'TRACE',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
  danger: 'DANGER',
  fatal: 'FATAL',
};

type PinoLogChunk = {
  level?: string | number;
  msg?: unknown;
  time?: string | number | Date;
  [key: string]: unknown;
};

function toLogBody(msg: unknown): AnyValue {
  if (msg == null) return '';
  if (
    typeof msg === 'string' ||
    typeof msg === 'number' ||
    typeof msg === 'boolean'
  ) {
    return msg;
  }
  try {
    return JSON.stringify(msg);
  } catch {
    return '[unserializable]';
  }
}

/**
 * Pino stream → OpenTelemetry LogRecord.
 * Dipasang sebagai salah satu target pino.multistream().
 * Jika OTel SDK belum aktif (transport stderr saja), stream ini no-op aman.
 */
export class OtelLogStream extends Writable {
  constructor() {
    super({ objectMode: true });
  }

  override _write(
    chunk: unknown,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    try {
      if (isOtelActive()) {
        const record: PinoLogChunk =
          chunk && typeof chunk === 'object' ? (chunk as PinoLogChunk) : {};
        const { level, msg, time, ...attributes } = record;
        const severity =
          (level !== undefined ? LEVEL_TO_SEVERITY[level] : undefined) ??
          SeverityNumber.UNSPECIFIED;

        logs.getLogger('api-template').emit({
          timestamp: time != null ? new Date(time) : new Date(),
          severityNumber: severity,
          severityText:
            (level !== undefined ? LEVEL_TO_TEXT[level] : undefined) ??
            'UNSPECIFIED',
          body: toLogBody(msg),
          attributes: attributes as AnyValueMap,
        });
      }
    } catch {
      // Jangan pernah biarkan logging merusak request path.
    }
    callback();
  }
}
