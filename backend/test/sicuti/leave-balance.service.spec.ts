import { BadRequestException } from '@nestjs/common';
import { LeaveBalanceService } from '../../src/sicuti/leave-balance/leave-balance.service';

const mockDb = {
  query: jest.fn(),
  getClient: jest.fn(),
  withSchema: (n: string) => `template.${n}`,
};

function makeSvc() {
  return new LeaveBalanceService(mockDb as any);
}

describe('LeaveBalanceService.deduct', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws when balance row missing', async () => {
    const client = { query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }) };
    const svc = makeSvc();
    await expect(svc.deduct('u1', 2026, 3, client as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when quota insufficient', async () => {
    const client = {
      query: jest.fn().mockResolvedValue({
        rows: [{ annual_quota: 12, used_days: 11, carry_over_days: 0 }],
        rowCount: 1,
      }),
    };
    const svc = makeSvc();
    await expect(svc.deduct('u1', 2026, 3, client as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('calls UPDATE when quota sufficient', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ annual_quota: 12, used_days: 0, carry_over_days: 2 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }),
    };
    const svc = makeSvc();
    await expect(svc.deduct('u1', 2026, 3, client as any)).resolves.toBeUndefined();
    expect(client.query).toHaveBeenCalledTimes(2);
    // second call is UPDATE
    expect(client.query.mock.calls[1][0]).toMatch(/UPDATE/i);
  });
});
