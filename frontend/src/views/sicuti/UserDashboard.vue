<script setup>
import { computed, ref } from 'vue';
import {
    currentUser,
    getUserBalance,
    sicutiState,
    getLeaveType,
    getStatusSeverity,
    getStatusLabel,
    formatDate,
    hasPermission
} from '@/service/sicutiService';
import LeaveDetailDialog from './LeaveDetailDialog.vue';
import {
    Wallet,
    CheckCircle2,
    History,
    Plus,
    ArrowRight,
    FolderOpen,
    Eye,
    ChevronLeft,
    ChevronRight
} from 'lucide-vue-next';

const selectedRequest = ref(null);
const detailVisible = ref(false);

const role = computed(() => currentUser.value?.role);
const canSubmit = computed(() => hasPermission(role.value, 'pengajuan_cuti', 'submit'));
const canViewHistory = computed(() => hasPermission(role.value, 'dokumen_saldo', 'view_history'));
const canViewBalance = computed(() => hasPermission(role.value, 'dokumen_saldo', 'view_balance'));

const userBalance = computed(() => {
    return getUserBalance(currentUser.value?.id);
});

const myRecentRequests = computed(() => {
    return sicutiState.leaveRequests
        .filter((r) => r.userId === currentUser.value?.id)
        .slice(0, 6);
});

// Mini Calendar State (Default September 2026)
const calYear = ref(2026);
const calMonth = ref(8); // 8 is September (0-indexed)

const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const calMonthName = computed(() => {
    return `${monthNames[calMonth.value]} ${calYear.value}`;
});

function changeCalMonth(dir) {
    let m = calMonth.value + dir;
    let y = calYear.value;
    if (m > 11) {
        m = 0;
        y++;
    } else if (m < 0) {
        m = 11;
        y--;
    }
    calMonth.value = m;
    calYear.value = y;
}

const holidayMap = computed(() => {
    const map = new Map();
    sicutiState.holidays.forEach((h) => {
        if (!h.date) return;
        map.set(h.date, h.name || 'Hari Libur');
    });
    return map;
});

