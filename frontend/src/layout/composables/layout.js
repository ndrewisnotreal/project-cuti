import { ref, computed } from 'vue';

const isDarkTheme = ref(false);
const mobileMenuOpen = ref(false);
const isSidebarCollapsed = ref(false);

export function useLayout() {
    const toggleDarkMode = () => {
        isDarkTheme.value = !isDarkTheme.value;
        document.documentElement.classList.toggle('app-dark', isDarkTheme.value);
    };

    const toggleMobileMenu = () => {
        mobileMenuOpen.value = !mobileMenuOpen.value;
    };

    const closeMobileMenu = () => {
        mobileMenuOpen.value = false;
    };

    const toggleSidebarCollapse = () => {
        isSidebarCollapsed.value = !isSidebarCollapsed.value;
    };

    return {
        isDarkTheme: computed(() => isDarkTheme.value),
        mobileMenuOpen,
        isSidebarCollapsed,
        toggleDarkMode,
        toggleMobileMenu,
        closeMobileMenu,
        toggleSidebarCollapse
    };
}
