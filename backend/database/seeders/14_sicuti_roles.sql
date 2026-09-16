-- SiCuti roles — extend md_role with domain-specific roles
SET search_path TO template, public;

INSERT INTO template.md_role (kd_role, nm_role, status) VALUES
('RS004', 'Staff IT',           'A'),
('RS005', 'Kepala IT',          'A'),
('RS006', 'Kepala Departemen',  'A'),
('RS007', 'Admin Divisi',       'A')
ON CONFLICT (kd_role) DO UPDATE SET nm_role = EXCLUDED.nm_role, status = EXCLUDED.status, updated_at = NOW();
