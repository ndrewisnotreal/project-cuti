import { ColoredStderrStream } from '../../src/logging/transports/console.transport';

describe('ColoredStderrStream', () => {
  let stderrWrite: jest.SpyInstance;
  let stream: ColoredStderrStream;

  beforeEach(() => {
    stderrWrite = jest
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    stream = new ColoredStderrStream();
  });

  afterEach(() => {
    stderrWrite.mockRestore();
  });

  function write(chunk: Buffer | string): Promise<void> {
    return new Promise((resolve, reject) => {
      stream.write(chunk, (err) => (err ? reject(err) : resolve()));
    });
  }

  it('writes normal JSON logs without red color', async () => {
    const line = JSON.stringify({ level: 'info', msg: 'hello' });
    await write(`${line}\n`);

    expect(stderrWrite).toHaveBeenCalled();
    const written = String(stderrWrite.mock.calls[0][0]);
    expect(written).not.toContain('\x1b[31m');
    expect(written).toContain('hello');
  });

  it('colors danger level string', async () => {
    await write(JSON.stringify({ level: 'danger', msg: 'bad' }));
    const written = String(stderrWrite.mock.calls[0][0]);
    expect(written).toContain('\x1b[31m');
    expect(written).toContain('bad');
  });

  it('colors danger flag and numeric level 55', async () => {
    await write(JSON.stringify({ danger: true, msg: 'flag' }));
    expect(String(stderrWrite.mock.calls[0][0])).toContain('\x1b[31m');

    stderrWrite.mockClear();
    await write(JSON.stringify({ level: 55, msg: 'num' }));
    expect(String(stderrWrite.mock.calls[0][0])).toContain('\x1b[31m');
  });

  it('writes non-JSON text as-is with newline', async () => {
    await write('plain text');
    expect(String(stderrWrite.mock.calls[0][0])).toBe('plain text\n');
  });

  it('accepts Buffer chunks', async () => {
    await write(Buffer.from(JSON.stringify({ level: 'warn', msg: 'buf' })));
    expect(String(stderrWrite.mock.calls[0][0])).toContain('buf');
  });

  it('still calls callback if stderr.write throws', async () => {
    stderrWrite.mockImplementation(() => {
      throw new Error('broken pipe');
    });
    await expect(write('still ok')).resolves.toBeUndefined();
  });
});
