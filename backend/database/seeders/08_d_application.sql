-- ================================================================
-- Seed: 08_d_application.sql
-- ================================================================
SET search_path TO template, public;


INSERT INTO template."d_application" ("app_key", "nama_aplikasi", "deskripsi", "domain", "api_token", "status", "is_deleted", "created_at") VALUES
('change-me-dev-app-key', 'API Template', 'NestJS + Fastify API template', 'http://localhost:5173', 'change-me-dev-api-token', 'A', FALSE, '2026-07-30T04:55:40.906Z')
ON CONFLICT ("app_key") DO UPDATE SET
    "nama_aplikasi" = EXCLUDED."nama_aplikasi",
    "deskripsi" = EXCLUDED."deskripsi",
    "domain" = EXCLUDED."domain",
    "api_token" = EXCLUDED."api_token",
    "status" = EXCLUDED."status",
    "is_deleted" = EXCLUDED."is_deleted",
    "created_at" = EXCLUDED."created_at";
