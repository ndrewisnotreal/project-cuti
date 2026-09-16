SET search_path TO template, public;

-- 3-level approval flow (matches DEFAULT_APPROVAL_FLOWS)
INSERT INTO template.d_approval_flow (id_flow, level, nm_flow, assigned_role, is_mandatory, is_active) VALUES
('AF002', 2, 'Staff IT (Verifikasi Awal)',      'staff_it',    TRUE, TRUE),
('AF003', 3, 'Kepala Seksi IT (Persetujuan)',   'kepala_it',   TRUE, TRUE),
('AF004', 4, 'Kepala Departemen (Pengesahan)',  'kepala_dept', TRUE, TRUE)
ON CONFLICT (id_flow) DO UPDATE SET
    level = EXCLUDED.level, nm_flow = EXCLUDED.nm_flow,
    assigned_role = EXCLUDED.assigned_role, is_mandatory = EXCLUDED.is_mandatory,
    is_active = EXCLUDED.is_active, updated_at = NOW();

-- Assign real users: USR002 (raka), USR007 (jabbar), USR008 (emil)
INSERT INTO template.d_approval_flow_user (id_flow, uid_user_system) VALUES
('AF002', 'USR002'),
('AF003', 'USR007'),
('AF004', 'USR008')
ON CONFLICT DO NOTHING;
