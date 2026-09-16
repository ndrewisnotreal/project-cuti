<script setup>
import { computed, ref } from 'vue';
import {
    currentUser,
    sicutiState,
    getUser,
    getLeaveType,
    getStatusSeverity,
    getStatusLabel,
    formatDate,
    approveLeaveRequest,
    getUserApprovalLevel,
    canUserApprove
} from '@/service/sicutiService';
import LeaveDetailDialog from './LeaveDetailDialog.vue';
import { useToast } from 'primevue/usetoast';
import {
    History,
    CheckSquare,
    Clock,
    CheckCircle2,
    Workflow,
    Inbox,
    ExternalLink,
    Eye,
    Check
} from 'lucide-vue-next';

const toast = useToast();
const selectedRequest = ref(null);
const detailVisible = ref(false);

const pendingRequests = computed(() => {
    return sicutiState.leaveRequests.filter(
        (r) => (r.status === 'submitted' || r.status === 'pending_validation') && canUserApprove(r, currentUser.value)
    );
});

const approvedByMeCount = computed(() => {
    const userId = currentUser.value?.id;
    return sicutiState.leaveRequests.filter((r) =>
        r.approvalRecords?.some((a) => a.approverId === userId && a.action === 'approve')
    ).length;
});

const allProcessedCount = computed(() => {
    return sicutiState.leaveRequests.filter(
        (r) => ['approved', 'rejected', 'returned'].includes(r.status)
    ).length;
});

const myApprovalLevel = computed(() => {
    return getUserApprovalLevel(currentUser.value?.id) || 1;
});

function viewDetail(request) {
    selectedRequest.value = request;
    detailVisible.value = true;
}

function quickApprove(request) {
    if (!canUserApprove(request, currentUser.value)) return;
    approveLeaveRequest(request.id, 'Disetujui cepat via dashboard', currentUser.value?.name);
    toast.add({
        severity: 'success',
        summary: 'Disetujui',
        detail: `Pengajuan ${request.id} berhasil disetujui`,
        life: 3000
    });
}
</script>

