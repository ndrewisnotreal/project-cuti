import { BadRequestException } from '@nestjs/common';
import { LeaveRequestService } from '../../src/sicuti/leave-request/leave-request.service';

// ---- minimal stubs ----
const mockDb = {
  query: jest.fn(),
  getClient: jest.fn(),
  withSchema: (n: string) => `template.${n}`,
};
const mockHolidays = {
  getHolidayDates: jest.fn().mockResolvedValue(new Set<string>()),
};
const mockFlow = {
  findAll: jest.fn(),
  canApprove: jest.fn(),
};
const mockBalance = {
  deduct: jest.fn(),
};

function makeSvc(): LeaveRequestService {
  return new LeaveRequestService(
    mockDb as any,
    mockHolidays as any,
    mockFlow as any,
    mockBalance as any,
  );
}

describe('LeaveRequestService.countWorkingDays (via create)', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects when start > end', async () => {
    const svc = makeSvc();
    await expect(
      svc.create({
        uid_user_system: 'u1',
        kd_leave_type: 'LT001',
        start_date: '2026-10-05',
        end_date: '2026-10-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when no working days (weekend only)', async () => {
    const svc = makeSvc();
    // 2026-10-10 (Saturday) – 2026-10-11 (Sunday)
    await expect(
      svc.create({
        uid_user_system: 'u1',
        kd_leave_type: 'LT001',
        start_date: '2026-10-10',
        end_date: '2026-10-11',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('counts 3 working days Mon-Wed', async () => {
    mockDb.query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // nextId SELECT
      .mockResolvedValueOnce({ rows: [{ id_request: 'LR202600001' }], rowCount: 1 }); // INSERT
    const svc = makeSvc();
    const res = await svc.create({
      uid_user_system: 'u1',
      kd_leave_type: 'LT001',
      start_date: '2026-10-12', // Monday
      end_date: '2026-10-14',   // Wednesday
    });
    // INSERT called with total_days = 3
    const insertCall = mockDb.query.mock.calls[1];
    expect(insertCall[1][6]).toBe(3); // 7th param = totalDays
  });
});
