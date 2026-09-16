<script setup>
import { ref, computed } from 'vue';
import {
    sicutiState,
    saveToLocalStorage
} from '@/service/sicutiService';
import { useToast } from 'primevue/usetoast';
import { Plus, Search, Pencil, Ban, Check } from 'lucide-vue-next';

const toast = useToast();
const searchQuery = ref('');
const departmentFilter = ref(null);
const dialogVisible = ref(false);
const isEditing = ref(false);

const currentEmployee = ref({
    id: '',
    namecode: '',
    name: '',
    email: '',
    password: 'password123',
    role: 'user',
    department: 'SIT',
    position: '',
    isActive: true
});

const deptOptions = [
    { label: 'Semua Divisi', value: null },
    { label: 'SIT', value: 'SIT' },
    { label: 'SIS', value: 'SIS' }
];

const roleOptions = [
    { label: 'User (Karyawan)', value: 'user' },
    { label: 'Staff IT (Approver L1)', value: 'staff_it' },
    { label: 'Kepala Seksi SIT (Approver L2)', value: 'kepala_it' },
    { label: 'Kepala Departemen SIT (Approver L3)', value: 'kepala_dept' },
    { label: 'Admin SIT', value: 'admin_sit' },
    { label: 'Admin SIS', value: 'admin_sis' }
];

const filteredUsers = computed(() => {
    return sicutiState.users.filter((u) => {
        if (departmentFilter.value && u.department !== departmentFilter.value) return false;
        if (searchQuery.value) {
            const q = searchQuery.value.toLowerCase();
            const name = u.name?.toLowerCase() || '';
            const code = u.namecode?.toLowerCase() || '';
            const email = u.email?.toLowerCase() || '';
            if (!name.includes(q) && !code.includes(q) && !email.includes(q)) return false;
        }
        return true;
    });
});

function openAdd() {
    isEditing.value = false;
    const numIds = sicutiState.users
        .map((u) => {
            const m = String(u?.id || '').match(/\d+/);
            return m ? parseInt(m[0], 10) : 0;
        })
        .filter((n) => !isNaN(n));
    const maxNum = numIds.length ? Math.max(...numIds, 0) : 0;
    const nextId = 'USR' + String(Math.max(maxNum, 11) + 1).padStart(3, '0');

    currentEmployee.value = {
        id: nextId,
        namecode: '',
        name: '',
        email: '',
        password: 'password123',
        role: 'user',
        department: 'SIT',
        position: '',
        isActive: true
    };
    dialogVisible.value = true;
}

function openEdit(emp) {
    isEditing.value = true;
    currentEmployee.value = { ...emp };
    dialogVisible.value = true;
}

function saveEmployee() {
    const e = currentEmployee.value;
    if (!e.namecode || !e.name || !e.email) {
        toast.add({ severity: 'error', summary: 'Validasi', detail: 'NIK, Nama, dan Email wajib diisi', life: 3000 });
        return;
    }

    if (isEditing.value) {
        const idx = sicutiState.users.findIndex((u) => u.id === e.id);
        if (idx !== -1) {
            sicutiState.users[idx] = { ...e };
            toast.add({ severity: 'success', summary: 'Diperbarui', detail: `Data karyawan ${e.name} berhasil diperbarui`, life: 3000 });
        }
    } else {
        sicutiState.users.push({ ...e });
        // Initialize balance safely with unique LB ID
        const numBalIds = sicutiState.leaveBalances
            .map((b) => {
                const m = String(b?.id || '').match(/\d+/);
                return m ? parseInt(m[0], 10) : 0;
            })
            .filter((n) => !isNaN(n));
        const maxBal = numBalIds.length ? Math.max(...numBalIds, 0) : 0;
        const nextBalId = 'LB' + String(maxBal + 1).padStart(3, '0');

        sicutiState.leaveBalances.push({
            id: nextBalId,
            userId: e.id,
            year: 2026,
            annualQuota: 12,
            usedDays: 0,
            carryOverDays: 0,
            carryOverExpiryDate: null
        });
        toast.add({ severity: 'success', summary: 'Ditambahkan', detail: `Karyawan baru ${e.name} berhasil ditambahkan`, life: 3000 });
    }
    saveToLocalStorage();
    dialogVisible.value = false;
}

