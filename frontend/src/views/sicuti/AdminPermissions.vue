<script setup>
import { ref, computed } from 'vue';
import {
    sicutiState,
    currentUser,
    getUser,
    formatDateTime,
    togglePermission,
    grantAllPermissions,
    revokeAllPermissions,
    resetPermissions,
    approveRoleChangeRequest,
    rejectRoleChangeRequest,
    createRoleChangeRequest,
    saveToLocalStorage
} from '@/service/sicutiService';
import { useToast } from 'primevue/usetoast';
import {
    Shield,
    RotateCcw,
    Save,
    Plus,
    LayoutGrid,
    UserCog,
    Info,
    CheckSquare,
    Ban,
    FolderOpen,
    CheckCircle2,
    ArrowRight,
    Check,
    X
} from 'lucide-vue-next';

const toast = useToast();
const activeTab = ref(0);

const selectedRole = ref('all');
const roles = computed(() => sicutiState.permissionRoles || ['user', 'staff_it', 'kepala_it', 'kepala_dept', 'admin', 'admin_sit', 'admin_sis']);
const roleLabels = computed(() => sicutiState.permissionRoleLabels || {});
const modules = computed(() => sicutiState.permissionModules || []);

const activeRoles = computed(() => {
    if (selectedRole.value === 'all') return roles.value;
    return [selectedRole.value];
});

function isChecked(role, modKey, actKey) {
    return Boolean(sicutiState.permissions?.[role]?.[modKey]?.[actKey]);
}

function handleToggle(role, modKey, actKey, val) {
    togglePermission(role, modKey, actKey, val);
}

function handleGrantAll(role) {
    grantAllPermissions(role);
    toast.add({
        severity: 'success',
        summary: 'Akses Diberikan',
        detail: `Seluruh hak akses untuk role ${roleLabels.value[role] || role} berhasil diaktifkan`,
        life: 3000
    });
}

function handleRevokeAll(role) {
    revokeAllPermissions(role);
    toast.add({
        severity: 'warn',
        summary: 'Akses Dikosongkan',
        detail: `Seluruh hak akses untuk role ${roleLabels.value[role] || role} telah dinonaktifkan`,
        life: 3000
    });
}

function handleSaveAll() {
    saveToLocalStorage();
    toast.add({
        severity: 'success',
        summary: 'Tersimpan',
        detail: 'Konfigurasi permission matriks berhasil disimpan ke sistem',
        life: 3000
    });
}

function handleResetDefaults() {
    resetPermissions();
    toast.add({
        severity: 'info',
        summary: 'Reset Selesai',
        detail: 'Seluruh hak akses role telah dikembalikan ke pengaturan standar sistem',
        life: 3000
    });
}

const reviewDialog = ref({
    visible: false,
    request: null,
    type: 'approve',
    notes: ''
});

const newRequestDialog = ref({
    visible: false,
    userId: 'USR001',
    requestedRole: 'staff_it',
    reason: ''
});

function openReview(req, type) {
    reviewDialog.value = {
        visible: true,
        request: req,
        type,
        notes: ''
    };
}

function submitReview() {
    const { request, type, notes } = reviewDialog.value;
    if (!request) return;

    const reviewer = currentUser.value?.name || 'Administrator';
    if (type === 'approve') {
        approveRoleChangeRequest(request.id, notes || 'Disetujui oleh admin', reviewer);
        toast.add({
            severity: 'success',
            summary: 'Permintaan Disetujui',
            detail: `Role ${getUser(request.userId)?.name} diubah menjadi ${request.requestedRole}`,
            life: 3500
        });
    } else {
        if (!notes.trim()) {
            toast.add({ severity: 'error', summary: 'Catatan Wajib', detail: 'Berikan alasan penolakan permintaan', life: 3000 });
            return;
        }
        rejectRoleChangeRequest(request.id, notes, reviewer);
        toast.add({
            severity: 'warn',
            summary: 'Permintaan Ditolak',
            detail: `Permintaan perubahan role ${request.id} telah ditolak`,
            life: 3500
        });
    }
    reviewDialog.value.visible = false;
}

