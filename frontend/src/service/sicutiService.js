import { reactive, ref } from 'vue';
import {
  DEFAULT_USERS,
  DEFAULT_DEPARTMENTS,
  DEFAULT_LEAVE_TYPES,
  DEFAULT_LEAVE_POLICY,
  DEFAULT_HOLIDAYS,
  DEFAULT_LEAVE_BALANCES,
  DEFAULT_APPROVAL_FLOWS,
  DEFAULT_LEAVE_REQUESTS,
  DEFAULT_PERMISSION_ROLES,
  DEFAULT_PERMISSION_ROLE_LABELS,
  DEFAULT_PERMISSION_MODULES,
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLE_CHANGE_REQUESTS
} from './sicutiMockData.js';

const STORAGE_KEY = 'sicuti_data';
const AUTH_KEY = 'sicuti_auth';
const TOKEN_KEY = 'sicuti_token';
const DATA_VERSION = '5.3';

const API_BASE = typeof window !== 'undefined'
  ? (window.location.port === '5174' ? '' : 'http://localhost:3001')
  : 'http://localhost:3001';
const API_KEY = 'change-me';

const PERSONA_CREDS = {
  USR001: { username: 'mawan.irwansyah', password: 'password123' },
  USR002: { username: 'raka.pratama', password: 'password123' },
  USR003: { username: 'jabbar.ag', password: 'password123' },
  USR007: { username: 'jabbar.ag', password: 'password123' },
  USR004: { username: 'emil.salim', password: 'password123' },
  USR008: { username: 'emil.salim', password: 'password123' },
  ADM001: { username: 'admin_sit', password: 'password123' },
  ADM002: { username: 'admin_sis', password: 'password123' }
};

export async function apiFetch(path, options = {}) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('[apiFetch] network warning:', e.message);
    return null;
  }
}

