<script setup>
import { ref, computed } from 'vue';
import {
    sicutiState,
    getUser,
    getLeaveType,
    getStatusLabel,
    formatDate
} from '@/service/sicutiService';
import { useToast } from 'primevue/usetoast';
import { FileSpreadsheet } from 'lucide-vue-next';

const toast = useToast();
const activeTab = ref(0); // 0: Riwayat Cuti, 1: Saldo Cuti
const departmentFilter = ref(null);
const leaveTypeFilter = ref(null);
const statusFilter = ref(null);

const deptOptions = [
    { label: 'Semua Divisi', value: null },
    { label: 'Divisi SIT', value: 'SIT' },
    { label: 'Divisi SIS', value: 'SIS' }
];

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

const leaveTypeOptions = computed(() => {
    return [
        { label: 'Semua Jenis Cuti', value: null },
        ...sicutiState.leaveTypes.map((t) => ({ label: t.name, value: t.id }))
    ];
});

const reportLeaveData = computed(() => {
    return [...sicutiState.leaveRequests]
        .filter((r) => {
            const user = getUser(r.userId);
            if (departmentFilter.value && user?.department !== departmentFilter.value) return false;
            if (leaveTypeFilter.value && r.leaveTypeId !== leaveTypeFilter.value) return false;
            if (statusFilter.value && r.status !== statusFilter.value) return false;
            return true;
        })
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
});

const reportBalanceData = computed(() => {
    return sicutiState.leaveBalances.map((b) => {
        const user = getUser(b.userId);
        const remaining = (b.annualQuota || 12) + (b.carryOverDays || 0) - (b.usedDays || 0);
        return {
            ...b,
            user,
            remaining: Math.max(0, remaining)
        };
    }).filter((item) => {
        if (!item.user) return false;
        if (departmentFilter.value && item.user.department !== departmentFilter.value) return false;
        return true;
    });
});

function exportLeaveCSV() {
    let csv = 'No. Pengajuan,NIK,Nama Karyawan,Divisi,Jabatan,Jenis Cuti,Tanggal Mulai,Tanggal Selesai,Hari Kerja,Status,Alasan\n';
    reportLeaveData.value.forEach((r) => {
        const u = getUser(r.userId);
        const lt = getLeaveType(r.leaveTypeId);
        csv += `"${r.id}","${u?.namecode || ''}","${u?.name || ''}","${u?.department || ''}","${u?.position || ''}","${lt?.name || ''}","${r.startDate}","${r.endDate}","${r.totalDays}","${getStatusLabel(r.status)}","${(r.reason || '').replace(/"/g, '""')}"\n`;
    });

    downloadCSV(csv, 'Laporan_Riwayat_Cuti_Inalum_2026.csv');
    toast.add({ severity: 'success', summary: 'Export Berhasil', detail: 'File CSV Laporan Cuti berhasil diunduh', life: 3000 });
}

function exportBalanceCSV() {
    let csv = 'NIK,Nama Karyawan,Divisi,Jabatan,Kuota Tahunan,Carry Over,Digunakan,Sisa Saldo\n';
    reportBalanceData.value.forEach((b) => {
        csv += `"${b.user?.namecode || ''}","${b.user?.name || ''}","${b.user?.department || ''}","${b.user?.position || ''}","${b.annualQuota}","${b.carryOverDays}","${b.usedDays}","${b.remaining}"\n`;
    });

    downloadCSV(csv, 'Laporan_Saldo_Cuti_Inalum_2026.csv');
    toast.add({ severity: 'success', summary: 'Export Berhasil', detail: 'File CSV Saldo Cuti berhasil diunduh', life: 3000 });
}

