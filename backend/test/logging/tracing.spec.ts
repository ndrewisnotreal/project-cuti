const start = jest.fn();
const shutdown = jest.fn().mockResolvedValue(undefined);
const setLogger = jest.fn();

jest.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: jest.fn().mockImplementation(() => ({
    start,
    shutdown,
  })),
}));

jest.mock('@opentelemetry/exporter-logs-otlp-http', () => ({
  OTLPLogExporter: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@opentelemetry/auto-instrumentations-node', () => ({
  getNodeAutoInstrumentations: jest.fn(() => []),
}));

jest.mock('@opentelemetry/sdk-logs', () => ({
  BatchLogRecordProcessor: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@opentelemetry/api', () => {
  const actual = jest.requireActual('@opentelemetry/api');
  return {
    ...actual,
    diag: { setLogger },
  };
});

import { DiagLogLevel } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import {
  initOpenTelemetry,
  isOtelActive,
  shutdownOpenTelemetry,
} from '../../src/logging/otel/tracing';

describe('OpenTelemetry tracing helpers', () => {
  beforeEach(async () => {
    await shutdownOpenTelemetry();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await shutdownOpenTelemetry();
  });

  it('returns undefined and stays inactive when disabled', () => {
    const sdk = initOpenTelemetry({
      serviceName: 'api-template',
      endpoint: 'http://localhost:4318',
      level: 'info',
      enabled: false,
    });
    expect(sdk).toBeUndefined();
    expect(isOtelActive()).toBe(false);
    expect(NodeSDK).not.toHaveBeenCalled();
  });

  it('starts SDK when enabled and strips trailing slash from endpoint', () => {
    delete process.env.OTEL_METRICS_EXPORTER;
    const sdk = initOpenTelemetry({
      serviceName: 'api-template',
      endpoint: 'http://collector:4318/',
      level: 'info',
      enabled: true,
    });

    expect(sdk).toBeDefined();
    expect(isOtelActive()).toBe(true);
    expect(start).toHaveBeenCalled();
    expect(process.env.OTEL_METRICS_EXPORTER).toBe('none');
    expect(OTLPLogExporter).toHaveBeenCalledWith({
      url: 'http://collector:4318/v1/logs',
    });
    expect(setLogger).toHaveBeenCalledWith(
      expect.anything(),
      DiagLogLevel.ERROR,
    );
  });

  it('uses DEBUG diag level for debug/trace log levels', () => {
    initOpenTelemetry({
      serviceName: 'api-template',
      endpoint: 'http://localhost:4318',
      level: 'debug',
      enabled: true,
    });
    expect(setLogger).toHaveBeenCalledWith(
      expect.anything(),
      DiagLogLevel.DEBUG,
    );
  });

  it('shutdown clears active flag and tolerates missing sdk', async () => {
    initOpenTelemetry({
      serviceName: 'api-template',
      endpoint: 'http://localhost:4318',
      level: 'trace',
      enabled: true,
    });
    expect(isOtelActive()).toBe(true);

    await shutdownOpenTelemetry();
    expect(shutdown).toHaveBeenCalled();
    expect(isOtelActive()).toBe(false);

    await expect(shutdownOpenTelemetry()).resolves.toBeUndefined();
  });

  it('clears active even if sdk.shutdown rejects', async () => {
    shutdown.mockRejectedValueOnce(new Error('flush failed'));
    initOpenTelemetry({
      serviceName: 'api-template',
      endpoint: 'http://localhost:4318',
      level: 'info',
      enabled: true,
    });

    await expect(shutdownOpenTelemetry()).rejects.toThrow('flush failed');
    expect(isOtelActive()).toBe(false);
  });
});
