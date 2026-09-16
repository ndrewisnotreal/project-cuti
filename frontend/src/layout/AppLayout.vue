<script setup>
import { useLayout } from '@/layout/composables/layout';
import AppTopbar from './AppTopbar.vue';
import AppMenu from './AppMenu.vue';

const { mobileMenuOpen, closeMobileMenu, isSidebarCollapsed } = useLayout();
</script>

<template>
    <div class="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950 text-surface-700 dark:text-surface-100 antialiased font-sans">
        <!-- Topbar -->
        <AppTopbar />

        <div class="flex flex-1 w-full">
            <!-- Desktop Collapsible Mini Sidebar -->
            <aside
                :class="[
                    'hidden lg:flex flex-col shrink-0 bg-surface-0 dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 sticky top-16 h-[calc(100vh-4rem)] z-30 select-none overflow-hidden transition-all duration-300 ease-in-out',
                    isSidebarCollapsed ? 'w-[72px]' : 'w-64'
                ]"
            >
                <!-- Menu Items Area -->
                <div class="flex-1 overflow-y-auto overflow-x-hidden p-2.5">
                    <AppMenu :collapsed="isSidebarCollapsed" />
                </div>
            </aside>

            <!-- Mobile Drawer (Pure Navigation) -->
            <Drawer v-model:visible="mobileMenuOpen" header="Navigasi SiCuti" class="!w-72">
                <div class="h-full flex flex-col overflow-y-auto p-1">
                    <AppMenu :collapsed="false" @item-click="closeMobileMenu" />
                </div>
            </Drawer>

            <!-- Main Content Area -->
            <main class="flex-1 min-w-0 p-4 md:p-6 lg:p-8 overflow-x-hidden">
                <div>
                    <router-view />
                </div>
            </main>
        </div>
    </div>
    <Toast />
</template>
