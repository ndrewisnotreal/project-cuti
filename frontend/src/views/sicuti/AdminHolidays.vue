<script setup>
import { ref } from 'vue';
import {
    sicutiState,
    saveToLocalStorage,
    formatDate
} from '@/service/sicutiService';
import { useToast } from 'primevue/usetoast';
import { Plus, Pencil, Trash2 } from 'lucide-vue-next';

const toast = useToast();
const dialogVisible = ref(false);
const isEditing = ref(false);

const currentHoliday = ref({
    id: '',
    date: '',
    name: '',
    year: 2026,
    type: 'national'
});

function openAdd() {
    isEditing.value = false;
    currentHoliday.value = {
        id: 'H' + String(sicutiState.holidays.length + 1).padStart(3, '0'),
        date: '2026-',
        name: '',
        year: 2026,
        type: 'national'
    };
    dialogVisible.value = true;
}

function openEdit(item) {
    isEditing.value = true;
    currentHoliday.value = { ...item };
    dialogVisible.value = true;
}

function saveHoliday() {
    const h = currentHoliday.value;
    if (!h.date || !h.name) {
        toast.add({ severity: 'error', summary: 'Validasi', detail: 'Tanggal dan Nama hari libur wajib diisi', life: 3000 });
        return;
    }

    if (isEditing.value) {
        const idx = sicutiState.holidays.findIndex((x) => x.id === h.id);
        if (idx !== -1) {
            sicutiState.holidays[idx] = { ...h };
            toast.add({ severity: 'success', summary: 'Diperbarui', detail: 'Hari libur berhasil diperbarui', life: 3000 });
        }
    } else {
        sicutiState.holidays.push({ ...h });
        toast.add({ severity: 'success', summary: 'Ditambahkan', detail: 'Hari libur baru berhasil ditambahkan', life: 3000 });
    }
    // Sort by date ascending
    sicutiState.holidays.sort((a, b) => (a.date > b.date ? 1 : -1));
    saveToLocalStorage();
    dialogVisible.value = false;
}

function deleteHoliday(item) {
    const idx = sicutiState.holidays.findIndex((x) => x.id === item.id);
    if (idx !== -1) {
        sicutiState.holidays.splice(idx, 1);
        saveToLocalStorage();
        toast.add({ severity: 'info', summary: 'Dihapus', detail: `Hari libur ${item.name} telah dihapus`, life: 3000 });
    }
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100">Master Hari Libur & Cuti Bersama 2026</h2>
                <p class="text-xs text-muted-color">Tanggal libur resmi yang dikecualikan dari pemotongan kuota cuti tahunan</p>
            </div>
            <Button
                severity="success"
                size="small"
                class="text-xs font-bold flex items-center gap-1.5"
                @click="openAdd"
            >
                <Plus :size="14" :stroke-width="2" />
                <span>Tambah Hari Libur</span>
            </Button>
        </div>

        <!-- DataTable -->
        <div class="card border border-surface-200 dark:border-surface-700 p-4 rounded-xl bg-surface-0 dark:bg-surface-900 shadow-sm">
            <DataTable :value="sicutiState.holidays" paginator :rows="12" class="p-datatable-sm text-xs" responsiveLayout="scroll">
                <Column field="date" header="Tanggal Libur" style="width: 20%">
                    <template #body="{ data }">
                        <span class="font-bold text-surface-900 dark:text-surface-100 block">{{ formatDate(data.date) }}</span>
                        <span class="text-[10px] text-muted-color">{{ data.date }}</span>
                    </template>
                </Column>
                <Column field="name" header="Nama Hari Libur / Keterangan" style="width: 40%">
                    <template #body="{ data }">
                        <span class="font-semibold text-surface-800 dark:text-surface-200">{{ data.name }}</span>
                    </template>
                </Column>
                <Column field="type" header="Kategori" style="width: 25%">
                    <template #body="{ data }">
                        <Tag
                            :value="data.type === 'national' ? 'Libur Nasional' : 'Cuti Bersama'"
                            :severity="data.type === 'national' ? 'danger' : 'warn'"
                            class="text-[10px]"
                        />
                    </template>
                </Column>
                <Column header="Aksi" style="width: 15%">
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
                                class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                                @click="deleteHoliday(data)"
                                title="Hapus"
                            >
                                <Trash2 :size="15" :stroke-width="1.75" />
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
            :header="isEditing ? 'Edit Hari Libur' : 'Tambah Hari Libur Baru'"
            :breakpoints="{ '960px': '75vw', '640px': '92vw' }"
            :style="{ width: '420px' }"
        >
            <div class="space-y-4 pt-2 text-xs">
                <div>
                    <label class="block font-medium mb-1">Tanggal Libur (YYYY-MM-DD) *</label>
                    <InputText v-model="currentHoliday.date" class="w-full text-xs" placeholder="2026-01-01" />
                </div>
                <div>
                    <label class="block font-medium mb-1">Nama Hari Libur *</label>
                    <InputText v-model="currentHoliday.name" class="w-full text-xs" placeholder="Misal: Tahun Baru Masehi" />
                </div>
                <div>
                    <label class="block font-medium mb-1">Kategori Libur</label>
                    <Select
                        v-model="currentHoliday.type"
                        :options="[{ label: 'Libur Nasional', value: 'national' }, { label: 'Cuti Bersama', value: 'collective' }]"
                        optionLabel="label"
                        optionValue="value"
                        class="w-full text-xs"
                    />
                </div>
            </div>
            <template #footer>
                <div class="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 w-full pt-2">
                    <Button label="Batal" severity="secondary" size="small" text @click="dialogVisible = false" />
                    <Button label="Simpan" severity="success" size="small" class="font-bold" @click="saveHoliday" />
                </div>
            </template>
        </Dialog>
    </div>
</template>
