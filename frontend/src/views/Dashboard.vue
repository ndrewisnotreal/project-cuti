<script setup>
import { activeRole } from '@/service/sicutiService';
import UserDashboard from './sicuti/UserDashboard.vue';
import ApprovalDashboard from './sicuti/ApprovalDashboard.vue';
import AdminDashboard from './sicuti/AdminDashboard.vue';
</script>

<template>
    <div>
        <UserDashboard v-if="activeRole === 'user'" />
        <ApprovalDashboard v-else-if="activeRole === 'approval'" />
        <AdminDashboard v-else />
    </div>
</template>
