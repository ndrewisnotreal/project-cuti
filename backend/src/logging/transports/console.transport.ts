import { Writable } from 'stream';

const ANSI_RED = '\x1b[31m';
const ANSI_RESET = '\x1b[0m';

function isDangerLog(parsed: Record<string, unknown>): boolean {
  return (
    parsed.level === 'danger' || parsed.level === 55 || parsed.danger === true
  );
}

/**
 * Pino stream → stderr, dengan warna merah untuk level `danger`.
 */
export class ColoredStderrStream extends Writable {
  override _write(
    chunk: Buffer | string,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    try {
      const raw = Buffer.isBuffer(chunk)
        ? chunk.toString('utf8')
        : String(chunk);
      const trimmed = raw.replace(/\r?\n$/, '');

      let isDanger = false;
      try {
        isDanger = isDangerLog(JSON.parse(trimmed) as Record<string, unknown>);
      } catch {
        // bukan JSON
      }

      if (isDanger) {
        process.stderr.write(`${ANSI_RED}${trimmed}${ANSI_RESET}\n`);
      } else {
        process.stderr.write(raw.endsWith('\n') ? raw : `${raw}\n`);
      }
    } catch {
      // jangan ganggu request path
    }
    callback();
  }
}
