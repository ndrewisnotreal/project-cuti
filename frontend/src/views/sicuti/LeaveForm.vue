<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
    currentUser,
    getUserBalance,
    sicutiState,
    calculateWorkingDays,
    createLeaveRequest,
    updateLeaveRequest
} from '@/service/sicutiService';
import { useToast } from 'primevue/usetoast';
import { ArrowLeft, Calendar, UploadCloud, FileText, X, Save, Send, History } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const toast = useToast();

const editId = computed(() => route.params.id || route.query.id || null);
const isEditing = computed(() => Boolean(editId.value));
let isFormLoaded = false;

const form = ref({
    leaveTypeId: 'LT001',
    startDate: '',
    endDate: '',
    reason: '',
    substituteId: '',
    documentFile: null,
    documentName: ''
});

const isSubmitting = ref(false);

function loadDraftData() {
    if (!editId.value) return;
    const req = sicutiState.leaveRequests.find((r) => r.id === editId.value);
    if (!req) return;
    if (!['draft', 'returned'].includes(req.status)) {
        toast.add({
            severity: 'warn',
            summary: 'Peringatan',
            detail: 'Hanya pengajuan berstatus draft atau dikembalikan yang dapat diedit',
            life: 4000
        });
        router.push('/leave/history');
        return;
    }
    isFormLoaded = true;
    form.value.leaveTypeId = req.leaveTypeId;
    form.value.startDate = parseToDate(req.startDate);
    form.value.endDate = parseToDate(req.endDate);
    form.value.reason = req.reason || '';
    form.value.substituteId = req.substituteId || '';
    if (req.documents && req.documents.length > 0) {
        form.value.documentName = req.documents[0].fileName;
    }
}

watch(
    () => [editId.value, sicutiState.leaveRequests],
    () => {
        if (editId.value && !isFormLoaded) {
            loadDraftData();
        }
    },
    { immediate: true }
);

const userBalance = computed(() => {
    return getUserBalance(currentUser.value?.id);
});

const activeLeaveTypes = computed(() => {
    return sicutiState.leaveTypes.filter((t) => t.isActive);
});

const selectedLeaveType = computed(() => {
    return sicutiState.leaveTypes.find((t) => t.id === form.value.leaveTypeId || (t.code && t.code === form.value.leaveTypeId));
});

watch(selectedLeaveType, (newType, oldType) => {
    if (oldType && !newType?.requiresDocument) {
        removeFile();
    }
});

const colleagueOptions = computed(() => {
    return sicutiState.users
        .filter((u) => u.isActive && u.id !== currentUser.value?.id && !u.id.startsWith('ADM'))
        .map((u) => ({
            label: `${u.name} (${u.department} - ${u.position})`,
            value: u.id
        }));
});

// Format Date object to YYYY-MM-DD
function formatDate(d) {
    if (!d) return '';
    if (typeof d === 'string') return d;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function parseToDate(val) {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'string') {
        const parts = val.split('-');
        if (parts.length === 3) {
            return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }
        return new Date(val);
    }
    return null;
}

const minEndDate = computed(() => {
    return parseToDate(form.value.startDate);
});

watch(() => form.value.startDate, (newStart) => {
    const sDate = parseToDate(newStart);
    const eDate = parseToDate(form.value.endDate);
    if (sDate && eDate && eDate < sDate) {
        form.value.endDate = newStart;
    }
});

const calculatedDays = computed(() => {
    const s = formatDate(form.value.startDate);
    const e = formatDate(form.value.endDate);
    if (!s || !e) return 0;
    return calculateWorkingDays(s, e);
});

function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (file) {
        form.value.documentFile = file;
        form.value.documentName = file.name;
    }
}

function removeFile() {
    form.value.documentFile = null;
    form.value.documentName = '';
}

