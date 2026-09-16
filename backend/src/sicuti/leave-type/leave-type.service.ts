import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { DeleteLeaveTypeDto, UpsertLeaveTypeDto } from './dto/leave-type.dto';

export interface LeaveType {
  kd_leave_type: string;
  code: string;
  nm_leave_type: string;
  description: string | null;
  uses_quota: boolean;
  requires_document: boolean;
  is_active: boolean;
  is_deleted: boolean;
}

@Injectable()
export class LeaveTypeService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(activeOnly = true): Promise<LeaveType[]> {
    const result = await this.db.query<LeaveType>(
      `SELECT kd_leave_type, code, nm_leave_type, description, uses_quota, requires_document, is_active, is_deleted
       FROM ${this.db.withSchema('md_leave_type')}
       ${activeOnly ? 'WHERE is_deleted = FALSE AND is_active = TRUE' : 'WHERE is_deleted = FALSE'}
       ORDER BY code`,
    );
    return result.rows;
  }

  private async nextKd(): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const kd = `LT${randomBytes(3).toString('hex').toUpperCase()}`;
      const exists = await this.db.query(
        `SELECT 1 FROM ${this.db.withSchema('md_leave_type')} WHERE kd_leave_type = $1`,
        [kd],
      );
      if (exists.rowCount === 0) return kd;
    }
    throw new BadRequestException('Gagal menghasilkan kd_leave_type unik');
  }

  async upsert(dto: UpsertLeaveTypeDto): Promise<LeaveType> {
    const kd = dto.kd_leave_type?.trim() || (await this.nextKd());
    const result = await this.db.query<LeaveType>(
      `INSERT INTO ${this.db.withSchema('md_leave_type')}
         (kd_leave_type, code, nm_leave_type, description, uses_quota, requires_document, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (kd_leave_type) DO UPDATE SET
         code = EXCLUDED.code, nm_leave_type = EXCLUDED.nm_leave_type,
         description = EXCLUDED.description, uses_quota = EXCLUDED.uses_quota,
         requires_document = EXCLUDED.requires_document, is_active = EXCLUDED.is_active,
         updated_at = NOW()
       RETURNING *`,
      [kd, dto.code, dto.nm_leave_type, dto.description ?? null,
       dto.uses_quota ?? true, dto.requires_document ?? false, dto.is_active ?? true],
    );
    return result.rows[0];
  }

  async remove(dto: DeleteLeaveTypeDto): Promise<void> {
    const res = await this.db.query(
      `UPDATE ${this.db.withSchema('md_leave_type')} SET is_deleted = TRUE, updated_at = NOW()
       WHERE kd_leave_type = $1 AND is_deleted = FALSE`,
      [dto.kd_leave_type],
    );
    if (res.rowCount === 0) throw new NotFoundException(`Jenis cuti ${dto.kd_leave_type} tidak ditemukan`);
  }
}
