import { BadRequestException, Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../database/database.service';
import { UpsertBalanceDto } from './dto/leave-balance.dto';

export interface LeaveBalance {
  id_balance: string;
  uid_user_system: string;
  year: number;
  annual_quota: number;
  used_days: number;
  carry_over_days: number;
  carry_over_expiry_date: Date | null;
  remaining?: number;
}

@Injectable()
export class LeaveBalanceService {
  constructor(private readonly db: DatabaseService) {}

  async getForUser(uid: string, year?: number): Promise<LeaveBalance[]> {
    const y = year ?? new Date().getFullYear();
    const res = await this.db.query<LeaveBalance>(
      `SELECT id_balance, uid_user_system, year, annual_quota, used_days,
              carry_over_days, carry_over_expiry_date,
              (annual_quota + carry_over_days - used_days) AS remaining
       FROM ${this.db.withSchema('d_leave_balance')}
       WHERE uid_user_system = $1 AND year = $2`,
      [uid, y],
    );
    return res.rows;
  }

  async getAll(year?: number): Promise<LeaveBalance[]> {
    const y = year ?? new Date().getFullYear();
    const res = await this.db.query<LeaveBalance>(
      `SELECT b.id_balance, b.uid_user_system, u.nama, u.namecode,
              u.kd_dept, b.year, b.annual_quota, b.used_days,
              b.carry_over_days, b.carry_over_expiry_date,
              (b.annual_quota + b.carry_over_days - b.used_days) AS remaining
       FROM ${this.db.withSchema('d_leave_balance')} b
       JOIN ${this.db.withSchema('md_user')} u ON u.uid_user_system = b.uid_user_system
       WHERE b.year = $1
       ORDER BY u.nama`,
      [y],
    );
    return res.rows;
  }

  private async nextId(): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const id = `LB${randomBytes(3).toString('hex').toUpperCase()}`;
      const e = await this.db.query(
        `SELECT 1 FROM ${this.db.withSchema('d_leave_balance')} WHERE id_balance = $1`, [id],
      );
      if (e.rowCount === 0) return id;
    }
    throw new BadRequestException('Gagal menghasilkan id_balance unik');
  }

  async upsert(dto: UpsertBalanceDto): Promise<LeaveBalance> {
    const existing = await this.db.query<LeaveBalance>(
      `SELECT id_balance FROM ${this.db.withSchema('d_leave_balance')} WHERE uid_user_system = $1 AND year = $2`,
      [dto.uid_user_system, dto.year],
    );
    const id = existing.rows[0]?.id_balance ?? (await this.nextId());
    const res = await this.db.query<LeaveBalance>(
      `INSERT INTO ${this.db.withSchema('d_leave_balance')}
         (id_balance, uid_user_system, year, annual_quota, carry_over_days, carry_over_expiry_date)
       VALUES ($1,$2,$3,COALESCE($4,12),COALESCE($5,0),$6)
       ON CONFLICT (uid_user_system, year) DO UPDATE SET
         annual_quota = COALESCE($4, EXCLUDED.annual_quota),
         carry_over_days = COALESCE($5, EXCLUDED.carry_over_days),
         carry_over_expiry_date = COALESCE($6, EXCLUDED.carry_over_expiry_date),
         updated_at = NOW()
       RETURNING *`,
      [id, dto.uid_user_system, dto.year,
       dto.annual_quota ?? null, dto.carry_over_days ?? null,
       dto.carry_over_expiry_date ?? null],
    );
    return res.rows[0];
  }

  /**
   * Deduct `days` from balance within an existing PoolClient transaction.
   * Throws BadRequestException if quota insufficient.
   */
  async deduct(uid: string, year: number, days: number, client: PoolClient): Promise<void> {
    const lockRes = await client.query<{ annual_quota: number; used_days: number; carry_over_days: number }>(
      `SELECT annual_quota, used_days, carry_over_days
       FROM ${this.db.withSchema('d_leave_balance')}
       WHERE uid_user_system = $1 AND year = $2
       FOR UPDATE`,
      [uid, year],
    );
    if (lockRes.rowCount === 0) {
      throw new BadRequestException(`Saldo cuti untuk tahun ${year} belum diinisialisasi`);
    }
    const { annual_quota, used_days, carry_over_days } = lockRes.rows[0];
    const remaining = annual_quota + carry_over_days - used_days;
    if (days > remaining) {
      throw new BadRequestException(`Kuota tidak cukup: tersisa ${remaining} hari, diajukan ${days} hari`);
    }
    await client.query(
      `UPDATE ${this.db.withSchema('d_leave_balance')}
       SET used_days = used_days + $1, updated_at = NOW()
       WHERE uid_user_system = $2 AND year = $3`,
      [days, uid, year],
    );
  }

  /** Restore deducted days (on reject / cancel) */
  async restore(uid: string, year: number, days: number): Promise<void> {
    await this.db.query(
      `UPDATE ${this.db.withSchema('d_leave_balance')}
       SET used_days = GREATEST(0, used_days - $1), updated_at = NOW()
       WHERE uid_user_system = $2 AND year = $3`,
      [days, uid, year],
    );
  }
}
