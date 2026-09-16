<script setup>
import { ref } from 'vue';
import {
    sicutiState,
    saveToLocalStorage
} from '@/service/sicutiService';
import { useToast } from 'primevue/usetoast';
import { Plus, Pencil, Ban, Check } from 'lucide-vue-next';

const toast = useToast();
const dialogVisible = ref(false);
const isEditing = ref(false);

const currentFlow = ref({
    id: '',
    level: 1,
    name: '',
    assignedRole: 'staff_it',
    isMandatory: true,
    isActive: true
});

const roleOptions = [
    { label: 'Staff IT (Atasan Langsung)', value: 'staff_it' },
    { label: 'Kepala Seksi SIT', value: 'kepala_it' },
    { label: 'Kepala Departemen SIT', value: 'kepala_dept' }
];

function openAdd() {
    isEditing.value = false;
    currentFlow.value = {
        id: 'AF' + String(sicutiState.approvalFlows.length + 1).padStart(3, '0'),
        level: sicutiState.approvalFlows.length + 1,
        name: '',
        assignedRole: 'staff_it',
        isMandatory: true,
        isActive: true
    };
    dialogVisible.value = true;
}

function openEdit(item) {
    isEditing.value = true;
    currentFlow.value = { ...item };
    dialogVisible.value = true;
}

function saveFlow() {
    const f = currentFlow.value;
    if (!f.name) {
        toast.add({ severity: 'error', summary: 'Validasi', detail: 'Nama level alur approval wajib diisi', life: 3000 });
        return;
    }

    if (isEditing.value) {
        const idx = sicutiState.approvalFlows.findIndex((x) => x.id === f.id);
        if (idx !== -1) {
            sicutiState.approvalFlows[idx] = { ...f };
            toast.add({ severity: 'success', summary: 'Diperbarui', detail: 'Alur approval berhasil diperbarui', life: 3000 });
        }
    } else {
        sicutiState.approvalFlows.push({ ...f });
        toast.add({ severity: 'success', summary: 'Ditambahkan', detail: 'Tingkat approval baru berhasil ditambahkan', life: 3000 });
    }
    sicutiState.approvalFlows.sort((a, b) => a.level - b.level);
    saveToLocalStorage();
    dialogVisible.value = false;
}

function toggleStatus(item) {
    item.isActive = !item.isActive;
    saveToLocalStorage();
    toast.add({
        severity: 'info',
        summary: 'Status Alur',
        detail: `Status level ${item.level} diubah menjadi ${item.isActive ? 'Aktif' : 'Nonaktif'}`,
        life: 3000
    });
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100">Konfigurasi Alur Approval (Workflow)</h2>
                <p class="text-xs text-muted-color">Struktur hierarki validasi bertingkat pengajuan cuti pegawai PT Inalum</p>
            </div>
            <Button
                severity="success"
                size="small"
                class="text-xs font-bold flex items-center gap-1.5"
                @click="openAdd"
            >
                <Plus :size="14" :stroke-width="2" />
                <span>Tambah Tingkat Approval</span>
            </Button>
        </div>

        <!-- DataTable -->
        <div class="card border border-surface-200 dark:border-surface-700 p-4 rounded-xl bg-surface-0 dark:bg-surface-900 shadow-sm">
            <DataTable :value="sicutiState.approvalFlows" class="p-datatable-sm text-xs" responsiveLayout="scroll">
                <Column field="level" header="Urutan Level" style="width: 12%">
                    <template #body="{ data }">
                        <span class="w-6 h-6 rounded-full bg-sky-100 dark:bg-sky-950/60 text-sky-700 font-black inline-flex items-center justify-center">
                            {{ data.level }}
                        </span>
                    </template>
                </Column>
                <Column field="name" header="Nama Tingkat / Jabatan" style="width: 30%">
                    <template #body="{ data }">
                        <span class="font-bold text-surface-900 dark:text-surface-100">{{ data.name }}</span>
                    </template>
                </Column>
                <Column field="assignedRole" header="Role Approver" style="width: 20%">
                    <template #body="{ data }">
                        <Tag :value="data.assignedRole" severity="info" class="text-[10px]" />
                    </template>
                </Column>
                <Column header="Sifat Persetujuan" style="width: 18%">
                    <template #body="{ data }">
                        <Tag
                            :value="data.isMandatory ? 'Wajib (Mandatory)' : 'Opsional (Optional)'"
                            :severity="data.isMandatory ? 'warn' : 'secondary'"
                            class="text-[10px]"
                        />
                    </template>
                </Column>
                <Column header="Status" style="width: 10%">
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
            :header="isEditing ? 'Edit Alur Approval' : 'Tambah Tingkat Approval'"
            :breakpoints="{ '960px': '75vw', '640px': '92vw' }"
            :style="{ width: '420px' }"
        >
            <div class="space-y-4 pt-2 text-xs">
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-medium mb-1">Tingkat Level *</label>
                        <InputNumber v-model="currentFlow.level" class="w-full text-xs" :min="1" :max="5" />
                    </div>
                    <div>
                        <label class="block font-medium mb-1">Status</label>
                        <Select v-model="currentFlow.isActive" :options="[{ label: 'Aktif', value: true }, { label: 'Nonaktif', value: false }]" optionLabel="label" optionValue="value" class="w-full text-xs" />
                    </div>
                </div>
                <div>
                    <label class="block font-medium mb-1">Nama Tingkat Approval *</label>
                    <InputText v-model="currentFlow.name" class="w-full text-xs" placeholder="Misal: Kepala Seksi SIT" />
                </div>
                <div>
                    <label class="block font-medium mb-1">Role Yang Menangani</label>
                    <Select v-model="currentFlow.assignedRole" :options="roleOptions" optionLabel="label" optionValue="value" class="w-full text-xs" />
                </div>
                <div class="flex items-center gap-2 pt-2 border-t border-surface-200 dark:border-surface-700">
                    <Checkbox v-model="currentFlow.isMandatory" :binary="true" inputId="isMandatory" />
                    <label for="isMandatory" class="cursor-pointer font-medium">Tingkat ini Wajib Dipenuhi (Mandatory)</label>
                </div>
            </div>
            <template #footer>
                <div class="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 w-full pt-2">
                    <Button label="Batal" severity="secondary" size="small" text @click="dialogVisible = false" />
                    <Button label="Simpan Alur" severity="success" size="small" class="font-bold" @click="saveFlow" />
                </div>
            </template>
        </Dialog>
    </div>
</template>
