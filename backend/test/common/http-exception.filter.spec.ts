import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { LoggingService } from '../../src/logging/logging.service';

function makeHost(
  reply: { status: jest.Mock; send: jest.Mock },
  request: Record<string, unknown> = { method: 'GET', url: '/test' },
) {
  return {
    switchToHttp: () => ({
      getResponse: () => reply,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;
}

describe('HttpExceptionFilter', () => {
  const loggingService = {
    danger: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  } as unknown as LoggingService;

  const filter = new HttpExceptionFilter(loggingService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function catchWith(exception: unknown, request?: Record<string, unknown>) {
    const reply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    filter.catch(exception, makeHost(reply, request));
    return reply;
  }

  it('handles string HttpException', () => {
    const reply = catchWith(new HttpException('nope', HttpStatus.FORBIDDEN));
    expect(reply.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(reply.send).toHaveBeenCalledWith({
      success: false,
      error: 'nope',
      data: null,
    });
    expect(loggingService.warn).toHaveBeenCalled();
  });

  it('joins validation message arrays', () => {
    const reply = catchWith(new BadRequestException(['a', 'b']));
    expect(reply.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(reply.send.mock.calls[0][0].error).toBe('a, b');
  });

  it('uses object message string', () => {
    const reply = catchWith(new BadRequestException('single'));
    expect(reply.send.mock.calls[0][0].error).toBe('single');
  });

  it('handles generic Error as 500', () => {
    const reply = catchWith(new Error('boom'));
    expect(reply.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(reply.send.mock.calls[0][0].error).toBe('boom');
    expect(loggingService.error).toHaveBeenCalled();
  });

  it('logs unknown route as danger', () => {
    const reply = catchWith(
      new HttpException('Cannot GET /unknown', HttpStatus.NOT_FOUND),
    );
    expect(reply.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(loggingService.danger).toHaveBeenCalled();
  });

  it('includes data from HttpException response body', () => {
    const reply = catchWith(
      new HttpException(
        {
          message: 'Password expired',
          data: { code: 'PASSWORD_EXPIRED', change_token: 'tok' },
        },
        HttpStatus.FORBIDDEN,
      ),
    );
    expect(reply.send).toHaveBeenCalledWith({
      success: false,
      error: 'Password expired',
      data: { code: 'PASSWORD_EXPIRED', change_token: 'tok' },
    });
  });

  it('handles object response without message and nullish message', () => {
    const reply = catchWith(
      new HttpException({ data: { x: 1 } }, HttpStatus.BAD_REQUEST),
    );
    expect(reply.send.mock.calls[0][0].error).toBe('Internal server error');
    expect(reply.send.mock.calls[0][0].data).toEqual({ x: 1 });

    const replyNullMsg = catchWith(
      new HttpException(
        { message: null, data: { a: 1 } },
        HttpStatus.BAD_REQUEST,
      ),
    );
    expect(replyNullMsg.send.mock.calls[0][0].error).toBe(
      'Internal server error',
    );
    expect(replyNullMsg.send.mock.calls[0][0].data).toEqual({ a: 1 });
  });

  it('handles object response with empty object (no message/data keys)', () => {
    const reply = catchWith(new HttpException({}, HttpStatus.BAD_REQUEST));
    expect(reply.send.mock.calls[0][0].error).toBe('Internal server error');
    expect(reply.send.mock.calls[0][0].data).toBeNull();
  });

  it('logs domain 404 as warn (not danger)', () => {
    catchWith(new HttpException('User not found', HttpStatus.NOT_FOUND));
    expect(loggingService.warn).toHaveBeenCalled();
    expect(loggingService.danger).not.toHaveBeenCalled();
  });

  it('uses originalUrl in log context when present', () => {
    catchWith(new Error('boom'), {
      method: 'DELETE',
      url: '/raw',
      originalUrl: '/api/items/1',
    });
    expect(loggingService.error).toHaveBeenCalledWith(
      'boom',
      expect.any(String),
      'DELETE /api/items/1',
    );
  });

  it('handles non-Error unknown as 500 with default message', () => {
    const reply = catchWith('weird');
    expect(reply.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(reply.send.mock.calls[0][0].error).toBe('Internal server error');
    expect(loggingService.error).toHaveBeenCalledWith(
      'Internal server error',
      undefined,
      'GET /test',
    );
  });
});
