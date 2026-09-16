# API Template (NestJS + Fastify)

Scaffolding backend untuk proyek baru: auth, user, menu, action, permission, settings.

## Stack
- NestJS 11 + Fastify
- PostgreSQL schema `template`
- JWT (cookie AES) + `x-api-key`
- Swagger: http://localhost:3000/api/docs
  - Login `POST /auth/authorize` → salin `data.access_token` → **Authorize** (Bearer + `x-api-key` = `API_TOKEN`)
  - Matikan docs: `SWAGGER_ENABLED=false` (default off di `NODE_ENV=production`)
- MinIO (opsional) + SMTP via MailModule

## Setup DB
```bash
# buat database/schema template di Postgres, lalu:
npm run db:schema
npm run db:seed
```

Sesuaikan `.env.development` (lihat `.env.example`).

## Run
```bash
npm install
npm run start:dev
```

## Akun seed
- username: `super`
- password: sesuai hash di `database/seeders/04_md_user.sql` (ganti setelah seed)

Pastikan `APP_KEY` / `API_TOKEN` di env cocok dengan baris di `08_d_application.sql`.

## Modul inti
| Area | Path |
|------|------|
| Login | `POST /auth/authorize` |
| User | `/master/user` |
| Permission | `/master/permission` |
| Menu / Action | `/system/menu`, `/system/action` |
| Website Settings | `/system/settings` |

## Test
```bash
npm test
```