const calendarDays = computed(() => {
    const firstDay = new Date(calYear.value, calMonth.value, 1).getDay();
    const daysInMonth = new Date(calYear.value, calMonth.value + 1, 0).getDate();
    const today = new Date();

    const cells = [];
    for (let i = 0; i < firstDay; i++) {
        cells.push({ day: null, isBlank: true });
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const mm = String(calMonth.value + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        const dateStr = `${calYear.value}-${mm}-${dd}`;
        const holidayName = holidayMap.value.get(dateStr);
        const isToday =
            today.getDate() === d &&
            today.getMonth() === calMonth.value &&
            today.getFullYear() === calYear.value;

        cells.push({
            day: d,
            isBlank: false,
            dateStr,
            isToday,
            isHoliday: Boolean(holidayName),
            holidayName: holidayName || null
        });
    }

    return cells;
});

function viewDetail(request) {
    selectedRequest.value = request;
    detailVisible.value = true;
}
</script>

<template>
    <div class="space-y-6">
        <!-- 3 Inalum Brand Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div class="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xs flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Wallet :size="22" :stroke-width="1.75" />
                </div>
                <div>
                    <span class="text-xs text-muted-color font-medium">Saldo Cuti Tersisa</span>
                    <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-0.5">
                        {{ userBalance.remaining }} <span class="text-xs font-normal text-muted-color">hari kerja</span>
                    </div>
                    <span class="text-xs text-muted-color">dari kuota tahunan {{ userBalance.annualQuota }} hari</span>
                </div>
            </div>

            <div class="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xs flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 :size="22" :stroke-width="1.75" />
                </div>
                <div>
                    <span class="text-xs text-muted-color font-medium">Cuti Telah Digunakan</span>
                    <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-0.5">
                        {{ userBalance.usedDays }} <span class="text-xs font-normal text-muted-color">hari</span>
                    </div>
                    <span class="text-xs text-muted-color">tahun berjalan 2026</span>
                </div>
            </div>

            <div class="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xs flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
                    <History :size="22" :stroke-width="1.75" />
                </div>
                <div>
                    <span class="text-xs text-muted-color font-medium">Carry Over (Sisa 2025)</span>
                    <div class="text-2xl font-bold text-surface-900 dark:text-surface-0 mt-0.5">
                        {{ userBalance.carryOverDays }} <span class="text-xs font-normal text-muted-color">hari</span>
                    </div>
                    <span class="text-xs text-muted-color">
                        {{ userBalance.carryOverExpiryDate ? `exp: ${formatDate(userBalance.carryOverExpiryDate)}` : 'tidak ada carry over' }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Quick Action Buttons -->
        <div class="flex flex-wrap items-center gap-3">
            <Button
                v-if="canSubmit"
                class="font-semibold shadow-xs flex items-center gap-2"
                @click="$router.push('/leave/new')"
            >
                <Plus :size="16" :stroke-width="2" />
                <span>Ajukan Cuti Baru</span>
            </Button>
            <Button
                v-if="canViewHistory"
                severity="secondary"
                outlined
                class="font-semibold flex items-center gap-2"
                @click="$router.push('/leave/history')"
            >
                <History :size="16" :stroke-width="1.75" />
                <span>Riwayat Cuti Saya</span>
            </Button>
            <Button
                v-if="canViewBalance"
                severity="secondary"
                outlined
                class="font-semibold flex items-center gap-2"
                @click="$router.push('/leave/balance')"
            >
                <Wallet :size="16" :stroke-width="1.75" />
                <span>Informasi Saldo</span>
            </Button>
        </div>

        <!-- 2-Column Content Grid: Table + Mini Calendar -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Left: Pengajuan Cuti Terakhir (8 cols) -->
            <div class="lg:col-span-8">
                <div class="card mb-0 p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xs">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-surface-100 dark:border-surface-800">
                        <div>
                            <h3 class="font-bold text-base text-surface-900 dark:text-surface-0 leading-tight">Pengajuan Cuti Terakhir</h3>
                            <p class="text-xs text-muted-color mt-0.5">Daftar berkas cuti terakhir yang Anda ajukan</p>
                        </div>
                        <button
                            v-if="canViewHistory"
                            type="button"
                            class="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                            @click="$router.push('/leave/history')"
                        >
                            <span>Lihat Semua</span>
                            <ArrowRight :size="13" :stroke-width="2" />
                        </button>
                    </div>

                    <DataTable :value="myRecentRequests" class="p-datatable-sm" responsiveLayout="scroll">
                        <template #empty>
                            <div class="text-center py-8 text-muted-color text-xs">
                                <FolderOpen :size="28" :stroke-width="1.5" class="text-surface-400 mb-2 block mx-auto" />
                                Belum ada pengajuan cuti yang diajukan.
                            </div>
                        </template>
                        <Column field="id" header="ID">
                            <template #body="{ data }">
                                <span class="font-bold text-xs text-primary">{{ data.id }}</span>
                            </template>
                        </Column>
                        <Column header="Tanggal Diajukan">
                            <template #body="{ data }">
                                <span class="text-xs text-muted-color">{{ formatDate(data.createdAt) }}</span>
                            </template>
                        </Column>
                        <Column header="Jenis Cuti">
                            <template #body="{ data }">
                                <span class="text-xs font-semibold text-surface-800 dark:text-surface-200">{{ getLeaveType(data.leaveTypeId)?.name || '-' }}</span>
                            </template>
                        </Column>
                        <Column header="Periode Cuti">
                            <template #body="{ data }">
                                <span class="text-xs">{{ formatDate(data.startDate) }} s/d {{ formatDate(data.endDate) }}</span>
                            </template>
                        </Column>
                        <Column header="Durasi">
                            <template #body="{ data }">
                                <span class="text-xs font-bold text-surface-800 dark:text-surface-200">{{ data.totalDays }} hari</span>
                            </template>
                        </Column>
                        <Column header="Status">
                            <template #body="{ data }">
                                <Tag :value="getStatusLabel(data.status)" :severity="getStatusSeverity(data.status)" class="text-[11px]" />
                            </template>
                        </Column>
                        <Column header="Aksi" style="width: 4rem; text-align: center">
                            <template #body="{ data }">
                                <button
                                    type="button"
                                    class="p-1.5 text-surface-500 hover:text-primary hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors cursor-pointer"
                                    @click="viewDetail(data)"
                                    title="Lihat Detail"
                                >
                                    <Eye :size="15" :stroke-width="1.75" />
                                </button>
                            </template>
                        </Column>
                    </DataTable>
                </div>
            </div>

            <!-- Right: Mini Calendar (4 cols) -->
            <div class="lg:col-span-4">
                <!-- Mini Calendar -->
                <div class="p-4 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-xs">
                    <!-- Calendar Header -->
                    <div class="flex items-center justify-between mb-3 pb-2 border-b border-surface-100 dark:border-surface-800">
                        <span class="font-bold text-sm text-surface-900 dark:text-surface-0">{{ calMonthName }}</span>
                        <div class="flex items-center gap-1">
                            <button
                                type="button"
                                class="p-1 rounded-md text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer"
                                @click="changeCalMonth(-1)"
                                title="Bulan Sebelumnya"
                            >
                                <ChevronLeft :size="16" :stroke-width="2" />
                            </button>
                            <button
                                type="button"
                                class="p-1 rounded-md text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer"
                                @click="changeCalMonth(1)"
                                title="Bulan Berikutnya"
                            >
                                <ChevronRight :size="16" :stroke-width="2" />
                            </button>
                        </div>
                    </div>

                    <!-- Day of week headers -->
                    <div class="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-color mb-1.5">
                        <span>Min</span><span>Sen</span><span>Sel</span><span>Rab</span><span>Kam</span><span>Jum</span><span>Sab</span>
                    </div>

                    <!-- Day grid cells -->
                    <div class="grid grid-cols-7 gap-1 text-center text-xs">
                        <div
                            v-for="(cell, idx) in calendarDays"
                            :key="idx"
                            class="h-8 flex items-center justify-center rounded-md transition-colors text-[11px]"
                            :class="[
                                cell.isBlank ? 'invisible' : '',
                                cell.isToday ? 'bg-primary text-white font-bold shadow-xs' : '',
                                cell.isHoliday && !cell.isToday ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-bold border border-red-200 dark:border-red-900/50' : '',
                                !cell.isToday && !cell.isHoliday && !cell.isBlank ? 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-700 dark:text-surface-200' : ''
                            ]"
                            :title="cell.holidayName || (cell.isToday ? 'Hari Ini' : '')"
                        >
                            {{ cell.day }}
                        </div>
                    </div>

                    <div class="mt-3 pt-2.5 border-t border-surface-100 dark:border-surface-800 flex items-center justify-between text-[10px] text-muted-color">
                        <div class="flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-primary inline-block"></span>
                            <span>Hari Ini</span>
                        </div>
                        <div class="flex items-center gap-1.5">
                            <span class="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                            <span>Hari Libur Resmi</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <LeaveDetailDialog v-model:visible="detailVisible" :request="selectedRequest" />
    </div>
</template>