function validateForm() {
    const s = formatDate(form.value.startDate);
    const e = formatDate(form.value.endDate);

    if (!form.value.leaveTypeId) {
        toast.add({ severity: 'error', summary: 'Validasi', detail: 'Silakan pilih jenis cuti', life: 3000 });
        return false;
    }
    if (!s || !e) {
        toast.add({ severity: 'error', summary: 'Validasi', detail: 'Tanggal mulai dan selesai wajib diisi', life: 3000 });
        return false;
    }
    if (new Date(e) < new Date(s)) {
        toast.add({ severity: 'error', summary: 'Validasi', detail: 'Tanggal selesai harus setelah tanggal mulai', life: 3000 });
        return false;
    }
    if (calculatedDays.value <= 0) {
        toast.add({ severity: 'error', summary: 'Validasi', detail: 'Periode yang dipilih tidak memiliki hari kerja', life: 3000 });
        return false;
    }
    if (selectedLeaveType.value?.usesQuota && calculatedDays.value > userBalance.value.remaining) {
        toast.add({
            severity: 'error',
            summary: 'Saldo Kurang',
            detail: `Saldo cuti Anda (${userBalance.value.remaining} hari) tidak mencukupi untuk ${calculatedDays.value} hari kerja`,
            life: 4000
        });
        return false;
    }
    if (selectedLeaveType.value?.requiresDocument && !form.value.documentName) {
        toast.add({
            severity: 'error',
            summary: 'Dokumen Wajib',
            detail: `Jenis ${selectedLeaveType.value.name} mensyaratkan bukti dokumen (misal: Surat Dokter)`,
            life: 4000
        });
        return false;
    }
    if (!form.value.reason.trim()) {
        toast.add({ severity: 'error', summary: 'Validasi', detail: 'Alasan pengajuan cuti wajib diisi', life: 3000 });
        return false;
    }

    // Check conflict with existing active leaves
    const hasConflict = sicutiState.leaveRequests.some((r) => {
        if (editId.value && r.id === editId.value) return false;
        if (r.userId !== currentUser.value?.id) return false;
        if (['cancelled', 'rejected'].includes(r.status)) return false;
        return (s <= r.endDate && e >= r.startDate);
    });

    if (hasConflict) {
        toast.add({
            severity: 'error',
            summary: 'Periode Bentrok',
            detail: 'Anda telah memiliki pengajuan lain pada rentang tanggal tersebut',
            life: 4000
        });
        return false;
    }

    return true;
}

function submitLeave(status = 'submitted') {
    if (!validateForm()) return;

    isSubmitting.value = true;
    try {
        const s = formatDate(form.value.startDate);
        const e = formatDate(form.value.endDate);

        const documents = form.value.documentName
            ? [{ fileName: form.value.documentName, fileType: 'pdf', fileSize: 150000 }]
            : [];

        if (isEditing.value) {
            updateLeaveRequest(editId.value, {
                leaveTypeId: form.value.leaveTypeId,
                startDate: s,
                endDate: e,
                totalDays: calculatedDays.value,
                reason: form.value.reason,
                substituteId: form.value.substituteId || null,
                status,
                documents
            });

            toast.add({
                severity: 'success',
                summary: status === 'draft' ? 'Draft Disimpan' : 'Berhasil Dikirim',
                detail: status === 'draft'
                    ? `Perubahan draft ${editId.value} berhasil disimpan`
                    : `Pengajuan ${editId.value} telah dikirim ke Atasan untuk validasi`,
                life: 4000
            });
        } else {
            const newReq = createLeaveRequest({
                userId: currentUser.value?.id,
                leaveTypeId: form.value.leaveTypeId,
                startDate: s,
                endDate: e,
                totalDays: calculatedDays.value,
                reason: form.value.reason,
                substituteId: form.value.substituteId || null,
                status,
                documents
            });

            toast.add({
                severity: 'success',
                summary: status === 'draft' ? 'Draft Disimpan' : 'Berhasil Dikirim',
                detail: status === 'draft'
                    ? `Pengajuan ${newReq.id} disimpan sebagai draft`
                    : `Pengajuan ${newReq.id} telah dikirim ke Atasan untuk validasi`,
                life: 4000
            });
        }

        router.push('/leave/history');
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Terjadi kesalahan sistem', life: 3000 });
    } finally {
        isSubmitting.value = false;
    }
}
</script>

