<script setup>
import { computed } from 'vue';
import { activeRole, currentUser, sicutiState, hasPermission } from '@/service/sicutiService';
import {
    LayoutDashboard,
    CalendarPlus,
    History,
    Wallet,
    CheckCircle2,
    ListChecks,
    Activity,
    Users,
    User,
    Tag,
    Calendar,
    GitFork,
    ShieldCheck,
    FileSpreadsheet
} from 'lucide-vue-next';

const props = defineProps({
    collapsed: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['item-click']);

const pendingApprovalCount = computed(() => {
    return sicutiState.leaveRequests.filter(
        (r) => r.status === 'submitted' || r.status === 'pending_validation'
    ).length;
});

const model = computed(() => {
    const role = activeRole.value;
    const userRole = currentUser.value?.role;

    if (role === 'user') {
        const userItems = [
            { label: 'Dashboard', icon: LayoutDashboard, to: '/' }
        ];
        if (hasPermission(userRole, 'pengajuan_cuti', 'submit')) {
            userItems.push({ label: 'Ajukan Cuti', icon: CalendarPlus, to: '/leave/new' });
        }
        if (hasPermission(userRole, 'dokumen_saldo', 'view_history')) {
            userItems.push({ label: 'Riwayat Cuti', icon: History, to: '/leave/history' });
        }
        if (hasPermission(userRole, 'dokumen_saldo', 'view_balance')) {
            userItems.push({ label: 'Saldo Cuti', icon: Wallet, to: '/leave/balance' });
        }
        return [
            {
                label: 'Menu Utama',
                items: [
                    { label: 'Dashboard', icon: LayoutDashboard, to: '/' }
                ]
            },
            {
                label: 'Manajemen Cuti',
                items: userItems.slice(1)
            }
        ];
    }

    if (role === 'approval') {
        const approvalItems = [
            { label: 'Dashboard Approval', icon: LayoutDashboard, to: '/' }
        ];
        if (hasPermission(userRole, 'approval', 'view_requests') || hasPermission(userRole, 'approval', 'validate')) {
            approvalItems.push({
                label: 'Menunggu Validasi',
                icon: CheckCircle2,
                to: '/approval/pending',
                badge: pendingApprovalCount.value > 0 ? pendingApprovalCount.value : null
            });
        }
        if (hasPermission(userRole, 'approval', 'view_requests')) {
            approvalItems.push({
                label: 'Riwayat Persetujuan',
                icon: ListChecks,
                to: '/approval/history'
            });
        }

        return [
            {
                label: 'Persetujuan (Approval)',
                items: approvalItems
            }
        ];
    }

    return [
        {
            label: 'Monitoring & Operasional',
            items: [
                { label: 'Dashboard Admin', icon: LayoutDashboard, to: '/' },
                { label: 'Monitoring Pengajuan', icon: Activity, to: '/admin/monitoring' },
                { label: 'Kelola Saldo Cuti', icon: Wallet, to: '/admin/balances' }
            ]
        },
        {
            label: 'Master Data & Pengaturan',
            items: [
                { label: 'Data Karyawan', icon: Users, to: '/admin/employees' },
                { label: 'Akun Pengguna', icon: User, to: '/admin/accounts' },
                { label: 'Jenis Cuti', icon: Tag, to: '/admin/leave-types' },
                { label: 'Hari Libur', icon: Calendar, to: '/admin/holidays' },
                { label: 'Alur Approval', icon: GitFork, to: '/admin/approval-flow' },
                { label: 'Hak Akses & Permission', icon: ShieldCheck, to: '/admin/permissions' }
            ]
        },
        {
            label: 'Laporan',
            items: [
                { label: 'Laporan & Export Data', icon: FileSpreadsheet, to: '/admin/reports' }
            ]
        }
    ];
});
</script>

<template>
    <nav class="flex flex-col gap-3">
        <div v-for="(group, gIdx) in model" :key="group.label" class="flex flex-col">
            <!-- Group Header (Expanded) -->
            <div
                class="text-[11px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500 px-3 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out select-none"
                :class="collapsed ? 'opacity-0 max-h-0 mb-0 pointer-events-none' : 'opacity-100 max-h-6 mb-1.5'"
            >
                {{ group.label }}
            </div>

            <!-- Divider (Collapsed) -->
            <div
                v-if="gIdx > 0"
                class="border-t border-surface-200 dark:border-surface-800 mx-2 transition-all duration-300 ease-in-out overflow-hidden"
                :class="collapsed ? 'my-2 opacity-100 max-h-2' : 'my-0 opacity-0 max-h-0'"
            />

            <!-- Items -->
            <div class="flex flex-col gap-1">
                <router-link
                    v-for="item in group.items"
                    :key="item.to"
                    :to="item.to"
                    @click="emit('item-click')"
                    :title="collapsed ? item.label : undefined"
                    class="flex items-center h-10 px-3 rounded-xl transition-colors cursor-pointer relative group text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-800 overflow-hidden"
                    exact-active-class="!bg-primary/10 !text-primary dark:!bg-primary/20 dark:!text-primary-300 font-semibold"
                >
                    <div class="w-5 h-5 flex items-center justify-center shrink-0">
                        <component
                            :is="item.icon"
                            :size="19"
                            :stroke-width="1.75"
                            class="text-surface-500 dark:text-surface-400 group-hover:text-primary transition-colors"
                        />
                    </div>
                    
                    <span
                        class="ml-3 text-xs font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out flex-1"
                        :class="collapsed ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[180px]'"
                    >
                        {{ item.label }}
                    </span>
                    
                    <!-- Badge (Expanded) -->
                    <span
                        v-if="item.badge"
                        class="whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out"
                        :class="collapsed ? 'opacity-0 max-w-0 p-0 ml-0' : 'opacity-100 px-1.5 py-0.5 ml-2 rounded-full text-[10px] font-bold bg-primary text-white shadow-xs shrink-0'"
                    >
                        {{ item.badge }}
                    </span>

                    <!-- Badge Dot Indicator (Collapsed) -->
                    <span
                        v-if="collapsed && item.badge"
                        class="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-primary ring-2 ring-surface-0 dark:ring-surface-900"
                        :title="`${item.badge} pending`"
                    ></span>
                </router-link>
            </div>
        </div>
    </nav>
</template>
