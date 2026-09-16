<script setup>
import { computed, ref } from 'vue';
import {
    currentUser,
    activeRole,
    getUser,
    getLeaveType,
    getStatusSeverity,
    getStatusLabel,
    formatDate,
    formatDateTime,
    canUserApprove,
    approveLeaveRequest,
    rejectLeaveRequest,
    returnLeaveRequest,
    deleteLeaveRequest
} from '@/service/sicutiService';
import { useToast } from 'primevue/usetoast';
import { FileText, Printer, X, Undo2, Check } from 'lucide-vue-next';

const props = defineProps({
    visible: Boolean,
    request: Object
});

const emit = defineEmits(['update:visible', 'refresh']);
const toast = useToast();

const actionDialog = ref({
    type: '',
    visible: false,
    notes: '',
    signature: ''
});

const requester = computed(() => (props.request ? getUser(props.request.userId) : null));
const substitute = computed(() => (props.request?.substituteId ? getUser(props.request.substituteId) : null));
const leaveType = computed(() => (props.request ? getLeaveType(props.request.leaveTypeId) : null));

const canApprove = computed(() => {
    if (!props.request || activeRole.value !== 'approval') return false;
    return canUserApprove(props.request, currentUser.value);
});

const canCancel = computed(() => {
    if (!props.request || activeRole.value !== 'user') return false;
    return props.request.userId === currentUser.value?.id && ['draft', 'submitted'].includes(props.request.status);
});

const isApproved = computed(() => props.request?.status === 'approved');

function openAction(type) {
    actionDialog.value = {
        type,
        visible: true,
        notes: '',
        signature: currentUser.value?.name || ''
    };
}

function submitAction() {
    const { type, notes, signature } = actionDialog.value;
    if (type === 'approve') {
        if (!signature) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Tanda tangan wajib diisi', life: 3000 });
            return;
        }
        approveLeaveRequest(props.request.id, notes, signature);
        toast.add({ severity: 'success', summary: 'Berhasil', detail: 'Pengajuan telah disetujui', life: 3000 });
    } else if (type === 'reject') {
        if (!notes) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Alasan penolakan wajib diisi', life: 3000 });
            return;
        }
        rejectLeaveRequest(props.request.id, notes);
        toast.add({ severity: 'warn', summary: 'Ditolak', detail: 'Pengajuan telah ditolak', life: 3000 });
    } else if (type === 'return') {
        if (!notes) {
            toast.add({ severity: 'error', summary: 'Error', detail: 'Catatan pengembalian wajib diisi', life: 3000 });
            return;
        }
        returnLeaveRequest(props.request.id, notes);
        toast.add({ severity: 'info', summary: 'Dikembalikan', detail: 'Pengajuan dikembalikan untuk revisi', life: 3000 });
    }
    actionDialog.value.visible = false;
    emit('update:visible', false);
    emit('refresh');
}

function handleCancelRequest() {
    deleteLeaveRequest(props.request.id);
    toast.add({ severity: 'info', summary: 'Dibatalkan', detail: 'Pengajuan cuti berhasil dibatalkan', life: 3000 });
    emit('update:visible', false);
    emit('refresh');
}

