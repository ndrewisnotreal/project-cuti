SET search_path TO template, public;

INSERT INTO template.d_leave_balance (id_balance, uid_user_system, year, annual_quota, used_days, carry_over_days, carry_over_expiry_date) VALUES
('LB001', 'USR001', 2026, 12, 0, 2, '2026-06-30'),
('LB002', 'USR002', 2026, 12, 0, 0, NULL),
('LB003', 'USR004', 2026, 12, 0, 0, NULL),
('LB004', 'USR005', 2026, 12, 0, 0, NULL),
('LB005', 'USR006', 2026, 12, 0, 0, NULL),
('LB006', 'USR007', 2026, 12, 0, 0, NULL),
('LB007', 'USR008', 2026, 12, 0, 0, NULL),
('LB008', 'USR009', 2026, 12, 0, 0, NULL),
('LB009', 'USR010', 2026, 12, 0, 0, NULL),
('LB010', 'USR011', 2026, 12, 0, 0, NULL),
('LB011', 'ADM001', 2026, 12, 0, 0, NULL),
('LB012', 'ADM002', 2026, 12, 0, 0, NULL)
ON CONFLICT (uid_user_system, year) DO NOTHING;
