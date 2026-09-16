import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { CreateHolidayDto, DeleteHolidayDto } from './dto/holiday.dto';

export interface Holiday {
  id_holiday: string;
  holiday_date: Date;
  nm_holiday: string;
  year: number;
  type: string;
  is_deleted: boolean;
}

@Injectable()
export class HolidayService {
  constructor(private readonly db: DatabaseService) {}

  async findByYear(year: number): Promise<Holiday[]> {
    const res = await this.db.query<Holiday>(
      `SELECT id_holiday, holiday_date, nm_holiday, year, type, is_deleted
       FROM ${this.db.withSchema('md_holiday')}
       WHERE year = $1 AND is_deleted = FALSE
       ORDER BY holiday_date`,
      [year],
    );
    return res.rows;
  }

  /** Returns Set of 'YYYY-MM-DD' strings for quick lookup */
  async getHolidayDates(year: number): Promise<Set<string>> {
    const rows = await this.findByYear(year);
    return new Set(rows.map((r) => new Date(r.holiday_date).toISOString().slice(0, 10)));
  }

  private async nextId(): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const id = `H${randomBytes(2).toString('hex').toUpperCase()}`;
      const e = await this.db.query(
        `SELECT 1 FROM ${this.db.withSchema('md_holiday')} WHERE id_holiday = $1`,
        [id],
      );
      if (e.rowCount === 0) return id;
    }
    throw new BadRequestException('Gagal menghasilkan id_holiday unik');
  }

  async create(dto: CreateHolidayDto): Promise<Holiday> {
    const id = dto.id_holiday?.trim() || (await this.nextId());
    const d = new Date(dto.holiday_date);
    const year = d.getFullYear();
    const res = await this.db.query<Holiday>(
      `INSERT INTO ${this.db.withSchema('md_holiday')} (id_holiday, holiday_date, nm_holiday, year, type)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id_holiday) DO UPDATE SET
         holiday_date = EXCLUDED.holiday_date, nm_holiday = EXCLUDED.nm_holiday,
         year = EXCLUDED.year, type = EXCLUDED.type
       RETURNING *`,
      [id, dto.holiday_date, dto.nm_holiday, year, dto.type ?? 'national'],
    );
    return res.rows[0];
  }

  async remove(dto: DeleteHolidayDto): Promise<void> {
    const res = await this.db.query(
      `UPDATE ${this.db.withSchema('md_holiday')} SET is_deleted = TRUE WHERE id_holiday = $1`,
      [dto.id_holiday],
    );
    if (res.rowCount === 0) throw new NotFoundException(`Hari libur ${dto.id_holiday} tidak ditemukan`);
  }
}
