<script setup>
import { useLayout } from '@/layout/composables/layout';
import {
    currentUser,
    activeRole,
    switchRole,
    logout,
    sicutiState,
    getNotifications,
    canUserApprove,
    getUser
} from '@/service/sicutiService';
import { useRouter } from 'vue-router';
import { computed, ref } from 'vue';
import {
    Menu as MenuIcon,
    PanelLeftClose,
    PanelLeft,
    CalendarDays,
    User,
    CheckCircle2,
    Moon,
    Sun,
    LogOut,
    Bell
} from 'lucide-vue-next';

const router = useRouter();
const { toggleMobileMenu, toggleDarkMode, isDarkTheme, isSidebarCollapsed, toggleSidebarCollapse } = useLayout();

const userInitials = computed(() => {
    if (!currentUser.value?.name) return 'U';
    return currentUser.value.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('');
});

function handleLogout() {
    logout();
    router.push('/auth/login');
}

const isApproverUser = computed(() => {
    const role = currentUser.value?.role;
    return ['staff_it', 'kepala_it', 'kepala_dept', 'approval'].includes(role);
});

function handleModeChange(mode) {
    switchRole(mode);
    router.push('/');
}

// Notifications
const notifOpen = ref(false);
const notifications = computed(() => {
    if (!currentUser.value) return [];
    return getNotifications(currentUser.value.id, activeRole.value);
});
const notifCount = computed(() => notifications.value.length);

function toggleNotif() { notifOpen.value = !notifOpen.value; }
function closeNotif() { notifOpen.value = false; }

const NOTIF_ROUTE_MAP = { 'admin-monitoring': '/admin/monitoring', pending: '/approval/pending', history: '/leave/history' };
function navigateFromNotif(page) {
    const route = NOTIF_ROUTE_MAP[page];
    if (route) router.push(route);
    notifOpen.value = false;
}

function getNotifStatusClass(status) {
    if (status === 'approved') return 'text-green-600 dark:text-green-400';
    if (status === 'rejected') return 'text-red-600 dark:text-red-400';
    if (status === 'returned') return 'text-orange-500 dark:text-orange-400';
    return 'text-primary';
}

const isAdminRole = computed(() => ['admin', 'admin_sit', 'admin_sis'].includes(activeRole.value));
const isApprovalRole = computed(() => ['staff_it', 'kepala_it', 'kepala_dept', 'approval'].includes(activeRole.value));
</script>