function printDocument() {
    if (!props.request || props.request.status !== 'approved') {
        toast.add({
            severity: 'warn',
            summary: 'Belum Disetujui Penuh',
            detail: 'Dokumen cuti hanya dapat dicetak setelah seluruh tahapan persetujuan selesai (Disetujui).',
            life: 4000
        });
        return;
    }
    const r = props.request;
    const u = requester.value;
    const lt = leaveType.value;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Formulir Cuti - ${r.id}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 30px; font-size: 13px; line-height: 1.6; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
                .header h2 { margin: 0; font-size: 18px; }
                .header p { margin: 2px 0; font-size: 12px; color: #555; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
                th { background-color: #f5f5f5; width: 30%; }
                .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
                .sig-box { text-align: center; width: 30%; }
                .sig-line { border-bottom: 1px solid #333; height: 60px; margin-bottom: 5px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>PT INDONESIA ASAHAN ALUMINIUM (PERSERO)</h2>
                <p>SURAT PERMOHONAN & PERSETUJUAN CUTI</p>
                <p>No. Dokumen: ${r.id}</p>
            </div>
            <table>
                <tr><th>Nama Karyawan</th><td>${u?.name || '-'}</td></tr>
                <tr><th>ID Karyawan / NIK</th><td>${u?.namecode || '-'}</td></tr>
                <tr><th>Departemen / Seksi</th><td>${u?.department || '-'} / ${u?.position || '-'}</td></tr>
                <tr><th>Jenis Cuti</th><td>${lt?.name || '-'}</td></tr>
                <tr><th>Periode Cuti</th><td>${r.startDate} s/d ${r.endDate} (${r.totalDays} Hari Kerja)</td></tr>
                <tr><th>Alasan Pengajuan</th><td>${r.reason}</td></tr>
                <tr><th>Pengganti Tugas</th><td>${substitute.value?.name || '-'}</td></tr>
                <tr><th>Status Terakhir</th><td><b>${getStatusLabel(r.status)}</b></td></tr>
            </table>

            <div class="signatures">
                <div class="sig-box">
                    <p>Pemohon,</p>
                    <div class="sig-line"></div>
                    <p><b>${u?.name || '-'}</b></p>
                </div>
                <div class="sig-box">
                    <p>Atasan Langsung / Staff IT,</p>
                    <div class="sig-line">${r.approvalRecords?.[0]?.signature || ''}</div>
                    <p><b>${r.approvalRecords?.[0]?.signature || '( .................... )'}</b></p>
                </div>
                <div class="sig-box">
                    <p>Kepala Seksi,</p>
                    <div class="sig-line">${r.approvalRecords?.[1]?.signature || ''}</div>
                    <p><b>${r.approvalRecords?.[1]?.signature || '( .................... )'}</b></p>
                </div>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
    }, 500);
}
</script>

<template>
    <Dialog
        :visible="visible"
        @update:visible="emit('update:visible', $event)"
        modal
        :header="`Detail Pengajuan Cuti (${request?.id || ''})`"
        :breakpoints="{ '960px': '85vw', '640px': '95vw' }"
        :style="{ width: '650px' }"
        :closable="true"
    >
        <div v-if="request" class="space-y-6">
            <!-- Header Summary -->
            <div class="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {{ requester?.name?.charAt(0) || 'U' }}
                    </div>
                    <div>
                        <h4 class="font-bold text-sm leading-tight">{{ requester?.name }}</h4>
                        <p class="text-xs text-muted-color">{{ requester?.namecode }} &bull; {{ requester?.department }} - {{ requester?.position }}</p>
                    </div>
                </div>
                <Tag :value="getStatusLabel(request.status)" :severity="getStatusSeverity(request.status)" class="text-xs font-semibold px-2.5 py-1" />
            </div>

            <!-- Detail Grid -->
            <div class="grid grid-cols-2 gap-4 text-xs">
                <div class="p-3 bg-surface-100/50 dark:bg-surface-800/50 rounded-lg">
                    <span class="text-muted-color block mb-1">Jenis Cuti</span>
                    <span class="font-semibold text-surface-900 dark:text-surface-100 text-sm">{{ leaveType?.name }}</span>
                </div>
                <div class="p-3 bg-surface-100/50 dark:bg-surface-800/50 rounded-lg">
                    <span class="text-muted-color block mb-1">Total Durasi</span>
                    <span class="font-bold text-primary text-sm">{{ request.totalDays }} Hari Kerja</span>
                </div>
                <div class="p-3 bg-surface-100/50 dark:bg-surface-800/50 rounded-lg">
                    <span class="text-muted-color block mb-1">Tanggal Mulai</span>
                    <span class="font-medium text-surface-900 dark:text-surface-100">{{ formatDate(request.startDate) }}</span>
                </div>
                <div class="p-3 bg-surface-100/50 dark:bg-surface-800/50 rounded-lg">
                    <span class="text-muted-color block mb-1">Tanggal Selesai</span>
                    <span class="font-medium text-surface-900 dark:text-surface-100">{{ formatDate(request.endDate) }}</span>
                </div>
            </div>

            <!-- Reason & Substitute -->
            <div class="space-y-3 text-xs">
                <div>
                    <span class="text-muted-color font-medium block mb-1">Alasan Pengajuan:</span>
                    <div class="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg text-surface-700 dark:text-surface-300">
                        {{ request.reason || '-' }}
                    </div>
                </div>
                <div v-if="substitute">
                    <span class="text-muted-color font-medium block mb-1">Pengganti Tugas:</span>
                    <span class="font-semibold text-surface-800 dark:text-surface-200">{{ substitute.name }} ({{ substitute.position }})</span>
                </div>
                <div v-if="request.documents && request.documents.length">
                    <span class="text-muted-color font-medium block mb-1">Dokumen Pendukung:</span>
                    <div class="flex items-center gap-2 p-2 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg">
                        <FileText :size="16" :stroke-width="1.75" class="text-primary shrink-0" />
                        <span class="font-medium text-primary text-xs">{{ request.documents[0].fileName }}</span>
                    </div>
                </div>
            </div>

            <!-- Approval Timeline -->
            <div>
                <h5 class="font-bold text-xs uppercase tracking-wider text-muted-color mb-3">Jejak Persetujuan (Workflow)</h5>
                <div class="border-l-2 border-primary ml-3 pl-4 space-y-4 text-xs">
                    <!-- Submission -->
                    <div class="relative">
                        <div class="absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full bg-primary ring-4 ring-white dark:ring-surface-900"></div>
                        <p class="font-bold text-surface-900 dark:text-surface-100">Pengajuan Dibuat</p>
                        <p class="text-muted-color text-[11px]">{{ formatDateTime(request.createdAt) }}</p>
                    </div>
                    <!-- Records -->
                    <div v-for="(rec, idx) in request.approvalRecords" :key="idx" class="relative">
                        <div
                            :class="[
                                'absolute -left-[23px] top-0 w-3.5 h-3.5 rounded-full ring-4 ring-white dark:ring-surface-900',
                                rec.action === 'approve' ? 'bg-primary' : rec.action === 'reject' ? 'bg-red-500' : 'bg-amber-500'
                            ]"
                        ></div>
                        <div class="flex items-center justify-between">
                            <span class="font-bold text-surface-900 dark:text-surface-100">
                                Level {{ rec.level }} - {{ rec.action === 'approve' ? 'Disetujui' : rec.action === 'reject' ? 'Ditolak' : 'Dikembalikan' }}
                            </span>
                            <span class="text-[11px] text-muted-color">{{ formatDateTime(rec.createdAt) }}</span>
                        </div>
                        <p class="text-muted-color text-[11px]">Oleh: {{ getUser(rec.approverId)?.name || rec.signature }}</p>
                        <p v-if="rec.notes" class="text-surface-700 dark:text-surface-300 italic mt-0.5">"{{ rec.notes }}"</p>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 w-full pt-3">
                <div>
                    <Button label="Tutup" severity="secondary" size="small" text class="text-xs font-medium" @click="emit('update:visible', false)" />
                </div>
                <div class="flex flex-wrap items-center justify-end gap-2">
                    <Button v-if="canCancel" severity="danger" size="small" text class="text-xs font-semibold flex items-center gap-1.5" @click="handleCancelRequest">
                        <X :size="14" :stroke-width="2" />
                        <span>Batalkan Pengajuan</span>
                    </Button>
                    <template v-if="canApprove">
                        <Button severity="warn" size="small" outlined class="text-xs font-semibold flex items-center gap-1.5" @click="openAction('return')">
                            <Undo2 :size="14" :stroke-width="2" />
                            <span>Kembalikan</span>
                        </Button>
                        <Button severity="danger" size="small" outlined class="text-xs font-semibold flex items-center gap-1.5" @click="openAction('reject')">
                            <X :size="14" :stroke-width="2" />
                            <span>Tolak</span>
                        </Button>
                        <Button severity="success" size="small" class="text-xs font-bold flex items-center gap-1.5" @click="openAction('approve')">
                            <Check :size="14" :stroke-width="2" />
                            <span>Setujui (Approve)</span>
                        </Button>
                    </template>
                    <Button
                        v-if="isApproved"
                        severity="primary"
                        size="small"
                        class="text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                        @click="printDocument"
                    >
                        <Printer :size="14" :stroke-width="1.75" />
                        <span>Cetak Dokumen Sah</span>
                    </Button>
                </div>
            </div>
        </template>
    </Dialog>

    <!-- Modal Form Approve / Reject / Return -->
    <Dialog
        v-model:visible="actionDialog.visible"
        modal
        :header="actionDialog.type === 'approve' ? 'Konfirmasi Persetujuan' : actionDialog.type === 'reject' ? 'Tolak Pengajuan' : 'Kembalikan Pengajuan'"
        :breakpoints="{ '960px': '75vw', '640px': '92vw' }"
        :style="{ width: '420px' }"
    >
        <div class="space-y-4 pt-2 text-xs">
            <div v-if="actionDialog.type === 'approve'" class="p-3 bg-primary/10 text-primary rounded-lg">
                Pastikan kuota cuti pemohon mencukupi dan tidak ada bentrok operasional.
            </div>
            <div>
                <label class="block font-medium mb-1">Catatan Approver</label>
                <Textarea v-model="actionDialog.notes" rows="3" class="w-full text-xs" :placeholder="actionDialog.type === 'approve' ? 'Catatan opsional (misal: Disetujui)' : 'Wajib mencantumkan alasan...'" />
            </div>
            <div v-if="actionDialog.type === 'approve'">
                <label class="block font-medium mb-1">Tanda Tangan Digital (Nama Jelas)</label>
                <InputText v-model="actionDialog.signature" class="w-full text-xs" />
            </div>
        </div>
        <template #footer>
            <div class="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 w-full pt-2">
                <Button label="Batal" severity="secondary" size="small" text @click="actionDialog.visible = false" />
                <Button
                    :label="actionDialog.type === 'approve' ? 'Setujui' : actionDialog.type === 'reject' ? 'Tolak' : 'Kembalikan'"
                    :severity="actionDialog.type === 'approve' ? 'success' : actionDialog.type === 'reject' ? 'danger' : 'warn'"
                    size="small"
                    class="font-bold"
                    @click="submitAction"
                />
            </div>
        </template>
    </Dialog>
</template>
