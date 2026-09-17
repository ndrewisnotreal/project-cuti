export const DEFAULT_USERS = [
  { id: 'USR001', namecode: 'SIT001', name: 'Mawan Irwansyah', email: 'mawan.irwansyah@inalum.co.id', password: 'password123', role: 'user', department: 'SIT', position: 'Operator', supervisorId: 'USR002', isActive: true, photo: null },
  { id: 'USR002', namecode: 'SIT002', name: 'Raka Pratama Kresnadhimadja', email: 'raka.pratama@inalum.co.id', password: 'password123', role: 'staff_it', department: 'SIT', position: 'Staff IT Senior', supervisorId: 'USR007', isActive: true, photo: null },
  { id: 'USR007', namecode: 'SIT007', name: 'Jabbar Abdul Gaffar', email: 'jabbar.gaffar@inalum.co.id', password: 'password123', role: 'kepala_it', department: 'SIT', position: 'Kepala Seksi SIT', supervisorId: 'USR008', isActive: true, photo: null },
  { id: 'USR008', namecode: 'SIT008', name: 'Emil Salim', email: 'emil.salim@inalum.co.id', password: 'password123', role: 'kepala_dept', department: 'SIT', position: 'Kepala Departemen SIT', supervisorId: null, isActive: true, photo: null },
  { id: 'USR004', namecode: 'SIT004', name: 'Dian Permata', email: 'dian.permata@inalum.co.id', password: 'password123', role: 'user', department: 'SIT', position: 'Staff IT', supervisorId: 'USR002', isActive: true, photo: null },
  { id: 'ADM001', namecode: 'ADMIN_SIT', name: 'Admin SIT', email: 'admin.sit@inalum.co.id', password: 'password123', role: 'admin_sit', adminDivision: 'SIT', department: 'SIT', position: 'Administrator Divisi SIT', supervisorId: null, isActive: true, photo: null },
  { id: 'ADM002', namecode: 'ADMIN_SIS', name: 'Admin SIS', email: 'admin.sis@inalum.co.id', password: 'password123', role: 'admin_sis', adminDivision: 'SIS', department: 'SIS', position: 'Administrator Divisi SIS', supervisorId: null, isActive: true, photo: null }
];

export const DEFAULT_DEPARTMENTS = [
  { id: 'DEP001', code: 'SIT', name: 'Sistem Informasi & Teknologi' },
  { id: 'DEP002', code: 'SIS', name: 'Sistem Informasi Smelting' }
];

export const DEFAULT_LEAVE_TYPES = [
  { id: 'LT001', code: 'CT', name: 'Cuti Tahunan', description: 'Hak cuti tahunan karyawan', usesQuota: true, requiresDocument: false, isActive: true },
  { id: 'LT002', code: 'CS', name: 'Cuti Sakit', description: 'Cuti karena sakit dengan surat dokter', usesQuota: false, requiresDocument: true, isActive: true },
  { id: 'LT003', code: 'CM', name: 'Cuti Melahirkan', description: 'Cuti melahirkan 3 bulan', usesQuota: false, requiresDocument: true, isActive: true },
  { id: 'LT004', code: 'CK', name: 'Cuti Menikah', description: 'Cuti menikah 3 hari kerja', usesQuota: false, requiresDocument: true, isActive: true },
  { id: 'LT006', code: 'CH', name: 'Cuti Haid', description: 'Cuti haid maksimal 2 hari', usesQuota: false, requiresDocument: false, isActive: true },
  { id: 'LT007', code: 'CI', name: 'Cuti Ibadah', description: 'Cuti ibadah keagamaan', usesQuota: false, requiresDocument: false, isActive: true }
];

export const DEFAULT_LEAVE_POLICY = {
  annualQuota: 12,
  maxCarryOver: 4,
  carryOverExpiryMonths: 6,
  description: 'Kuota tahunan 12 hari, carry over maks 4 hari berlaku s/d 30 Juni'
};

