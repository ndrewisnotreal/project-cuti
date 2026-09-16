import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { UpdatePolicyDto } from './dto/policy.dto';

export interface LeavePolicy {
  id: number;
  annual_quota: number;
  max_carry_over: number;
  carry_over_expiry_months: number;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class LeavePolicyService {
  constructor(private readonly db: DatabaseService) {}

  async getActive(): Promise<LeavePolicy | null> {
    const res = await this.db.query<LeavePolicy>(
      `SELECT * FROM ${this.db.withSchema('md_leave_policy')} WHERE is_active = TRUE ORDER BY id DESC LIMIT 1`,
    );
    return res.rows[0] ?? null;
  }

  async update(dto: UpdatePolicyDto): Promise<LeavePolicy> {
    const res = await this.db.query<LeavePolicy>(
      `UPDATE ${this.db.withSchema('md_leave_policy')}
       SET annual_quota              = COALESCE($1, annual_quota),
           max_carry_over            = COALESCE($2, max_carry_over),
           carry_over_expiry_months  = COALESCE($3, carry_over_expiry_months),
           description               = COALESCE($4, description),
           updated_at                = NOW()
       WHERE is_active = TRUE
       RETURNING *`,
      [dto.annual_quota ?? null, dto.max_carry_over ?? null,
       dto.carry_over_expiry_months ?? null, dto.description ?? null],
    );
    if (res.rowCount === 0) {
      const ins = await this.db.query<LeavePolicy>(
        `INSERT INTO ${this.db.withSchema('md_leave_policy')}
           (annual_quota, max_carry_over, carry_over_expiry_months, description)
         VALUES (COALESCE($1,12), COALESCE($2,4), COALESCE($3,6), $4)
         RETURNING *`,
        [dto.annual_quota ?? null, dto.max_carry_over ?? null,
         dto.carry_over_expiry_months ?? null, dto.description ?? null],
      );
      return ins.rows[0];
    }
    return res.rows[0];
  }
}
