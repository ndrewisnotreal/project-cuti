-- SiCuti demo users: update existing users with kd_dept & admin_division
SET search_path TO template, public;

UPDATE template.md_user SET kd_dept = 'SIT', admin_division = NULL WHERE uid_user_system IN ('USR001','USR002','USR004','USR005','USR006','USR007','USR008');
UPDATE template.md_user SET kd_dept = 'SIS', admin_division = NULL WHERE uid_user_system IN ('USR009','USR010','USR011');
UPDATE template.md_user SET kd_dept = 'SIT', admin_division = 'SIT' WHERE uid_user_system IN ('ADM001','USR003');
UPDATE template.md_user SET kd_dept = 'SIS', admin_division = 'SIS' WHERE uid_user_system = 'ADM002';
