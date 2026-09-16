import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

let sdk: NodeSDK | undefined;
let active = false;

export interface OpenTelemetryOptions {
  serviceName: string;
  endpoint: string; // contoh: http://localhost:4318
  level: string; // log level, untuk kontrol verbosity diag
  enabled?: boolean;
}

/**
 * Inisialisasi OpenTelemetry SDK (tracing + logs).
 * Harus dipanggil SEBELUM NestFactory.create() agar auto-instrumentation
 * menangkap request HTTP sejak awal (lihat main.ts).
 *
 * Metrics OTLP dimatikan (OTEL_METRICS_EXPORTER=none) — template ini
 * hanya mengekspor logs + traces; tanpa collector, metrics hanya noise.
 */
export function initOpenTelemetry(
  opts: OpenTelemetryOptions,
): NodeSDK | undefined {
  if (!opts.enabled) {
    return undefined;
  }

  // Diagnosis OTel internal hanya saat LOG_LEVEL=debug / trace
  const diagLevel =
    opts.level === 'debug' || opts.level === 'trace'
      ? DiagLogLevel.DEBUG
      : DiagLogLevel.ERROR;
  diag.setLogger(new DiagConsoleLogger(), diagLevel);

  // Cegah PeriodicExportingMetricReader → localhost:4318 (ECONNREFUSED spam)
  if (!process.env.OTEL_METRICS_EXPORTER) {
    process.env.OTEL_METRICS_EXPORTER = 'none';
  }

  const baseUrl = opts.endpoint.replace(/\/+$/, '');
  const logExporter = new OTLPLogExporter({
    url: `${baseUrl}/v1/logs`,
  });
  const traceExporter = new OTLPTraceExporter({
    url: `${baseUrl}/v1/traces`,
  });

  sdk = new NodeSDK({
    serviceName: opts.serviceName,
    traceExporter,
    logRecordProcessors: [
      new BatchLogRecordProcessor({ exporter: logExporter }),
    ],
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  active = true;
  return sdk;
}

/** Apakah SDK OTel sedang aktif (transport otel/both dipakai). */
export function isOtelActive(): boolean {
  return active;
}

/** Shutdown SDK saat aplikasi berhenti (flush pending spans/logs). */
export async function shutdownOpenTelemetry(): Promise<void> {
  if (sdk) {
    try {
      await sdk.shutdown();
    } finally {
      active = false;
      sdk = undefined;
    }
  }
}
