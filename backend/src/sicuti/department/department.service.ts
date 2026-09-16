import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

export interface Department {
  kd_dept: string;
  nm_dept: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class DepartmentService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(includeDeleted = false): Promise<Department[]> {
    const result = await this.db.query<Department>(
      `SELECT kd_dept, nm_dept, is_deleted, created_at, updated_at
       FROM ${this.db.withSchema('md_department')}
       ${includeDeleted ? '' : 'WHERE is_deleted = FALSE'}
       ORDER BY nm_dept`,
    );
    return result.rows;
  }

  private async nextKd(): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const kd = `DP${randomBytes(3).toString('hex').toUpperCase()}`;
      const exists = await this.db.query(
        `SELECT 1 FROM ${this.db.withSchema('md_department')} WHERE kd_dept = $1`,
        [kd],
      );
      if (exists.rowCount === 0) return kd;
    }
    throw new BadRequestException('Gagal menghasilkan kd_dept unik');
  }

  async create(dto: CreateDepartmentDto): Promise<Department> {
    const kd = dto.kd_dept?.trim().toUpperCase() || (await this.nextKd());
    const result = await this.db.query<Department>(
      `INSERT INTO ${this.db.withSchema('md_department')} (kd_dept, nm_dept)
       VALUES ($1, $2)
       ON CONFLICT (kd_dept) DO UPDATE SET nm_dept = EXCLUDED.nm_dept, updated_at = NOW()
       RETURNING *`,
      [kd, dto.nm_dept],
    );
    return result.rows[0];
  }

  async update(dto: UpdateDepartmentDto): Promise<Department> {
    const result = await this.db.query<Department>(
      `UPDATE ${this.db.withSchema('md_department')}
       SET nm_dept = COALESCE($2, nm_dept), updated_at = NOW()
       WHERE kd_dept = $1 AND is_deleted = FALSE
       RETURNING *`,
      [dto.kd_dept, dto.nm_dept ?? null],
    );
    if (result.rowCount === 0) throw new NotFoundException(`Departemen ${dto.kd_dept} tidak ditemukan`);
    return result.rows[0];
  }

  async remove(kdDept: string): Promise<void> {
    const users = await this.db.query(
      `SELECT 1 FROM ${this.db.withSchema('md_user')} WHERE kd_dept = $1 AND is_deleted = FALSE LIMIT 1`,
      [kdDept],
    );
    if (users.rowCount && users.rowCount > 0) {
      throw new BadRequestException(`Departemen ${kdDept} masih memiliki user aktif`);
    }
    const res = await this.db.query(
      `UPDATE ${this.db.withSchema('md_department')} SET is_deleted = TRUE, updated_at = NOW() WHERE kd_dept = $1`,
      [kdDept],
    );
    if (res.rowCount === 0) throw new NotFoundException(`Departemen ${kdDept} tidak ditemukan`);
  }
}
