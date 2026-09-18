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
    hasPermission
} from '@/service/sicutiService';
import LeaveDetailDialog from './LeaveDetailDialog.vue';
import { Users, Clock, CheckCircle2, Calendar, FileText, Settings, BarChart3, ArrowRight, Eye } from 'lucide-vue-next';

const selectedRequest = ref(null);
const detailVisible = ref(false);

const adminDivision = computed(() => {
    const u = currentUser.value;
    if (u?.adminDivision) return u.adminDivision;
    return u?.role === 'admin_sis' ? 'SIS' : u?.role === 'admin_sit' ? 'SIT' : null;
});

const divisionUsers = computed(() => {
    const div = adminDivision.value;
    return div ? sicutiState.users.filter((u) => u.department === div) : sicutiState.users;
});

const divisionRequests = computed(() => {
    const divUserIds = new Set(divisionUsers.value.map((u) => u.id));
    return sicutiState.leaveRequests.filter((r) => divUserIds.has(r.userId));
});

const totalKaryawan = computed(() => {
    return divisionUsers.value.filter((u) => u.role === 'user').length;
});

const pendingCount = computed(() => {
    return divisionRequests.value.filter((r) =>
        ['submitted', 'pending_validation'].includes(r.status)
    ).length;
});

const approvedCount = computed(() => {
    return divisionRequests.value.filter((r) => r.status === 'approved').length;
});

const holidaysThisYear = computed(() => {
    return sicutiState.holidays.filter((h) => h.year === 2026).length;
});

const recentRequests = computed(() => {
    return [...divisionRequests.value]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
});

function viewDetail(request) {
    selectedRequest.value = request;
    detailVisible.value = true;
}

// Chart: Pengajuan per Bulan
const monthLabels = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const monthlyChartData = computed(() => {
    const counts = monthLabels.map((_, month) => {
        return divisionRequests.value.filter((r) => new Date(r.createdAt).getMonth() === month).length;
    });

    return {
        labels: monthLabels,
        datasets: [
            {
                label: 'Pengajuan',
                backgroundColor: '#0077b8',
                borderRadius: 4,
                data: counts
            }
        ]
    };
});

const monthlyChartOptions = {
    maintainAspectRatio: false,
    aspectRatio: 1.6,
    plugins: {
        legend: { display: false }
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
        },
        y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 11 }, precision: 0 }
        }
    }
};

// Permissions
const role = computed(() => currentUser.value?.role);
const canManageEmployees = computed(() => hasPermission(role.value, 'master_data', 'manage_employees'));
const canManageLeaveTypes = computed(() => hasPermission(role.value, 'master_data', 'manage_leave_types'));
const canManagePolicy = computed(() => hasPermission(role.value, 'master_data', 'manage_policy'));
const canManageHolidays = computed(() => hasPermission(role.value, 'master_data', 'manage_holidays'));
const canViewReports = computed(() => hasPermission(role.value, 'dashboard_laporan', 'view_reports'));
const canViewProcessed = computed(() => hasPermission(role.value, 'master_data', 'view_processed'));
</script>

