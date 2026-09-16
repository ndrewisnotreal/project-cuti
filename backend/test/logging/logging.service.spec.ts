import { ConfigService } from '@nestjs/config';
import { LoggingService } from '../../src/logging/logging.service';
import { mockConfig } from '../helpers/mock-config';

describe('LoggingService', () => {
  let stderrWrite: jest.SpyInstance;

  beforeEach(() => {
    stderrWrite = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
  });

  afterEach(() => {
    stderrWrite.mockRestore();
  });

  function createService(map: Record<string, unknown> = {}): LoggingService {
    return new LoggingService(
      mockConfig({
        LOG_LEVEL: 'info',
        LOG_TRANSPORT: 'stderr',
        OTEL_SERVICE_NAME: 'api-template',
        ...map,
      }) as unknown as ConfigService,
    );
  }

  it('creates pino logger with defaults', () => {
    const service = createService({});
    expect(service.getPinoLogger()).toBeDefined();
    expect(service.getPinoLogger().level).toBe('info');
  });

  it('maps alias levels to pino levels', () => {
    expect(createService({ LOG_LEVEL: 'http' }).getPinoLogger().level).toBe(
      'info',
    );
    expect(createService({ LOG_LEVEL: 'verbose' }).getPinoLogger().level).toBe(
      'debug',
    );
    expect(createService({ LOG_LEVEL: 'silly' }).getPinoLogger().level).toBe(
      'trace',
    );
    expect(createService({ LOG_LEVEL: 'danger' }).getPinoLogger().level).toBe(
      'error',
    );
  });

  it('uses otel transport stream without throwing', () => {
    expect(() => createService({ LOG_TRANSPORT: 'otel' })).not.toThrow();
    expect(() => createService({ LOG_TRANSPORT: 'both' })).not.toThrow();
  });

  it('falls back to stderr when transport is unrecognized', () => {
    expect(() => createService({ LOG_TRANSPORT: 'invalid' })).not.toThrow();
  });

  it('log/info/http/warn/debug/verbose/error/fatal write without throwing', () => {
    const service = createService({ LOG_LEVEL: 'trace' });
    expect(() => {
      service.log('hello', 'Ctx');
      service.info('info', 'Ctx');
      service.http('GET /', 'HTTP');
      service.warn('warn', 'Ctx');
      service.debug('debug', 'Ctx');
      service.verbose('verbose', 'Ctx');
      service.error('err', 'stack', 'Ctx');
      service.fatal('fatal', 'stack', 'Ctx');
    }).not.toThrow();
  });

  it('danger writes red JSON line to stderr', () => {
    const service = createService();
    service.danger('probe', 'UnknownRoute');

    expect(stderrWrite).toHaveBeenCalled();
    const written = String(stderrWrite.mock.calls[0][0]);
    expect(written).toContain('\x1b[31m');
    expect(written).toContain('\x1b[0m');
    expect(written).toContain('"level":"danger"');
    expect(written).toContain('"danger":true');
    expect(written).toContain('probe');
    expect(written).toContain('UnknownRoute');
  });

  it('danger stringifies non-string messages and defaults context', () => {
    const service = createService();
    service.danger({ code: 1 });

    const written = String(stderrWrite.mock.calls[0][0]);
    expect(written).toContain('"msg":"{\\"code\\":1}"');
    expect(written).toContain('"context":"Danger"');
  });

  it('uses default service name when OTEL_SERVICE_NAME missing', () => {
    const service = new LoggingService(
      mockConfig({
        LOG_LEVEL: 'info',
        LOG_TRANSPORT: 'stderr',
      }) as unknown as ConfigService,
    );
    service.danger('x');
    const written = String(stderrWrite.mock.calls[0][0]);
    expect(written).toContain('"name":"api-template"');
  });

  it('defaults LOG_LEVEL and LOG_TRANSPORT when unset', () => {
    const service = new LoggingService(
      mockConfig({}) as unknown as ConfigService,
    );
    expect(service.getPinoLogger().level).toBe('info');
    // default transport = otel (stream no-op jika SDK belum start)
    expect(() => service.log('boot')).not.toThrow();
  });
});
