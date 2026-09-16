<script setup>
import { ref, computed } from 'vue';
import {
    sicutiState,
    getUser,
    saveToLocalStorage
} from '@/service/sicutiService';
import { useToast } from 'primevue/usetoast';
import { Search, Pencil } from 'lucide-vue-next';

const toast = useToast();
const searchQuery = ref('');
const departmentFilter = ref(null);
const editDialogVisible = ref(false);
const editingBalance = ref(null);

const deptOptions = [
    { label: 'Semua Divisi', value: null },
    { label: 'Divisi SIT', value: 'SIT' },
    { label: 'Divisi SIS', value: 'SIS' }
];

const balancesWithUsers = computed(() => {
    return sicutiState.leaveBalances.map((b) => {
        const user = getUser(b.userId);
        const remaining = (b.annualQuota || 12) + (b.carryOverDays || 0) - (b.usedDays || 0);
        return {
            ...b,
            user,
            remaining: Math.max(0, remaining)
        };
    }).filter((item) => {
        if (!item.user) return false;
        if (departmentFilter.value && item.user.department !== departmentFilter.value) {
            return false;
        }
        if (searchQuery.value) {
            const q = searchQuery.value.toLowerCase();
            const name = item.user.name?.toLowerCase() || '';
            const code = item.user.namecode?.toLowerCase() || '';
            if (!name.includes(q) && !code.includes(q)) return false;
        }
        return true;
    });
});

function openEdit(item) {
    editingBalance.value = {
        id: item.id,
        userId: item.userId,
        userName: item.user?.name,
        annualQuota: item.annualQuota,
        carryOverDays: item.carryOverDays,
        usedDays: item.usedDays,
        carryOverExpiryDate: item.carryOverExpiryDate || '2026-06-30'
    };
    editDialogVisible.value = true;
}

function saveBalance() {
    const idx = sicutiState.leaveBalances.findIndex((b) => b.id === editingBalance.value.id);
    if (idx !== -1) {
        sicutiState.leaveBalances[idx].annualQuota = Number(editingBalance.value.annualQuota);
        sicutiState.leaveBalances[idx].carryOverDays = Number(editingBalance.value.carryOverDays);
        sicutiState.leaveBalances[idx].usedDays = Number(editingBalance.value.usedDays);
        sicutiState.leaveBalances[idx].carryOverExpiryDate = editingBalance.value.carryOverExpiryDate;
        saveToLocalStorage();
        toast.add({ severity: 'success', summary: 'Tersimpan', detail: 'Saldo cuti karyawan berhasil diperbarui', life: 3000 });
    }
    editDialogVisible.value = false;
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100">Kelola Saldo Cuti Karyawan</h2>
                <p class="text-xs text-muted-color">Manajemen kuota tahunan, carry over, dan penyesuaian hak cuti karyawan</p>
            </div>
        </div>

        <!-- Filter Bar -->
        <div class="card border border-surface-200 dark:border-surface-700 p-4 rounded-xl bg-surface-0 dark:bg-surface-900 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <IconField iconPosition="left" class="w-full sm:w-64">
                    <InputIcon class="!flex items-center justify-center">
                        <Search :size="14" :stroke-width="1.75" class="text-muted-color" />
                    </InputIcon>
                    <InputText v-model="searchQuery" placeholder="Cari Karyawan / NIK..." class="w-full text-xs" size="small" />
                </IconField>
                <Select
                    v-model="departmentFilter"
                    :options="deptOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filter Divisi"
                    class="w-full sm:w-48 text-xs"
                    size="small"
                />
            </div>
            <div class="text-xs text-muted-color w-full sm:w-auto text-right">
                Total Data: <span class="font-bold text-surface-900 dark:text-surface-100">{{ balancesWithUsers.length }}</span> Karyawan
            </div>
        </div>

        <!-- DataTable -->
        <div class="card border border-surface-200 dark:border-surface-700 p-4 rounded-xl bg-surface-0 dark:bg-surface-900 shadow-sm">
            <DataTable
                :value="balancesWithUsers"
                paginator
                :rows="10"
                class="p-datatable-sm text-xs"
                responsiveLayout="scroll"
            >
                <template #empty>
                    <div class="text-center py-8 text-muted-color">Tidak ada data saldo karyawan.</div>
                </template>
                <Column header="Karyawan" style="width: 25%">
                    <template #body="{ data }">
                        <div class="font-bold text-surface-900 dark:text-surface-100">{{ data.user?.name }}</div>
                        <div class="text-[10px] text-muted-color">{{ data.user?.namecode }} &bull; {{ data.user?.department }} ({{ data.user?.position }})</div>
                    </template>
                </Column>
                <Column field="annualQuota" header="Kuota Tahunan" style="width: 15%">
                    <template #body="{ data }">
                        <span class="font-semibold">{{ data.annualQuota }} Hari</span>
                    </template>
                </Column>
                <Column field="carryOverDays" header="Carry Over" style="width: 15%">
                    <template #body="{ data }">
                        <span class="font-semibold text-amber-600">{{ data.carryOverDays }} Hari</span>
                    </template>
                </Column>
                <Column field="usedDays" header="Digunakan" style="width: 15%">
                    <template #body="{ data }">
                        <span class="font-semibold text-surface-700 dark:text-surface-300">{{ data.usedDays }} Hari</span>
                    </template>
                </Column>
                <Column header="Sisa Saldo" style="width: 15%">
                    <template #body="{ data }">
                        <span class="font-bold text-primary text-sm">{{ data.remaining }} Hari</span>
                    </template>
                </Column>
                <Column header="Aksi" style="width: 15%">
                    <template #body="{ data }">
                        <button
                            type="button"
                            class="p-1.5 text-surface-500 hover:text-primary hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors cursor-pointer"
                            @click="openEdit(data)"
                            title="Edit Saldo"
                        >
                            <Pencil :size="15" :stroke-width="1.75" />
                        </button>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Edit Modal Dialog -->
        <Dialog
            v-model:visible="editDialogVisible"
            modal
            :header="`Penyesuaian Saldo Cuti - ${editingBalance?.userName || ''}`"
            :breakpoints="{ '960px': '75vw', '640px': '92vw' }"
            :style="{ width: '420px' }"
        >
            <div v-if="editingBalance" class="space-y-4 pt-2 text-xs">
                <div>
                    <label class="block font-medium mb-1">Kuota Cuti Tahunan (Hari)</label>
                    <InputNumber v-model="editingBalance.annualQuota" class="w-full text-xs" :min="0" :max="30" />
                </div>
                <div>
                    <label class="block font-medium mb-1">Carry Over Dari Tahun Lalu (Hari)</label>
                    <InputNumber v-model="editingBalance.carryOverDays" class="w-full text-xs" :min="0" :max="12" />
                </div>
                <div>
                    <label class="block font-medium mb-1">Cuti Sudah Digunakan (Hari)</label>
                    <InputNumber v-model="editingBalance.usedDays" class="w-full text-xs" :min="0" :max="30" />
                </div>
                <div>
                    <label class="block font-medium mb-1">Batas Waktu Carry Over</label>
                    <InputText v-model="editingBalance.carryOverExpiryDate" class="w-full text-xs" placeholder="YYYY-MM-DD" />
                </div>
            </div>
            <template #footer>
                <div class="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 w-full pt-2">
                    <Button label="Batal" severity="secondary" size="small" text @click="editDialogVisible = false" />
                    <Button label="Simpan Perubahan" severity="success" size="small" class="font-bold" @click="saveBalance" />
                </div>
            </template>
        </Dialog>
    </div>
</template>
