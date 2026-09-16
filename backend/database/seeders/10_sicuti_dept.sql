SET search_path TO template, public;

INSERT INTO template.md_department (kd_dept, nm_dept) VALUES
('SIT', 'Sistem Informasi & Teknologi'),
('SIS', 'Sistem Informasi Smelting')
ON CONFLICT (kd_dept) DO UPDATE SET nm_dept = EXCLUDED.nm_dept, updated_at = NOW();
