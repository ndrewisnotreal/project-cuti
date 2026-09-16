import { of, throwError, lastValueFrom } from 'rxjs';
import { ExecutionContext } from '@nestjs/common';
import { LoggingInterceptor } from '../../src/common/interceptors/logging.interceptor';
import { LoggingService } from '../../src/logging/logging.service';

describe('LoggingInterceptor', () => {
  const loggingService = {
    http: jest.fn(),
    error: jest.fn(),
  } as unknown as LoggingService;

  const interceptor = new LoggingInterceptor(loggingService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function makeHttpContext(opts?: {
    method?: string;
    url?: string;
    originalUrl?: string;
    statusCode?: number;
  }): ExecutionContext {
    const request = {
      method: opts?.method ?? 'GET',
      url: opts?.url ?? '/health',
      ...(opts?.originalUrl !== undefined
        ? { originalUrl: opts.originalUrl }
        : {}),
    };
    const response = { statusCode: opts?.statusCode ?? 200 };

    return {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as unknown as ExecutionContext;
  }

  it('passes through non-http contexts without logging', async () => {
    const ctx = {
      getType: () => 'rpc',
      switchToHttp: () => {
        throw new Error('should not be called');
      },
    } as unknown as ExecutionContext;

    const result = await lastValueFrom(
      interceptor.intercept(ctx, { handle: () => of('ok') }),
    );
    expect(result).toBe('ok');
    expect(loggingService.http).not.toHaveBeenCalled();
  });

  it('logs successful HTTP request with duration', async () => {
    const ctx = makeHttpContext({
      method: 'POST',
      url: '/auth/login',
      statusCode: 201,
    });

    await lastValueFrom(
      interceptor.intercept(ctx, { handle: () => of({ ok: true }) }),
    );

    expect(loggingService.http).toHaveBeenCalledWith(
      expect.stringMatching(/^POST \/auth\/login -> 201 \(\d+\.\d{2}ms\)$/),
      'HTTP',
    );
  });

  it('prefers originalUrl when present', async () => {
    const ctx = makeHttpContext({
      url: '/raw',
      originalUrl: '/via-proxy/path',
    });

    await lastValueFrom(interceptor.intercept(ctx, { handle: () => of(null) }));

    expect(loggingService.http).toHaveBeenCalledWith(
      expect.stringContaining('GET /via-proxy/path -> 200'),
      'HTTP',
    );
  });

  it('logs errors with status from exception when available', async () => {
    const ctx = makeHttpContext({ url: '/fail' });
    const err = Object.assign(new Error('denied'), { status: 403 });

    await expect(
      lastValueFrom(
        interceptor.intercept(ctx, { handle: () => throwError(() => err) }),
      ),
    ).rejects.toThrow('denied');

    expect(loggingService.error).toHaveBeenCalledWith(
      expect.stringMatching(/^GET \/fail -> 403 \(\d+\.\d{2}ms\)$/),
      err.stack,
      'HTTP',
    );
  });

  it('defaults error status to 500 when missing', async () => {
    const ctx = makeHttpContext();

    await expect(
      lastValueFrom(
        interceptor.intercept(ctx, {
          handle: () => throwError(() => ({ message: 'no status' })),
        }),
      ),
    ).rejects.toEqual({ message: 'no status' });

    expect(loggingService.error).toHaveBeenCalledWith(
      expect.stringContaining('-> 500'),
      undefined,
      'HTTP',
    );
  });

  it('defaults status to 500 when err.status is nullish', async () => {
    const ctx = makeHttpContext();
    const err = Object.assign(new Error('x'), { status: undefined });

    await expect(
      lastValueFrom(
        interceptor.intercept(ctx, { handle: () => throwError(() => err) }),
      ),
    ).rejects.toThrow('x');

    expect(loggingService.error).toHaveBeenCalledWith(
      expect.stringContaining('-> 500'),
      err.stack,
      'HTTP',
    );
  });
});
