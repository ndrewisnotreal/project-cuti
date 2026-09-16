<script setup></script>

<template>
    <div class="flex items-center justify-center min-h-screen bg-surface-50 dark:bg-surface-950 px-4">
        <div class="w-full max-w-md bg-surface-0 dark:bg-surface-900 rounded-2xl p-8 text-center shadow-sm border border-surface-200 dark:border-surface-800">
            <div class="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <i class="pi pi-exclamation-triangle text-3xl"></i>
            </div>
            <span class="text-primary font-bold text-4xl block mb-1">404</span>
            <h1 class="text-surface-900 dark:text-surface-0 font-bold text-2xl mb-2">Halaman Tidak Ditemukan</h1>
            <p class="text-muted-color text-sm mb-6">Halaman yang Anda cari tidak tersedia atau URL yang dimasukkan salah.</p>
            <Button as="router-link" label="Kembali ke Dashboard" icon="pi pi-home" to="/" />
        </div>
    </div>
</template>
