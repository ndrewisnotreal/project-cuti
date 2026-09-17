<script setup>
import { useLayout } from '@/layout/composables/layout';
import {
    currentUser,
    activeRole,
    switchRole,
    logout
} from '@/service/sicutiService';
import AppNotificationMenu from '@/layout/AppNotificationMenu.vue';
import { useRouter } from 'vue-router';
import { computed } from 'vue';
import {
    Menu as MenuIcon,
    PanelLeftClose,
    PanelLeft,
    User,
    CheckCircle2,
    Moon,
    Sun,
    LogOut
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
                <span class="font-bold text-base leading-tight text-primary">Lebur</span>
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
            <!-- Notification Popover Menu -->
            <AppNotificationMenu />

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
