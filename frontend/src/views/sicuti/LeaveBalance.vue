<script setup>
import { computed } from 'vue';
import {
    currentUser,
    getUserBalance,
    sicutiState,
    getLeaveType,
    getStatusSeverity,
    getStatusLabel,
    formatDate
} from '@/service/sicutiService';
import { Plus, ShieldCheck } from 'lucide-vue-next';

const userBalance = computed(() => {
    return getUserBalance(currentUser.value?.id);
});

const policy = computed(() => {
    return sicutiState.leavePolicy;
});

const approvedLeaveHistory = computed(() => {
    return sicutiState.leaveRequests.filter(
        (r) => r.userId === currentUser.value?.id && r.status === 'approved'
    );
});
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100">Informasi Saldo Cuti Karyawan</h2>
                <p class="text-xs text-muted-color">Rincian hak kuota cuti tahunan, carry over, dan mutasi cuti Anda</p>
            </div>
            <router-link to="/leave/new">
                <Button severity="success" size="small" class="text-xs font-bold flex items-center gap-1.5">
                    <Plus :size="14" :stroke-width="2" />
                    <span>Ajukan Cuti</span>
                </Button>
            </router-link>
        </div>

        <!-- 4 Summary Balance Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-sm">
                <span class="text-muted-color block text-xs font-medium mb-1">Hak Kuota Tahunan</span>
                <div class="text-2xl font-black text-surface-900 dark:text-surface-100">
                    {{ userBalance.annualQuota }} <span class="text-xs font-normal text-muted-color">Hari</span>
                </div>
                <span class="text-[11px] text-muted-color">Tahun Berjalan 2026</span>
            </div>

            <div class="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-sm">
                <span class="text-muted-color block text-xs font-medium mb-1">Carry Over (Sisa Lalu)</span>
                <div class="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {{ userBalance.carryOverDays }} <span class="text-xs font-normal text-muted-color">Hari</span>
                </div>
                <span class="text-[11px] text-muted-color">
                    {{ userBalance.carryOverExpiryDate ? `Berlaku s/d ${formatDate(userBalance.carryOverExpiryDate)}` : 'Tidak ada carry over' }}
                </span>
            </div>

            <div class="p-5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 shadow-sm">
                <span class="text-muted-color block text-xs font-medium mb-1">Cuti Telah Digunakan</span>
                <div class="text-2xl font-black text-sky-600 dark:text-sky-400">
                    {{ userBalance.usedDays }} <span class="text-xs font-normal text-muted-color">Hari</span>
                </div>
                <span class="text-[11px] text-muted-color">Dari pengajuan disetujui</span>
            </div>

            <div class="p-5 rounded-xl border border-primary/30 dark:border-primary/40 bg-primary/5 dark:bg-primary/10 shadow-sm">
                <span class="text-primary block text-xs font-bold mb-1">Sisa Saldo Cuti</span>
                <div class="text-2xl font-black text-primary">
                    {{ userBalance.remaining }} <span class="text-xs font-normal text-muted-color">Hari Kerja</span>
                </div>
                <span class="text-[11px] text-muted-color">Dapat diajukan tahun ini</span>
            </div>
        </div>

        <!-- Perhitungan & Kebijakan -->
        <div class="grid grid-cols-12 gap-6">
            <!-- Riwayat Pengurangan Kuota -->
            <div class="col-span-12 lg:col-span-8 card border border-surface-200 dark:border-surface-700 p-5 rounded-xl bg-surface-0 dark:bg-surface-900">
                <h3 class="font-bold text-sm text-surface-900 dark:text-surface-100 mb-1">Riwayat Penggunaan Cuti (Mutasi)</h3>
                <p class="text-xs text-muted-color mb-4">Daftar cuti yang telah disetujui dan memotong saldo tahun berjalan</p>

                <DataTable :value="approvedLeaveHistory" class="p-datatable-sm text-xs" responsiveLayout="scroll">
                    <template #empty>
                        <div class="text-center py-6 text-muted-color">Belum ada cuti disetujui yang memotong saldo.</div>
                    </template>
                    <Column field="id" header="No. Pengajuan" style="width: 15%">
                        <template #body="{ data }">
                            <span class="font-bold text-primary">{{ data.id }}</span>
                        </template>
                    </Column>
                    <Column header="Jenis Cuti" style="width: 25%">
                        <template #body="{ data }">
                            {{ getLeaveType(data.leaveTypeId)?.name }}
                        </template>
                    </Column>
                    <Column header="Periode" style="width: 30%">
                        <template #body="{ data }">
                            {{ formatDate(data.startDate) }} s/d {{ formatDate(data.endDate) }}
                        </template>
                    </Column>
                    <Column header="Pengurangan" style="width: 15%">
                        <template #body="{ data }">
                            <span class="font-bold text-red-600">-{{ data.totalDays }} Hari</span>
                        </template>
                    </Column>
                    <Column header="Status" style="width: 15%">
                        <template #body="{ data }">
                            <Tag value="Disetujui" severity="success" class="text-[10px]" />
                        </template>
                    </Column>
                </DataTable>
            </div>

            <!-- Kebijakan & Ketentuan -->
            <div class="col-span-12 lg:col-span-4 card border border-surface-200 dark:border-surface-700 p-5 rounded-xl bg-surface-0 dark:bg-surface-900 space-y-4">
                <div class="flex items-center gap-2 text-surface-900 dark:text-surface-100 font-bold text-sm">
                    <ShieldCheck :size="16" :stroke-width="1.75" class="text-primary" />
                    <span>Kebijakan Cuti Inalum</span>
                </div>

                <div class="space-y-3 text-xs">
                    <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <span class="font-bold block text-surface-900 dark:text-surface-100">Formula Perhitungan:</span>
                        <p class="text-muted-color text-[11px] mt-1 font-mono">
                            Saldo Tersisa = Kuota Tahunan + Carry Over - Cuti Digunakan
                        </p>
                    </div>

                    <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <span class="font-bold block text-surface-900 dark:text-surface-100">Masa Berlaku Carry Over:</span>
                        <p class="text-muted-color text-[11px] mt-1">
                            Maksimum carry over <b>{{ policy.maxCarryOver }} hari</b> dan memiliki masa kadaluarsa <b>{{ policy.carryOverExpiryMonths }} bulan</b> (berakhir 30 Juni 2026).
                        </p>
                    </div>

                    <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
                        <span class="font-bold block text-surface-900 dark:text-surface-100">Cuti Khusus:</span>
                        <p class="text-muted-color text-[11px] mt-1">
                            Cuti Sakit, Menikah, Melahirkan, dan Ibadah tidak mengurangi saldo cuti tahunan dengan melampirkan berkas bukti.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
