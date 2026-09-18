-- SiCuti menus
SET search_path TO template, public;

INSERT INTO template.md_menu (kd_menu, nm_menu, icon_menu, link_menu, kd_parent, status, level, urut, urut_global, created_at) VALUES
('MN_CUTI',   'Lebur',               NULL,                        NULL,                   NULL,       'A', 1, 5,  20, NOW()),
('MN_PENGAJ', 'Pengajuan Cuti',      'ri-file-add-line',          '/leave/apply',         'MN_CUTI',  'A', 2, 1,  21, NOW()),
('MN_HISTCU', 'Riwayat Cuti',        'ri-history-line',           '/leave/history',       'MN_CUTI',  'A', 2, 2,  22, NOW()),
('MN_SALDO',  'Saldo Cuti',          'ri-wallet-3-line',          '/leave/balance',       'MN_CUTI',  'A', 2, 3,  23, NOW()),
('MN_APPRV',  'Approval',            NULL,                        NULL,                   NULL,       'A', 1, 6,  24, NOW()),
('MN_PNDAPP', 'Pending Approval',    'ri-checkbox-circle-line',   '/approval/pending',    'MN_APPRV', 'A', 2, 1,  25, NOW()),
('MN_ADMCU',  'Admin Lebur',         NULL,                        NULL,                   NULL,       'A', 1, 7,  26, NOW()),
('MN_ADMMON', 'Monitoring',          'ri-eye-line',               '/admin/monitoring',    'MN_ADMCU', 'A', 2, 1,  27, NOW()),
('MN_ADMRPT', 'Laporan',             'ri-bar-chart-line',         '/admin/reports',       'MN_ADMCU', 'A', 2, 2,  28, NOW()),
('MN_ADMACC', 'Akun Karyawan',       'ri-user-settings-line',     '/admin/accounts',      'MN_ADMCU', 'A', 2, 3,  29, NOW()),
('MN_ADMFLW', 'Alur Approval',       'ri-flow-chart',             '/admin/approval-flow', 'MN_ADMCU', 'A', 2, 4,  30, NOW()),
('MN_ADMLT',  'Jenis Cuti',          'ri-list-check',             '/admin/leave-types',   'MN_ADMCU', 'A', 2, 5,  31, NOW()),
('MN_ADMHOL', 'Hari Libur',          'ri-calendar-event-line',    '/admin/holidays',      'MN_ADMCU', 'A', 2, 6,  32, NOW()),
('MN_ADMPOL', 'Kebijakan Cuti',      'ri-settings-4-line',        '/admin/policy',        'MN_ADMCU', 'A', 2, 7,  33, NOW()),
('MN_ADMPERM','Hak Akses',           'ri-shield-keyhole-line',    '/admin/permissions',   'MN_ADMCU', 'A', 2, 8,  34, NOW())
ON CONFLICT (kd_menu) DO UPDATE SET
    nm_menu = EXCLUDED.nm_menu, icon_menu = EXCLUDED.icon_menu,
    link_menu = EXCLUDED.link_menu, kd_parent = EXCLUDED.kd_parent,
    status = EXCLUDED.status, level = EXCLUDED.level,
    urut = EXCLUDED.urut, urut_global = EXCLUDED.urut_global;
--0