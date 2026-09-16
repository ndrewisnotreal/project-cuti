import { SeverityNumber } from '@opentelemetry/api-logs';

const emit = jest.fn();
const getLogger = jest.fn(() => ({ emit }));
const isOtelActive = jest.fn();

jest.mock('@opentelemetry/api-logs', () => {
  const actual = jest.requireActual('@opentelemetry/api-logs');
  return {
    ...actual,
    logs: { getLogger: (...args: unknown[]) => getLogger(...args) },
  };
});

jest.mock('../../src/logging/otel/tracing', () => ({
  isOtelActive: () => isOtelActive(),
}));

import { OtelLogStream } from '../../src/logging/transports/otel.transport';

describe('OtelLogStream', () => {
  let stream: OtelLogStream;

  beforeEach(() => {
    jest.clearAllMocks();
    stream = new OtelLogStream();
  });

  function write(chunk: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      stream.write(chunk, (err) => (err ? reject(err) : resolve()));
    });
  }

  it('is a no-op when OTel is inactive', async () => {
    isOtelActive.mockReturnValue(false);
    await write({ level: 'info', msg: 'skip' });
    expect(getLogger).not.toHaveBeenCalled();
    expect(emit).not.toHaveBeenCalled();
  });

  it('emits LogRecord when OTel is active', async () => {
    isOtelActive.mockReturnValue(true);
    await write({
      level: 'info',
      msg: 'hello',
      time: '2026-01-01T00:00:00.000Z',
      context: 'HTTP',
    });

    expect(getLogger).toHaveBeenCalledWith('api-template');
    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({
        severityNumber: SeverityNumber.INFO,
        severityText: 'INFO',
        body: 'hello',
        attributes: expect.objectContaining({ context: 'HTTP' }),
      }),
    );
  });

  it('maps numeric and string levels including danger/fatal', async () => {
    isOtelActive.mockReturnValue(true);

    await write({ level: 50, msg: 'e' });
    expect(emit.mock.calls.at(-1)[0].severityNumber).toBe(SeverityNumber.ERROR);

    await write({ level: 'danger', msg: 'd' });
    expect(emit.mock.calls.at(-1)[0].severityText).toBe('DANGER');

    await write({ level: 60, msg: 'f' });
    expect(emit.mock.calls.at(-1)[0].severityNumber).toBe(SeverityNumber.FATAL);

    await write({ level: 'unknown-level', msg: 'u' });
    expect(emit.mock.calls.at(-1)[0].severityNumber).toBe(
      SeverityNumber.UNSPECIFIED,
    );
    expect(emit.mock.calls.at(-1)[0].severityText).toBe('UNSPECIFIED');
  });

  it('handles empty chunk safely', async () => {
    isOtelActive.mockReturnValue(true);
    await write({});
    expect(emit).toHaveBeenCalledWith(
      expect.objectContaining({
        body: '',
        severityText: 'UNSPECIFIED',
      }),
    );
  });

  it('handles undefined fields via direct _write', (done) => {
    isOtelActive.mockReturnValue(true);
    stream._write(undefined, 'utf8', (err) => {
      expect(err).toBeFalsy();
      expect(emit).toHaveBeenCalledWith(
        expect.objectContaining({
          body: '',
          severityText: 'UNSPECIFIED',
        }),
      );
      done();
    });
  });

  it('swallows emit errors so request path is not broken', async () => {
    isOtelActive.mockReturnValue(true);
    emit.mockImplementationOnce(() => {
      throw new Error('otel down');
    });
    await expect(write({ level: 'info', msg: 'x' })).resolves.toBeUndefined();
  });
});
