<script setup>
import { ref, computed, watch } from 'vue';
import {
    currentUser,
    getUserBalance,
    sicutiState,
    calculateWorkingDays,
    createLeaveRequest,
    updateLeaveRequest
} from '@/service/sicutiService';
import { useToast } from 'primevue/usetoast';
import { Calendar, UploadCloud, FileText, X, Save, Send, Wallet, AlertCircle } from 'lucide-vue-next';

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    editId: {
        type: String,
        default: null
    }
});

const emit = defineEmits(['update:visible', 'saved']);
const toast = useToast();

const isEditing = computed(() => Boolean(props.editId));
const isSubmitting = ref(false);

const form = ref({
    leaveTypeId: 'LT001',
    startDate: null,
    endDate: null,
    reason: '',
    substituteId: '',
    documentFile: null,
    documentName: ''
});

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

function formatDate(d) {
    if (!d) return '';
    if (typeof d === 'string') return d;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const userBalance = computed(() => getUserBalance(currentUser.value?.id));

const activeLeaveTypes = computed(() => sicutiState.leaveTypes.filter((t) => t.isActive));

const selectedLeaveType = computed(() => {
    return sicutiState.leaveTypes.find(
        (t) => t.id === form.value.leaveTypeId || (t.code && t.code === form.value.leaveTypeId)
    );
});

const colleagueOptions = computed(() => {
    return sicutiState.users
        .filter((u) => u.isActive && u.id !== currentUser.value?.id && !u.id.startsWith('ADM'))
        .map((u) => ({
            label: `${u.name} (${u.department} - ${u.position})`,
            value: u.id
        }));
});

const minEndDate = computed(() => parseToDate(form.value.startDate));

const calculatedDays = computed(() => {
    const s = formatDate(form.value.startDate);
    const e = formatDate(form.value.endDate);
    if (!s || !e) return 0;
    return calculateWorkingDays(s, e);
});

const estimatedRemaining = computed(() => {
    if (!selectedLeaveType.value?.usesQuota) return userBalance.value.remaining;
    return userBalance.value.remaining - (calculatedDays.value || 0);
});

watch(
    () => form.value.startDate,
    (newStart) => {
        const sDate = parseToDate(newStart);
        const eDate = parseToDate(form.value.endDate);
        if (sDate && eDate && eDate < sDate) {
            form.value.endDate = newStart;
        }
    }
);

watch(selectedLeaveType, (newType, oldType) => {
    if (oldType && !newType?.requiresDocument) {
        removeFile();
    }
});

function loadData() {
    if (props.editId) {
        const req = sicutiState.leaveRequests.find((r) => r.id === props.editId);
        if (req) {
            form.value.leaveTypeId = req.leaveTypeId;
            form.value.startDate = parseToDate(req.startDate);
            form.value.endDate = parseToDate(req.endDate);
            form.value.reason = req.reason || '';
            form.value.substituteId = req.substituteId || '';
            form.value.documentFile = null;
            form.value.documentName = req.documents && req.documents.length > 0 ? req.documents[0].fileName : '';
            return;
        }
    }
    form.value = {
        leaveTypeId: 'LT001',
        startDate: null,
        endDate: null,
        reason: '',
        substituteId: '',
        documentFile: null,
        documentName: ''
    };
}

watch(
    () => [props.visible, props.editId],
    ([visible]) => {
        if (visible) {
            loadData();
        }
    },
    { immediate: true }
);

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

    const hasConflict = sicutiState.leaveRequests.some((r) => {
        if (props.editId && r.id === props.editId) return false;
        if (r.userId !== currentUser.value?.id) return false;
        if (['cancelled', 'rejected'].includes(r.status)) return false;
        return s <= r.endDate && e >= r.startDate;
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

        let resultReq = null;

        if (isEditing.value) {
            resultReq = updateLeaveRequest(props.editId, {
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
                    ? `Perubahan draft ${props.editId} berhasil disimpan`
                    : `Pengajuan ${props.editId} telah dikirim ke Atasan untuk validasi`,
                life: 4000
            });
        } else {
            resultReq = createLeaveRequest({
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
                    ? `Pengajuan ${resultReq.id} disimpan sebagai draft`
                    : `Pengajuan ${resultReq.id} telah dikirim ke Atasan untuk validasi`,
                life: 4000
            });
        }

        emit('saved', resultReq);
        closeDialog();
    } catch (err) {
        toast.add({ severity: 'error', summary: 'Gagal', detail: 'Terjadi kesalahan sistem', life: 3000 });
    } finally {
        isSubmitting.value = false;
    }
}

function closeDialog() {
    emit('update:visible', false);
}
</script>

<template>
    <Dialog
        :visible="visible"
        @update:visible="emit('update:visible', $event)"
        modal
        :header="isEditing ? `Edit Draft Pengajuan (${editId})` : 'Formulir Pengajuan Cuti'"
        :breakpoints="{ '960px': '85vw', '640px': '95vw' }"
        :style="{ width: '640px' }"
        :closable="true"
        dismissableMask
    >
        <div class="space-y-4 pt-1">
            <!-- Saldo Cuti Live Preview Card -->
            <div class="p-3.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/60 flex items-center justify-between text-xs">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Wallet :size="18" :stroke-width="1.75" />
                    </div>
                    <div>
                        <span class="text-muted-color block">Saldo Cuti Tersedia</span>
                        <div class="font-bold text-surface-900 dark:text-surface-100">
                            {{ userBalance.remaining }} <span class="font-normal text-muted-color">hari kerja</span>
                            <span v-if="userBalance.carryOverDays > 0" class="text-muted-color font-normal ml-1">
                                (inc. {{ userBalance.carryOverDays }} carry over)
                            </span>
                        </div>
                    </div>
                </div>

                <div v-if="selectedLeaveType?.usesQuota && calculatedDays > 0" class="text-right">
                    <span class="text-muted-color block">Estimasi Sisa</span>
                    <div :class="['font-bold', estimatedRemaining < 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400']">
                        {{ estimatedRemaining }} <span class="font-normal text-muted-color">hari kerja</span>
                    </div>
                </div>
            </div>

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
                    size="small"
                />
                <div v-if="selectedLeaveType?.description" class="text-[11px] text-surface-500 dark:text-surface-400 mt-1 flex items-center gap-1">
                    <AlertCircle :size="12" :stroke-width="1.75" class="shrink-0 text-muted-color" />
                    <span>
                        {{ selectedLeaveType.description }}
                        <span v-if="selectedLeaveType.usesQuota" class="font-medium text-surface-600 dark:text-surface-300"> (Mengurangi kuota tahunan)</span>
                        <span v-else class="font-medium text-emerald-600 dark:text-emerald-400"> (Tidak mengurangi kuota)</span>
                    </span>
                </div>
            </div>

            <!-- Periode Tanggal -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                    <label class="block text-xs font-bold text-surface-800 dark:text-surface-200 mb-1.5">
                        Tanggal Mulai <span class="text-red-500">*</span>
                    </label>
                    <DatePicker
                        v-model="form.startDate"
                        dateFormat="yy-mm-dd"
                        placeholder="Pilih Tanggal Mulai"
                        class="w-full text-xs"
                        size="small"
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
                        size="small"
                        showIcon
                    />
                </div>
            </div>

            <!-- Durasi Perhitungan Otomatis -->
            <div class="p-3 bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <Calendar :size="16" :stroke-width="1.75" class="text-primary shrink-0" />
                    <div>
                        <span class="text-xs font-bold text-surface-900 dark:text-surface-100 block">Total Durasi Dihitung:</span>
                        <span class="text-[11px] text-muted-color">Exclude Sabtu, Minggu, & Libur Nasional 2026</span>
                    </div>
                </div>
                <div class="text-right">
                    <span class="text-lg font-extrabold text-primary">{{ calculatedDays }}</span>
                    <span class="text-xs text-muted-color ml-1 font-medium">Hari Kerja</span>
                </div>
            </div>

            <!-- Pengganti Tugas (Handover) -->
            <div>
                <label class="block text-xs font-bold text-surface-800 dark:text-surface-200 mb-1.5">
                    Karyawan Pengganti Tugas (Handover)
                </label>
                <Select
                    v-model="form.substituteId"
                    :options="colleagueOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Pilih Rekan Pengganti (Opsional)"
                    showClear
                    filter
                    class="w-full text-xs"
                    size="small"
                />
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
                    placeholder="Tuliskan keterangan keperluan cuti..."
                />
            </div>
            <!-- Dokumen Pendukung (Hanya jika disyaratkan) -->
            <div v-if="selectedLeaveType?.requiresDocument">
                <label class="block text-xs font-bold text-surface-800 dark:text-surface-200 mb-1.5">
                    Dokumen Pendukung <span class="text-red-500">* (Wajib diunggah)</span>
                </label>

                <div v-if="!form.documentName" class="border-2 border-dashed border-surface-300 dark:border-surface-700 rounded-xl p-3.5 text-center hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <UploadCloud :size="22" :stroke-width="1.5" class="text-muted-color mb-1 block mx-auto" />
                    <span class="text-xs text-muted-color block">Pilih berkas (PDF, JPG, PNG maks 5MB)</span>
                    <label class="mt-2 inline-block">
                        <input type="file" class="hidden" accept=".pdf,.png,.jpg,.jpeg" @change="handleFileUpload" />
                        <span class="cursor-pointer inline-flex items-center gap-1 px-3 py-1 bg-primary hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all">
                            <FileText :size="13" :stroke-width="2" /> Unggah Berkas
                        </span>
                    </label>
                </div>

                <div v-else class="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl">
                    <div class="flex items-center gap-2 text-xs">
                        <FileText :size="16" :stroke-width="1.75" class="text-emerald-600" />
                        <span class="font-bold text-emerald-800 dark:text-emerald-200 truncate max-w-[280px]">{{ form.documentName }}</span>
                    </div>
                    <button
                        type="button"
                        class="p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        @click="removeFile"
                        title="Hapus File"
                    >
                        <X :size="15" :stroke-width="2" />
                    </button>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex items-center justify-between gap-2 w-full pt-2 border-t border-surface-200 dark:border-surface-700">
                <Button
                    label="Batal"
                    severity="secondary"
                    text
                    size="small"
                    class="text-xs font-semibold"
                    @click="closeDialog"
                />
                <div class="flex items-center gap-2">
                    <Button
                        severity="secondary"
                        outlined
                        size="small"
                        class="text-xs flex items-center gap-1.5 font-semibold"
                        :loading="isSubmitting"
                        @click="submitLeave('draft')"
                    >
                        <Save :size="14" :stroke-width="1.75" />
                        <span>Simpan Draft</span>
                    </Button>
                    <Button
                        severity="primary"
                        size="small"
                        class="text-xs flex items-center gap-1.5 font-bold shadow-xs"
                        :loading="isSubmitting"
                        @click="submitLeave('submitted')"
                    >
                        <Send :size="14" :stroke-width="2" />
                        <span>Kirim Pengajuan</span>
                    </Button>
                </div>
            </div>
        </template>
    </Dialog>
</template>


