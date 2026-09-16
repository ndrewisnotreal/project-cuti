# SiCuti Frontend - PrimeVue 4

Frontend Sistem Manajemen Cuti Digital PT Indonesia Asahan Aluminium (Inalum), dibangun dengan **Vue 3** dan **PrimeVue 4** ([PrimeVue GitHub](https://github.com/primefaces/primevue)).

## Tech Stack
- **Framework**: Vue 3 (Composition API `<script setup>`)
- **UI Suite**: [PrimeVue v4](https://github.com/primefaces/primevue)
- **Design System / Theme**: `@primeuix/themes` (Aura preset kustom Inalum)
- **Icons**: [PrimeIcons](https://github.com/primefaces/primeicons)
- **Styling**: Tailwind CSS v4 + Scoped SCSS
- **Routing**: Vue Router 4
- **Build Tool**: Vite 5

## Fitur Utama
1. **Multi-Role Portal**:
   - Dashboard & Pengajuan Cuti Karyawan
   - Dashboard Validasi & Persetujuan (Approval)
   - Dashboard Admin (Monitoring, Saldo, Master Karyawan, Jenis Cuti, Hari Libur, Approval Flow, Permissions, Reports)
2. **Dual-Mode Switcher**: Mode Pengajuan & Mode Approval untuk peran struktural.
3. **Simulasi Akun Demo**: Quick switch persona untuk demonstrasi alur sistem.
4. **Dark Mode & Theme Palette**: Toggle tema gelap/terang dan palet warna kustom.

## Cara Menjalankan
```bash
# Masuk direktori frontend
cd frontend

# Install dependensi (jika belum)
npm install

# Jalankan server development
npm run dev

# Build untuk produksi
npm run build

# Uji coba logika servis
node test-check.js
```