function openAddRequest() {
    newRequestDialog.value = {
        visible: true,
        userId: 'USR001',
        requestedRole: 'staff_it',
        reason: ''
    };
}

function submitNewRequest() {
    if (!newRequestDialog.value.reason.trim()) {
        toast.add({ severity: 'error', summary: 'Validasi', detail: 'Alasan pengajuan role wajib diisi', life: 3000 });
        return;
    }
    const targetUser = getUser(newRequestDialog.value.userId);
    createRoleChangeRequest({
        userId: newRequestDialog.value.userId,
        currentRole: targetUser?.role || 'user',
        requestedRole: newRequestDialog.value.requestedRole,
        reason: newRequestDialog.value.reason
    });
    toast.add({
        severity: 'success',
        summary: 'Permintaan Dikirim',
        detail: 'Permintaan penyesuaian role berhasil didaftarkan',
        life: 3000
    });
    newRequestDialog.value.visible = false;
}

function getRoleSeverity(role) {
    switch (role) {
        case 'admin':
        case 'admin_sit':
        case 'admin_sis':
            return 'danger';
        case 'approval':
        case 'kepala_dept':
        case 'kepala_it':
        case 'staff_it':
            return 'warn';
        default:
            return 'info';
    }
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 class="text-xl font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
                    <Shield :size="22" class="text-primary" />
                    Manajemen Hak Akses & Permission
                </h2>
                <p class="text-xs text-muted-color">
                    Konfigurasi matriks kewenangan role pegawai dan evaluasi permohonan penyesuaian role
                </p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
                <Button
                    v-if="activeTab === 0"
                    severity="secondary"
                    outlined
                    size="small"
                    class="text-xs font-bold flex items-center gap-1.5"
                    @click="handleResetDefaults"
                >
                    <RotateCcw :size="14" :stroke-width="1.75" />
                    <span>Reset ke Default</span>
                </Button>
                <Button
                    v-if="activeTab === 0"
                    severity="success"
                    size="small"
                    class="text-xs font-bold shadow-xs flex items-center gap-1.5"
                    @click="handleSaveAll"
                >
                    <Save :size="14" :stroke-width="1.75" />
                    <span>Simpan Perubahan</span>
                </Button>
                <Button
                    v-if="activeTab === 1"
                    size="small"
                    class="text-xs font-bold shadow-xs flex items-center gap-1.5"
                    @click="openAddRequest"
                >
                    <Plus :size="14" :stroke-width="2" />
                    <span>Simulasi Pengajuan Role</span>
                </Button>
            </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-surface-200 dark:border-surface-700 pb-3">
            <div class="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 p-1 rounded-xl w-full sm:w-auto">
                <button
                    type="button"
                    @click="activeTab = 0"
                    :class="[
                        'flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2',
                        activeTab === 0 ? 'bg-surface-0 dark:bg-surface-900 text-primary shadow-xs' : 'text-muted-color hover:text-surface-900 dark:hover:text-surface-100'
                    ]"
                >
                    <LayoutGrid :size="14" :stroke-width="1.75" />
                    Matriks Hak Akses (Matrix)
                </button>
                <button
                    type="button"
                    @click="activeTab = 1"
                    :class="[
                        'flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 relative',
                        activeTab === 1 ? 'bg-surface-0 dark:bg-surface-900 text-primary shadow-xs' : 'text-muted-color hover:text-surface-900 dark:hover:text-surface-100'
                    ]"
                >
                    <UserCog :size="14" :stroke-width="1.75" />
                    Permintaan Penyesuaian Role
                    <span
                        v-if="sicutiState.roleChangeRequests.filter(r => r.status === 'pending').length"
                        class="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold"
                    >
                        {{ sicutiState.roleChangeRequests.filter(r => r.status === 'pending').length }}
                    </span>
                </button>
            </div>

            <!-- Role Filter Pills for Matrix -->
            <div v-if="activeTab === 0" class="flex flex-wrap items-center gap-1.5">
                <span class="text-xs text-muted-color mr-1 font-medium">Tampilkan:</span>
                <button
                    type="button"
                    @click="selectedRole = 'all'"
                    :class="[
                        'px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all border',
                        selectedRole === 'all'
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-surface-0 dark:bg-surface-900 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:bg-surface-50'
                    ]"
                >
                    Semua Role
                </button>
                <button
                    v-for="r in roles"
                    :key="r"
                    type="button"
                    @click="selectedRole = r"
                    :class="[
                        'px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all border',
                        selectedRole === r
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'bg-surface-0 dark:bg-surface-900 text-surface-700 dark:text-surface-300 border-surface-200 dark:border-surface-700 hover:bg-surface-50'
                    ]"
                >
                    {{ roleLabels[r] || r }}
                </button>
            </div>
        </div>

        <!-- TAB 0: Matriks Hak Akses -->
        <div v-if="activeTab === 0" class="space-y-4">
            <div class="p-4 rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div class="flex items-start gap-3">
                    <Info :size="16" class="text-primary mt-0.5 shrink-0" />
                    <div>
                        <div class="font-bold text-surface-900 dark:text-surface-100">Aturan Otoritas Sistem SiCuti</div>
                        <div class="text-muted-color mt-0.5">
                            Centang untuk mengizinkan tindakan pada modul terkait. Modul permohonan dan saldo cuti dipisahkan antara peran Karyawan, Approver bertingkat, dan Admin Operasional.
                        </div>
                    </div>
                </div>
                <div v-if="selectedRole !== 'all'" class="flex items-center gap-2 shrink-0">
                    <Button
                        severity="success"
                        size="small"
                        outlined
                        class="text-xs flex items-center gap-1.5"
                        @click="handleGrantAll(selectedRole)"
                    >
                        <CheckSquare :size="14" :stroke-width="1.75" />
                        <span>{{ `Beri Semua Hak ${roleLabels[selectedRole] || selectedRole}` }}</span>
                    </Button>
                    <Button
                        severity="danger"
                        size="small"
                        outlined
                        class="text-xs flex items-center gap-1.5"
                        @click="handleRevokeAll(selectedRole)"
                    >
                        <Ban :size="14" :stroke-width="1.75" />
                        <span>Kosongkan</span>
                    </Button>
                </div>
            </div>

            <!-- Permission Table -->
            <div class="card border border-surface-200 dark:border-surface-700 rounded-xl bg-surface-0 dark:bg-surface-900 shadow-sm overflow-hidden p-0">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr class="bg-surface-50 dark:bg-surface-800/60 border-b border-surface-200 dark:border-surface-700">
                                <th class="p-3 font-bold text-surface-900 dark:text-surface-100 w-1/3 min-w-[220px]">
                                    Modul & Tindakan Fitur
                                </th>
                                <th
                                    v-for="r in activeRoles"
                                    :key="r"
                                    class="p-3 text-center font-bold text-surface-900 dark:text-surface-100 min-w-[110px]"
                                >
                                    <Tag :value="roleLabels[r] || r" :severity="getRoleSeverity(r)" class="text-[11px] font-bold" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-for="mod in modules" :key="mod.key">
                                <tr class="bg-primary/5 dark:bg-primary/10 border-t-2 border-primary/20">
                                    <td
                                        :colspan="activeRoles.length + 1"
                                        class="p-2.5 px-3 font-bold text-primary text-xs uppercase tracking-wide"
                                    >
                                        <div class="flex items-center gap-2">
                                            <FolderOpen :size="14" :stroke-width="1.75" />
                                            <span>{{ mod.group }} ({{ mod.label }})</span>
                                        </div>
                                    </td>
                                </tr>
                                <tr
                                    v-for="act in mod.actions"
                                    :key="act.key"
                                    class="border-b border-surface-100 dark:border-surface-800 hover:bg-surface-50/70 dark:hover:bg-surface-800/40 transition-colors"
                                >
                                    <td class="p-2.5 px-4 font-medium text-surface-800 dark:text-surface-200">
                                        <span class="inline-block w-2 h-2 rounded-full bg-surface-300 dark:bg-surface-600 mr-2"></span>
                                        {{ act.label }}
                                        <span class="text-[10px] text-muted-color ml-1">({{ act.key }})</span>
                                    </td>
                                    <td
                                        v-for="r in activeRoles"
                                        :key="r"
                                        class="p-2.5 text-center align-middle"
                                    >
                                        <label class="inline-flex items-center justify-center cursor-pointer p-1">
                                            <input
                                                type="checkbox"
                                                class="w-4 h-4 text-primary rounded border-surface-300 dark:border-surface-600 focus:ring-primary cursor-pointer transition-all"
                                                :checked="isChecked(r, mod.key, act.key)"
                                                @change="e => handleToggle(r, mod.key, act.key, e.target.checked)"
                                            />
                                        </label>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- TAB 1: Permintaan Penyesuaian Role -->
        <div v-if="activeTab === 1" class="space-y-4">
            <div class="card border border-surface-200 dark:border-surface-700 p-4 rounded-xl bg-surface-0 dark:bg-surface-900 shadow-sm">
                <DataTable
                    :value="sicutiState.roleChangeRequests"
                    paginator
                    :rows="10"
                    class="p-datatable-sm text-xs"
                    responsiveLayout="scroll"
                >
                    <template #empty>
                        <div class="text-center py-10 text-muted-color">
                            <CheckCircle2 :size="32" class="text-primary mx-auto mb-2" />
                            Tidak ada permohonan penyesuaian role saat ini.
                        </div>
                    </template>

                    <Column field="id" header="ID Permohonan" style="width: 14%">
                        <template #body="{ data }">
                            <span class="font-bold text-primary">{{ data.id }}</span>
                            <div class="text-[10px] text-muted-color">{{ formatDateTime(data.createdAt) }}</div>
                        </template>
                    </Column>

                    <Column header="Karyawan" style="width: 24%">
                        <template #body="{ data }">
                            <div class="font-bold text-surface-900 dark:text-surface-100">{{ getUser(data.userId)?.name }}</div>
                            <div class="text-[11px] text-muted-color">
                                NIK: {{ getUser(data.userId)?.namecode }} &bull; Divisi {{ getUser(data.userId)?.department }}
                            </div>
                        </template>
                    </Column>

                    <Column header="Perubahan Role" style="width: 22%">
                        <template #body="{ data }">
                            <div class="flex items-center gap-1.5">
                                <Tag :value="data.currentRole" severity="secondary" class="text-[10px]" />
                                <ArrowRight :size="12" class="text-muted-color" />
                                <Tag :value="data.requestedRole" :severity="getRoleSeverity(data.requestedRole)" class="text-[10px] font-bold" />
                            </div>
                        </template>
                    </Column>

                    <Column field="reason" header="Alasan Permohonan" style="width: 22%">
                        <template #body="{ data }">
                            <span class="text-xs text-muted-color italic block max-w-xs truncate" :title="data.reason">
                                "{{ data.reason }}"
                            </span>
                            <div v-if="data.reviewNotes" class="text-[10px] text-surface-700 dark:text-surface-300 mt-0.5">
                                Review: <b>{{ data.reviewNotes }}</b> ({{ data.reviewedBy || '-' }})
                            </div>
                        </template>
                    </Column>

                    <Column header="Status" style="width: 10%">
                        <template #body="{ data }">
                            <Tag
                                :value="data.status === 'pending' ? 'Menunggu Review' : data.status === 'approved' ? 'Disetujui' : 'Ditolak'"
                                :severity="data.status === 'pending' ? 'warn' : data.status === 'approved' ? 'success' : 'danger'"
                                class="text-[10px]"
                            />
                        </template>
                    </Column>

                    <Column header="Aksi" style="width: 8%; text-align: center">
                        <template #body="{ data }">
                            <div v-if="data.status === 'pending'" class="flex items-center justify-center gap-1">
                                <button
                                    type="button"
                                    class="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors cursor-pointer"
                                    @click="openReview(data, 'approve')"
                                    title="Setujui Perubahan Role"
                                >
                                    <Check :size="15" :stroke-width="2" />
                                </button>
                                <button
                                    type="button"
                                    class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                                    @click="openReview(data, 'reject')"
                                    title="Tolak Permintaan"
                                >
                                    <X :size="15" :stroke-width="2" />
                                </button>
                            </div>
                            <span v-else class="text-xs text-muted-color">-</span>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- Review Dialog -->
        <Dialog
            v-model:visible="reviewDialog.visible"
            modal
            :header="reviewDialog.type === 'approve' ? 'Konfirmasi Setujui Permintaan Role' : 'Tolak Permintaan Role'"
            :breakpoints="{ '960px': '75vw', '640px': '92vw' }"
            :style="{ width: '440px' }"
        >
            <div class="space-y-4 pt-2 text-xs">
                <div
                    :class="[
                        'p-3 rounded-lg text-xs',
                        reviewDialog.type === 'approve'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200'
                            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-200'
                    ]"
                >
                    <p class="font-semibold">
                        {{ reviewDialog.type === 'approve'
                            ? `Karyawan akan dialihkan peran menjadi ${reviewDialog.request?.requestedRole}.`
                            : 'Permintaan penyesuaian role akan ditolak dan karyawan tetap memegang peran semula.'
                        }}
                    </p>
                </div>

                <div>
                    <label class="block font-medium mb-1">Catatan Evaluator / Admin</label>
                    <Textarea
                        v-model="reviewDialog.notes"
                        rows="3"
                        class="w-full text-xs"
                        :placeholder="reviewDialog.type === 'approve' ? 'Catatan persetujuan (opsional)...' : 'Alasan penolakan (wajib)...'"
                    />
                </div>
            </div>

            <template #footer>
                <div class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 w-full pt-3">
                    <Button label="Batal" severity="secondary" size="small" text @click="reviewDialog.visible = false" />
                    <Button
                        :label="reviewDialog.type === 'approve' ? 'Setujui Role' : 'Tolak Permintaan'"
                        :severity="reviewDialog.type === 'approve' ? 'success' : 'danger'"
                        size="small"
                        class="font-bold"
                        @click="submitReview"
                    />
                </div>
            </template>
        </Dialog>

        <!-- New Request Simulation Dialog -->
        <Dialog
            v-model:visible="newRequestDialog.visible"
            modal
            header="Ajukan Permintaan Penyesuaian Role (Simulasi)"
            :breakpoints="{ '960px': '75vw', '640px': '92vw' }"
            :style="{ width: '460px' }"
        >
            <div class="space-y-4 pt-2 text-xs">
                <div>
                    <label class="block font-medium mb-1">Pilih Karyawan Pengaju</label>
                    <Select
                        v-model="newRequestDialog.userId"
                        :options="sicutiState.users.filter(u => !u.id.startsWith('ADM'))"
                        optionLabel="name"
                        optionValue="id"
                        class="w-full text-xs"
                    />
                </div>
                <div>
                    <label class="block font-medium mb-1">Role Yang Diminta</label>
                    <Select
                        v-model="newRequestDialog.requestedRole"
                        :options="['user', 'staff_it', 'kepala_it', 'kepala_dept', 'admin_sit']"
                        class="w-full text-xs"
                    />
                </div>
                <div>
                    <label class="block font-medium mb-1">Alasan Penyesuaian Role *</label>
                    <Textarea
                        v-model="newRequestDialog.reason"
                        rows="3"
                        class="w-full text-xs"
                        placeholder="Contoh: Penyesuaian SK jabatan baru / rotasi kerja divisi..."
                    />
                </div>
            </div>

            <template #footer>
                <div class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 w-full pt-3">
                    <Button label="Batal" severity="secondary" size="small" text @click="newRequestDialog.visible = false" />
                    <Button
                        label="Kirim Permintaan"
                        severity="primary"
                        size="small"
                        class="font-bold"
                        @click="submitNewRequest"
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>
