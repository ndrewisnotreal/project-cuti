<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
    currentUser,
    activeRole,
    sicutiState,
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
} from '@/service/sicutiService';
import LeaveDetailDialog from '@/views/sicuti/LeaveDetailDialog.vue';
import {
    Bell,
    CheckCheck,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Clock,
    Calendar,
    ShieldCheck,
    FileText,
    Inbox,
    ChevronRight
} from 'lucide-vue-next';

const router = useRouter();

const notifOpen = ref(false);
const notifTab = ref('all');
const selectedRequest = ref(null);
const isDetailDialogVisible = ref(false);

const notifications = computed(() => {
    if (!currentUser.value) return [];
    return getNotifications(currentUser.value.id, activeRole.value);
});

const unreadCount = computed(() => notifications.value.filter((n) => !n.isRead).length);

const displayedNotifications = computed(() => {
    if (notifTab.value === 'unread') {
        return notifications.value.filter((n) => !n.isRead);
    }
    return notifications.value;
});

function toggleNotif() {
    notifOpen.value = !notifOpen.value;
}

function closeNotif() {
    notifOpen.value = false;
}

function handleMarkAllRead() {
    markAllNotificationsAsRead(currentUser.value?.id, activeRole.value);
}

function getNotifIcon(type) {
    switch (type) {
        case 'approved': return CheckCircle2;
        case 'rejected': return XCircle;
        case 'returned': return AlertTriangle;
        case 'pending': return Clock;
        case 'submitted': return FileText;
        case 'role_request': return ShieldCheck;
        case 'info': return Calendar;
        default: return Bell;
    }
}

function getIconBadgeClass(type) {
    switch (type) {
        case 'approved': return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400';
        case 'rejected': return 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400';
        case 'returned': return 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400';
        case 'pending': return 'bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400';
        case 'role_request':
        case 'submitted': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400';
        case 'info': return 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400';
        default: return 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300';
    }
}

const NOTIF_ROUTE_MAP = {
    'admin-monitoring': '/admin/monitoring',
    pending: '/approval/pending',
    history: '/leave/history',
    balance: '/leave/balance'
};

function handleNotifClick(notif) {
    markNotificationAsRead(notif.id);
    closeNotif();

    if (notif.requestId) {
        const req = sicutiState.leaveRequests.find((r) => r.id === notif.requestId);
        if (req) {
            selectedRequest.value = req;
            isDetailDialogVisible.value = true;
            return;
        }
    }

    if (notif.targetRoute) {
        router.push(notif.targetRoute);
    } else if (notif.page && NOTIF_ROUTE_MAP[notif.page]) {
        router.push(NOTIF_ROUTE_MAP[notif.page]);
    }
}

function handleDetailEdit(req) {
    isDetailDialogVisible.value = false;
    router.push({ path: '/leave/history', query: { editId: req.id } });
}

const isAdminRole = computed(() => ['admin', 'admin_sit', 'admin_sis'].includes(activeRole.value));
const isApprovalRole = computed(() => ['staff_it', 'kepala_it', 'kepala_dept', 'approval'].includes(activeRole.value));

const footerNavText = computed(() => {
    if (isAdminRole.value) return 'Buka Monitoring Divisi';
    if (isApprovalRole.value) return 'Buka Antrean Persetujuan';
    return 'Buka Riwayat Pengajuan';
});

function navigateFooter() {
    closeNotif();
    if (isAdminRole.value) router.push('/admin/monitoring');
    else if (isApprovalRole.value) router.push('/approval/pending');
    else router.push('/leave/history');
}
</script>

