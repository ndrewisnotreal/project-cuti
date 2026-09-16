import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { ApprovalFlowService } from '../approval-flow/approval-flow.service';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  id_request: string | null;
  is_read: boolean;
  created_at: Date;
}

type NotifRaw = {
  id_request: string;
  status: string;
  requester_name: string;
  nm_leave_type: string;
  start_date: Date;
  end_date: Date;
  total_days: number;
  updated_at: Date;
};

@Injectable()
export class NotificationService {
  constructor(
    private readonly db: DatabaseService,
    private readonly flow: ApprovalFlowService,
  ) {}

  /**
   * 3-branch: user / approver / admin — mirrors sicutiService.js mock
   */
  async getForUser(uid: string): Promise<Notification[]> {
    const notifs: Notification[] = [];

    // --- Branch 1: requester — own request status changes ---
    const userRequests = await this.db.query<NotifRaw>(
      `SELECT r.id_request, r.status, u.nama AS requester_name,
              lt.nm_leave_type, r.start_date, r.end_date, r.total_days, r.updated_at
       FROM ${this.db.withSchema('d_leave_request')} r
       JOIN ${this.db.withSchema('md_user')} u ON u.uid_user_system = r.uid_user_system
       JOIN ${this.db.withSchema('md_leave_type')} lt ON lt.kd_leave_type = r.kd_leave_type
       WHERE r.uid_user_system = $1 AND r.status IN ('approved','rejected','returned')
         AND r.updated_at >= NOW() - INTERVAL '30 days'
       ORDER BY r.updated_at DESC LIMIT 20`,
      [uid],
    );
    for (const r of userRequests.rows) {
      const statusLabel: Record<string, string> = {
        approved: 'Disetujui',
        rejected: 'Ditolak',
        returned: 'Dikembalikan',
      };
      notifs.push({
        id: `notif-user-${r.id_request}`,
        type: `leave_${r.status}`,
        title: `Pengajuan Cuti ${statusLabel[r.status] ?? r.status}`,
        message: `Pengajuan ${r.nm_leave_type} Anda (${r.start_date.toISOString().slice(0, 10)} - ${r.end_date.toISOString().slice(0, 10)}) telah ${statusLabel[r.status]?.toLowerCase() ?? r.status}`,
        id_request: r.id_request,
        is_read: false,
        created_at: r.updated_at,
      });
    }

    // --- Branch 2: approver — pending requests waiting for this user ---
    const flows = await this.flow.findAll();
    for (const f of flows) {
      if (!f.users?.includes(uid)) continue;
      const pending = await this.db.query<NotifRaw>(
        `SELECT r.id_request, r.status, u.nama AS requester_name,
                lt.nm_leave_type, r.start_date, r.end_date, r.total_days, r.created_at AS updated_at
         FROM ${this.db.withSchema('d_leave_request')} r
         JOIN ${this.db.withSchema('md_user')} u ON u.uid_user_system = r.uid_user_system
         JOIN ${this.db.withSchema('md_leave_type')} lt ON lt.kd_leave_type = r.kd_leave_type
         WHERE r.status IN ('submitted','pending_validation')
           AND NOT EXISTS (
             SELECT 1 FROM ${this.db.withSchema('d_approval_record')} ar
             WHERE ar.id_request = r.id_request AND ar.level = $1
           )
         ORDER BY r.created_at DESC LIMIT 10`,
        [f.level],
      );
      for (const r of pending.rows) {
        notifs.push({
          id: `notif-approver-${r.id_request}-${f.level}`,
          type: 'leave_pending_approval',
          title: 'Pengajuan Menunggu Persetujuan',
          message: `${r.requester_name} mengajukan ${r.nm_leave_type} selama ${r.total_days} hari (${r.start_date.toISOString().slice(0, 10)})`,
          id_request: r.id_request,
          is_read: false,
          created_at: r.updated_at,
        });
      }
    }

    // --- Branch 3: admin — recent submissions in their division ---
    const adminDiv = await this.db.query<{ admin_division: string | null }>(
      `SELECT admin_division FROM ${this.db.withSchema('md_user')} WHERE uid_user_system = $1`,
      [uid],
    );
    const div = adminDiv.rows[0]?.admin_division;
    if (div) {
      const recentSubmissions = await this.db.query<NotifRaw>(
        `SELECT r.id_request, r.status, u.nama AS requester_name,
                lt.nm_leave_type, r.start_date, r.end_date, r.total_days, r.created_at AS updated_at
         FROM ${this.db.withSchema('d_leave_request')} r
         JOIN ${this.db.withSchema('md_user')} u ON u.uid_user_system = r.uid_user_system
         JOIN ${this.db.withSchema('md_leave_type')} lt ON lt.kd_leave_type = r.kd_leave_type
         WHERE u.kd_dept = $1 AND r.created_at >= NOW() - INTERVAL '7 days'
         ORDER BY r.created_at DESC LIMIT 10`,
        [div],
      );
      for (const r of recentSubmissions.rows) {
        notifs.push({
          id: `notif-admin-${r.id_request}`,
          type: 'leave_submitted',
          title: 'Pengajuan Cuti Baru',
          message: `${r.requester_name} mengajukan ${r.nm_leave_type}`,
          id_request: r.id_request,
          is_read: false,
          created_at: r.updated_at,
        });
      }
    }

    // sort newest first, deduplicate
    const seen = new Set<string>();
    return notifs
      .filter((n) => { const dup = seen.has(n.id); seen.add(n.id); return !dup; })
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 30);
  }
}