export const DEFAULT_HOLIDAYS = [
  { id: 'H001', date: '2026-01-01', name: 'Tahun Baru Masehi', year: 2026, type: 'national' },
  { id: 'H002', date: '2026-01-29', name: "Isra Mi'raj", year: 2026, type: 'national' },
  { id: 'H003', date: '2026-02-19', name: 'Tahun Baru Imlek', year: 2026, type: 'national' },
  { id: 'H004', date: '2026-03-20', name: 'Wafat Isa Almasih', year: 2026, type: 'national' },
  { id: 'H005', date: '2026-03-29', name: 'Hari Raya Nyepi', year: 2026, type: 'national' },
  { id: 'H006', date: '2026-04-03', name: 'Hari Raya Idul Fitri', year: 2026, type: 'collective' },
  { id: 'H007', date: '2026-04-06', name: 'Cuti Bersama Idul Fitri', year: 2026, type: 'collective' },
  { id: 'H008', date: '2026-05-01', name: 'Hari Buruh', year: 2026, type: 'national' },
  { id: 'H009', date: '2026-05-12', name: 'Hari Raya Waisak', year: 2026, type: 'national' },
  { id: 'H010', date: '2026-05-29', name: 'Kenaikan Isa Almasih', year: 2026, type: 'national' },
  { id: 'H011', date: '2026-06-07', name: 'Hari Raya Idul Adha', year: 2026, type: 'national' },
  { id: 'H012', date: '2026-06-28', name: 'Tahun Baru Islam', year: 2026, type: 'national' },
  { id: 'H013', date: '2026-08-17', name: 'Hari Kemerdekaan RI', year: 2026, type: 'national' },
  { id: 'H014', date: '2026-09-16', name: 'Maulid Nabi', year: 2026, type: 'national' },
  { id: 'H015', date: '2026-12-25', name: 'Hari Natal', year: 2026, type: 'national' }
];

export const DEFAULT_LEAVE_BALANCES = [
  { id: 'LB001', userId: 'USR001', year: 2026, annualQuota: 12, usedDays: 0, carryOverDays: 2, carryOverExpiryDate: '2026-06-30' },
  { id: 'LB002', userId: 'USR002', year: 2026, annualQuota: 12, usedDays: 0, carryOverDays: 0, carryOverExpiryDate: null },
  { id: 'LB003', userId: 'USR004', year: 2026, annualQuota: 12, usedDays: 0, carryOverDays: 0, carryOverExpiryDate: null },
  { id: 'LB006', userId: 'USR007', year: 2026, annualQuota: 12, usedDays: 0, carryOverDays: 0, carryOverExpiryDate: null },
  { id: 'LB007', userId: 'USR008', year: 2026, annualQuota: 12, usedDays: 0, carryOverDays: 0, carryOverExpiryDate: null },
  { id: 'LB011', userId: 'ADM001', year: 2026, annualQuota: 12, usedDays: 0, carryOverDays: 0, carryOverExpiryDate: null },
  { id: 'LB012', userId: 'ADM002', year: 2026, annualQuota: 12, usedDays: 0, carryOverDays: 0, carryOverExpiryDate: null }
];

export const DEFAULT_APPROVAL_FLOWS = [
  { id: 'AF001', level: 1, name: 'Staff IT (Verifikasi Awal)', assignedRole: 'staff_it', assignedUserIds: ['USR002'], isMandatory: true, isActive: true },
  { id: 'AF002', level: 2, name: 'Kepala Departemen (Pengesahan)', assignedRole: 'kepala_dept', assignedUserIds: ['USR008', 'USR004'], isMandatory: true, isActive: true },
  { id: 'AF003', level: 3, name: 'Kepala Seksi IT (Persetujuan)', assignedRole: 'kepala_it', assignedUserIds: ['USR007', 'USR003'], isMandatory: false, isActive: true }
];

