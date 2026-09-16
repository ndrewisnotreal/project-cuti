<script setup>
import { ref, computed } from 'vue';
import {
    currentUser,
    sicutiState,
    getLeaveType,
    getStatusSeverity,
    getStatusLabel,
    formatDate,
    deleteLeaveRequest,
    updateLeaveRequest
} from '@/service/sicutiService';
import LeaveDetailDialog from './LeaveDetailDialog.vue';
import { useToast } from 'primevue/usetoast';
import { Plus, Search, Eye, Send, Trash2 } from 'lucide-vue-next';

const toast = useToast();
const selectedRequest = ref(null);
const detailVisible = ref(false);
const statusFilter = ref(null);
const searchQuery = ref('');

const statusOptions = [
    { label: 'Semua Status', value: null },
    { label: 'Draft', value: 'draft' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Menunggu Validasi', value: 'pending_validation' },
    { label: 'Disetujui', value: 'approved' },
    { label: 'Ditolak', value: 'rejected' },
    { label: 'Dikembalikan', value: 'returned' }
];

const filteredRequests = computed(() => {
    return sicutiState.leaveRequests.filter((r) => {
        if (r.userId !== currentUser.value?.id) return false;
        if (statusFilter.value && r.status !== statusFilter.value) return false;
        if (searchQuery.value) {
            const q = searchQuery.value.toLowerCase();
            const typeName = getLeaveType(r.leaveTypeId)?.name?.toLowerCase() || '';
            const reason = r.reason?.toLowerCase() || '';
            const id = r.id?.toLowerCase() || '';
            if (!id.includes(q) && !typeName.includes(q) && !reason.includes(q)) {
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

function submitDraft(req) {
    updateLeaveRequest(req.id, { status: 'submitted' });
    toast.add({ severity: 'success', summary: 'Terkirim', detail: `Draft ${req.id} berhasil diajukan`, life: 3000 });
}

function cancelRequest(req) {
    if (!confirm(`Batalkan pengajuan ${req.id}? Tindakan ini tidak bisa dibatalkan.`)) return;
    const firstApproved = req.approvalRecords?.some((a) => a.action === 'approve');
    if (firstApproved) {
        toast.add({ severity: 'warn', summary: 'Tidak Bisa Dibatalkan', detail: 'Pengajuan sudah disetujui level pertama', life: 4000 });
        return;
    }
    deleteLeaveRequest(req.id);
    toast.add({ severity: 'info', summary: 'Dibatalkan', detail: `Pengajuan ${req.id} berhasil dibatalkan`, life: 3000 });
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100">Riwayat Cuti Saya</h2>
                <p class="text-xs text-muted-color">Seluruh riwayat permohonan cuti yang pernah Anda ajukan</p>
            </div>
            <Button
                severity="success"
                size="small"
                class="text-xs font-bold flex items-center gap-1.5"
                @click="$router.push('/leave/new')"
            >
                <Plus :size="15" :stroke-width="2" />
                <span>Ajukan Cuti Baru</span>
            </Button>
        </div>

        <!-- Filter Bar -->
        <div class="card border border-surface-200 dark:border-surface-700 p-4 rounded-xl bg-surface-0 dark:bg-surface-900 flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <IconField iconPosition="left" class="w-full sm:w-64">
                    <InputIcon class="!flex items-center justify-center">
                        <Search :size="14" :stroke-width="1.75" class="text-muted-color" />
                    </InputIcon>
                    <InputText v-model="searchQuery" placeholder="Cari No. / Alasan..." class="w-full text-xs" size="small" />
                </IconField>
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
            <div class="text-xs text-muted-color w-full sm:w-auto text-right font-medium">
                Total: <span class="font-bold text-surface-900 dark:text-surface-100">{{ filteredRequests.length }}</span> Pengajuan
            </div>
        </div>

        <!-- DataTable -->
        <div class="card border border-surface-200 dark:border-surface-700 p-4 rounded-xl bg-surface-0 dark:bg-surface-900 shadow-sm">
            <DataTable
                :value="filteredRequests"
                paginator
                :rows="10"
                class="p-datatable-sm text-xs"
                responsiveLayout="scroll"
            >
                <template #empty>
                    <div class="text-center py-8 text-muted-color">
                        Tidak ada riwayat pengajuan cuti yang sesuai filter.
                    </div>
                </template>
                <Column field="id" header="No. Pengajuan" style="width: 14%">
                    <template #body="{ data }">
                        <span class="font-bold text-primary">{{ data.id }}</span>
                        <div class="text-[10px] text-muted-color">{{ formatDate(data.createdAt) }}</div>
                    </template>
                </Column>
                <Column header="Jenis Cuti" style="width: 18%">
                    <template #body="{ data }">
                        <span class="font-semibold">{{ getLeaveType(data.leaveTypeId)?.name || '-' }}</span>
                    </template>
                </Column>
                <Column header="Periode" style="width: 22%">
                    <template #body="{ data }">
                        <div>{{ formatDate(data.startDate) }} s/d {{ formatDate(data.endDate) }}</div>
                        <div class="text-[11px] font-bold text-primary">({{ data.totalDays }} Hari Kerja)</div>
                    </template>
                </Column>
                <Column field="reason" header="Alasan" style="width: 20%">
                    <template #body="{ data }">
                        <span class="truncate block max-w-xs" :title="data.reason">{{ data.reason }}</span>
                    </template>
                </Column>
                <Column header="Status" style="width: 14%">
                    <template #body="{ data }">
                        <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" class="text-[10px]" />
                    </template>
                </Column>
                <Column header="Aksi" style="width: 12%">
                    <template #body="{ data }">
                        <div class="flex items-center gap-1">
                            <button
                                type="button"
                                class="p-1.5 text-surface-500 hover:text-primary hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors cursor-pointer"
                                @click="viewDetail(data)"
                                title="Lihat Detail"
                            >
                                <Eye :size="15" :stroke-width="1.75" />
                            </button>
                            <button
                                v-if="data.status === 'draft' || data.status === 'returned'"
                                type="button"
                                class="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors cursor-pointer"
                                @click="submitDraft(data)"
                                title="Kirim Pengajuan"
                            >
                                <Send :size="15" :stroke-width="1.75" />
                            </button>
                            <button
                                v-if="data.status === 'draft'"
                                type="button"
                                class="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                                @click="cancelRequest(data)"
                                title="Hapus Draft"
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
