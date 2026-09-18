<script setup>
import { ref, computed } from 'vue';
import {
    sicutiState,
    getUser,
    getLeaveType,
    getStatusSeverity,
    getStatusLabel,
    formatDate,
    deleteLeaveRequest
} from '@/service/sicutiService';
import LeaveDetailDialog from './LeaveDetailDialog.vue';
import { useToast } from 'primevue/usetoast';
import { FileSpreadsheet, Search, Eye, Trash2 } from 'lucide-vue-next';

const toast = useToast();
const selectedRequest = ref(null);
const detailVisible = ref(false);
const searchQuery = ref('');
const statusFilter = ref(null);
const departmentFilter = ref(null);

const statusOptions = [
    { label: 'Semua Status', value: null },
    { label: 'Draft', value: 'draft' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Pending Validation', value: 'pending_validation' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Returned', value: 'returned' },
    { label: 'Cancelled', value: 'cancelled' }
];

const deptOptions = [
    { label: 'Semua Divisi', value: null },
    { label: 'Divisi SIT', value: 'SIT' },
    { label: 'Divisi SIS', value: 'SIS' }
];

const filteredRequests = computed(() => {
    return sicutiState.leaveRequests.filter((r) => {
        const user = getUser(r.userId);
        if (departmentFilter.value && user?.department !== departmentFilter.value) {
            return false;
        }
        if (statusFilter.value && r.status !== statusFilter.value) {
            return false;
        }
        if (searchQuery.value) {
            const q = searchQuery.value.toLowerCase();
            const name = user?.name?.toLowerCase() || '';
            const id = r.id?.toLowerCase() || '';
            const type = getLeaveType(r.leaveTypeId)?.name?.toLowerCase() || '';
            if (!name.includes(q) && !id.includes(q) && !type.includes(q)) {
                return false;
            }
        }
        return true;
    });
});

function viewDetail(req) {
    selectedRequest.value = req;
    detailVisible.value = true;
}

function removeRequest(req) {
    deleteLeaveRequest(req.id);
    toast.add({ severity: 'warn', summary: 'Dihapus', detail: `Pengajuan ${req.id} telah dihapus oleh Admin`, life: 3000 });
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100">Monitoring Pengajuan Cuti (All Division)</h2>
                <p class="text-xs text-muted-color">Pantau seluruh status dan alur pengajuan cuti pegawai divisi SIT dan SIS</p>
            </div>
            <Button
                severity="success"
                size="small"
                class="text-xs font-bold flex items-center gap-1.5"
                @click="$router.push('/admin/reports')"
            >
                <FileSpreadsheet :size="14" :stroke-width="1.75" />
                <span>Export Laporan CSV</span>
            </Button>
        </div>

        <!-- Filter Bar -->
        <div class="card border border-surface-200 dark:border-surface-700 p-4 rounded-xl bg-surface-0 dark:bg-surface-900 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <IconField iconPosition="left" class="w-full sm:w-64">
                    <InputIcon class="!flex items-center justify-center">
                        <Search :size="14" :stroke-width="1.75" class="text-muted-color" />
                    </InputIcon>
                    <InputText v-model="searchQuery" placeholder="Cari Karyawan / ID..." class="w-full text-xs" size="small" />
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
                <Select
                    v-model="statusFilter"
                    :options="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filter Status"
                    class="w-full sm:w-44 text-xs"
                    size="small"
                />
            </div>
            <div class="text-xs text-muted-color w-full sm:w-auto text-right">
                Total: <span class="font-bold text-surface-900 dark:text-surface-100">{{ filteredRequests.length }}</span> Pengajuan
            </div>
        </div>

        <!-- DataTable -->
        <div class="card border border-surface-200 dark:border-surface-700 p-4 rounded-xl bg-surface-0 dark:bg-surface-900 shadow-sm">
            <DataTable
                :value="filteredRequests"
                paginator
                :rows="12"
                class="p-datatable-sm text-xs"
                responsiveLayout="scroll"
            >
                <template #empty>
                    <div class="text-center py-8 text-muted-color">
                        Tidak ada pengajuan permohonan yang sesuai filter.
                    </div>
                </template>
                <Column field="id" header="No. ID" style="width: 10%">
                    <template #body="{ data }">
                        <span class="font-bold text-primary">{{ data.id }}</span>
                    </template>
                </Column>
                <Column header="Karyawan Pengaju" style="width: 22%">
                    <template #body="{ data }">
                        <div class="font-bold text-surface-900 dark:text-surface-100">{{ getUser(data.userId)?.name }}</div>
                        <div class="text-[10px] text-muted-color">
                            {{ getUser(data.userId)?.namecode }} &bull; <Tag :value="getUser(data.userId)?.department" severity="info" class="text-[9px] px-1 py-0" /> ({{ getUser(data.userId)?.position }})
                        </div>
                    </template>
                </Column>
                <Column header="Jenis Cuti" style="width: 16%">
                    <template #body="{ data }">
                        <div class="font-semibold">{{ getLeaveType(data.leaveTypeId)?.name || '-' }}</div>
                    </template>
                </Column>
                <Column header="Periode & Durasi" style="width: 22%">
                    <template #body="{ data }">
                        <div>{{ formatDate(data.startDate) }} - {{ formatDate(data.endDate) }}</div>
                        <div class="font-bold text-surface-700 dark:text-surface-300 text-[11px]">{{ data.totalDays }} Hari Kerja</div>
                    </template>
                </Column>
                <Column header="Status" style="width: 15%">
                    <template #body="{ data }">
                        <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" class="text-[10px]" />
                    </template>
                </Column>
                <Column header="Aksi" style="width: 15%">
                    <template #body="{ data }">
                        <div class="flex items-center gap-1">
                            <button
                                type="button"
                                class="p-1.5 text-surface-500 hover:text-primary hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors cursor-pointer"
                                @click="viewDetail(data)"
                                title="Review Detail"
                            >
                                <Eye :size="15" :stroke-width="1.75" />
                            </button>
                            <button
                                type="button"
                                class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                                @click="removeRequest(data)"
                                title="Hapus (Admin)"
                            >
                                <Trash2 :size="15" :stroke-width="1.75" />
                            </button>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Detail Dialog Reusable -->
        <LeaveDetailDialog
            v-model:visible="detailVisible"
            :request="selectedRequest"
        />
    </div>
</template>
