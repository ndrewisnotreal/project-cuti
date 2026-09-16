import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { AssignFlowUsersDto, UpsertFlowDto } from './dto/approval-flow.dto';

export interface ApprovalFlow {
  id_flow: string;
  level: number;
  nm_flow: string;
  assigned_role: string | null;
  is_mandatory: boolean;
  is_active: boolean;
  users?: string[];
}

@Injectable()
export class ApprovalFlowService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(): Promise<ApprovalFlow[]> {
    const flows = await this.db.query<ApprovalFlow>(
      `SELECT f.id_flow, f.level, f.nm_flow, f.assigned_role, f.is_mandatory, f.is_active
       FROM ${this.db.withSchema('d_approval_flow')} f
       WHERE f.is_active = TRUE ORDER BY f.level`,
    );
    if (flows.rowCount === 0) return [];

    const ids = flows.rows.map((r) => r.id_flow);
    const fuRes = await this.db.query<{ id_flow: string; uid_user_system: string }>(
      `SELECT id_flow, uid_user_system FROM ${this.db.withSchema('d_approval_flow_user')} WHERE id_flow = ANY($1)`,
      [ids],
    );
    const map = new Map<string, string[]>();
    for (const r of fuRes.rows) {
      const arr = map.get(r.id_flow) ?? [];
      arr.push(r.uid_user_system);
      map.set(r.id_flow, arr);
    }
    return flows.rows.map((f) => ({ ...f, users: map.get(f.id_flow) ?? [] }));
  }

  private async nextId(): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const id = `AF${randomBytes(2).toString('hex').toUpperCase()}`;
      const e = await this.db.query(
        `SELECT 1 FROM ${this.db.withSchema('d_approval_flow')} WHERE id_flow = $1`, [id],
      );
      if (e.rowCount === 0) return id;
    }
    throw new BadRequestException('Gagal menghasilkan id_flow unik');
  }

  async upsert(dto: UpsertFlowDto): Promise<ApprovalFlow> {
    const id = dto.id_flow?.trim() || (await this.nextId());
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO ${this.db.withSchema('d_approval_flow')}
           (id_flow, level, nm_flow, assigned_role, is_mandatory)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (id_flow) DO UPDATE SET
           level = EXCLUDED.level, nm_flow = EXCLUDED.nm_flow,
           assigned_role = EXCLUDED.assigned_role, is_mandatory = EXCLUDED.is_mandatory,
           updated_at = NOW()`,
        [id, dto.level, dto.nm_flow, dto.assigned_role ?? null, dto.is_mandatory ?? true],
      );
      if (dto.users && dto.users.length > 0) {
        await client.query(`DELETE FROM ${this.db.withSchema('d_approval_flow_user')} WHERE id_flow = $1`, [id]);
        for (const uid of dto.users) {
          await client.query(
            `INSERT INTO ${this.db.withSchema('d_approval_flow_user')} (id_flow, uid_user_system) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
            [id, uid],
          );
        }
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    const all = await this.findAll();
    return all.find((f) => f.id_flow === id) as ApprovalFlow;
  }

  async assignUsers(dto: AssignFlowUsersDto): Promise<void> {
    const check = await this.db.query(
      `SELECT 1 FROM ${this.db.withSchema('d_approval_flow')} WHERE id_flow = $1`, [dto.id_flow],
    );
    if (check.rowCount === 0) throw new NotFoundException(`Flow ${dto.id_flow} tidak ditemukan`);
    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');
      await client.query(`DELETE FROM ${this.db.withSchema('d_approval_flow_user')} WHERE id_flow = $1`, [dto.id_flow]);
      for (const uid of dto.users) {
        await client.query(
          `INSERT INTO ${this.db.withSchema('d_approval_flow_user')} (id_flow, uid_user_system) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
          [dto.id_flow, uid],
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getApproversForLevel(level: number): Promise<string[]> {
    const res = await this.db.query<{ uid_user_system: string }>(
      `SELECT fu.uid_user_system FROM ${this.db.withSchema('d_approval_flow_user')} fu
       JOIN ${this.db.withSchema('d_approval_flow')} f ON f.id_flow = fu.id_flow
       WHERE f.level = $1 AND f.is_active = TRUE`,
      [level],
    );
    return res.rows.map((r) => r.uid_user_system);
  }

  /** Returns {canAct, level} for uid on idRequest. level = first unfilled approval level. */
  async canApprove(uid: string, idRequest: string): Promise<{ canAct: boolean; level: number }> {
    const flows = await this.findAll();
    for (const flow of flows) {
      const done = await this.db.query(
        `SELECT 1 FROM ${this.db.withSchema('d_approval_record')} WHERE id_request = $1 AND level = $2`,
        [idRequest, flow.level],
      );
      if (done.rowCount === 0) {
        const approvers = await this.getApproversForLevel(flow.level);
        return { canAct: approvers.includes(uid), level: flow.level };
      }
    }
    return { canAct: false, level: 0 };
  }
}
