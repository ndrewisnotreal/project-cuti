<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '@/service/sicutiService';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const toast = useToast();

const identifier = ref('');
const password = ref('');
const rememberMe = ref(false);

// State notifikasi & error
const errorMessage = ref('');
const errorField = ref('');

const demoAccounts = [
    { label: 'User', role: 'Pemohon Cuti (Staff)', id: 'user@inalum.co.id', pass: 'password123' },
    { label: 'Approver 1', role: 'Atasan Langsung (Approver L1)', id: 'approver1@inalum.co.id', pass: 'password123' },
    { label: 'Approver 2', role: 'Kepala Departemen (Approver L2)', id: 'approver2@inalum.co.id', pass: 'password123' },
    { label: 'Admin SIT', role: 'Administrator Divisi SIT', id: 'admin.sit@inalum.co.id', pass: 'password123' },
    { label: 'Admin SIS', role: 'Administrator Divisi SIS', id: 'admin.sis@inalum.co.id', pass: 'password123' }
];

function onInput(field) {
    if (errorField.value === field || !errorField.value) {
        errorMessage.value = '';
        errorField.value = '';
    }
}

async function selectDemo(acc) {
    identifier.value = acc.id;
    password.value = acc.pass;
    errorMessage.value = '';
    errorField.value = '';
    await handleLogin();
}

async function handleLogin() {
    errorMessage.value = '';
    errorField.value = '';

    const cleanId = identifier.value.trim();
    const cleanPass = password.value.trim();

    if (!cleanId) {
        errorMessage.value = 'ID Karyawan / Email wajib diisi';
        errorField.value = 'identifier';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage.value, life: 3000 });
        return;
    }

    if (!cleanPass) {
        errorMessage.value = 'Password wajib diisi';
        errorField.value = 'password';
        toast.add({ severity: 'error', summary: 'Gagal', detail: errorMessage.value, life: 3000 });
        return;
    }

    const res = await login(cleanId, cleanPass, rememberMe.value);
    if (res.success) {
        toast.add({
            severity: 'success',
            summary: 'Login Berhasil',
            detail: `Selamat datang, ${res.user.name}`,
            life: 3000
        });
        router.push('/');
    } else {
        errorField.value = res.field || '';
        if (res.field === 'identifier' || res.code === 'USER_NOT_FOUND') {
            errorMessage.value = 'ID Karyawan atau Email tidak terdaftar dalam sistem';
            toast.add({
                severity: 'error',
                summary: 'Email / ID Salah',
                detail: errorMessage.value,
                life: 3500
            });
        } else if (res.field === 'password' || res.code === 'INVALID_PASSWORD') {
            errorMessage.value = 'Password yang Anda masukkan salah. Silakan periksa kembali';
            toast.add({
                severity: 'error',
                summary: 'Password Salah',
                detail: errorMessage.value,
                life: 3500
            });
        } else {
            errorMessage.value = res.message || 'Login gagal';
            toast.add({
                severity: 'error',
                summary: 'Login Gagal',
                detail: errorMessage.value,
                life: 3000
            });
        }
    }
}
</script>

<template>
    <div class="min-h-screen flex items-center justify-center p-4 bg-surface-50 dark:bg-surface-950">
        <div class="w-full max-w-md bg-surface-0 dark:bg-surface-900 rounded-2xl p-8 shadow-sm border border-surface-200 dark:border-surface-800">
            <!-- Header Brand -->
            <div class="text-center mb-6">
                <div class="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <i class="pi pi-calendar-plus text-2xl"></i>
                </div>
                <h1 class="text-2xl font-black text-primary leading-tight tracking-tight">SiCuti</h1>
                <p class="text-xs text-muted-color mt-1 font-medium">Sistem Manajemen Cuti Digital &bull; PT Indonesia Asahan Aluminium</p>
            </div>

            <!-- Notifikasi Error Login (Salah Email / Password) -->
            <div
                v-if="errorMessage"
                class="mb-4 p-3 rounded-xl text-xs flex items-center gap-2.5 transition-all"
                :class="[
                    errorField === 'identifier'
                        ? 'bg-amber-50 text-amber-900 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800'
                        : 'bg-red-50 text-red-900 border border-red-300 dark:bg-red-950/40 dark:text-red-200 dark:border-red-800'
                ]"
            >
                <i :class="errorField === 'identifier' ? 'pi pi-user-times' : 'pi pi-times-circle'" class="text-base shrink-0"></i>
                <div class="flex-1 font-medium leading-relaxed">{{ errorMessage }}</div>
            </div>

            <!-- Login Form -->
            <form @submit.prevent="handleLogin" class="space-y-4 text-sm">
                <div>
                    <label class="block font-semibold text-surface-700 dark:text-surface-300 mb-1 text-xs">ID Karyawan / Email</label>
                    <IconField iconPosition="left" class="w-full">
                        <InputIcon class="pi pi-user text-sm" />
                        <InputText
                            v-model="identifier"
                            @input="onInput('identifier')"
                            placeholder="nama@inalum.co.id / user"
                            class="w-full text-xs"
                            :invalid="errorField === 'identifier'"
                        />
                    </IconField>
                    <small v-if="errorField === 'identifier'" class="text-red-500 text-[11px] block mt-1">
                        ID Karyawan atau Email tidak ditemukan
                    </small>
                </div>

                <div>
                    <label class="block font-semibold text-surface-700 dark:text-surface-300 mb-1 text-xs">Kata Sandi</label>
                    <IconField iconPosition="left" class="w-full">
                        <InputIcon class="pi pi-lock text-sm" />
                        <InputText
                            v-model="password"
                            @input="onInput('password')"
                            type="password"
                            placeholder="Masukkan password..."
                            class="w-full text-xs"
                            :invalid="errorField === 'password'"
                        />
                    </IconField>
                    <small v-if="errorField === 'password'" class="text-red-500 text-[11px] block mt-1">
                        Password salah. Periksa huruf besar/kecil
                    </small>
                </div>

                <div class="flex items-center justify-between text-xs pt-1">
                    <div class="flex items-center gap-2">
                        <Checkbox v-model="rememberMe" :binary="true" inputId="rememberMe" />
                        <label for="rememberMe" class="cursor-pointer text-muted-color">Ingat Sesi Saya</label>
                    </div>
                </div>

                <Button type="submit" label="Masuk ke Sistem" icon="pi pi-sign-in" class="w-full font-bold shadow-xs mt-2" />
            </form>

            <!-- Quick Demo Login -->
            <div class="mt-6 pt-5 border-t border-surface-200 dark:border-surface-800">
                <span class="text-[11px] text-muted-color block font-semibold mb-2.5 text-center">Akun Demo Simulasi (Klik untuk masuk instan):</span>
                <div class="space-y-1.5">
                    <button
                        v-for="acc in demoAccounts"
                        :key="acc.id"
                        type="button"
                        @click="selectDemo(acc)"
                        class="w-full p-2.5 text-left rounded-xl border border-surface-200 dark:border-surface-800 hover:border-primary hover:bg-primary/5 text-surface-700 dark:text-surface-300 transition-all cursor-pointer flex items-center justify-between group"
                    >
                        <div>
                            <span class="text-xs font-bold block text-surface-900 dark:text-surface-100 group-hover:text-primary transition-colors">{{ acc.label }}</span>
                            <span class="text-[10px] text-muted-color">{{ acc.role }}</span>
                        </div>
                        <i class="pi pi-arrow-right text-xs text-muted-color group-hover:text-primary transition-colors"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