function downloadCSV(csvContent, fileName) {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100">Laporan & Export Data Cuti</h2>
                <p class="text-xs text-muted-color">Rekapitulasi riwayat pengajuan cuti dan saldo hak cuti seluruh pegawai</p>
            </div>
            <div class="flex items-center gap-2">
                <Button
                    v-if="activeTab === 0"
                    severity="success"
                    size="small"
                    class="text-xs font-bold flex items-center gap-1.5"
                    @click="exportLeaveCSV"
                >
                    <FileSpreadsheet :size="14" :stroke-width="1.75" />
                    <span>Export CSV Riwayat Cuti</span>
                </Button>
                <Button
                    v-else
                    severity="success"
                    size="small"
                    class="text-xs font-bold flex items-center gap-1.5"
                    @click="exportBalanceCSV"
                >
                    <FileSpreadsheet :size="14" :stroke-width="1.75" />
                    <span>Export CSV Saldo Cuti</span>
                </Button>
            </div>
        </div>

        <!-- Filter & Tab Controls -->
        <div class="card border border-surface-200 dark:border-surface-700 p-4 rounded-xl bg-surface-0 dark:bg-surface-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl w-full sm:w-auto">
                <button
                    @click="activeTab = 0"
                    :class="[
                        'px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                        activeTab === 0 ? 'bg-white dark:bg-surface-900 text-primary shadow-xs' : 'text-muted-color hover:text-surface-900'
                    ]"
                >
                    Laporan Riwayat Cuti
                </button>
                <button
                    @click="activeTab = 1"
                    :class="[
                        'px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
                        activeTab === 1 ? 'bg-white dark:bg-surface-900 text-primary shadow-xs' : 'text-muted-color hover:text-surface-900'
                    ]"
                >
                    Laporan Saldo Cuti
                </button>
            </div>

            <div class="flex flex-wrap items-center gap-3 w-full sm:w-auto">
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
                    v-if="activeTab === 0"
                    v-model="leaveTypeFilter"
                    :options="leaveTypeOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filter Jenis Cuti"
                    class="w-full sm:w-48 text-xs"
                    size="small"
                />
                <Select
                    v-if="activeTab === 0"
                    v-model="statusFilter"
                    :options="statusOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Filter Status"
                    class="w-full sm:w-44 text-xs"
                    size="small"
                />
            </div>
        </div>

        <!-- Tab 0: Laporan Riwayat Cuti -->
        <div v-if="activeTab === 0" class="card border border-surface-200 dark:border-surface-700 p-4 rounded-xl bg-surface-0 dark:bg-surface-900 shadow-sm">
            <DataTable :value="reportLeaveData" paginator :rows="12" class="p-datatable-sm text-xs" responsiveLayout="scroll">
                <template #empty>
                    <div class="text-center py-8 text-muted-color">Tidak ada data riwayat cuti.</div>
                </template>
                <Column field="id" header="No. Dokumen" style="width: 12%">
                    <template #body="{ data }">
                        <span class="font-bold text-primary">{{ data.id }}</span>
                    </template>
                </Column>
                <Column header="Karyawan" style="width: 22%">
                    <template #body="{ data }">
                        <div class="font-bold text-surface-900 dark:text-surface-100">{{ getUser(data.userId)?.name }}</div>
                        <div class="text-[10px] text-muted-color">NIK: {{ getUser(data.userId)?.namecode }} &bull; {{ getUser(data.userId)?.department }}</div>
                    </template>
                </Column>
                <Column header="Jenis Cuti" style="width: 16%">
                    <template #body="{ data }">
                        <span class="font-semibold">{{ getLeaveType(data.leaveTypeId)?.name || '-' }}</span>
                    </template>
                </Column>
                <Column header="Periode" style="width: 20%">
                    <template #body="{ data }">
                        {{ formatDate(data.startDate) }} - {{ formatDate(data.endDate) }}
                    </template>
                </Column>
                <Column field="totalDays" header="Durasi" style="width: 10%">
                    <template #body="{ data }">
                        <span class="font-bold">{{ data.totalDays }} Hari</span>
                    </template>
                </Column>
                <Column header="Status" style="width: 20%">
                    <template #body="{ data }">
                        <span class="font-semibold text-xs">{{ getStatusLabel(data.status) }}</span>
                    </template>
                </Column>
            </DataTable>
        </div>

        <!-- Tab 1: Laporan Saldo Cuti -->
        <div v-else class="card border border-surface-200 dark:border-surface-700 p-4 rounded-xl bg-surface-0 dark:bg-surface-900 shadow-sm">
            <DataTable :value="reportBalanceData" paginator :rows="12" class="p-datatable-sm text-xs" responsiveLayout="scroll">
                <template #empty>
                    <div class="text-center py-8 text-muted-color">Tidak ada data saldo karyawan.</div>
                </template>
                <Column header="Karyawan" style="width: 28%">
                    <template #body="{ data }">
                        <div class="font-bold text-surface-900 dark:text-surface-100">{{ data.user?.name }}</div>
                        <div class="text-[10px] text-muted-color">NIK: {{ data.user?.namecode }} &bull; {{ data.user?.position }}</div>
                    </template>
                </Column>
                <Column field="user.department" header="Divisi" style="width: 12%">
                    <template #body="{ data }">
                        <Tag :value="data.user?.department" severity="info" class="text-[10px]" />
                    </template>
                </Column>
                <Column field="annualQuota" header="Hak Kuota" style="width: 15%">
                    <template #body="{ data }">
                        <span class="font-semibold">{{ data.annualQuota }} Hari</span>
                    </template>
                </Column>
                <Column field="carryOverDays" header="Carry Over" style="width: 15%">
                    <template #body="{ data }">
                        <span class="font-semibold text-amber-600">{{ data.carryOverDays }} Hari</span>
                    </template>
                </Column>
                <Column field="usedDays" header="Digunakan" style="width: 15%">
                    <template #body="{ data }">
                        <span class="font-semibold text-blue-600">{{ data.usedDays }} Hari</span>
                    </template>
                </Column>
                <Column header="Sisa Saldo" style="width: 15%">
                    <template #body="{ data }">
                        <span class="font-bold text-sky-600 text-sm">{{ data.remaining }} Hari</span>
                    </template>
                </Column>
            </DataTable>
        </div>
    </div>
</template>