<template>
    <div class="relative">
        <button
            type="button"
            @click="toggleNotif"
            class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer relative"
            title="Notifikasi"
        >
            <Bell :size="16" :stroke-width="1.75" />
            <span
                v-if="unreadCount > 0"
                class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none ring-2 ring-surface-0 dark:ring-surface-900"
            >
                {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
        </button>

        <!-- Dropdown Popover -->
        <div
            v-if="notifOpen"
            class="absolute right-0 top-full mt-2 w-80 sm:w-[380px] bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col"
        >
            <!-- Header -->
            <div class="px-4 py-3 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between bg-surface-50/60 dark:bg-surface-800/30">
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-surface-900 dark:text-surface-100 uppercase tracking-wider">Notifikasi</span>
                    <span
                        v-if="unreadCount > 0"
                        class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/10 text-primary dark:bg-primary/20"
                    >
                        {{ unreadCount }} Baru
                    </span>
                </div>
                <div class="flex items-center gap-1">
                    <button
                        v-if="unreadCount > 0"
                        type="button"
                        @click="handleMarkAllRead"
                        class="px-2 py-1 rounded-md text-[11px] font-medium text-surface-500 hover:text-primary hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Tandai semua telah dibaca"
                    >
                        <CheckCheck :size="13" />
                        <span>Tandai dibaca</span>
                    </button>
                    <button
                        type="button"
                        @click="closeNotif"
                        class="p-1 rounded-md text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer text-xs"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <!-- Filter Tabs -->
            <div class="px-3 pt-2 pb-1.5 border-b border-surface-100 dark:border-surface-800/80 flex gap-2">
                <button
                    type="button"
                    @click="notifTab = 'all'"
                    :class="[
                        'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                        notifTab === 'all'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                    ]"
                >
                    Semua ({{ notifications.length }})
                </button>
                <button
                    type="button"
                    @click="notifTab = 'unread'"
                    :class="[
                        'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                        notifTab === 'unread'
                            ? 'bg-primary text-white shadow-xs'
                            : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
                    ]"
                >
                    Belum Dibaca ({{ unreadCount }})
                </button>
            </div>
            <!-- List Body -->
            <div class="max-h-[380px] overflow-y-auto divide-y divide-surface-100 dark:divide-surface-800/60">
                <div v-if="displayedNotifications.length === 0" class="py-10 px-4 text-center">
                    <div class="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-2.5 text-surface-400">
                        <Inbox :size="20" />
                    </div>
                    <p class="text-xs font-medium text-surface-700 dark:text-surface-200">
                        {{ notifTab === 'unread' ? 'Semua notifikasi sudah dibaca' : 'Tidak ada notifikasi' }}
                    </p>
                    <p class="text-[11px] text-muted-color mt-0.5">
                        Notifikasi aktivitas pengajuan dan mutasi cuti akan muncul di sini.
                    </p>
                </div>

                <button
                    v-for="notif in displayedNotifications"
                    :key="notif.id"
                    type="button"
                    class="w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer group hover:bg-surface-50 dark:hover:bg-surface-800/60 relative"
                    :class="{
                        'bg-primary-50/25 dark:bg-primary-950/15': !notif.isRead
                    }"
                    @click="handleNotifClick(notif)"
                >
                    <!-- Type Icon Badge -->
                    <div
                        class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs"
                        :class="getIconBadgeClass(notif.type)"
                    >
                        <component :is="getNotifIcon(notif.type)" :size="15" :stroke-width="2" />
                    </div>

                    <!-- Content Details -->
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-1">
                            <div class="flex items-center gap-1.5 min-w-0">
                                <span class="text-xs font-semibold truncate text-surface-900 dark:text-surface-100">
                                    {{ notif.title }}
                                </span>
                                <span
                                    v-if="!notif.isRead"
                                    class="w-2 h-2 rounded-full bg-primary shrink-0"
                                    title="Belum dibaca"
                                ></span>
                            </div>
                            <span class="text-[10px] text-surface-400 dark:text-surface-500 whitespace-nowrap shrink-0">
                                {{ notif.timeAgo }}
                            </span>
                        </div>

                        <p class="text-xs text-surface-600 dark:text-surface-300 leading-snug line-clamp-2 mt-1">
                            {{ notif.message }}
                        </p>

                        <div v-if="notif.requestId" class="mt-1.5 flex items-center gap-1.5">
                            <span class="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                                {{ notif.requestId }}
                            </span>
                            <span class="text-[10px] text-primary group-hover:underline flex items-center gap-0.5">
                                <span>Buka detail</span>
                                <ChevronRight :size="11" />
                            </span>
                        </div>
                    </div>
                </button>
            </div>

            <!-- Footer -->
            <div class="p-2 border-t border-surface-100 dark:border-surface-800 bg-surface-50/60 dark:bg-surface-800/30 text-center">
                <button
                    type="button"
                    @click="navigateFooter"
                    class="w-full py-1.5 text-xs font-semibold text-primary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                    <span>{{ footerNavText }}</span>
                    <ChevronRight :size="13" />
                </button>
            </div>
        </div>

        <div v-if="notifOpen" class="fixed inset-0 z-40" @click="closeNotif"></div>
    </div>

    <!-- Live Detail Dialog directly from notification -->
    <LeaveDetailDialog
        v-model:visible="isDetailDialogVisible"
        :request="selectedRequest"
        @edit="handleDetailEdit"
    />
</template>


