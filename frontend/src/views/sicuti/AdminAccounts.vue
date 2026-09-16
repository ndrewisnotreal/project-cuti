<script setup>
import { ref, computed } from 'vue';
import {
    currentUser,
    sicutiState,
    updateUserAccount,
    toggleUserStatus
} from '@/service/sicutiService';
import { useToast } from 'primevue/usetoast';
import { Pencil, ToggleLeft, ToggleRight } from 'lucide-vue-next';

const toast = useToast();

const adminDivision = computed(() => currentUser.value?.adminDivision || null);

const users = computed(() => {
    return sicutiState.users.filter((u) => {
        if (adminDivision.value && u.department !== adminDivision.value) return false;
        return true;
    });
});

const editVisible = ref(false);
const editForm = ref({ id: '', name: '', email: '', password: '', confirmPassword: '', isActive: true });
const editErrors = ref({});

function openEdit(user) {
    editForm.value = { id: user.id, name: user.name, email: user.email, password: '', confirmPassword: '', isActive: user.isActive !== false };
    editErrors.value = {};
    editVisible.value = true;
}

function validateEdit() {
    const errs = {};
    if (!editForm.value.name.trim()) errs.name = 'Nama wajib diisi';
    if (!editForm.value.email.trim()) errs.email = 'Email wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.value.email)) errs.email = 'Format email tidak valid';
    if (editForm.value.password) {
        if (editForm.value.password.length < 8) errs.password = 'Password minimal 8 karakter';
        if (editForm.value.password !== editForm.value.confirmPassword) errs.confirmPassword = 'Konfirmasi password tidak cocok';
    }
    editErrors.value = errs;
    return Object.keys(errs).length === 0;
}

function saveEdit() {
    if (!validateEdit()) return;
    updateUserAccount(editForm.value.id, {
        name: editForm.value.name,
        email: editForm.value.email,
        password: editForm.value.password || undefined,
        isActive: editForm.value.isActive
    });
    toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Akun berhasil diperbarui', life: 3000 });
    editVisible.value = false;
}

const confirmVisible = ref(false);
const confirmTarget = ref(null);

function askToggle(user) {
    if (user.id === currentUser.value?.id) {
        toast.add({ severity: 'warn', summary: 'Tidak Diizinkan', detail: 'Tidak bisa menonaktifkan akun sendiri', life: 3000 });
        return;
    }
    confirmTarget.value = user;
    confirmVisible.value = true;
}

function confirmToggle() {
    if (!confirmTarget.value) return;
    const wasActive = confirmTarget.value.isActive !== false;
    toggleUserStatus(confirmTarget.value.id);
    toast.add({ severity: 'info', summary: 'Status Diubah', detail: `Akun ${confirmTarget.value.name} ${wasActive ? 'dinonaktifkan' : 'diaktifkan'}`, life: 3000 });
    confirmVisible.value = false;
    confirmTarget.value = null;
}

function getRoleLabel(role) {
    const m = { user: 'User', staff_it: 'Staff IT', kepala_it: 'Kepala IT', kepala_dept: 'Kepala Dept', admin: 'Admin', admin_sit: 'Admin SIT', admin_sis: 'Admin SIS' };
    return m[role] || role;
}
</script>