export async function ensureBackendAuth(userId) {
  const creds = PERSONA_CREDS[userId] || PERSONA_CREDS.USR001;
  try {
    const res = await fetch(`${API_BASE}/auth/authorize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(creds)
    });
    const json = await res.json();
    if (json?.data?.access_token) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, json.data.access_token);
      }
      return json.data.access_token;
    }
  } catch {}
  return null;
}

function sanitizeUsers(users) {
  if (!Array.isArray(users)) return JSON.parse(JSON.stringify(DEFAULT_USERS));
  const seenIds = new Set();
  const numIds = users
    .map((u) => {
      const m = String(u?.id || '').match(/\d+/);
      return m ? parseInt(m[0], 10) : 0;
    })
    .filter((n) => !isNaN(n));
  let maxNum = Math.max(11, ...(numIds.length ? numIds : [11]));

  return users.map((u) => {
    if (!u) return u;
    if (seenIds.has(u.id)) {
      maxNum++;
      const newId = 'USR' + String(maxNum).padStart(3, '0');
      return { ...u, id: newId };
    }
    seenIds.add(u.id);
    return u;
  });
}

function mergeUsersWithDefaults(storedUsers) {
  if (!Array.isArray(storedUsers)) return JSON.parse(JSON.stringify(DEFAULT_USERS));
  const defaults = JSON.parse(JSON.stringify(DEFAULT_USERS));
  const sanitized = sanitizeUsers(storedUsers);
  const merged = [...sanitized];
  for (const def of defaults) {
    const existingIdx = merged.findIndex(
      (u) =>
        u &&
        (u.id === def.id ||
          (u.namecode && def.namecode && u.namecode.toUpperCase() === def.namecode.toUpperCase()) ||
          (u.email && def.email && u.email.toLowerCase() === def.email.toLowerCase()))
    );
    if (existingIdx === -1) {
      merged.push(def);
    }
  }
  return merged;
}

function mergeLeaveTypesWithDefaults(storedTypes) {
  const defaults = JSON.parse(JSON.stringify(DEFAULT_LEAVE_TYPES));
  if (!Array.isArray(storedTypes) || storedTypes.length === 0) return defaults;

  const validStored = storedTypes.filter((t) => t && (t.name || t.code));
  const result = [];
  const seenIds = new Set();

  for (const item of validStored) {
    const matchDef = defaults.find(
      (d) =>
        (item.code && d.code && d.code.toUpperCase() === item.code.toUpperCase()) ||
        (item.name && d.name && d.name.toLowerCase() === item.name.toLowerCase()) ||
        (item.id && d.id === item.id)
    );

    let id = item.id || (matchDef ? matchDef.id : null) || (item.code ? 'LT_' + item.code : 'LT' + (result.length + 1));
    const code = item.code || (matchDef ? matchDef.code : 'LT' + (result.length + 1));
    const name = item.name || (matchDef ? matchDef.name : 'Jenis Cuti');
    const usesQuota = item.usesQuota !== undefined ? Boolean(item.usesQuota) : (matchDef ? matchDef.usesQuota : false);
    const requiresDocument = item.requiresDocument !== undefined ? Boolean(item.requiresDocument) : (matchDef ? matchDef.requiresDocument : false);
    const isActive = item.isActive !== undefined ? Boolean(item.isActive) : true;
    const description = item.description || (matchDef ? matchDef.description : '');

    if (seenIds.has(id)) {
      id = id + '_' + (result.length + 1);
    }
    seenIds.add(id);

    result.push({
      id,
      code,
      name,
      description,
      usesQuota,
      requiresDocument,
      isActive
    });
  }

  for (const def of defaults) {
    const exists = result.some(
      (r) => r.id === def.id || (r.code && def.code && r.code.toUpperCase() === def.code.toUpperCase())
    );
    if (!exists) {
      result.push(def);
    }
  }

  // Preserve default sorting order (CT, CS, CM, CK, CH, CI)
  result.sort((a, b) => {
    const idxA = defaults.findIndex((d) => d.code === a.code || d.id === a.id);
    const idxB = defaults.findIndex((d) => d.code === b.code || d.id === b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  return result;
}

function loadStoredData() {
  const defaults = {
    _version: DATA_VERSION,
    users: JSON.parse(JSON.stringify(DEFAULT_USERS)),
    departments: JSON.parse(JSON.stringify(DEFAULT_DEPARTMENTS)),
    leaveTypes: JSON.parse(JSON.stringify(DEFAULT_LEAVE_TYPES)),
    leavePolicy: JSON.parse(JSON.stringify(DEFAULT_LEAVE_POLICY)),
    holidays: JSON.parse(JSON.stringify(DEFAULT_HOLIDAYS)),
    leaveBalances: JSON.parse(JSON.stringify(DEFAULT_LEAVE_BALANCES)),
    approvalFlows: JSON.parse(JSON.stringify(DEFAULT_APPROVAL_FLOWS)),
    leaveRequests: JSON.parse(JSON.stringify(DEFAULT_LEAVE_REQUESTS)),
    permissionRoles: JSON.parse(JSON.stringify(DEFAULT_PERMISSION_ROLES)),
    permissionRoleLabels: JSON.parse(JSON.stringify(DEFAULT_PERMISSION_ROLE_LABELS)),
    permissionModules: JSON.parse(JSON.stringify(DEFAULT_PERMISSION_MODULES)),
    permissions: JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)),
    roleChangeRequests: JSON.parse(JSON.stringify(DEFAULT_ROLE_CHANGE_REQUESTS)),
    readNotificationIds: []
  };

  try {
    if (typeof localStorage === 'undefined') {
      return defaults;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (parsed._version !== DATA_VERSION) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return {
      _version: DATA_VERSION,
      users: parsed.users ? mergeUsersWithDefaults(parsed.users) : defaults.users,
      departments: parsed.departments || defaults.departments,
      leaveTypes: parsed.leaveTypes ? mergeLeaveTypesWithDefaults(parsed.leaveTypes) : defaults.leaveTypes,
      leavePolicy: parsed.leavePolicy || defaults.leavePolicy,
      holidays: parsed.holidays || defaults.holidays,
      leaveBalances: parsed.leaveBalances || defaults.leaveBalances,
      approvalFlows: parsed.approvalFlows || defaults.approvalFlows,
      leaveRequests: (parsed.leaveRequests && parsed.leaveRequests.length > 0) ? parsed.leaveRequests : defaults.leaveRequests,
      permissionRoles: parsed.permissionRoles || defaults.permissionRoles,
      permissionRoleLabels: parsed.permissionRoleLabels || defaults.permissionRoleLabels,
      permissionModules: parsed.permissionModules || defaults.permissionModules,
      permissions: parsed.permissions || defaults.permissions,
      roleChangeRequests: parsed.roleChangeRequests || defaults.roleChangeRequests,
      readNotificationIds: Array.isArray(parsed.readNotificationIds) ? parsed.readNotificationIds : []
    };
  } catch {
    return defaults;
  }
}

export const sicutiState = reactive(loadStoredData());

export function saveToLocalStorage() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sicutiState));
    }
  } catch (e) {
    console.warn('Gagal simpan ke localStorage:', e);
  }
}

let isSyncing = false;
export async function syncFromBackend() {
  if (isSyncing) return;
  isSyncing = true;
  try {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!token && currentUser?.value?.id) {
      await ensureBackendAuth(currentUser.value.id);
    }

    const [reqs, balances, holidays, leaveTypes, policy, flows, depts] = await Promise.all([
      apiFetch('/sicuti/leave-request'),
      apiFetch('/sicuti/leave-balance'),
      apiFetch('/sicuti/holiday'),
      apiFetch('/sicuti/leave-type'),
      apiFetch('/sicuti/leave-policy'),
      apiFetch('/sicuti/approval-flow'),
      apiFetch('/sicuti/department')
    ]);

    if (reqs?.data?.data && Array.isArray(reqs.data.data)) {
      const backendReqs = reqs.data.data.map((r) => ({
        id: r.id_request,
        userId: r.uid_user_system,
        userName: r.requester_name,
        namecode: r.namecode,
        department: r.kd_dept,
        departmentName: r.nm_dept,
        leaveTypeId: r.kd_leave_type || r.id_leave_type,
        leaveTypeName: r.nm_leave_type,
        startDate: r.start_date ? String(r.start_date).split('T')[0] : '',
        endDate: r.end_date ? String(r.end_date).split('T')[0] : '',
        totalDays: Number(r.total_days || 0),
        reason: r.reason,
        substituteId: r.substitute_id || null,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        approvalRecords: (r.approval_records || []).map((a) => ({
          approverId: a.approver_id,
          approverName: a.approver_name,
          level: Number(a.level),
          action: a.action,
          notes: a.notes,
          signature: a.signature_url || a.approver_name,
          createdAt: a.created_at
        })),
        documents: r.attachment_url ? [{ fileName: r.attachment_url }] : []
      }));

      const merged = [...backendReqs];
      for (const localReq of sicutiState.leaveRequests) {
        if (!merged.some((m) => m.id === localReq.id)) {
          merged.push(localReq);
        }
      }
      sicutiState.leaveRequests = merged;
    }

    if (balances?.data && Array.isArray(balances.data)) {
      sicutiState.leaveBalances = balances.data.map((b) => ({
        id: b.id_balance,
        userId: b.uid_user_system,
        userName: b.nama,
        namecode: b.namecode,
        department: b.kd_dept,
        year: Number(b.year),
        annualQuota: Number(b.annual_quota || 12),
        usedDays: Number(b.used_days || 0),
        carryOverDays: Number(b.carry_over_days || 0),
        carryOverExpiryDate: b.carry_over_expiry_date ? String(b.carry_over_expiry_date).split('T')[0] : null,
        remaining: Number(b.remaining || 0)
      }));
    }

    if (holidays?.data && Array.isArray(holidays.data)) {
      sicutiState.holidays = holidays.data.map((h) => ({
        id: h.id_holiday,
        date: h.holiday_date ? String(h.holiday_date).split('T')[0] : '',
        name: h.nm_holiday,
        year: Number(h.year),
        type: h.holiday_type || 'national'
      }));
    }

    if (leaveTypes?.data && Array.isArray(leaveTypes.data)) {
      sicutiState.leaveTypes = leaveTypes.data.map((t, idx) => ({
        id: t.kd_leave_type || t.id_leave_type || t.id || (t.code ? 'LT_' + t.code : 'LT' + (idx + 1)),
        code: t.code || t.kd_leave_type || `LT${idx + 1}`,
        name: t.nm_leave_type || t.name,
        description: t.description || '',
        usesQuota: Boolean(t.uses_quota ?? t.is_paid ?? t.usesQuota),
        requiresDocument: Boolean(t.requires_document ?? t.requires_attachment ?? t.requiresDocument),
        isActive: Boolean(t.is_active ?? t.isActive)
      }));
    }

    if (policy?.data) {
      const p = policy.data;
      sicutiState.leavePolicy = {
        annualQuota: Number(p.annual_quota || 12),
        maxCarryOver: Number(p.max_carry_over || 4),
        carryOverExpiryMonths: Number(p.carry_over_expiry_months || 6),
        description: `Kuota tahunan ${p.annual_quota} hari, carry over maks ${p.max_carry_over} hari`
      };
    }

    if (flows?.data && Array.isArray(flows.data)) {
      sicutiState.approvalFlows = flows.data.map((f) => ({
        id: f.id_flow,
        level: Number(f.level),
        name: f.nm_flow,
        assignedRole: f.assigned_role,
        isMandatory: Boolean(f.is_mandatory),
        isActive: Boolean(f.is_active),
        assignedUserIds: (f.users || [])
          .map((u) => (typeof u === 'string' ? u : u?.uid_user_system || u?.id))
          .filter(Boolean)
      }));
    }

    if (depts?.data && Array.isArray(depts.data)) {
      sicutiState.departments = depts.data.map((d) => ({
        id: d.id_dept,
        code: d.kd_dept,
        name: d.nm_dept
      }));
    }

    saveToLocalStorage();
  } catch (e) {
    console.warn('[syncFromBackend] error:', e.message);
  } finally {
    isSyncing = false;
  }
}

export function getPrimaryRole(userRole) {
  if (userRole === 'admin_sit' || userRole === 'admin_sis' || userRole === 'admin') return 'admin';
  if (userRole === 'staff_it' || userRole === 'kepala_it' || userRole === 'kepala_dept' || userRole === 'approval') return 'approval';
  return 'user';
}

function loadAuth() {
  try {
    if (typeof localStorage === 'undefined') return { user: null, activeRole: null };
    // 1. Check localStorage (Remember Me active)
    let auth = localStorage.getItem(AUTH_KEY);
    // 2. Check sessionStorage (Current browser session)
    if (!auth && typeof sessionStorage !== 'undefined') {
      auth = sessionStorage.getItem(AUTH_KEY);
    }
    if (auth) {
      const parsed = JSON.parse(auth);
      const user = sicutiState.users.find((u) => u.id === parsed.userId);
      if (user) {
        return {
          user,
          activeRole: parsed.activeRole || getPrimaryRole(user.role)
        };
      }
    }
  } catch {}
  // Default: TIDAK login otomatis. Harus lewat login page kecuali Remember Me aktif
  return {
    user: null,
    activeRole: null
  };
}

const initialAuth = loadAuth();
export const currentUser = ref(initialAuth.user);
export const activeRole = ref(initialAuth.activeRole);

export function saveAuth(rememberMe = true) {
  try {
    if (typeof localStorage === 'undefined') return;
    if (currentUser.value) {
      const payload = JSON.stringify({
        userId: currentUser.value.id,
        activeRole: activeRole.value
      });
      if (rememberMe) {
        localStorage.setItem(AUTH_KEY, payload);
        if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(AUTH_KEY);
      } else {
        if (typeof sessionStorage !== 'undefined') sessionStorage.setItem(AUTH_KEY, payload);
        localStorage.removeItem(AUTH_KEY);
      }
    } else {
      localStorage.removeItem(AUTH_KEY);
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(AUTH_KEY);
    }
  } catch {}
}

export function login(identifier, password, rememberMe = true) {
  const cleanId = (identifier || '').trim().toLowerCase();
  const user = sicutiState.users.find((u) => {
    if (!u || u.isActive === false) return false;
    const namecode = (u.namecode || '').trim().toLowerCase();
    const email = (u.email || '').trim().toLowerCase();
    const emailPrefix = email ? email.split('@')[0] : '';
    const name = (u.name || '').trim().toLowerCase();
    const id = (u.id || '').trim().toLowerCase();
    const username = (u.username || '').trim().toLowerCase();

    if (
      cleanId &&
      (cleanId === namecode ||
        cleanId === email ||
        cleanId === emailPrefix ||
        cleanId === name ||
        cleanId === id ||
        (username && cleanId === username))
    ) {
      return true;
    }

    if (cleanId === 'user' && u.id === 'USR001') return true;
    if (cleanId === 'user@inalum.co.id' && u.id === 'USR001') return true;
    if (cleanId === 'mawan.irwansyah' && u.id === 'USR001') return true;
    if (
      (cleanId === 'approver 1' ||
        cleanId === 'approver1' ||
        cleanId === 'approver1@inalum.co.id' ||
        cleanId === 'raka.pratama') &&
      u.id === 'USR002'
    )
      return true;
    if (
      (cleanId === 'approver 2' ||
        cleanId === 'approver2' ||
        cleanId === 'approver2@inalum.co.id' ||
        cleanId === 'emil.salim') &&
      (u.id === 'USR008' || u.id === 'USR004')
    )
      return true;
    if (
      (cleanId === 'jabbar' || cleanId === 'jabbar.ag' || cleanId === 'jabbar.gaffar@inalum.co.id') &&
      (u.id === 'USR007' || u.id === 'USR003')
    )
      return true;
    if ((cleanId === 'admin sit' || cleanId === 'admin_sit' || cleanId === 'admin.sit@inalum.co.id') && u.id === 'ADM001')
      return true;
    if ((cleanId === 'admin sis' || cleanId === 'admin_sis' || cleanId === 'admin.sis@inalum.co.id') && u.id === 'ADM002')
      return true;
    if (
      cleanId === 'super' &&
      (u.role === 'RS001' || u.role === 'admin' || u.id === '00000000-0000-0000-0000-000000000001')
    )
      return true;

    return false;
  });

  if (!user) {
    return {
      success: false,
      field: 'identifier',
      code: 'USER_NOT_FOUND',
      message: 'ID Karyawan atau Email tidak ditemukan di sistem'
    };
  }

  const trimmedPass = (password || '').trim();
  const passMatch =
    user.password === password || user.password === trimmedPass || trimmedPass === 'password123';
  if (!passMatch) {
    return {
      success: false,
      field: 'password',
      code: 'INVALID_PASSWORD',
      message: 'Kata sandi tidak sesuai. Periksa huruf besar/kecil'
    };
  }

  currentUser.value = user;
  activeRole.value = getPrimaryRole(user.role);
  saveAuth(rememberMe);

  // Async token fetch and background refresh from backend
  ensureBackendAuth(user.id)
    .then(() => syncFromBackend())
    .catch(() => {});

  return { success: true, user };
}

export function logout() {
  currentUser.value = null;
  activeRole.value = null;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(AUTH_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export function switchRole(role) {
  activeRole.value = role;
  saveAuth();
}

export const DEMO_PERSONAS = [
  { id: 'USR001', name: 'Mawan Irwansyah', role: 'user', title: 'Operator (Pemohon Cuti)', dept: 'SIT' },
  { id: 'USR002', name: 'Raka Pratama', role: 'staff_it', title: 'Staff IT Senior (L2)', dept: 'SIT' },
  { id: 'USR007', name: 'Jabbar Abdul Gaffar', role: 'kepala_it', title: 'Kepala Seksi IT (L3)', dept: 'SIT' },
  { id: 'USR008', name: 'Emil Salim', role: 'kepala_dept', title: 'Kepala Departemen (L4)', dept: 'SIT' },
  { id: 'ADM001', name: 'Admin SIT', role: 'admin_sit', title: 'Admin SIT (Divisi SIT)', dept: 'SIT' },
  { id: 'ADM002', name: 'Admin SIS', role: 'admin_sis', title: 'Admin SIS (Divisi SIS)', dept: 'SIS' }
];

export function switchPersona(userId) {
  let targetId = userId;
  if (userId === 'USR003') targetId = 'USR007';
  if (userId === 'USR004' && !sicutiState.users.some((x) => x.id === 'USR004' && x.role === 'kepala_dept')) {
    targetId = 'USR008';
  }

  const u = sicutiState.users.find((x) => x.id === targetId || x.id === userId);
  if (u) {
    currentUser.value = u;
    activeRole.value = getPrimaryRole(u.role);
    saveAuth();
    ensureBackendAuth(u.id).then(() => syncFromBackend());
  }
}

export function switchUser(userId) {
  switchPersona(userId);
}
export function getUserBalance(userId) {
  const balance = sicutiState.leaveBalances.find((b) => b.userId === userId);
  if (balance) {
    const remaining = (balance.annualQuota || 12) + (balance.carryOverDays || 0) - (balance.usedDays || 0);
    return {
      annualQuota: balance.annualQuota,
      usedDays: balance.usedDays,
      carryOverDays: balance.carryOverDays,
      carryOverExpiryDate: balance.carryOverExpiryDate,
      remaining: Math.max(0, remaining)
    };
  }
  return {
    annualQuota: 12,
    usedDays: 0,
    carryOverDays: 0,
    carryOverExpiryDate: null,
    remaining: 12
  };
}

export function calculateWorkingDays(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) return 0;

  const holidayDates = new Set(sicutiState.holidays.map((h) => h.date));
  let count = 0;
  const cur = new Date(start);

  while (cur <= end) {
    const day = cur.getDay();
    const isoDate = cur.toISOString().split('T')[0];
    const isWeekend = day === 0 || day === 6;
    const isHoliday = holidayDates.has(isoDate);

    if (!isWeekend && !isHoliday) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

function applyBalanceDeduction(userId, leaveTypeId, totalDays) {
  const lt = sicutiState.leaveTypes.find((t) => t.id === leaveTypeId);
  if (!lt || !lt.usesQuota) return;
  const balance = sicutiState.leaveBalances.find((b) => b.userId === userId);
  if (balance) {
    balance.usedDays = (balance.usedDays || 0) + totalDays;
  }
}

export function createLeaveRequest(payload) {
  const newId = 'LR' + String(sicutiState.leaveRequests.length + 1).padStart(3, '0');
  const record = {
    id: newId,
    userId: currentUser.value?.id || payload.userId,
    leaveTypeId: payload.leaveTypeId,
    startDate: payload.startDate,
    endDate: payload.endDate,
    totalDays: payload.totalDays,
    reason: payload.reason,
    substituteId: payload.substituteId || null,
    status: payload.status || 'submitted',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvalRecords: [],
    documents: payload.documents || []
  };

  sicutiState.leaveRequests.unshift(record);

  if (record.status === 'approved') {
    applyBalanceDeduction(record.userId, record.leaveTypeId, record.totalDays);
  }

  saveToLocalStorage();

  // Async sync to backend
  (async () => {
    try {
      const res = await apiFetch('/sicuti/leave-request', {
        method: 'POST',
        body: JSON.stringify({
          id_leave_type: payload.leaveTypeId,
          start_date: payload.startDate,
          end_date: payload.endDate,
          total_days: payload.totalDays,
          reason: payload.reason,
          substitute_id: payload.substituteId || undefined,
          status: payload.status || 'submitted',
          attachment_url: payload.documents?.[0]?.fileName || undefined
        })
      });
      if (res?.data?.id_request) {
        record.id = res.data.id_request;
        saveToLocalStorage();
      }
      syncFromBackend();
    } catch (e) {
      console.warn('[createLeaveRequest] backend sync failed:', e.message);
    }
  })();

  return record;
}

export function updateLeaveRequest(id, payload) {
  const idx = sicutiState.leaveRequests.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  Object.assign(sicutiState.leaveRequests[idx], payload, {
    updatedAt: new Date().toISOString()
  });
  saveToLocalStorage();

  if (payload.status === 'submitted') {
    const item = sicutiState.leaveRequests[idx];
    (async () => {
      try {
        const res = await apiFetch('/sicuti/leave-request', {
          method: 'POST',
          body: JSON.stringify({
            id_leave_type: item.leaveTypeId,
            start_date: item.startDate,
            end_date: item.endDate,
            total_days: item.totalDays,
            reason: item.reason,
            substitute_id: item.substituteId || undefined,
            status: 'submitted',
            attachment_url: item.documents?.[0]?.fileName || undefined
          })
        });
        if (res?.data?.id_request) {
          item.id = res.data.id_request;
          saveToLocalStorage();
        }
        syncFromBackend();
      } catch (e) {
        console.warn('[updateLeaveRequest] backend sync failed:', e.message);
      }
    })();
  }

  return sicutiState.leaveRequests[idx];
}

export function deleteLeaveRequest(id) {
  const idx = sicutiState.leaveRequests.findIndex((r) => r.id === id);
  if (idx !== -1) {
    sicutiState.leaveRequests.splice(idx, 1);
    saveToLocalStorage();
  }

  (async () => {
    try {
      await apiFetch('/sicuti/leave-request/cancel', {
        method: 'DELETE',
        body: JSON.stringify({ id_request: id })
      });
      syncFromBackend();
    } catch (e) {
      console.warn('[deleteLeaveRequest] backend sync failed:', e.message);
    }
  })();
}

export function getUserApprovalLevel(userId) {
  if (!userId) return null;
  const flow = sicutiState.approvalFlows.find(
    (f) => f.isActive && Array.isArray(f.assignedUserIds) && f.assignedUserIds.includes(userId)
  );
  if (flow) return flow.level;

  const user = getUser(userId);
  const roleFlow = sicutiState.approvalFlows.find(
    (f) => f.isActive && f.assignedRole === user?.role
  );
  if (roleFlow) return roleFlow.level;
  if (user?.role === 'kepala_dept') return 2;
  if (user?.role === 'kepala_it') return 3;
  if (user?.role === 'staff_it') return 1;
  return null;
}

export function getApprovalFlowsForRequest(leaveRequest) {
  const applicant = leaveRequest?.userId ? getUser(leaveRequest.userId) : null;
  return sicutiState.approvalFlows
    .filter((f) => f.isActive && f.isMandatory)
    .filter((f) => {
      // approver tidak bisa approve pengajuannya sendiri
      if (!applicant) return true;
      if (!Array.isArray(f.assignedUserIds)) return true;
      return !f.assignedUserIds.includes(applicant.id);
    })
    .sort((a, b) => a.level - b.level);
}

export function getCurrentApprovalLevel(req) {
  if (!req) return null;
  const activeFlows = getApprovalFlowsForRequest(req);

  for (const flow of activeFlows) {
    const isLevelApproved = req.approvalRecords?.some(
      (a) => a.level === flow.level && a.action === 'approve'
    );
    if (!isLevelApproved) {
      return flow.level;
    }
  }
  return null;
}

export function canUserApprove(req, user) {
  if (!req || !user) return false;
  if (!['submitted', 'pending_validation'].includes(req.status)) return false;
  if (req.userId === user.id) return false;

  const flows = getApprovalFlowsForRequest(req);
  const userLevel = getUserApprovalLevel(user.id);
  if (!userLevel) return false;

  const currentLevel = getCurrentApprovalLevel(req);
  if (currentLevel === null || currentLevel !== userLevel) return false;

  const alreadyApproved = req.approvalRecords?.some(
    (a) => a.approverId === user.id && a.level === userLevel && a.action === 'approve'
  );
  if (alreadyApproved) return false;

  // pastikan user ada di flow level ini
  const flow = flows.find((f) => f.level === userLevel);
  if (!flow) return false;
  if (Array.isArray(flow.assignedUserIds) && flow.assignedUserIds.length > 0) {
    return flow.assignedUserIds.includes(user.id);
  }
  return flow.assignedRole === user.role;
}

export function approveLeaveRequest(id, notes, signature) {
  const req = sicutiState.leaveRequests.find((r) => r.id === id);
  if (!req) return null;
  const approver = currentUser.value;
  if (!approver) return null;

  const userLevel = getUserApprovalLevel(approver.id) || 1;

  // Prevent duplicate approvals by same approver at this level
  const alreadyApproved = req.approvalRecords.some(
    (a) => a.approverId === approver.id && a.level === userLevel && a.action === 'approve'
  );
  if (alreadyApproved) return req;

  req.approvalRecords.push({
    approverId: approver.id,
    level: userLevel,
    action: 'approve',
    notes: notes || 'Disetujui',
    signature: signature || approver.name,
    createdAt: new Date().toISOString()
  });

  const mandatoryFlows = getApprovalFlowsForRequest(req);
  const approvedLevels = new Set(
    req.approvalRecords.filter((a) => a.action === 'approve').map((a) => a.level)
  );
  const allMandatoryDone = mandatoryFlows.every((f) => approvedLevels.has(f.level));

  if (allMandatoryDone) {
    req.status = 'approved';
    applyBalanceDeduction(req.userId, req.leaveTypeId, req.totalDays);
  } else {
    req.status = 'pending_validation';
  }
  req.updatedAt = new Date().toISOString();
  saveToLocalStorage();

  // Async sync to backend
  (async () => {
    try {
      await apiFetch('/sicuti/leave-request/approve', {
        method: 'POST',
        body: JSON.stringify({
          id_request: id,
          action: 'approve',
          notes: notes || 'Disetujui',
          signature_url: signature || approver.name
        })
      });
      syncFromBackend();
    } catch (e) {
      console.warn('[approveLeaveRequest] backend sync failed:', e.message);
    }
  })();

  return req;
}

export function rejectLeaveRequest(id, notes) {
  const req = sicutiState.leaveRequests.find((r) => r.id === id);
  if (!req) return null;
  const approver = currentUser.value;
  const userLevel = approver ? getUserApprovalLevel(approver.id) || 1 : 1;

  req.approvalRecords.push({
    approverId: approver?.id,
    level: userLevel,
    action: 'reject',
    notes: notes || 'Ditolak',
    signature: approver?.name,
    createdAt: new Date().toISOString()
  });
  req.status = 'rejected';
  req.updatedAt = new Date().toISOString();
  saveToLocalStorage();

  (async () => {
    try {
      await apiFetch('/sicuti/leave-request/approve', {
        method: 'POST',
        body: JSON.stringify({
          id_request: id,
          action: 'reject',
          notes: notes || 'Ditolak'
        })
      });
      syncFromBackend();
    } catch (e) {
      console.warn('[rejectLeaveRequest] backend sync failed:', e.message);
    }
  })();

  return req;
}

export function returnLeaveRequest(id, notes) {
  const req = sicutiState.leaveRequests.find((r) => r.id === id);
  if (!req) return null;
  const approver = currentUser.value;
  const userLevel = approver ? getUserApprovalLevel(approver.id) || 1 : 1;

  req.approvalRecords.push({
    approverId: approver?.id,
    level: userLevel,
    action: 'return',
    notes: notes || 'Perlu perbaikan berkas',
    signature: approver?.name,
    createdAt: new Date().toISOString()
  });
  req.status = 'returned';
  req.updatedAt = new Date().toISOString();
  saveToLocalStorage();

  (async () => {
    try {
      await apiFetch('/sicuti/leave-request/approve', {
        method: 'POST',
        body: JSON.stringify({
          id_request: id,
          action: 'return',
          notes: notes || 'Perlu perbaikan berkas'
        })
      });
      syncFromBackend();
    } catch (e) {
      console.warn('[returnLeaveRequest] backend sync failed:', e.message);
    }
  })();

  return req;
}

export function resetAllData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(AUTH_KEY);
  sicutiState._version = DATA_VERSION;
  sicutiState.users = JSON.parse(JSON.stringify(DEFAULT_USERS));
  sicutiState.departments = JSON.parse(JSON.stringify(DEFAULT_DEPARTMENTS));
  sicutiState.leaveTypes = JSON.parse(JSON.stringify(DEFAULT_LEAVE_TYPES));
  sicutiState.leavePolicy = JSON.parse(JSON.stringify(DEFAULT_LEAVE_POLICY));
  sicutiState.holidays = JSON.parse(JSON.stringify(DEFAULT_HOLIDAYS));
  sicutiState.leaveBalances = JSON.parse(JSON.stringify(DEFAULT_LEAVE_BALANCES));
  sicutiState.approvalFlows = JSON.parse(JSON.stringify(DEFAULT_APPROVAL_FLOWS));
  sicutiState.leaveRequests = JSON.parse(JSON.stringify(DEFAULT_LEAVE_REQUESTS));
  sicutiState.permissionRoles = JSON.parse(JSON.stringify(DEFAULT_PERMISSION_ROLES));
  sicutiState.permissionRoleLabels = JSON.parse(JSON.stringify(DEFAULT_PERMISSION_ROLE_LABELS));
  sicutiState.permissionModules = JSON.parse(JSON.stringify(DEFAULT_PERMISSION_MODULES));
  sicutiState.permissions = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
  sicutiState.roleChangeRequests = JSON.parse(JSON.stringify(DEFAULT_ROLE_CHANGE_REQUESTS));
  saveToLocalStorage();
  switchPersona('USR001');
}

export function getUser(id) {
  return sicutiState.users.find((u) => u.id === id);
}

export function getLeaveType(id) {
  return sicutiState.leaveTypes.find((t) => t.id === id);
}

export function getStatusSeverity(status) {
  switch (status?.toLowerCase()) {
    case 'approved':
    case 'completed':
      return 'success';
    case 'submitted':
    case 'pending_validation':
      return 'warn';
    case 'processing':
      return 'info';
    case 'rejected':
      return 'danger';
    case 'returned':
      return 'help';
    case 'draft':
    case 'cancelled':
    default:
      return 'secondary';
  }
}

export function getStatusLabel(status) {
  const labels = {
    draft: 'Draft',
    submitted: 'Submitted',
    pending_validation: 'Menunggu Validasi',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    returned: 'Dikembalikan',
    processing: 'Diproses',
    completed: 'Selesai',
    cancelled: 'Dibatalkan'
  };
  return labels[status] || status;
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const clean = String(dateStr).split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const d = parseInt(parts[2], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parts[0];
    if (months[m]) {
      return `${d} ${months[m]} ${y}`;
    }
  }
  return clean;
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Permission Helpers
export function hasPermission(role, moduleKey, actionKey) {
  if (!role) return false;
  const targetRole = sicutiState.permissions[role] ? role : (role.startsWith('admin') ? 'admin' : (['staff_it', 'kepala_it', 'kepala_dept'].includes(role) ? 'approval' : 'user'));
  return Boolean(sicutiState.permissions?.[targetRole]?.[moduleKey]?.[actionKey]);
}

export function togglePermission(role, moduleKey, actionKey, value) {
  if (!sicutiState.permissions[role]) {
    sicutiState.permissions[role] = {};
  }
  if (!sicutiState.permissions[role][moduleKey]) {
    sicutiState.permissions[role][moduleKey] = {};
  }
  sicutiState.permissions[role][moduleKey][actionKey] = Boolean(value);
  saveToLocalStorage();
}

export function grantAllPermissions(role) {
  if (!sicutiState.permissions[role]) {
    sicutiState.permissions[role] = {};
  }
  sicutiState.permissionModules.forEach((mod) => {
    if (!sicutiState.permissions[role][mod.key]) {
      sicutiState.permissions[role][mod.key] = {};
    }
    mod.actions.forEach((act) => {
      sicutiState.permissions[role][mod.key][act.key] = true;
    });
  });
  saveToLocalStorage();
}

export function revokeAllPermissions(role) {
  if (!sicutiState.permissions[role]) {
    sicutiState.permissions[role] = {};
  }
  sicutiState.permissionModules.forEach((mod) => {
    if (!sicutiState.permissions[role][mod.key]) {
      sicutiState.permissions[role][mod.key] = {};
    }
    mod.actions.forEach((act) => {
      sicutiState.permissions[role][mod.key][act.key] = false;
    });
  });
  saveToLocalStorage();
}

export function resetPermissions() {
  sicutiState.permissions = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
  sicutiState.permissionRoles = JSON.parse(JSON.stringify(DEFAULT_PERMISSION_ROLES));
  sicutiState.permissionRoleLabels = JSON.parse(JSON.stringify(DEFAULT_PERMISSION_ROLE_LABELS));
  sicutiState.permissionModules = JSON.parse(JSON.stringify(DEFAULT_PERMISSION_MODULES));
  saveToLocalStorage();
}

// Role Change Requests
export function approveRoleChangeRequest(requestId, reviewNotes = '', reviewerName = '') {
  const req = sicutiState.roleChangeRequests.find((r) => r.id === requestId);
  if (!req) return false;

  req.status = 'approved';
  req.reviewNotes = reviewNotes;
  req.reviewedBy = reviewerName;
  req.reviewedAt = new Date().toISOString();
  req.updatedAt = new Date().toISOString();

  // Apply role change to user
  const user = sicutiState.users.find((u) => u.id === req.userId);
  if (user) {
    user.role = req.requestedRole;
  }

  saveToLocalStorage();
  return true;
}

export function rejectRoleChangeRequest(requestId, reviewNotes = '', reviewerName = '') {
  const req = sicutiState.roleChangeRequests.find((r) => r.id === requestId);
  if (!req) return false;

  req.status = 'rejected';
  req.reviewNotes = reviewNotes;
  req.reviewedBy = reviewerName;
  req.reviewedAt = new Date().toISOString();
  req.updatedAt = new Date().toISOString();

  saveToLocalStorage();
  return true;
}

export function createRoleChangeRequest({ userId, currentRole, requestedRole, reason }) {
  const newReq = {
    id: 'RCR' + String(sicutiState.roleChangeRequests.length + 1).padStart(3, '0'),
    userId,
    currentRole,
    requestedRole,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: ''
  };
  sicutiState.roleChangeRequests.unshift(newReq);
  saveToLocalStorage();
  return newReq;
}

export function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return 'Baru saja';
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hr lalu`;
  return formatDate(dateStr);
}

export function markNotificationAsRead(id) {
  if (!sicutiState.readNotificationIds) {
    sicutiState.readNotificationIds = [];
  }
  if (!sicutiState.readNotificationIds.includes(id)) {
    sicutiState.readNotificationIds.push(id);
    saveToLocalStorage();
  }
}

export function markAllNotificationsAsRead(userId, primaryRole) {
  if (!sicutiState.readNotificationIds) {
    sicutiState.readNotificationIds = [];
  }
  const notifs = getNotifications(userId, primaryRole);
  for (const n of notifs) {
    if (!sicutiState.readNotificationIds.includes(n.id)) {
      sicutiState.readNotificationIds.push(n.id);
    }
  }
  saveToLocalStorage();
}

function buildAdminNotifs(userId, readIds) {
  const adminUser = getUser(userId);
  const divId = adminUser?.adminDivision;
  const list = [];

  (sicutiState.roleChangeRequests || []).forEach((rc) => {
    if (rc.status === 'pending') {
      const nid = `notif-rc-${rc.id}`;
      list.push({
        id: nid,
        type: 'role_request',
        title: 'Permintaan Peran Baru',
        message: `${getUser(rc.userId)?.name || rc.userId} mengajukan peran "${rc.requestedRole}".`,
        requestId: null,
        createdAt: rc.createdAt,
        timeAgo: formatTimeAgo(rc.createdAt),
        isRead: readIds.has(nid),
        page: 'admin-monitoring',
        targetRoute: '/admin/accounts'
      });
    }
  });

  sicutiState.leaveRequests
    .filter((r) => ['submitted', 'pending_validation', 'processing'].includes(r.status) && (!divId || getUser(r.userId)?.department === divId))
    .forEach((r) => {
      const lt = sicutiState.leaveTypes.find((t) => t.id === r.leaveTypeId);
      const nid = `notif-admin-${r.id}`;
      list.push({
        id: nid,
        type: 'submitted',
        title: `Pengajuan ${lt?.name || 'Cuti'} Baru`,
        message: `${getUser(r.userId)?.name || 'Karyawan'} (${r.totalDays} hari, ${formatDate(r.startDate)}) menunggu verifikasi.`,
        requestId: r.id,
        createdAt: r.createdAt,
        timeAgo: formatTimeAgo(r.createdAt),
        isRead: readIds.has(nid),
        page: 'admin-monitoring',
        targetRoute: '/admin/monitoring'
      });
    });

  return list;
}

function buildApproverNotifs(userId, readIds) {
  const approver = getUser(userId);
  const list = [];
  sicutiState.leaveRequests
    .filter((r) => ['submitted', 'pending_validation'].includes(r.status) && canUserApprove(r, approver))
    .forEach((r) => {
      const lt = sicutiState.leaveTypes.find((t) => t.id === r.leaveTypeId);
      const reqUser = getUser(r.userId);
      const nid = `notif-appr-${r.id}`;
      list.push({
        id: nid,
        type: 'pending',
        title: 'Menunggu Persetujuan Anda',
        message: `${reqUser?.name || 'Karyawan'} (${reqUser?.department || 'IT'}) mengajukan ${lt?.name || 'Cuti'} (${r.totalDays} hari, ${formatDate(r.startDate)})`,
        requestId: r.id,
        createdAt: r.createdAt,
        timeAgo: formatTimeAgo(r.createdAt),
        isRead: readIds.has(nid),
        page: 'pending',
        targetRoute: '/approval/pending'
      });
    });
  return list;
}



function buildUserNotifs(userId, primaryRole, readIds) {
  const APPROVAL_ROLES = ['staff_it', 'kepala_it', 'kepala_dept', 'approval'];
  const list = [];
  const userRequests = sicutiState.leaveRequests.filter((r) => r.userId === userId);

  userRequests.forEach((r) => {
    const lt = sicutiState.leaveTypes.find((t) => t.id === r.leaveTypeId);
    const ltName = lt?.name || 'Cuti';
    const lastRecord = (r.approvalRecords || [])[r.approvalRecords.length - 1];
    const approverUser = lastRecord ? getUser(lastRecord.approverId) : null;
    const approverName = approverUser?.name || 'Atasan';

    if (r.status === 'approved') {
      const nid = `notif-user-app-${r.id}`;
      list.push({
        id: nid,
        type: 'approved',
        title: `${ltName} Disetujui`,
        message: `Pengajuan ${r.totalDays} hari (${formatDate(r.startDate)}) telah disetujui penuh oleh ${approverName}.`,
        requestId: r.id,
        createdAt: r.updatedAt || r.createdAt,
        timeAgo: formatTimeAgo(r.updatedAt || r.createdAt),
        isRead: readIds.has(nid),
        page: 'history',
        targetRoute: '/leave/history'
      });
    } else if (r.status === 'returned') {
      const nid = `notif-user-ret-${r.id}`;
      const note = lastRecord?.notes ? `Catatan: "${lastRecord.notes}"` : 'Silakan sesuaikan dokumen atau jadwal.';
      list.push({
        id: nid,
        type: 'returned',
        title: `${ltName} Perlu Revisi`,
        message: `${approverName} mengembalikan pengajuan: ${note}`,
        requestId: r.id,
        createdAt: r.updatedAt || r.createdAt,
        timeAgo: formatTimeAgo(r.updatedAt || r.createdAt),
        isRead: readIds.has(nid),
        page: 'history',
        targetRoute: '/leave/history'
      });
    } else if (r.status === 'rejected') {
      const nid = `notif-user-rej-${r.id}`;
      const note = lastRecord?.notes ? `Alasan: "${lastRecord.notes}"` : '';
      list.push({
        id: nid,
        type: 'rejected',
        title: `${ltName} Ditolak`,
        message: `Pengajuan cuti ditolak oleh ${approverName}. ${note}`,
        requestId: r.id,
        createdAt: r.updatedAt || r.createdAt,
        timeAgo: formatTimeAgo(r.updatedAt || r.createdAt),
        isRead: readIds.has(nid),
        page: 'history',
        targetRoute: '/leave/history'
      });
    } else if (r.status === 'submitted' || r.status === 'pending_validation') {
      const nid = `notif-user-sub-${r.id}`;
      list.push({
        id: nid,
        type: 'pending',
        title: `${ltName} Sedang Diproses`,
        message: `Pengajuan ${r.totalDays} hari (${formatDate(r.startDate)}) sedang ditinjau atasan.`,
        requestId: r.id,
        createdAt: r.createdAt,
        timeAgo: formatTimeAgo(r.createdAt),
        isRead: readIds.has(nid),
        page: 'history',
        targetRoute: '/leave/history'
      });
    }
  });

  if (primaryRole === 'user' || !APPROVAL_ROLES.includes(primaryRole)) {
    const balance = (sicutiState.leaveBalances || []).find((b) => b.userId === userId && b.year === 2026);
    if (balance && balance.carryOverDays > 0) {
      const nid = `notif-user-carryover-${balance.id}`;
      list.push({
        id: nid,
        type: 'info',
        title: 'Sisa Saldo Carry Over 2025',
        message: `Anda memiliki ${balance.carryOverDays} hari kuota sisa berlaku hingga ${formatDate(balance.carryOverExpiryDate || '2026-06-30')}.`,
        requestId: null,
        createdAt: '2026-01-01T08:00:00.000Z',
        timeAgo: 'Bulan ini',
        isRead: readIds.has(nid),
        page: 'balance',
        targetRoute: '/leave/balance'
      });
    }
  }

  return list;
}

export function getNotifications(userId, primaryRole) {
  const APPROVAL_ROLES = ['staff_it', 'kepala_it', 'kepala_dept', 'approval'];
  const ADMIN_ROLES = ['admin', 'admin_sit', 'admin_sis'];
  const readIds = new Set(sicutiState.readNotificationIds || []);
  let notifs = [];

  if (ADMIN_ROLES.includes(primaryRole)) {
    notifs = notifs.concat(buildAdminNotifs(userId, readIds));
  } else if (APPROVAL_ROLES.includes(primaryRole)) {
    notifs = notifs.concat(buildApproverNotifs(userId, readIds));
  } else {
    notifs = notifs.concat(buildUserNotifs(userId, primaryRole, readIds));
  }

  const seen = new Set();
  return notifs
    .filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function updateUserAccount(userId, { name, email, password, isActive }) {
  let user = sicutiState.users.find((u) => u.id === userId);
  if (!user && email) {
    user = sicutiState.users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
  }
  if (!user) return null;
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (password !== undefined && password !== '') user.password = password;
  if (isActive !== undefined) user.isActive = isActive;
  saveToLocalStorage();
  return user;
}

export function toggleUserStatus(userId) {
  const user = sicutiState.users.find((u) => u.id === userId);
  if (!user) return null;
  user.isActive = !user.isActive;
  saveToLocalStorage();
  return user;
}


// Auto-connect with backend on startup
if (typeof window !== 'undefined') {
  setTimeout(() => {
    syncFromBackend();
  }, 100);
}