export const DEFAULT_LEAVE_REQUESTS = [
  {
    id: 'LR001',
    userId: 'USR001',
    leaveTypeId: 'LT001',
    startDate: '2026-02-16',
    endDate: '2026-02-18',
    totalDays: 3,
    reason: 'Keperluan keluarga di luar kota',
    substituteId: 'USR004',
    status: 'approved',
    createdAt: '2026-02-10T08:30:00.000Z',
    updatedAt: '2026-02-11T14:20:00.000Z',
    approvalRecords: [
      { approverId: 'USR002', level: 1, action: 'approve', notes: 'Tugas telah didelegasikan', signature: 'Raka Pratama', createdAt: '2026-02-10T11:00:00.000Z' },
      { approverId: 'USR008', level: 2, action: 'approve', notes: 'Disetujui', signature: 'Emil Salim', createdAt: '2026-02-11T14:20:00.000Z' }
    ],
    documents: []
  },
  {
    id: 'LR002',
    userId: 'USR001',
    leaveTypeId: 'LT002',
    startDate: '2026-03-24',
    endDate: '2026-03-25',
    totalDays: 2,
    reason: 'Istirahat pasca rawat jalan demam',
    substituteId: 'USR004',
    status: 'returned',
    createdAt: '2026-03-23T08:45:00.000Z',
    updatedAt: '2026-03-23T11:30:00.000Z',
    approvalRecords: [
      { approverId: 'USR002', level: 1, action: 'return', notes: 'Surat dokter buram, mohon unggah foto/scan yang jelas.', signature: 'Raka Pratama', createdAt: '2026-03-23T11:30:00.000Z' }
    ],
    documents: [{ fileName: 'surat-sakit.pdf', fileSize: '145 KB' }]
  },
  {
    id: 'LR003',
    userId: 'USR004',
    leaveTypeId: 'LT001',
    startDate: '2026-04-14',
    endDate: '2026-04-16',
    totalDays: 3,
    reason: 'Mudik Idul Fitri',
    substituteId: 'USR001',
    status: 'submitted',
    createdAt: '2026-03-26T09:15:00.000Z',
    updatedAt: '2026-03-26T09:15:00.000Z',
    approvalRecords: [],
    documents: []
  }
];

export const DEFAULT_PERMISSION_ROLES = ['user', 'staff_it', 'kepala_it', 'kepala_dept', 'admin', 'admin_sit', 'admin_sis'];

export const DEFAULT_PERMISSION_ROLE_LABELS = {
  user: 'User',
  staff_it: 'Staff IT',
  kepala_it: 'Kepala IT',
  kepala_dept: 'Kepala Departemen',
  admin: 'Admin',
  admin_sit: 'Admin SIT',
  admin_sis: 'Admin SIS'
};