<template>
    <header class="sticky top-0 z-40 w-full h-16 bg-surface-0 dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 px-4 flex items-center justify-between shadow-xs">
        <!-- Left: Mobile Nav + Desktop Sidebar Toggle + Logo/Brand -->
        <div class="flex items-center gap-3">
            <button
                type="button"
                class="lg:hidden p-2 text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors cursor-pointer"
                @click="toggleMobileMenu"
                aria-label="Toggle Navigation"
            >
                <MenuIcon :size="18" :stroke-width="1.75" />
            </button>
            <button
                type="button"
                class="hidden lg:flex p-2 text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors cursor-pointer"
                @click="toggleSidebarCollapse"
                :title="isSidebarCollapsed ? 'Lebarkan Sidebar' : 'Ciutkan Sidebar'"
            >
                <component :is="isSidebarCollapsed ? PanelLeft : PanelLeftClose" :size="18" :stroke-width="1.75" />
            </button>
            <router-link to="/" class="flex items-center gap-2.5">
                <img src="/logo-inalum.png" alt="Logo PT INALUM" class="h-8 w-auto object-contain" />
                <div class="flex flex-col">
                    <span class="font-bold text-base leading-tight text-primary">SiCuti</span>
                    <span class="text-[10px] text-muted-color font-normal">PT Indonesia Asahan Aluminium</span>
                </div>
            </router-link>
        </div>

        <!-- Center: Approver Dual-Mode Switcher -->
        <div v-if="isApproverUser" class="hidden md:flex items-center bg-surface-100 dark:bg-surface-800 p-1 rounded-lg border border-surface-200 dark:border-surface-700">
            <button
                type="button"
                @click="handleModeChange('user')"
                :class="[
                    'px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                    activeRole === 'user' ? 'bg-primary text-white shadow-xs' : 'text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-0'
                ]"
            >
                <User :size="13" :stroke-width="2" />
                <span>Mode Pengajuan</span>
            </button>
            <button
                type="button"
                @click="handleModeChange('approval')"
                :class="[
                    'px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5',
                    activeRole === 'approval' ? 'bg-primary text-white shadow-xs' : 'text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-0'
                ]"
            >
                <CheckCircle2 :size="13" :stroke-width="2" />
                <span>Mode Approval</span>
            </button>
        </div>

        <!-- Right: Persona Switcher + Notif Bell + Dark Mode -->
        <div class="flex items-center gap-2 sm:gap-3">
            <!-- Notification Bell -->
            <div class="relative">
                <button
                    type="button"
                    @click="toggleNotif"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer relative"
                    title="Notifikasi"
                >
                    <Bell :size="16" :stroke-width="1.75" />
                    <span
                        v-if="notifCount > 0"
                        class="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none"
                    >{{ notifCount }}</span>
                </button>
                <!-- Dropdown -->
                <div
                    v-if="notifOpen"
                    class="absolute right-0 top-full mt-2 w-72 bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl shadow-lg z-50 overflow-hidden"
                >
                    <div class="px-4 py-2.5 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
                        <span class="text-xs font-bold text-surface-800 dark:text-surface-100">Notifikasi</span>
                        <button type="button" @click="closeNotif" class="text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 cursor-pointer text-xs">✕</button>
                    </div>
                    <div class="max-h-64 overflow-y-auto">
                        <div v-if="notifications.length === 0" class="px-4 py-6 text-center text-xs text-surface-400">
                            Tidak ada notifikasi baru
                        </div>
                        <button
                            v-for="notif in notifications"
                            :key="notif.id"
                            type="button"
                            class="w-full text-left px-4 py-3 border-b border-surface-100 dark:border-surface-800 last:border-0 hover:bg-surface-50 dark:hover:bg-surface-800/50 cursor-pointer"
                            @click="navigateFromNotif(notif.page)"
                        >
                            <!-- Admin: karyawan mengajukan cuti -->
                            <template v-if="isAdminRole">
                                <p class="text-xs font-semibold text-surface-800 dark:text-surface-100">{{ notif.requesterName }}</p>
                                <p class="text-[10px] text-surface-500 mt-0.5">Mengajukan {{ notif.leaveTypeName }}</p>
                                <p v-if="notif.createdAt" class="text-[10px] text-surface-400 mt-0.5">{{ new Date(notif.createdAt).toLocaleString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) }}</p>
                            </template>
                            <!-- Approval roles: menunggu approval mereka -->
                            <template v-else-if="isApprovalRole">
                                <p class="text-xs font-semibold text-surface-800 dark:text-surface-100">{{ notif.requesterName }}</p>
                                <p class="text-[10px] text-surface-500 mt-0.5">{{ notif.leaveTypeName }} — menunggu approval Anda</p>
                                <p v-if="notif.createdAt" class="text-[10px] text-surface-400 mt-0.5">{{ new Date(notif.createdAt).toLocaleString('id-ID', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) }}</p>
                            </template>
                            <!-- User: notif agregat -->
                            <template v-else>
                                <p class="text-xs font-semibold" :class="getNotifStatusClass(notif.status)">{{ notif.label }}</p>
                            </template>
                        </button>
                    </div>
                </div>
                <div v-if="notifOpen" class="fixed inset-0 z-40" @click="closeNotif"></div>
            </div>

            <!-- Dark Mode Toggle -->
            <button
                type="button"
                @click="toggleDarkMode"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer"
                title="Ganti Tema"
            >
                <Sun v-if="isDarkTheme" :size="16" :stroke-width="1.75" />
                <Moon v-else :size="16" :stroke-width="1.75" />
            </button>
            <!-- Vertical Divider -->
            <div class="h-6 w-px bg-surface-200 dark:bg-surface-800 mx-1 hidden sm:block"></div>

            <!-- Enterprise User Profile Chip -->
            <div class="flex items-center gap-2.5 pl-1">
                <div
                    class="w-8 h-8 rounded-full bg-primary/10 text-primary dark:bg-primary/20 font-bold text-xs flex items-center justify-center border border-primary/20 shrink-0 select-none shadow-xs"
                    :title="currentUser?.name"
                >
                    {{ userInitials }}
                </div>
                <div class="hidden sm:flex flex-col min-w-0 max-w-[130px] leading-tight">
                    <span class="text-xs font-semibold truncate text-surface-900 dark:text-surface-100" :title="currentUser?.name">
                        {{ currentUser?.name || 'Pengguna' }}
                    </span>
                    <span class="text-[10px] text-muted-color truncate font-medium">
                        {{ currentUser?.position || activeRole }}
                    </span>
                </div>
                <button
                    type="button"
                    @click="handleLogout"
                    class="p-1.5 text-surface-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer shrink-0 ml-0.5"
                    title="Keluar / Logout"
                >
                    <LogOut :size="16" :stroke-width="1.75" />
                </button>
            </div>
        </div>
    </header>
</template>
