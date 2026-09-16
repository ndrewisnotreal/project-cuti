-- ============================================================================
-- SiCuti - 10_sicuti.sql
-- Domain tables for leave management system. Safe to re-run (idempotent).
-- ============================================================================

SET search_path TO template, public;

-- md_department
CREATE TABLE IF NOT EXISTS template.md_department (
    kd_dept     VARCHAR(10)  PRIMARY KEY,
    nm_dept     VARCHAR(200) NOT NULL,
    is_deleted  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Extend md_user with SiCuti columns (idempotent)
ALTER TABLE template.md_user
    ADD COLUMN IF NOT EXISTS kd_dept        VARCHAR(10)  REFERENCES template.md_department(kd_dept) ON UPDATE CASCADE ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS position       VARCHAR(200),
    ADD COLUMN IF NOT EXISTS namecode       VARCHAR(50),
    ADD COLUMN IF NOT EXISTS admin_division VARCHAR(10),
    ADD COLUMN IF NOT EXISTS supervisor_id  VARCHAR(36)  REFERENCES template.md_user(uid_user_system) ON UPDATE CASCADE ON DELETE SET NULL;

-- md_leave_type
CREATE TABLE IF NOT EXISTS template.md_leave_type (
    kd_leave_type     VARCHAR(10)  PRIMARY KEY,
    code              VARCHAR(10)  NOT NULL UNIQUE,
    nm_leave_type     VARCHAR(100) NOT NULL,
    description       TEXT,
    uses_quota        BOOLEAN      NOT NULL DEFAULT TRUE,
    requires_document BOOLEAN      NOT NULL DEFAULT FALSE,
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    is_deleted        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- md_leave_policy (singleton)
CREATE TABLE IF NOT EXISTS template.md_leave_policy (
    id                       SERIAL    PRIMARY KEY,
    annual_quota             INTEGER   NOT NULL DEFAULT 12,
    max_carry_over           INTEGER   NOT NULL DEFAULT 4,
    carry_over_expiry_months INTEGER   NOT NULL DEFAULT 6,
    description              TEXT,
    is_active                BOOLEAN   NOT NULL DEFAULT TRUE,
    created_at               TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMP NOT NULL DEFAULT NOW()
);

-- md_holiday
CREATE TABLE IF NOT EXISTS template.md_holiday (
    id_holiday   VARCHAR(10)  PRIMARY KEY,
    holiday_date DATE         NOT NULL,
    nm_holiday   VARCHAR(200) NOT NULL,
    year         INTEGER      NOT NULL,
    type         VARCHAR(20)  NOT NULL DEFAULT 'national',
    is_deleted   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_md_holiday_year ON template.md_holiday (year) WHERE is_deleted = FALSE;

-- d_approval_flow
CREATE TABLE IF NOT EXISTS template.d_approval_flow (
    id_flow       VARCHAR(10)  PRIMARY KEY,
    level         INTEGER      NOT NULL,
    nm_flow       VARCHAR(200) NOT NULL,
    assigned_role VARCHAR(50),
    is_mandatory  BOOLEAN      NOT NULL DEFAULT TRUE,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- d_approval_flow_user: flow ↔ user many-to-many
CREATE TABLE IF NOT EXISTS template.d_approval_flow_user (
    id_flow         VARCHAR(10) NOT NULL REFERENCES template.d_approval_flow(id_flow) ON DELETE CASCADE,
    uid_user_system VARCHAR(36) NOT NULL REFERENCES template.md_user(uid_user_system) ON DELETE CASCADE,
    PRIMARY KEY (id_flow, uid_user_system)
);

-- d_leave_balance
CREATE TABLE IF NOT EXISTS template.d_leave_balance (
    id_balance             VARCHAR(20) PRIMARY KEY,
    uid_user_system        VARCHAR(36) NOT NULL REFERENCES template.md_user(uid_user_system) ON DELETE CASCADE,
    year                   INTEGER     NOT NULL,
    annual_quota           INTEGER     NOT NULL DEFAULT 12,
    used_days              INTEGER     NOT NULL DEFAULT 0,
    carry_over_days        INTEGER     NOT NULL DEFAULT 0,
    carry_over_expiry_date DATE,
    created_at             TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP   NOT NULL DEFAULT NOW(),
    UNIQUE (uid_user_system, year)
);

-- d_leave_request
CREATE TABLE IF NOT EXISTS template.d_leave_request (
    id_request      VARCHAR(20) PRIMARY KEY,
    uid_user_system VARCHAR(36) NOT NULL REFERENCES template.md_user(uid_user_system) ON DELETE RESTRICT,
    kd_leave_type   VARCHAR(10) NOT NULL REFERENCES template.md_leave_type(kd_leave_type) ON UPDATE CASCADE ON DELETE RESTRICT,
    substitute_id   VARCHAR(36) REFERENCES template.md_user(uid_user_system) ON DELETE SET NULL,
    start_date      DATE        NOT NULL,
    end_date        DATE        NOT NULL,
    total_days      INTEGER     NOT NULL DEFAULT 1,
    reason          TEXT,
    status          VARCHAR(30) NOT NULL DEFAULT 'submitted',
    created_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_d_leave_request_uid    ON template.d_leave_request (uid_user_system);
CREATE INDEX IF NOT EXISTS idx_d_leave_request_status ON template.d_leave_request (status);

-- d_approval_record
CREATE TABLE IF NOT EXISTS template.d_approval_record (
    id_record   BIGSERIAL   PRIMARY KEY,
    id_request  VARCHAR(20) NOT NULL REFERENCES template.d_leave_request(id_request) ON DELETE CASCADE,
    approver_id VARCHAR(36) NOT NULL REFERENCES template.md_user(uid_user_system) ON DELETE RESTRICT,
    level       INTEGER     NOT NULL,
    action      VARCHAR(20) NOT NULL,
    notes       TEXT,
    signature   VARCHAR(250),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_d_approval_record_request ON template.d_approval_record (id_request);

-- View: v_leave_request
DROP VIEW IF EXISTS template.v_leave_request CASCADE;
CREATE OR REPLACE VIEW template.v_leave_request AS
SELECT r.id_request, r.uid_user_system, u.nama AS requester_name, u.namecode,
       u.kd_dept, d.nm_dept, r.kd_leave_type, lt.nm_leave_type, lt.uses_quota,
       r.substitute_id, r.start_date, r.end_date, r.total_days,
       r.reason, r.status, r.created_at, r.updated_at
FROM template.d_leave_request r
JOIN template.md_user u ON u.uid_user_system = r.uid_user_system
JOIN template.md_leave_type lt ON lt.kd_leave_type = r.kd_leave_type
LEFT JOIN template.md_department d ON d.kd_dept = u.kd_dept;

-- View: v_leave_balance
DROP VIEW IF EXISTS template.v_leave_balance CASCADE;
CREATE OR REPLACE VIEW template.v_leave_balance AS
SELECT b.id_balance, b.uid_user_system, u.nama, u.namecode,
       u.kd_dept, d.nm_dept, u.status_user, b.year,
       b.annual_quota, b.used_days, b.carry_over_days, b.carry_over_expiry_date,
       (b.annual_quota + b.carry_over_days - b.used_days) AS remaining,
       b.created_at, b.updated_at
FROM template.d_leave_balance b
JOIN template.md_user u ON u.uid_user_system = b.uid_user_system
LEFT JOIN template.md_department d ON d.kd_dept = u.kd_dept;

