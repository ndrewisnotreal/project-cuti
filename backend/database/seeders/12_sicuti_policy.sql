SET search_path TO template, public;

INSERT INTO template.md_leave_policy (annual_quota, max_carry_over, carry_over_expiry_months, description, is_active)
SELECT 12, 4, 6, 'Kuota tahunan 12 hari, carry over maks 4 hari berlaku s/d 30 Juni', TRUE
WHERE NOT EXISTS (SELECT 1 FROM template.md_leave_policy WHERE is_active = TRUE);