<template>
    <div class="flex flex-col gap-6">
        <!-- Dashboard Header & Quick Actions -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100 leading-tight">Dashboard Persetujuan</h2>
                <p class="text-xs text-muted-color mt-0.5">Ringkasan status permohonan cuti dan antrean validasi bawahan</p>
            </div>
            <div class="flex items-center gap-2">
                <Button
                    severity="secondary"
                    outlined
                    size="small"
                    class="font-semibold text-xs flex items-center gap-1.5"
                    @click="$router.push('/approval/history')"
                >
                    <History :size="14" :stroke-width="1.75" />
                    <span>Riwayat Persetujuan</span>
                </Button>
                <Button
                    size="small"
                    class="font-semibold shadow-xs text-xs flex items-center gap-1.5"
                    @click="$router.push('/approval/pending')"
                >
                    <CheckSquare :size="14" :stroke-width="1.75" />
                    <span>Halaman Validasi</span>
                </Button>
            </div>
        </div>

        <!-- 3 Approver Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div class="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xs flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock :size="22" :stroke-width="1.75" />
                </div>
                <div>
                    <span class="text-xs text-muted-color font-medium">Menunggu Validasi</span>
                    <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-0.5">
                        {{ pendingRequests.length }} <span class="text-xs font-normal text-muted-color">pengajuan</span>
                    </div>
                    <span class="text-xs text-muted-color">Perlu verifikasi & persetujuan Anda</span>
                </div>
            </div>

            <div class="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xs flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <CheckCircle2 :size="22" :stroke-width="1.75" />
                </div>
                <div>
                    <span class="text-xs text-muted-color font-medium">Telah Anda Setujui</span>
                    <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-0.5">
                        {{ approvedByMeCount }} <span class="text-xs font-normal text-muted-color">pengajuan</span>
                    </div>
                    <span class="text-xs text-muted-color">Total berkas diverifikasi</span>
                </div>
            </div>

            <div class="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xs flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 flex items-center justify-center shrink-0">
                    <History :size="22" :stroke-width="1.75" />
                </div>
                <div>
                    <span class="text-xs text-muted-color font-medium">Total Selesai Diproses</span>
                    <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-0.5">
                        {{ allProcessedCount }} <span class="text-xs font-normal text-muted-color">pengajuan</span>
                    </div>
                    <span class="text-xs text-muted-color">Status approved, rejected, returned</span>
                </div>
            </div>
        </div>

        <!-- Approval Workflow Hierarchy Visualizer (hidden per Proto-2) -->
        <div style="display:none">
        <div class="p-5 rounded-2xl border border-surface-200/80 dark:border-surface-700/80 bg-surface-0 dark:bg-surface-900 shadow-xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-surface-100 dark:border-surface-800">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        <Workflow :size="16" :stroke-width="1.75" />
                    </div>
                    <div>
                        <h3 class="font-bold text-sm text-surface-900 dark:text-surface-0 leading-tight">Alur Persetujuan Bertingkat (Workflow)</h3>
                        <p class="text-xs text-muted-color mt-0.5">Struktur kewenangan validasi berjenjang di divisi SIT</p>
                    </div>
                </div>
                <Tag :value="`Peran Anda: Level ${myApprovalLevel}`" severity="info" class="text-xs self-start sm:self-auto font-medium" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                <!-- Level 1 -->
                <div
                    :class="[
                        'p-4 rounded-xl border transition-all relative overflow-hidden',
                        myApprovalLevel === 1
                            ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xs ring-1 ring-primary/20'
                            : 'border-surface-200 dark:border-surface-700/70 bg-surface-50/60 dark:bg-surface-800/40'
                    ]"
                >
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-start gap-3">
                            <div
                                :class="[
                                    'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs',
                                    myApprovalLevel === 1 ? 'bg-primary text-white' : 'bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-200'
                                ]"
                            >
                                1
                            </div>
                            <div>
                                <div class="text-xs font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                                    <span>Level 1: Kepala Seksi SIT</span>
                                </div>
                                <div class="text-[11px] text-muted-color mt-0.5">Pejabat: Budi Santoso (Kasi SIT)</div>
                                <div class="text-[11px] text-primary font-medium mt-1">Verifikasi teknis operasional & ketersediaan pengganti</div>
                            </div>
                        </div>
                        <Tag v-if="myApprovalLevel === 1" value="Level Anda" severity="success" class="text-[10px] shrink-0" />
                    </div>
                </div>

                <!-- Level 2 -->
                <div
                    :class="[
                        'p-4 rounded-xl border transition-all relative overflow-hidden',
                        myApprovalLevel === 2
                            ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-xs ring-1 ring-primary/20'
                            : 'border-surface-200 dark:border-surface-700/70 bg-surface-50/60 dark:bg-surface-800/40'
                    ]"
                >
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-start gap-3">
                            <div
                                :class="[
                                    'w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs',
                                    myApprovalLevel === 2 ? 'bg-primary text-white' : 'bg-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200'
                                ]"
                            >
                                2
                            </div>
                            <div>
                                <div class="text-xs font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                                    <span>Level 2: Kepala Departemen SIT</span>
                                </div>
                                <div class="text-[11px] text-muted-color mt-0.5">Pejabat: Hendra Wijaya (Kadep SIT)</div>
                                <div class="text-[11px] text-primary font-medium mt-1">Otorisasi final & pemotongan kuota cuti resmi</div>
                            </div>
                        </div>
                        <Tag v-if="myApprovalLevel === 2" value="Level Anda" severity="success" class="text-[10px] shrink-0" />
                    </div>
                </div>
            </div>
        </div>

        </div><!-- end hidden workflow card -->

        <!-- Table Card: Daftar Pengajuan Menunggu Validasi -->
        <div class="p-6 rounded-2xl border border-surface-200/80 dark:border-surface-700/80 bg-surface-0 dark:bg-surface-900 shadow-xs">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-surface-100 dark:border-surface-800">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Inbox :size="18" :stroke-width="1.75" />
                    </div>
                    <div>
                        <div class="flex items-center gap-2.5">
                            <h3 class="font-bold text-base text-surface-900 dark:text-surface-0 leading-tight">Daftar Menunggu Validasi</h3>
                            <Badge :value="pendingRequests.length" severity="warn" class="text-xs font-bold" />
                        </div>
                        <p class="text-xs text-muted-color mt-0.5">Pengajuan yang perlu ditinjau dan divalidasi oleh pejabat approver</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <Button
                        size="small"
                        severity="secondary"
                        outlined
                        class="text-xs font-semibold flex items-center gap-1.5"
                        @click="$router.push('/approval/pending')"
                    >
                        <ExternalLink :size="14" :stroke-width="1.75" />
                        <span>Halaman Validasi Penuh</span>
                    </Button>
                </div>
            </div>

            <DataTable :value="pendingRequests" class="p-datatable-sm" responsiveLayout="scroll">
                <template #empty>
                    <div class="text-center py-8 text-muted-color text-sm">
                        <CheckCircle2 :size="32" :stroke-width="1.5" class="text-primary mb-2 block mx-auto" />
                        Tidak ada antrean pengajuan cuti yang menunggu validasi saat ini.
                    </div>
                </template>

                <Column field="id" header="ID">
                    <template #body="{ data }">
                        <span class="font-bold text-xs text-primary">{{ data.id }}</span>
                    </template>
                </Column>

                <Column header="Karyawan">
                    <template #body="{ data }">
                        <div>
                            <span class="font-semibold text-xs block text-surface-900 dark:text-surface-100">{{ getUser(data.userId)?.name }}</span>
                            <span class="text-[11px] text-muted-color">{{ getUser(data.userId)?.namecode }} &bull; {{ getUser(data.userId)?.department }} ({{ getUser(data.userId)?.position }})</span>
                        </div>
                    </template>
                </Column>

                <Column header="Jenis Cuti">
                    <template #body="{ data }">
                        <span class="text-xs font-semibold text-surface-800 dark:text-surface-200">{{ getLeaveType(data.leaveTypeId)?.name || '-' }}</span>
                    </template>
                </Column>

                <Column header="Periode & Durasi">
                    <template #body="{ data }">
                        <div class="text-xs">
                            <span class="font-medium">{{ formatDate(data.startDate) }} s/d {{ formatDate(data.endDate) }}</span>
                            <span class="font-bold text-primary block mt-0.5">{{ data.totalDays }} hari kerja</span>
                        </div>
                    </template>
                </Column>

                <Column field="reason" header="Alasan">
                    <template #body="{ data }">
                        <span class="text-xs truncate max-w-xs block text-muted-color" :title="data.reason">{{ data.reason }}</span>
                    </template>
                </Column>

                <Column header="Tanggal Pengajuan">
                    <template #body="{ data }">
                        <span class="text-xs text-muted-color">{{ formatDate(data.createdAt) }}</span>
                    </template>
                </Column>

                <Column header="Status">
                    <template #body="{ data }">
                        <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" class="text-[11px]" />
                    </template>
                </Column>

                <Column header="Aksi" style="width: 7rem; text-align: center">
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

        <LeaveDetailDialog v-model:visible="detailVisible" :request="selectedRequest" />
    </div>
</template>