export const DEFAULT_PERMISSION_MODULES = [
  {
    key: 'login_user',
    label: 'Login & User',
    group: 'Login & Profil',
    actions: [
      { key: 'login_logout', label: 'Login & Logout' },
      { key: 'view_profile', label: 'Melihat Profil Pribadi' }
    ]
  },
  {
    key: 'pengajuan_cuti',
    label: 'Pengajuan Cuti',
    group: 'Layanan Cuti',
    actions: [
      { key: 'submit', label: 'Mengajukan Cuti Baru' },
      { key: 'edit_returned', label: 'Memperbaiki Pengajuan Dikembalikan' },
      { key: 'cancel', label: 'Membatalkan Pengajuan' }
    ]
  },
  {
    key: 'dokumen_saldo',
    label: 'Dokumen & Saldo',
    group: 'Dokumen & Saldo',
    actions: [
      { key: 'view_balance', label: 'Melihat Saldo Cuti Pribadi' },
      { key: 'view_history', label: 'Melihat Riwayat Cuti Pribadi' },
      { key: 'upload_doc', label: 'Mengunggah Dokumen Pendukung' }
    ]
  },
  {
    key: 'approval',
    label: 'Approval & Validasi',
    group: 'Otorisasi & Approval',
    actions: [
      { key: 'view_requests', label: 'Melihat Pengajuan Bawahan' },
      { key: 'validate', label: 'Validasi Pengajuan' },
      { key: 'approve_reject', label: 'Approve / Reject Pengajuan' },
      { key: 'qr_code', label: 'QR Code Approval' },
      { key: 'generate_doc', label: 'Generate & Cetak Dokumen Cuti' },
      { key: 'add_notes', label: 'Memberikan Catatan Approval' },
      { key: 'dynamic_config', label: 'Konfigurasi Alur Approval Dinamis' }
    ]
  },
  {
    key: 'master_data',
    label: 'Master Data & Administrasi',
    group: 'Master Data & Sistem',
    actions: [
      { key: 'view_processed', label: 'Melihat Informasi Cuti Diproses' },
      { key: 'manage_employees', label: 'Mengelola Data Karyawan' },
      { key: 'manage_approval', label: 'Mengelola Alur Approval' },
      { key: 'manage_leave_types', label: 'Mengelola Jenis Cuti' },
      { key: 'manage_policy', label: 'Mengelola Kebijakan Cuti' },
      { key: 'manage_holidays', label: 'Mengelola Hari Libur' },
      { key: 'manage_balance', label: 'Mengelola Saldo Cuti' }
    ]
  },
  {
    key: 'dashboard_laporan',
    label: 'Dashboard & Laporan',
    group: 'Laporan & Audit',
    actions: [
      { key: 'view_history', label: 'Melihat Riwayat Pengajuan Seluruh Karyawan' },
      { key: 'view_audit', label: 'Melihat Jejak Audit' },
      { key: 'view_dashboard', label: 'Melihat Dashboard Utama' },
      { key: 'view_reports', label: 'Melihat Rekapitulasi Laporan' },
      { key: 'export_reports', label: 'Export Laporan CSV' }
    ]
  }
];
export const DEFAULT_PERMISSIONS = {
  user: {
    login_user: { login_logout: true, view_profile: true },
    pengajuan_cuti: { submit: true, edit_returned: true, cancel: true },
    dokumen_saldo: { view_balance: true, view_history: true, upload_doc: true },
    approval: { view_requests: false, validate: false, approve_reject: false, qr_code: false, generate_doc: true, add_notes: false, dynamic_config: false },
    master_data: { view_processed: false, manage_employees: false, manage_approval: false, manage_leave_types: false, manage_policy: false, manage_holidays: false, manage_balance: false },
    dashboard_laporan: { view_history: true, view_audit: false, view_dashboard: true, view_reports: false, export_reports: false }
  },
  approval: {
    login_user: { login_logout: true, view_profile: true },
    pengajuan_cuti: { submit: false, edit_returned: false, cancel: false },
    dokumen_saldo: { view_balance: false, view_history: false, upload_doc: false },
    approval: { view_requests: true, validate: true, approve_reject: true, qr_code: true, generate_doc: true, add_notes: true, dynamic_config: false },
    master_data: { view_processed: false, manage_employees: false, manage_approval: false, manage_leave_types: false, manage_policy: false, manage_holidays: false, manage_balance: false },
    dashboard_laporan: { view_history: true, view_audit: true, view_dashboard: true, view_reports: false, export_reports: false }
  },
  staff_it: {
    login_user: { login_logout: true, view_profile: true },
    pengajuan_cuti: { submit: true, edit_returned: true, cancel: true },
    dokumen_saldo: { view_balance: false, view_history: false, upload_doc: false },
    approval: { view_requests: true, validate: true, approve_reject: true, qr_code: true, generate_doc: true, add_notes: true, dynamic_config: false },
    master_data: { view_processed: false, manage_employees: false, manage_approval: false, manage_leave_types: false, manage_policy: false, manage_holidays: false, manage_balance: false },
    dashboard_laporan: { view_history: true, view_audit: true, view_dashboard: true, view_reports: false, export_reports: false }
  },
  kepala_it: {
    login_user: { login_logout: true, view_profile: true },
    pengajuan_cuti: { submit: true, edit_returned: true, cancel: true },
    dokumen_saldo: { view_balance: false, view_history: false, upload_doc: false },
    approval: { view_requests: true, validate: true, approve_reject: true, qr_code: true, generate_doc: true, add_notes: true, dynamic_config: false },
    master_data: { view_processed: false, manage_employees: false, manage_approval: false, manage_leave_types: false, manage_policy: false, manage_holidays: false, manage_balance: false },
    dashboard_laporan: { view_history: true, view_audit: true, view_dashboard: true, view_reports: false, export_reports: false }
  },
  kepala_dept: {
    login_user: { login_logout: true, view_profile: true },
    pengajuan_cuti: { submit: true, edit_returned: true, cancel: true },
    dokumen_saldo: { view_balance: false, view_history: false, upload_doc: false },
    approval: { view_requests: true, validate: true, approve_reject: true, qr_code: true, generate_doc: true, add_notes: true, dynamic_config: false },
    master_data: { view_processed: false, manage_employees: false, manage_approval: false, manage_leave_types: false, manage_policy: false, manage_holidays: false, manage_balance: false },
    dashboard_laporan: { view_history: true, view_audit: true, view_dashboard: true, view_reports: false, export_reports: false }
  },
  admin: {
    login_user: { login_logout: true, view_profile: true },
    pengajuan_cuti: { submit: false, edit_returned: false, cancel: false },
    dokumen_saldo: { view_balance: false, view_history: false, upload_doc: false },
    approval: { view_requests: true, validate: false, approve_reject: false, qr_code: false, generate_doc: true, add_notes: false, dynamic_config: true },
    master_data: { view_processed: true, manage_employees: true, manage_approval: true, manage_leave_types: true, manage_policy: true, manage_holidays: true, manage_balance: true },
    dashboard_laporan: { view_history: true, view_audit: true, view_dashboard: true, view_reports: true, export_reports: true }
  },
  admin_sit: {
    login_user: { login_logout: true, view_profile: true },
    pengajuan_cuti: { submit: false, edit_returned: false, cancel: false },
    dokumen_saldo: { view_balance: false, view_history: false, upload_doc: false },
    approval: { view_requests: true, validate: false, approve_reject: false, qr_code: false, generate_doc: true, add_notes: false, dynamic_config: true },
    master_data: { view_processed: true, manage_employees: true, manage_approval: true, manage_leave_types: true, manage_policy: true, manage_holidays: true, manage_balance: true },
    dashboard_laporan: { view_history: true, view_audit: true, view_dashboard: true, view_reports: true, export_reports: true }
  },
  admin_sis: {
    login_user: { login_logout: true, view_profile: true },
    pengajuan_cuti: { submit: false, edit_returned: false, cancel: false },
    dokumen_saldo: { view_balance: false, view_history: false, upload_doc: false },
    approval: { view_requests: true, validate: false, approve_reject: false, qr_code: false, generate_doc: true, add_notes: false, dynamic_config: true },
    master_data: { view_processed: true, manage_employees: true, manage_approval: true, manage_leave_types: true, manage_policy: true, manage_holidays: true, manage_balance: true },
    dashboard_laporan: { view_history: true, view_audit: true, view_dashboard: true, view_reports: true, export_reports: true }
  }
};

export const DEFAULT_ROLE_CHANGE_REQUESTS = [
  {
    id: 'RCR001',
    userId: 'USR001',
    currentRole: 'user',
    requestedRole: 'approval',
    reason: 'Pengajuan rotasi penugasan menjadi PIC approval cuti',
    status: 'pending',
    createdAt: '2026-09-12T10:00:00',
    updatedAt: '2026-09-12T10:00:00',
    reviewedBy: null,
    reviewedAt: null,
    reviewNotes: ''
  }
];