<template>
    <div class="space-y-6">
        <!-- 4 Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <!-- Total Karyawan -->
            <div class="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xs flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                    <Users :size="22" :stroke-width="1.75" />
                </div>
                <div>
                    <span class="text-xs text-muted-color font-medium">Total Karyawan</span>
                    <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-0.5">
                        {{ totalKaryawan }}
                    </div>
                    <span class="text-xs text-muted-color">{{ adminDivision || 'Semua divisi' }}</span>
                </div>
            </div>

            <!-- Pengajuan Pending -->
            <div class="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xs flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock :size="22" :stroke-width="1.75" />
                </div>
                <div>
                    <span class="text-xs text-muted-color font-medium">Pengajuan Pending</span>
                    <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-0.5">
                        {{ pendingCount }}
                    </div>
                    <span class="text-xs text-muted-color">menunggu proses</span>
                </div>
            </div>

            <!-- Cuti Selesai -->
            <div class="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xs flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 :size="22" :stroke-width="1.75" />
                </div>
                <div>
                    <span class="text-xs text-muted-color font-medium">Cuti Selesai</span>
                    <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-0.5">
                        {{ approvedCount }}
                    </div>
                    <span class="text-xs text-muted-color">total</span>
                </div>
            </div>

            <!-- Hari Libur -->
            <div class="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xs flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
                    <Calendar :size="22" :stroke-width="1.75" />
                </div>
                <div>
                    <span class="text-xs text-muted-color font-medium">Hari Libur</span>
                    <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-0.5">
                        {{ holidaysThisYear }}
                    </div>
                    <span class="text-xs text-muted-color">tahun 2026</span>
                </div>
            </div>
        </div>

        <!-- 2 Columns: Pengajuan per Bulan + Akses Cepat -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <!-- Left: Pengajuan per Bulan -->
            <div class="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xs flex flex-col">
                <h3 class="font-bold text-base text-surface-900 dark:text-surface-0 mb-4 pb-2 border-b border-surface-100 dark:border-surface-800">
                    Pengajuan per Bulan
                </h3>
                <div class="h-64 w-full">
                    <Chart type="bar" :data="monthlyChartData" :options="monthlyChartOptions" class="h-full w-full" />
                </div>
            </div>

            <!-- Right: Akses Cepat -->
            <div class="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xs flex flex-col">
                <h3 class="font-bold text-base text-surface-900 dark:text-surface-0 mb-4 pb-2 border-b border-surface-100 dark:border-surface-800">
                    Akses Cepat
                </h3>
                <div class="flex flex-col gap-2.5">
                    <Button
                        v-if="canManageEmployees"
                        severity="secondary"
                        outlined
                        class="w-full justify-start text-xs font-semibold py-2.5 flex items-center gap-2"
                        @click="$router.push('/admin/employees')"
                    >
                        <Users :size="15" :stroke-width="1.75" />
                        <span>Kelola Data Karyawan</span>
                    </Button>
                    <Button
                        v-if="canManageLeaveTypes"
                        severity="secondary"
                        outlined
                        class="w-full justify-start text-xs font-semibold py-2.5 flex items-center gap-2"
                        @click="$router.push('/admin/leave-types')"
                    >
                        <FileText :size="15" :stroke-width="1.75" />
                        <span>Kelola Jenis Cuti</span>
                    </Button>
                    <Button
                        v-if="canManagePolicy"
                        severity="secondary"
                        outlined
                        class="w-full justify-start text-xs font-semibold py-2.5 flex items-center gap-2"
                        @click="$router.push('/admin/approval-flow')"
                    >
                        <Settings :size="15" :stroke-width="1.75" />
                        <span>Kebijakan Cuti</span>
                    </Button>
                    <Button
                        v-if="canManageHolidays"
                        severity="secondary"
                        outlined
                        class="w-full justify-start text-xs font-semibold py-2.5 flex items-center gap-2"
                        @click="$router.push('/admin/holidays')"
                    >
                        <Calendar :size="15" :stroke-width="1.75" />
                        <span>Hari Libur</span>
                    </Button>
                    <Button
                        v-if="canViewReports"
                        severity="secondary"
                        outlined
                        class="w-full justify-start text-xs font-semibold py-2.5 flex items-center gap-2"
                        @click="$router.push('/admin/reports')"
                    >
                        <BarChart3 :size="15" :stroke-width="1.75" />
                        <span>Laporan & Export</span>
                    </Button>
                </div>
            </div>
        </div>

        <!-- Pengajuan Terbaru -->
        <div class="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xs">
            <div class="flex items-center justify-between mb-4 pb-2 border-b border-surface-100 dark:border-surface-800">
                <h3 class="font-bold text-base text-surface-900 dark:text-surface-0">Pengajuan Terbaru</h3>
                <Button
                    v-if="canViewProcessed"
                    severity="secondary"
                    outlined
                    size="small"
                    class="text-xs flex items-center gap-1.5"
                    @click="$router.push('/admin/monitoring')"
                >
                    <span>Lihat Semua</span>
                    <ArrowRight :size="14" :stroke-width="1.75" />
                </Button>
            </div>
            <DataTable :value="recentRequests" class="p-datatable-sm text-xs" responsiveLayout="scroll">
                <Column header="No" style="width: 3.5rem">
                    <template #body="{ index }">
                        <span class="text-muted-color font-medium">{{ index + 1 }}</span>
                    </template>
                </Column>
                <Column header="Nama">
                    <template #body="{ data }">
                        <span class="font-bold text-surface-900 dark:text-surface-0">{{ getUser(data.userId)?.name || '-' }}</span>
                    </template>
                </Column>
                <Column header="Jenis Cuti">
                    <template #body="{ data }">
                        <span class="text-surface-700 dark:text-surface-200">{{ getLeaveType(data.leaveTypeId)?.name || '-' }}</span>
                    </template>
                </Column>
                <Column header="Periode">
                    <template #body="{ data }">
                        <span class="text-surface-700 dark:text-surface-200">{{ formatDate(data.startDate) }} - {{ formatDate(data.endDate) }}</span>
                    </template>
                </Column>
                <Column header="Hari" style="width: 5rem">
                    <template #body="{ data }">
                        <span class="font-semibold text-surface-900 dark:text-surface-0">{{ data.totalDays }}</span>
                    </template>
                </Column>
                <Column header="Status" style="width: 8rem">
                    <template #body="{ data }">
                        <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" class="text-[11px]" />
                    </template>
                </Column>
                <Column header="Aksi" style="width: 4rem; text-align: center">
                    <template #body="{ data }">
                        <button
                            type="button"
                            class="p-1.5 text-surface-500 hover:text-primary hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                            @click="viewDetail(data)"
                            title="Lihat Detail"
                        >
                            <Eye :size="15" :stroke-width="1.75" />
                        </button>
                    </template>
                </Column>
            </DataTable>
        </div>

        <LeaveDetailDialog v-model:visible="detailVisible" :request="selectedRequest" />
    </div>
</template>
