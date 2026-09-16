-- ================================================================
-- Seed: 05_d_action_menu.sql
-- Extra action bindings (Confirm on Website Settings)
-- ================================================================
SET search_path TO template, public;


INSERT INTO template."d_action_menu" ("kd_menu", "kd_action") VALUES
('MN_SYSWS', 'ACT_F09EDD')
ON CONFLICT ("kd_menu", "kd_action") DO NOTHING;
