import { fileURLToPath, URL } from 'node:url';

import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    server: {
        port: 5174,
        host: true,
        proxy: {
            '/auth': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                bypass(req) {
                    if (req.headers.accept?.includes('text/html')) {
                        return '/index.html';
                    }
                }
            },
            '/sicuti': {
                target: 'http://localhost:3001',
                changeOrigin: true,
                bypass(req) {
                    if (req.headers.accept?.includes('text/html')) {
                        return '/index.html';
                    }
                }
            }
        }
    },
    optimizeDeps: {
        noDiscovery: true
    },
    plugins: [
        vue(),
        tailwindcss(),
        Components({
            resolvers: [PrimeVueResolver()]
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler'
            }
        }
    }
});
