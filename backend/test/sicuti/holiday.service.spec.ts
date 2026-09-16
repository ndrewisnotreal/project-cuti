import { HolidayService } from '../../src/sicuti/holiday/holiday.service';

const mockDb = {
  query: jest.fn(),
  getClient: jest.fn(),
  withSchema: (n: string) => `template.${n}`,
};

function makeSvc() {
  return new HolidayService(mockDb as any);
}

describe('HolidayService.getHolidayDates', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns Set of ISO strings', async () => {
    mockDb.query.mockResolvedValue({
      rows: [
        { id_holiday: 'H001', holiday_date: new Date('2026-01-01'), nm_holiday: 'Tahun Baru', year: 2026, type: 'national', is_deleted: false },
        { id_holiday: 'H002', holiday_date: new Date('2026-08-17'), nm_holiday: 'Kemerdekaan', year: 2026, type: 'national', is_deleted: false },
      ],
      rowCount: 2,
    });
    const svc = makeSvc();
    const set = await svc.getHolidayDates(2026);
    expect(set.has('2026-01-01')).toBe(true);
    expect(set.has('2026-08-17')).toBe(true);
    expect(set.has('2026-03-15')).toBe(false);
  });

  it('returns empty Set when no holidays', async () => {
    mockDb.query.mockResolvedValue({ rows: [], rowCount: 0 });
    const svc = makeSvc();
    const set = await svc.getHolidayDates(2099);
    expect(set.size).toBe(0);
  });
});
