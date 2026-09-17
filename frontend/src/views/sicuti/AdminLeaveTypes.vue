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

const currentType = ref({
    id: '',
    code: '',
    name: '',
    description: '',
    usesQuota: true,
    requiresDocument: false,
    isActive: true
});

function openAdd() {
    isEditing.value = false;
    const existingNums = sicutiState.leaveTypes
        .map((t) => {
            const m = String(t.id || '').match(/\d+/);
            return m ? parseInt(m[0], 10) : 0;
        })
        .filter((n) => !isNaN(n));
    const nextNum = (existingNums.length ? Math.max(...existingNums) : 0) + 1;
    currentType.value = {
        id: 'LT' + String(nextNum).padStart(3, '0'),
        code: '',
        name: '',
        description: '',
        usesQuota: false,
        requiresDocument: false,
        isActive: true
    };
    dialogVisible.value = true;
}

function openEdit(item) {
    isEditing.value = true;
    currentType.value = { ...item };
    dialogVisible.value = true;
}

function saveLeaveType() {
    const t = currentType.value;
    if (!t.code || !t.name) {
        toast.add({ severity: 'error', summary: 'Validasi', detail: 'Kode dan Nama jenis cuti wajib diisi', life: 3000 });
        return;
    }

    if (isEditing.value) {
        const idx = sicutiState.leaveTypes.findIndex((x) => x.id === t.id);
        if (idx !== -1) {
            sicutiState.leaveTypes[idx] = { ...t };
            toast.add({ severity: 'success', summary: 'Diperbarui', detail: `Jenis cuti ${t.name} berhasil diperbarui`, life: 3000 });
        }
    } else {
        sicutiState.leaveTypes.push({ ...t });
        toast.add({ severity: 'success', summary: 'Ditambahkan', detail: `Jenis cuti baru ${t.name} berhasil ditambahkan`, life: 3000 });
    }
    saveToLocalStorage();
    dialogVisible.value = false;
}

function toggleStatus(item) {
    item.isActive = !item.isActive;
    saveToLocalStorage();
    toast.add({
        severity: 'info',
        summary: 'Status',
        detail: `Status jenis cuti ${item.name} diubah menjadi ${item.isActive ? 'Aktif' : 'Nonaktif'}`,
        life: 3000
    });
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100">Master Jenis Cuti</h2>
                <p class="text-xs text-muted-color">Konfigurasi jenis cuti, aturan pengurangan kuota tahunan, dan syarat dokumen</p>
            </div>
            <Button
                severity="success"
                size="small"
                class="text-xs font-bold flex items-center gap-1.5"
                @click="openAdd"
            >
                <Plus :size="14" :stroke-width="2" />
                <span>Tambah Jenis Cuti</span>
            </Button>
        </div>

        <!-- DataTable -->
        <div class="card border border-surface-200 dark:border-surface-700 p-4 rounded-xl bg-surface-0 dark:bg-surface-900 shadow-sm">
            <DataTable :value="sicutiState.leaveTypes" class="p-datatable-sm text-xs" responsiveLayout="scroll">
                <Column field="code" header="Kode" style="width: 10%">
                    <template #body="{ data }">
                        <span class="font-bold text-sky-600">{{ data.code }}</span>
                    </template>
                </Column>
                <Column field="name" header="Nama Jenis Cuti" style="width: 25%">
                    <template #body="{ data }">
                        <div class="font-bold text-surface-900 dark:text-surface-100">{{ data.name }}</div>
                        <div class="text-[10px] text-muted-color">{{ data.description }}</div>
                    </template>
                </Column>
                <Column header="Mengurangi Kuota" style="width: 18%">
                    <template #body="{ data }">
                        <Tag
                            :value="data.usesQuota ? 'Ya (Kurangi Kuota)' : 'Tidak (Cuti Khusus)'"
                            :severity="data.usesQuota ? 'warn' : 'info'"
                            class="text-[10px]"
                        />
                    </template>
                </Column>
                <Column header="Wajib Dokumen" style="width: 18%">
                    <template #body="{ data }">
                        <Tag
                            :value="data.requiresDocument ? 'Wajib Bukti' : 'Tidak Wajib'"
                            :severity="data.requiresDocument ? 'danger' : 'secondary'"
                            class="text-[10px]"
                        />
                    </template>
                </Column>
                <Column header="Status" style="width: 12%">
                    <template #body="{ data }">
                        <Tag :value="data.isActive ? 'Aktif' : 'Nonaktif'" :severity="data.isActive ? 'success' : 'secondary'" class="text-[10px]" />
                    </template>
                </Column>
                <Column header="Aksi" style="width: 17%">
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
            :header="isEditing ? 'Edit Jenis Cuti' : 'Tambah Jenis Cuti'"
            :breakpoints="{ '960px': '75vw', '640px': '92vw' }"
            :style="{ width: '420px' }"
        >
            <div class="space-y-4 pt-2 text-xs">
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block font-medium mb-1">Kode Unik *</label>
                        <InputText v-model="currentType.code" class="w-full text-xs" placeholder="Misal: CT" />
                    </div>
                    <div>
                        <label class="block font-medium mb-1">Status</label>
                        <Select v-model="currentType.isActive" :options="[{ label: 'Aktif', value: true }, { label: 'Nonaktif', value: false }]" optionLabel="label" optionValue="value" class="w-full text-xs" />
                    </div>
                </div>
                <div>
                    <label class="block font-medium mb-1">Nama Jenis Cuti *</label>
                    <InputText v-model="currentType.name" class="w-full text-xs" placeholder="Nama Jenis Cuti" />
                </div>
                <div>
                    <label class="block font-medium mb-1">Deskripsi / Keterangan</label>
                    <Textarea v-model="currentType.description" rows="2" class="w-full text-xs" placeholder="Keterangan aturan cuti..." />
                </div>
                <div class="space-y-2 pt-2 border-t border-surface-200 dark:border-surface-700">
                    <div class="flex items-center gap-2">
                        <Checkbox v-model="currentType.usesQuota" :binary="true" inputId="usesQuota" />
                        <label for="usesQuota" class="cursor-pointer font-medium">Mengurangi Saldo Cuti Tahunan Karyawan</label>
                    </div>
                    <div class="flex items-center gap-2">
                        <Checkbox v-model="currentType.requiresDocument" :binary="true" inputId="requiresDoc" />
                        <label for="requiresDoc" class="cursor-pointer font-medium">Wajib Unggah Dokumen Pendukung (Surat / Bukti)</label>
                    </div>
                </div>
            </div>
            <template #footer>
                <div class="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 w-full pt-2">
                    <Button label="Batal" severity="secondary" size="small" text @click="dialogVisible = false" />
                    <Button label="Simpan" severity="success" size="small" class="font-bold" @click="saveLeaveType" />
                </div>
            </template>
        </Dialog>
    </div>
</template>
