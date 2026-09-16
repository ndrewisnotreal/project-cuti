import {
  BadRequestException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { HolidayService } from '../holiday/holiday.service';
import { ApprovalFlowService } from '../approval-flow/approval-flow.service';
import { LeaveBalanceService } from '../leave-balance/leave-balance.service';
import {
  ApproveLeaveRequestDto, CancelLeaveRequestDto,
  CreateLeaveRequestDto, ListLeaveRequestDto,
} from './dto/leave-request.dto';

export interface LeaveRequest {
  id_request: string;
  uid_user_system: string;
  kd_leave_type: string;
  substitute_id: string | null;
  start_date: Date;
  end_date: Date;
  total_days: number;
  reason: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  [k: string]: unknown;
}

@Injectable()
export class LeaveRequestService {
  constructor(
    private readonly db: DatabaseService,
    private readonly holidays: HolidayService,
    private readonly flow: ApprovalFlowService,
    private readonly balance: LeaveBalanceService,
  ) {}

  private async countWorkingDays(start: string, end: string): Promise<number> {
    const year = new Date(start).getFullYear();
    const holidayDates = await this.holidays.getHolidayDates(year);
    let count = 0;
    const cur = new Date(start);
    const fin = new Date(end);
    while (cur <= fin) {
      const dow = cur.getDay();
      const iso = cur.toISOString().slice(0, 10);
      if (dow !== 0 && dow !== 6 && !holidayDates.has(iso)) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  }

  private async nextId(year: number): Promise<string> {
    const prefix = `LR${year}`;
    const res = await this.db.query<{ id_request: string }>(
      `SELECT id_request FROM ${this.db.withSchema('d_leave_request')}
       WHERE id_request LIKE $1 ORDER BY id_request DESC LIMIT 1`,
      [`${prefix}%`],
    );
    if (res.rowCount === 0) return `${prefix}00001`;
    const num = parseInt(res.rows[0].id_request.slice(6), 10);
    return `${prefix}${String(num + 1).padStart(5, '0')}`;
  }

  async findAll(dto: ListLeaveRequestDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const offset = (page - 1) * limit;
    const wheres: string[] = [];
    const params: unknown[] = [];
    let idx = 1;
    if (dto.uid_user_system) { wheres.push(`r.uid_user_system = $${idx++}`); params.push(dto.uid_user_system); }
    if (dto.status)          { wheres.push(`r.status = $${idx++}`);          params.push(dto.status); }
    if (dto.kd_dept)         { wheres.push(`u.kd_dept = $${idx++}`);         params.push(dto.kd_dept); }
    if (dto.year)            { wheres.push(`EXTRACT(YEAR FROM r.start_date) = $${idx++}`); params.push(dto.year); }
    const where = wheres.length ? `WHERE ${wheres.join(' AND ')}` : '';
    const rows = await this.db.query<LeaveRequest>(
      `SELECT r.*, u.nama AS requester_name, u.namecode, u.kd_dept, d.nm_dept, lt.nm_leave_type,
        COALESCE((
          SELECT json_agg(json_build_object(
            'approver_id', ar.approver_id,
            'level', ar.level,
            'action', ar.action,
            'notes', ar.notes,
            'signature', ar.signature,
            'created_at', ar.created_at,
            'approver_name', au.nama
          ) ORDER BY ar.level ASC)
          FROM ${this.db.withSchema('d_approval_record')} ar
          LEFT JOIN ${this.db.withSchema('md_user')} au ON au.uid_user_system = ar.approver_id
          WHERE ar.id_request = r.id_request
        ), '[]'::json) AS approval_records
       FROM ${this.db.withSchema('d_leave_request')} r
       JOIN ${this.db.withSchema('md_user')} u ON u.uid_user_system = r.uid_user_system
       JOIN ${this.db.withSchema('md_leave_type')} lt ON lt.kd_leave_type = r.kd_leave_type
       LEFT JOIN ${this.db.withSchema('md_department')} d ON d.kd_dept = u.kd_dept
       ${where} ORDER BY r.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params,
    );
    const total = await this.db.query<{ count: string }>(
      `SELECT COUNT(*) FROM ${this.db.withSchema('d_leave_request')} r
       JOIN ${this.db.withSchema('md_user')} u ON u.uid_user_system = r.uid_user_system ${where}`,
      params,
    );
    return { data: rows.rows, total: Number(total.rows[0].count), page, limit };
  }

  async findOne(idRequest: string): Promise<LeaveRequest> {
    const res = await this.db.query<LeaveRequest>(
      `SELECT r.*, u.nama AS requester_name, u.namecode, u.kd_dept, lt.nm_leave_type, lt.uses_quota
       FROM ${this.db.withSchema('d_leave_request')} r
       JOIN ${this.db.withSchema('md_user')} u ON u.uid_user_system = r.uid_user_system
       JOIN ${this.db.withSchema('md_leave_type')} lt ON lt.kd_leave_type = r.kd_leave_type
       WHERE r.id_request = $1`,
      [idRequest],
    );
    if (res.rowCount === 0) throw new NotFoundException(`Request ${idRequest} tidak ditemukan`);
    return res.rows[0];
  }

  async create(dto: CreateLeaveRequestDto): Promise<LeaveRequest> {
    if (new Date(dto.start_date) > new Date(dto.end_date))
      throw new BadRequestException('start_date harus sebelum end_date');
    const totalDays = await this.countWorkingDays(dto.start_date, dto.end_date);
    if (totalDays === 0) throw new BadRequestException('Tidak ada hari kerja dalam rentang tanggal');
    const year = new Date(dto.start_date).getFullYear();
    const id = await this.nextId(year);
    const res = await this.db.query<LeaveRequest>(
      `INSERT INTO ${this.db.withSchema('d_leave_request')}
         (id_request, uid_user_system, kd_leave_type, substitute_id, start_date, end_date, total_days, reason, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'submitted') RETURNING *`,
      [id, dto.uid_user_system, dto.kd_leave_type, dto.substitute_id ?? null,
       dto.start_date, dto.end_date, totalDays, dto.reason ?? null],
    );
    return res.rows[0];
  }

  async approve(dto: ApproveLeaveRequestDto): Promise<LeaveRequest> {
    const req = await this.findOne(dto.id_request);
    if (!['submitted', 'pending_validation'].includes(req.status as string))
      throw new BadRequestException(`Request sudah dalam status ${req.status}`);

    const { canAct, level } = await this.flow.canApprove(dto.approver_id, dto.id_request);
    if (!canAct) throw new ForbiddenException('Anda tidak berhak melakukan approval pada level ini');

    const flows = await this.flow.findAll();
    const isLastLevel = level === flows[flows.length - 1].level;

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO ${this.db.withSchema('d_approval_record')}
           (id_request, approver_id, level, action, notes, signature)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [dto.id_request, dto.approver_id, level, dto.action, dto.notes ?? null, dto.signature ?? null],
      );

      let newStatus = req.status as string;
      if (dto.action === 'approve') {
        if (isLastLevel) {
          const lt = await client.query<{ uses_quota: boolean }>(
            `SELECT uses_quota FROM ${this.db.withSchema('md_leave_type')} WHERE kd_leave_type = $1`,
            [req.kd_leave_type],
          );
          if (lt.rows[0]?.uses_quota) {
            const year = new Date(req.start_date).getFullYear();
            await this.balance.deduct(req.uid_user_system, year, req.total_days, client);
          }
          newStatus = 'approved';
        } else {
          newStatus = 'pending_validation';
        }
      } else if (dto.action === 'reject') {
        newStatus = 'rejected';
      } else {
        newStatus = 'returned';
      }

      const updated = await client.query<LeaveRequest>(
        `UPDATE ${this.db.withSchema('d_leave_request')}
         SET status = $1, updated_at = NOW() WHERE id_request = $2 RETURNING *`,
        [newStatus, dto.id_request],
      );
      await client.query('COMMIT');
      return updated.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async cancel(dto: CancelLeaveRequestDto): Promise<LeaveRequest> {
    const req = await this.findOne(dto.id_request);
    if (req.uid_user_system !== dto.uid_user_system) throw new ForbiddenException('Bukan pengajuan Anda');
    if (!['submitted', 'returned'].includes(req.status as string))
      throw new BadRequestException(`Request tidak dapat dibatalkan dari status ${req.status}`);
    const res = await this.db.query<LeaveRequest>(
      `UPDATE ${this.db.withSchema('d_leave_request')}
       SET status = 'cancelled', updated_at = NOW() WHERE id_request = $1 RETURNING *`,
      [dto.id_request],
    );
    return res.rows[0];
  }

  async getApprovalHistory(idRequest: string) {
    const res = await this.db.query(
      `SELECT ar.*, u.nama AS approver_name
       FROM ${this.db.withSchema('d_approval_record')} ar
       JOIN ${this.db.withSchema('md_user')} u ON u.uid_user_system = ar.approver_id
       WHERE ar.id_request = $1 ORDER BY ar.created_at ASC`,
      [idRequest],
    );
    return res.rows;
  }
}

