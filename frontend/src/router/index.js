import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { currentUser, hasPermission } from '@/service/sicutiService';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            component: AppLayout,
            children: [
                {
                    path: '/',
                    name: 'dashboard',
                    component: () => import('@/views/Dashboard.vue')
                },
                // Karyawan (User)
                {
                    path: '/leave/new',
                    name: 'leave-new',
                    redirect: '/?action=new_leave'
                },
                {
                    path: '/leave/edit/:id',
                    name: 'leave-edit',
                    redirect: (to) => ({ path: '/leave/history', query: { editId: to.params.id } })
                },
                {
                    path: '/leave/history',
                    name: 'leave-history',
                    component: () => import('@/views/sicuti/LeaveHistory.vue')
                },
                {
                    path: '/leave/balance',
                    name: 'leave-balance',
                    component: () => import('@/views/sicuti/LeaveBalance.vue')
                },
                // Approval
                {
                    path: '/approval/pending',
                    name: 'approval-pending',
                    component: () => import('@/views/sicuti/PendingApproval.vue')
                },
                {
                    path: '/approval/history',
                    name: 'approval-history',
                    component: () => import('@/views/sicuti/ApprovalHistory.vue')
                },
                // Admin
                {
                    path: '/admin/monitoring',
                    name: 'admin-monitoring',
                    component: () => import('@/views/sicuti/AdminMonitoring.vue')
                },
                {
                    path: '/admin/balances',
                    name: 'admin-balances',
                    component: () => import('@/views/sicuti/AdminBalances.vue')
                },
                {
                    path: '/admin/employees',
                    name: 'admin-employees',
                    component: () => import('@/views/sicuti/AdminEmployees.vue')
                },
                {
                    path: '/admin/leave-types',
                    name: 'admin-leave-types',
                    component: () => import('@/views/sicuti/AdminLeaveTypes.vue')
                },
                {
                    path: '/admin/holidays',
                    name: 'admin-holidays',
                    component: () => import('@/views/sicuti/AdminHolidays.vue')
                },
                {
                    path: '/admin/approval-flow',
                    name: 'admin-approval-flow',
                    component: () => import('@/views/sicuti/AdminApprovalFlow.vue')
                },
                {
                    path: '/admin/permissions',
                    name: 'admin-permissions',
                    component: () => import('@/views/sicuti/AdminPermissions.vue')
                },
                {
                    path: '/admin/reports',
                    name: 'admin-reports',
                    component: () => import('@/views/sicuti/AdminReports.vue')
                },
                {
                    path: '/admin/accounts',
                    name: 'admin-accounts',
                    component: () => import('@/views/sicuti/AdminAccounts.vue')
                }
            ]
        },
        {
            path: '/auth/login',
            name: 'login',
            component: () => import('@/views/pages/auth/Login.vue')
        },
        {
            path: '/:pathMatch(.*)*',
            name: 'notfound',
            component: () => import('@/views/pages/NotFound.vue')
        }
    ]
});

router.beforeEach((to, from, next) => {
    if (to.name !== 'login' && !currentUser.value) {
        next({ name: 'login' });
    } else if (to.name === 'login' && currentUser.value) {
        next({ name: 'dashboard' });
    } else {
        const role = currentUser.value?.role;
        if (to.name === 'leave-new' && !hasPermission(role, 'pengajuan_cuti', 'submit')) {
            next({ name: 'dashboard' });
            return;
        }
        if (to.name === 'leave-history' && !hasPermission(role, 'dokumen_saldo', 'view_history')) {
            next({ name: 'dashboard' });
            return;
        }
        if (to.name === 'leave-balance' && !hasPermission(role, 'dokumen_saldo', 'view_balance')) {
            next({ name: 'dashboard' });
            return;
        }
        next();
    }
});

export default router;
