SET search_path TO template, public;

INSERT INTO template.md_leave_type (kd_leave_type, code, nm_leave_type, description, uses_quota, requires_document, is_active) VALUES
('LT001', 'CT', 'Cuti Tahunan',    'Hak cuti tahunan karyawan',           TRUE,  FALSE, TRUE),
('LT002', 'CS', 'Cuti Sakit',      'Cuti karena sakit dengan surat dokter',FALSE, TRUE,  TRUE),
('LT003', 'CM', 'Cuti Melahirkan', 'Cuti melahirkan 3 bulan',              FALSE, TRUE,  TRUE),
('LT004', 'CK', 'Cuti Menikah',    'Cuti menikah 3 hari kerja',            FALSE, TRUE,  TRUE),
('LT006', 'CH', 'Cuti Haid',       'Cuti haid maksimal 2 hari',            FALSE, FALSE, TRUE),
('LT007', 'CI', 'Cuti Ibadah',     'Cuti ibadah keagamaan',                FALSE, FALSE, TRUE)
ON CONFLICT (kd_leave_type) DO UPDATE SET
    code = EXCLUDED.code, nm_leave_type = EXCLUDED.nm_leave_type,
    description = EXCLUDED.description, uses_quota = EXCLUDED.uses_quota,
    requires_document = EXCLUDED.requires_document, is_active = EXCLUDED.is_active,
    updated_at = NOW();