function toggleStatus(emp) {
    emp.isActive = !emp.isActive;
    saveToLocalStorage();
    toast.add({
        severity: 'info',
        summary: 'Status Diubah',
        detail: `Status karyawan ${emp.name} diubah menjadi ${emp.isActive ? 'Aktif' : 'Nonaktif'}`,
        life: 3000
    });
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100">Master Data Karyawan</h2>
                <p class="text-xs text-muted-color">Manajemen profil pegawai, jabatan, hak akses, dan penugasan divisi</p>
            </div>
            <Button
                severity="success"
                size="small"
                class="text-xs font-bold flex items-center gap-1.5"
                @click="openAdd"
            >
                <Plus :size="14" :stroke-width="2" />
                <span>Tambah Karyawan</span>
            </Button>
        </div>

        <!-- Filter Bar -->
        <div class="card border border-surface-200 dark:border-surface-700 p-4 rounded-xl bg-surface-0 dark:bg-surface-900 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <IconField iconPosition="left" class="w-full sm:w-64">
                    <InputIcon class="!flex items-center justify-center">
                        <Search :size="14" :stroke-width="1.75" class="text-muted-color" />
                    </InputIcon>
                    <InputText v-model="searchQuery" placeholder="Cari Nama / NIK / Email..." class="w-full text-xs" size="small" />
                </IconField>
                <Select
                    v-model="departmentFilter"
                    :options="deptOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filter Divisi"
                    class="w-full sm:w-44 text-xs"
                    size="small"
                />
            </div>
            <div class="text-xs text-muted-color w-full sm:w-auto text-right">
                Total: <span class="font-bold text-surface-900 dark:text-surface-100">{{ filteredUsers.length }}</span> Karyawan
            </div>
        </div>

        <!-- DataTable -->
        <div class="card border border-surface-200 dark:border-surface-700 p-4 rounded-xl bg-surface-0 dark:bg-surface-900 shadow-sm">
            <DataTable
                :value="filteredUsers"
                paginator
                :rows="10"
                class="p-datatable-sm text-xs"
                responsiveLayout="scroll"
            >
                <Column field="namecode" header="NIK / ID" style="width: 12%">
                    <template #body="{ data }">
                        <span class="font-bold text-surface-900 dark:text-surface-100">{{ data.namecode }}</span>
                    </template>
                </Column>
                <Column header="Nama Lengkap" style="width: 25%">
                    <template #body="{ data }">
                        <div class="font-bold text-surface-900 dark:text-surface-100">{{ data.name }}</div>
                        <div class="text-[10px] text-muted-color">{{ data.email }}</div>
                    </template>
                </Column>
                <Column field="department" header="Divisi" style="width: 10%">
                    <template #body="{ data }">
                        <Tag :value="data.department" severity="info" class="text-[10px]" />
                    </template>
                </Column>
                <Column field="position" header="Jabatan" style="width: 20%"></Column>
                <Column field="role" header="Role Akses" style="width: 15%">
                    <template #body="{ data }">
                        <span class="font-semibold text-xs text-surface-700 dark:text-surface-300">{{ data.role }}</span>
                    </template>
                </Column>
                <Column header="Status" style="width: 8%">
                    <template #body="{ data }">
                        <Tag :value="data.isActive ? 'Aktif' : 'Nonaktif'" :severity="data.isActive ? 'success' : 'secondary'" class="text-[10px]" />
                    </template>
                </Column>
                <Column header="Aksi" style="width: 10%">
                    <template #body="{ data }">
                        <div class="flex items-center gap-1">
                            <button
                                type="button"
                                class="p-1.5 text-surface-500 hover:text-primary hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors cursor-pointer"
                                @click="openEdit(data)"
                                title="Edit"
                            >
                                <Pencil :size="15" :stroke-width="1.75" />
                            </button>
                            <button
                                type="button"
                                :class="[
                                    'p-1.5 rounded-lg transition-colors cursor-pointer',
                                    data.isActive
                                        ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20'
                                        : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                                ]"
                                @click="toggleStatus(data)"
                                :title="data.isActive ? 'Nonaktifkan' : 'Aktifkan'"
                            >
                                <Ban v-if="data.isActive" :size="15" :stroke-width="1.75" />
                                <Check v-else :size="15" :stroke-width="2" />
                            </button>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Add / Edit Dialog -->
        <Dialog
            v-model:visible="dialogVisible"
            modal
            :header="isEditing ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'"
            :breakpoints="{ '960px': '75vw', '640px': '92vw' }"
            :style="{ width: '480px' }"
        >
            <div class="space-y-4 pt-2 text-xs">
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-medium mb-1">NIK / ID Pegawai *</label>
                        <InputText v-model="currentEmployee.namecode" class="w-full text-xs" placeholder="Misal: SIT012" />
                    </div>
                    <div>
                        <label class="block font-medium mb-1">Divisi *</label>
                        <Select v-model="currentEmployee.department" :options="['SIT', 'SIS']" class="w-full text-xs" />
                    </div>
                </div>
                <div>
                    <label class="block font-medium mb-1">Nama Lengkap *</label>
                    <InputText v-model="currentEmployee.name" class="w-full text-xs" placeholder="Nama Karyawan" />
                </div>
                <div>
                    <label class="block font-medium mb-1">Email Perusahaan *</label>
                    <InputText v-model="currentEmployee.email" class="w-full text-xs" placeholder="nama@inalum.co.id" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-medium mb-1">Jabatan *</label>
                        <InputText v-model="currentEmployee.position" class="w-full text-xs" placeholder="Staff IT / Analis" />
                    </div>
                    <div>
                        <label class="block font-medium mb-1">Role Hak Akses *</label>
                        <Select v-model="currentEmployee.role" :options="roleOptions" optionLabel="label" optionValue="value" class="w-full text-xs" />
                    </div>
                </div>
                <div>
                    <label class="block font-medium mb-1">Password Akun <span class="text-muted-color font-normal">(Default: password123)</span></label>
                    <InputText v-model="currentEmployee.password" type="password" class="w-full text-xs" placeholder="password123" />
                </div>
            </div>
            <template #footer>
                <div class="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 w-full pt-2">
                    <Button label="Batal" severity="secondary" size="small" text @click="dialogVisible = false" />
                    <Button label="Simpan Data" severity="success" size="small" class="font-bold" @click="saveEmployee" />
                </div>
            </template>
        </Dialog>
    </div>
</template>
