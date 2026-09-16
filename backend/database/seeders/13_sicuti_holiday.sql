SET search_path TO template, public;

INSERT INTO template.md_holiday (id_holiday, holiday_date, nm_holiday, year, type) VALUES
('H001', '2026-01-01', 'Tahun Baru Masehi',       2026, 'national'),
('H002', '2026-01-29', 'Isra Mi''raj',             2026, 'national'),
('H003', '2026-02-19', 'Tahun Baru Imlek',         2026, 'national'),
('H004', '2026-03-20', 'Wafat Isa Almasih',        2026, 'national'),
('H005', '2026-03-29', 'Hari Raya Nyepi',          2026, 'national'),
('H006', '2026-04-03', 'Hari Raya Idul Fitri',     2026, 'collective'),
('H007', '2026-04-06', 'Cuti Bersama Idul Fitri',  2026, 'collective'),
('H008', '2026-05-01', 'Hari Buruh',               2026, 'national'),
('H009', '2026-05-12', 'Hari Raya Waisak',         2026, 'national'),
('H010', '2026-05-29', 'Kenaikan Isa Almasih',     2026, 'national'),
('H011', '2026-06-07', 'Hari Raya Idul Adha',      2026, 'national'),
('H012', '2026-06-28', 'Tahun Baru Islam',         2026, 'national'),
('H013', '2026-08-17', 'Hari Kemerdekaan RI',      2026, 'national'),
('H014', '2026-09-16', 'Maulid Nabi',              2026, 'national'),
('H015', '2026-12-25', 'Hari Natal',               2026, 'national')
ON CONFLICT (id_holiday) DO UPDATE SET
    holiday_date = EXCLUDED.holiday_date, nm_holiday = EXCLUDED.nm_holiday,
    year = EXCLUDED.year, type = EXCLUDED.type;