<template>
    <div class="space-y-6">
        <div>
            <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100">Manajemen Akun Pengguna</h2>
            <p class="text-xs text-muted-color mt-0.5">Kelola data akun karyawan divisi {{ adminDivision || 'semua' }}</p>
        </div>
        <div class="card border border-surface-200 dark:border-surface-700 rounded-xl bg-surface-0 dark:bg-surface-900 p-4 shadow-sm">
            <DataTable :value="users" paginator :rows="15" class="p-datatable-sm text-xs" responsiveLayout="scroll">
                <template #empty><div class="text-center py-8 text-muted-color">Tidak ada data akun.</div></template>
                <Column header="Karyawan" style="width: 28%">
                    <template #body="{ data }">
                        <div class="font-bold text-surface-900 dark:text-surface-100">{{ data.name }}</div>
                        <div class="text-[10px] text-muted-color">{{ data.namecode }} · {{ data.email }}</div>
                    </template>
                </Column>
                <Column header="Jabatan" style="width: 22%">
                    <template #body="{ data }"><span class="text-xs">{{ data.position }}</span></template>
                </Column>
                <Column header="Role" style="width: 14%">
                    <template #body="{ data }"><Tag :value="getRoleLabel(data.role)" severity="info" class="text-[10px]" /></template>
                </Column>
                <Column header="Divisi" style="width: 10%">
                    <template #body="{ data }"><span class="text-xs">{{ data.department }}</span></template>
                </Column>
                <Column header="Status" style="width: 12%">
                    <template #body="{ data }">
                        <Tag :value="data.isActive !== false ? 'Aktif' : 'Nonaktif'" :severity="data.isActive !== false ? 'success' : 'secondary'" class="text-[10px]" />
                    </template>
                </Column>
                <Column header="Aksi" style="width: 14%">
                    <template #body="{ data }">
                        <div class="flex items-center gap-1">
                            <button type="button" class="p-1.5 text-surface-500 hover:text-primary hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg cursor-pointer" @click="openEdit(data)" title="Edit">
                                <Pencil :size="14" :stroke-width="1.75" />
                            </button>
                            <button type="button" :class="['p-1.5 rounded-lg cursor-pointer', data.isActive !== false ? 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950/20']" @click="askToggle(data)">
                                <component :is="data.isActive !== false ? ToggleRight : ToggleLeft" :size="15" :stroke-width="1.75" />
                            </button>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Edit Modal -->
        <Dialog v-model:visible="editVisible" modal header="Edit Akun Pengguna" :style="{ width: '440px' }" :breakpoints="{ '640px': '92vw' }">
            <div class="space-y-4 pt-2">
                <div>
                    <label class="block text-xs font-medium mb-1">Nama <span class="text-red-500">*</span></label>
                    <InputText v-model="editForm.name" class="w-full text-xs" />
                    <small v-if="editErrors.name" class="text-red-500 text-[11px]">{{ editErrors.name }}</small>
                </div>
                <div>
                    <label class="block text-xs font-medium mb-1">Email <span class="text-red-500">*</span></label>
                    <InputText v-model="editForm.email" type="email" class="w-full text-xs" />
                    <small v-if="editErrors.email" class="text-red-500 text-[11px]">{{ editErrors.email }}</small>
                </div>
                <div>
                    <label class="block text-xs font-medium mb-1">Password Baru <span class="text-muted-color font-normal">(kosongkan jika tidak diubah)</span></label>
                    <InputText v-model="editForm.password" type="password" class="w-full text-xs" placeholder="Min. 8 karakter" />
                    <small v-if="editErrors.password" class="text-red-500 text-[11px]">{{ editErrors.password }}</small>
                </div>
                <div v-if="editForm.password">
                    <label class="block text-xs font-medium mb-1">Konfirmasi Password <span class="text-red-500">*</span></label>
                    <InputText v-model="editForm.confirmPassword" type="password" class="w-full text-xs" />
                    <small v-if="editErrors.confirmPassword" class="text-red-500 text-[11px]">{{ editErrors.confirmPassword }}</small>
                </div>
                <div class="flex items-center gap-3 pt-1">
                    <label class="text-xs font-medium">Status:</label>
                    <input type="checkbox" v-model="editForm.isActive" id="editIsActive" class="cursor-pointer" />
                    <label for="editIsActive" class="text-xs cursor-pointer">{{ editForm.isActive ? 'Aktif' : 'Nonaktif' }}</label>
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-2 pt-2">
                    <Button label="Batal" severity="secondary" size="small" text @click="editVisible = false" />
                    <Button label="Simpan" severity="primary" size="small" class="font-bold" @click="saveEdit" />
                </div>
            </template>
        </Dialog>

        <!-- Toggle Confirm -->
        <Dialog v-model:visible="confirmVisible" modal :header="confirmTarget?.isActive !== false ? 'Nonaktifkan Akun' : 'Aktifkan Akun'" :style="{ width: '380px' }">
            <p class="text-sm">{{ confirmTarget?.isActive !== false ? 'Nonaktifkan' : 'Aktifkan' }} akun <strong>{{ confirmTarget?.name }}</strong>?</p>
            <template #footer>
                <div class="flex justify-end gap-2 pt-2">
                    <Button label="Batal" severity="secondary" size="small" text @click="confirmVisible = false" />
                    <Button :label="confirmTarget?.isActive !== false ? 'Nonaktifkan' : 'Aktifkan'" :severity="confirmTarget?.isActive !== false ? 'danger' : 'success'" size="small" class="font-bold" @click="confirmToggle" />
                </div>
            </template>
        </Dialog>
    </div>
</template>
