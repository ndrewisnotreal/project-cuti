<script setup>
import { ref, computed } from 'vue';
import {
    currentUser,
    sicutiState,
    getUser,
    getLeaveType,
    getStatusSeverity,
    getStatusLabel,
    formatDate,
    approveLeaveRequest,
    canUserApprove
} from '@/service/sicutiService';
import LeaveDetailDialog from './LeaveDetailDialog.vue';
import { useToast } from 'primevue/usetoast';
import { Check, Search, CheckCircle2, Paperclip, Eye } from 'lucide-vue-next';

const toast = useToast();
const selectedRequest = ref(null);
const detailVisible = ref(false);
const searchQuery = ref('');
const departmentFilter = ref(null);
const selectedRequests = ref([]);

const deptOptions = [
    { label: 'Semua Divisi', value: null },
    { label: 'SIT (Sistem Informasi & Teknologi)', value: 'SIT' },
    { label: 'SIS (Sistem Informasi Smelting)', value: 'SIS' }
];

const pendingRequests = computed(() => {
    return sicutiState.leaveRequests.filter((r) => {
        const isPending = r.status === 'submitted' || r.status === 'pending_validation';
        if (!isPending) return false;

        if (!canUserApprove(r, currentUser.value)) return false;

        const user = getUser(r.userId);
        if (departmentFilter.value && user?.department !== departmentFilter.value) {
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

function bulkApprove() {
    if (!selectedRequests.value.length) return;
    const eligible = selectedRequests.value.filter((r) => canUserApprove(r, currentUser.value));
    if (!eligible.length) {
        toast.add({
            severity: 'warn',
            summary: 'Tidak Dapat Diproses',
            detail: 'Tidak ada pengajuan terpilih yang berada pada giliran persetujuan Anda',
            life: 3000
        });
        return;
    }
    eligible.forEach((r) => {
        approveLeaveRequest(r.id, 'Disetujui massal oleh atasan', currentUser.value?.name);
    });
    toast.add({
        severity: 'success',
        summary: 'Selesai',
        detail: `${eligible.length} permohonan berhasil disetujui sekaligus`,
        life: 4000
    });
    selectedRequests.value = [];
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100">Validasi Pengajuan Cuti</h2>
                <p class="text-xs text-muted-color">Daftar permohonan cuti yang menunggu validasi dan persetujuan Anda</p>
            </div>
            <div class="flex items-center gap-2">
                <Button
                    v-if="selectedRequests.length"
                    severity="success"
                    size="small"
                    class="text-xs font-bold flex items-center gap-1.5"
                    @click="bulkApprove"
                >
                    <Check :size="14" :stroke-width="2" />
                    <span>Setujui Terpilih ({{ selectedRequests.length }})</span>
                </Button>
            </div>
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
                    class="w-full sm:w-48 text-xs"
                    size="small"
                />
            </div>
            <div class="text-xs text-muted-color w-full sm:w-auto text-right">
                Menunggu: <span class="font-bold text-amber-600">{{ pendingRequests.length }}</span> Pengajuan
            </div>
        </div>

        <!-- DataTable -->
        <div class="card border border-surface-200 dark:border-surface-700 p-4 rounded-xl bg-surface-0 dark:bg-surface-900 shadow-sm">
            <DataTable
                v-model:selection="selectedRequests"
                :value="pendingRequests"
                paginator
                :rows="10"
                class="p-datatable-sm text-xs"
                responsiveLayout="scroll"
                dataKey="id"
            >
                <template #empty>
                    <div class="text-center py-10 text-muted-color">
                        <CheckCircle2 :size="36" :stroke-width="1.5" class="text-sky-500 mb-2 block mx-auto" />
                        Tidak ada pengajuan permohonan cuti yang perlu divalidasi saat ini.
                    </div>
                </template>
                <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
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
                        <div v-if="data.documents && data.documents.length" class="text-[10px] text-primary flex items-center gap-1 mt-0.5">
                            <Paperclip :size="11" :stroke-width="1.75" />
                            <span>Ada Dokumen</span>
                        </div>
                    </template>
                </Column>
                <Column header="Periode & Durasi" style="width: 22%">
                    <template #body="{ data }">
                        <div>{{ formatDate(data.startDate) }} - {{ formatDate(data.endDate) }}</div>
                        <div class="font-bold text-primary text-[11px]">{{ data.totalDays }} Hari Kerja</div>
                    </template>
                </Column>
                <Column header="Status" style="width: 12%">
                    <template #body="{ data }">
                        <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" class="text-[10px]" />
                    </template>
                </Column>
                <Column header="Aksi" style="width: 10%; text-align: center">
                    <template #body="{ data }">
                        <Button
                            size="small"
                            severity="primary"
                            outlined
                            class="text-xs font-semibold py-1 px-3 flex items-center gap-1.5 mx-auto"
                            @click="viewDetail(data)"
                        >
                            <Eye :size="14" :stroke-width="1.75" />
                            <span>Tinjau</span>
                        </Button>
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