<template>
    <div class="max-w-4xl mx-auto space-y-6">
        <!-- Breadcrumb / Header -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <button
                    type="button"
                    @click="router.back()"
                    class="p-2 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-300 transition-colors shadow-xs cursor-pointer shrink-0"
                    title="Kembali"
                >
                    <ArrowLeft :size="16" :stroke-width="2" />
                </button>
                <div>
                    <div class="flex items-center gap-1.5 text-[11px] text-muted-color mb-0.5">
                        <router-link to="/" class="hover:text-primary transition-colors">Dashboard</router-link>
                        <span>/</span>
                        <span class="text-surface-700 dark:text-surface-300 font-medium">{{ isEditing ? 'Edit Draft' : 'Pengajuan Cuti' }}</span>
                    </div>
                    <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100 leading-tight">
                        {{ isEditing ? `Edit Draft Pengajuan (${editId})` : 'Formulir Pengajuan Cuti' }}
                    </h2>
                </div>
            </div>
            <router-link
                to="/leave/history"
                class="hidden sm:inline-flex items-center gap-1.5 text-xs text-surface-500 hover:text-primary transition-colors font-medium"
            >
                <History :size="14" :stroke-width="1.75" />
                <span>Riwayat Pengajuan</span>
            </router-link>
        </div>

        <!-- Mode Edit Notice Banner -->
        <div v-if="isEditing" class="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between">
            <span>Mode Edit Draft: Perubahan yang Anda simpan akan memperbarui berkas <b>{{ editId }}</b>.</span>
        </div>

        <!-- Form Input Panel -->
        <div class="card border border-surface-200 dark:border-surface-700 p-6 sm:p-8 rounded-2xl bg-surface-0 dark:bg-surface-900 shadow-sm space-y-5">
                <!-- Jenis Cuti -->
                <div>
                    <label class="block text-xs font-bold text-surface-800 dark:text-surface-200 mb-1.5">
                        Jenis Cuti <span class="text-red-500">*</span>
                    </label>
                    <Select
                        v-model="form.leaveTypeId"
                        :options="activeLeaveTypes"
                        optionLabel="name"
                        optionValue="id"
                        dataKey="id"
                        placeholder="Pilih Jenis Cuti"
                        class="w-full text-xs"
                    />
                    <small v-if="selectedLeaveType?.description" class="text-[11px] text-surface-500 dark:text-surface-400 block mt-1">
                        {{ selectedLeaveType.description }}
                        <span v-if="selectedLeaveType.usesQuota" class="font-medium text-surface-600 dark:text-surface-300"> (Mengurangi kuota tahunan)</span>
                        <span v-else class="font-medium text-surface-600 dark:text-surface-300"> (Tidak mengurangi kuota)</span>
                    </small>
                </div>

                <!-- Periode Tanggal -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-surface-800 dark:text-surface-200 mb-1.5">
                            Tanggal Mulai <span class="text-red-500">*</span>
                        </label>
                        <DatePicker
                            v-model="form.startDate"
                            dateFormat="yy-mm-dd"
                            placeholder="Pilih Tanggal Mulai"
                            class="w-full text-xs"
                            showIcon
                        />
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-surface-800 dark:text-surface-200 mb-1.5">
                            Tanggal Selesai <span class="text-red-500">*</span>
                        </label>
                        <DatePicker
                            v-model="form.endDate"
                            :minDate="minEndDate"
                            dateFormat="yy-mm-dd"
                            placeholder="Pilih Tanggal Selesai"
                            class="w-full text-xs"
                            showIcon
                        />
                    </div>
                </div>

                <!-- Durasi Perhitungan Otomatis -->
                <div class="p-3.5 bg-surface-50 dark:bg-surface-800/60 rounded-xl border border-surface-200 dark:border-surface-700 flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                        <Calendar :size="18" :stroke-width="1.75" class="text-primary shrink-0" />
                        <div>
                            <span class="text-xs font-bold text-surface-900 dark:text-surface-100 block">Total Hari Kerja Dihitung:</span>
                            <span class="text-[11px] text-muted-color">Exclude hari Sabtu, Minggu, & Libur Nasional 2026</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-xl font-extrabold text-primary">{{ calculatedDays }}</span>
                        <span class="text-xs text-muted-color ml-1">Hari Kerja</span>
                    </div>
                </div>

                <!-- Pengganti Tugas (Substitute) -->
                <div>
                    <label class="block text-xs font-bold text-surface-800 dark:text-surface-200 mb-1.5">
                        Karyawan Pengganti Tugas (Handover)
                    </label>
                    <Select
                        v-model="form.substituteId"
                        :options="colleagueOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Pilih Rekan Pengganti Tugas"
                        class="w-full text-xs"
                        filter
                        showClear
                    />
                    <small class="text-[11px] text-muted-color block mt-1">Karyawan yang akan memegang tanggung jawab selama Anda cuti</small>
                </div>

                <!-- Alasan Pengajuan -->
                <div>
                    <label class="block text-xs font-bold text-surface-800 dark:text-surface-200 mb-1.5">
                        Alasan Pengajuan Cuti <span class="text-red-500">*</span>
                    </label>
                    <Textarea
                        v-model="form.reason"
                        rows="3"
                        class="w-full text-xs"
                        placeholder="Tuliskan keterangan keperluan pengajuan cuti secara jelas..."
                    />
                </div>

                <!-- Dokumen Pendukung (Hanya tampil jika jenis cuti mewajibkan dokumen) -->
                <div v-if="selectedLeaveType?.requiresDocument">
                    <label class="block text-xs font-bold text-surface-800 dark:text-surface-200 mb-1.5">
                        Dokumen Pendukung <span class="text-red-500">* (Wajib diunggah)</span>
                    </label>

                    <div v-if="!form.documentName" class="border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-xl p-4 text-center hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                        <UploadCloud :size="24" :stroke-width="1.5" class="text-muted-color mb-1 block mx-auto" />
                        <span class="text-xs text-muted-color block">Pilih berkas dokumen (PDF, JPG, PNG maks 5MB)</span>
                        <label class="mt-2 inline-block">
                            <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg" @change="handleFileUpload" />
                            <span class="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all">
                                <FileText :size="13" :stroke-width="2" /> Unggah Berkas
                            </span>
                        </label>
                    </div>

                    <div v-else class="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl">
                        <div class="flex items-center gap-2 text-xs">
                            <FileText :size="18" :stroke-width="1.75" class="text-emerald-600" />
                            <span class="font-bold text-emerald-800 dark:text-emerald-200">{{ form.documentName }}</span>
                        </div>
                        <button type="button" class="p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors cursor-pointer" @click="removeFile" title="Hapus File">
                            <X :size="16" :stroke-width="2" />
                        </button>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-surface-200 dark:border-surface-700">
                    <Button
                        label="Batal"
                        severity="secondary"
                        text
                        size="small"
                        class="w-full sm:w-auto text-xs font-semibold"
                        @click="router.back()"
                    />
                    <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                            severity="secondary"
                            outlined
                            size="small"
                            class="flex-1 sm:flex-initial text-xs flex items-center gap-1.5"
                            :loading="isSubmitting"
                            @click="submitLeave('draft')"
                        >
                            <Save :size="14" :stroke-width="1.75" />
                            <span>{{ isEditing ? 'Simpan Perubahan Draft' : 'Simpan Draft' }}</span>
                        </Button>
                        <Button
                            severity="success"
                            size="small"
                            class="font-bold flex-1 sm:flex-initial text-xs flex items-center gap-1.5"
                            :loading="isSubmitting"
                            @click="submitLeave('submitted')"
                        >
                            <Send :size="14" :stroke-width="2" />
                            <span>{{ isEditing ? 'Kirim Pengajuan Sekarang' : 'Kirim Pengajuan' }}</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
</template>
