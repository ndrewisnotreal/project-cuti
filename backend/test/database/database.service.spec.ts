import { DatabaseService } from '../../src/database/database.service';
import { mockConfig } from '../helpers/mock-config';

const query = jest.fn();
const connect = jest.fn();
const end = jest.fn();
const on = jest.fn();

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({ query, connect, end, on })),
}));

describe('DatabaseService', () => {
  beforeEach(() => {
    query.mockReset();
    connect.mockReset();
    end.mockReset();
    on.mockReset();
  });

  it('schema helpers and query', async () => {
    const db = new DatabaseService(
      mockConfig({ DB_SCHEMA: 'template' }) as any,
    );
    expect(db.getSchema()).toBe('template');
    expect(db.withSchema('md_user')).toBe('template.md_user');
    query.mockResolvedValueOnce({ rows: [1] });
    expect(await db.query('SELECT 1', [])).toEqual({ rows: [1] });
    expect(on).toHaveBeenCalledWith('error', expect.any(Function));
    on.mock.calls[0][1](new Error('idle'));
  });

  it('onModuleInit ping success and failure', async () => {
    const db = new DatabaseService(mockConfig({}) as any);
    query.mockResolvedValueOnce({ rows: [1] });
    await db.onModuleInit();
    query.mockRejectedValueOnce(new Error('down'));
    await db.onModuleInit();
  });

  it('onModuleDestroy ends pool', async () => {
    const db = new DatabaseService(mockConfig({}) as any);
    end.mockResolvedValueOnce(undefined);
    await db.onModuleDestroy();
    expect(end).toHaveBeenCalled();
  });

  it('withTransaction commits and rolls back', async () => {
    const db = new DatabaseService(mockConfig({}) as any);
    const client = {
      query: jest.fn().mockResolvedValue({}),
      release: jest.fn(),
    };
    connect.mockResolvedValue(client);

    await expect(
      db.withTransaction(async (c) => {
        expect(c).toBe(client);
        return 42;
      }),
    ).resolves.toBe(42);
    expect(client.query).toHaveBeenCalledWith('BEGIN');
    expect(client.query).toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalled();

    client.query.mockReset();
    client.query.mockResolvedValue({});
    await expect(
      db.withTransaction(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(client.query).toHaveBeenCalledWith('ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });

  it('getClient connects', async () => {
    const db = new DatabaseService(mockConfig({}) as any);
    connect.mockResolvedValueOnce({ query: jest.fn() });
    expect(await db.getClient()).toBeDefined();
  });
});
