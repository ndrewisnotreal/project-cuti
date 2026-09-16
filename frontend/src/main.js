import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { syncFromBackend } from '@/service/sicutiService';

import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import '@/assets/tailwind.css';
import '@/assets/styles.scss';

const InalumPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '#eff8ff',
            100: '#dceeff',
            200: '#b9ddff',
            300: '#82c5f5',
            400: '#3ea7df',
            500: '#0077b8',
            600: '#00649b',
            700: '#004f7d',
            800: '#003b5c',
            900: '#00283f',
            950: '#001a2c'
        },
        colorScheme: {
            light: {
                primary: {
                    color: '#0077b8',
                    inverseColor: '#ffffff',
                    hoverColor: '#00649b',
                    activeColor: '#004f7d'
                },
                highlight: {
                    background: '#eff8ff',
                    focusBackground: '#dceeff',
                    color: '#0077b8',
                    focusColor: '#00649b'
                }
            },
            dark: {
                primary: {
                    color: '#3ea7df',
                    inverseColor: '#00283f',
                    hoverColor: '#82c5f5',
                    activeColor: '#b9ddff'
                },
                highlight: {
                    background: 'rgba(0, 119, 184, 0.16)',
                    focusBackground: 'rgba(0, 119, 184, 0.24)',
                    color: 'rgba(255,255,255,.87)',
                    focusColor: 'rgba(255,255,255,.87)'
                }
            }
        }
    }
});

const app = createApp(App);

app.use(router);
app.use(PrimeVue, {
    theme: {
        preset: InalumPreset,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app');
syncFromBackend();
