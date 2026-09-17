<script setup>
import { ref, computed } from 'vue';
import {
    currentUser,
    sicutiState,
    getUser,
    getLeaveType,
    getStatusSeverity,
    getStatusLabel,
    formatDate
} from '@/service/sicutiService';
import LeaveDetailDialog from './LeaveDetailDialog.vue';
import { Clock, Search, Eye } from 'lucide-vue-next';

const selectedRequest = ref(null);
const detailVisible = ref(false);
const searchQuery = ref('');
const statusFilter = ref(null);

const statusOptions = [
    { label: 'Semua Riwayat Persetujuan', value: null },
    { label: 'Menunggu Persetujuan Lanjutan', value: 'pending_validation' },
    { label: 'Disetujui Penuh (Approved)', value: 'approved' },
    { label: 'Ditolak (Rejected)', value: 'rejected' },
    { label: 'Dikembalikan (Returned)', value: 'returned' }
];

const processedRequests = computed(() => {
    return sicutiState.leaveRequests.filter((r) => {
        const userId = currentUser.value?.id;
        const myRecord = r.approvalRecords?.some((a) => a.approverId === userId);
        const isCompleted = ['approved', 'rejected', 'returned', 'completed'].includes(r.status);
        if (!myRecord && !isCompleted) return false;

        if (statusFilter.value && r.status !== statusFilter.value) {
            return false;
        }

        if (searchQuery.value) {
            const q = searchQuery.value.toLowerCase();
            const user = getUser(r.userId);
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
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100">Riwayat Persetujuan Cuti</h2>
                <p class="text-xs text-muted-color">Seluruh permohonan cuti yang telah selesai diproses oleh Approver</p>
            </div>
            <Button
                severity="warn"
                size="small"
                class="text-xs font-bold flex items-center gap-1.5"
                @click="$router.push('/approval/pending')"
            >
                <Clock :size="14" :stroke-width="2" />
                <span>Lihat Pengajuan Pending</span>
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
                    v-model="statusFilter"
                    :options="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filter Status"
                    class="w-full sm:w-52 text-xs"
                    size="small"
                />
            </div>
            <div class="text-xs text-muted-color w-full sm:w-auto text-right">
                Total Diproses: <span class="font-bold text-surface-900 dark:text-surface-100">{{ processedRequests.length }}</span> Pengajuan
            </div>
        </div>

        <!-- DataTable -->
        <div class="card border border-surface-200 dark:border-surface-700 p-4 rounded-xl bg-surface-0 dark:bg-surface-900 shadow-sm">
            <DataTable
                :value="processedRequests"
                paginator
                :rows="10"
                class="p-datatable-sm text-xs"
                responsiveLayout="scroll"
            >
                <template #empty>
                    <div class="text-center py-8 text-muted-color">
                        Tidak ada riwayat persetujuan cuti yang sesuai filter.
                    </div>
                </template>
                <Column field="id" header="No. Pengajuan" style="width: 12%">
                    <template #body="{ data }">
                        <span class="font-bold text-primary">{{ data.id }}</span>
                        <div class="text-[10px] text-muted-color">{{ formatDate(data.createdAt) }}</div>
                    </template>
                </Column>
                <Column header="Karyawan Pengaju" style="width: 22%">
                    <template #body="{ data }">
                        <div class="font-bold text-surface-900 dark:text-surface-100">{{ getUser(data.userId)?.name }}</div>
                        <div class="text-[10px] text-muted-color">
                            {{ getUser(data.userId)?.namecode }} &bull; Divisi {{ getUser(data.userId)?.department }} ({{ getUser(data.userId)?.position }})
                        </div>
                    </template>
                </Column>
                <Column header="Jenis Cuti" style="width: 18%">
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
                <Column header="Status" style="width: 14%">
                    <template #body="{ data }">
                        <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" class="text-[10px]" />
                    </template>
                </Column>
                <Column header="Aksi" style="width: 12%">
                    <template #body="{ data }">
                        <button
                            type="button"
                            class="p-1.5 text-surface-500 hover:text-primary hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors cursor-pointer"
                            @click="viewDetail(data)"
                            title="Lihat Detail & Dokumen"
                        >
                            <Eye :size="15" :stroke-width="1.75" />
                        </button>
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
