const toggles = document.querySelectorAll('[data-theme-toggle]');
const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

function effectiveTheme() {
    const override = document.documentElement.getAttribute('data-theme');
    if (override === 'light' || override === 'dark') return override;
    return darkMediaQuery.matches ? 'dark' : 'light';
}

function syncToggles() {
    const isDark = effectiveTheme() === 'dark';
    toggles.forEach((toggle) => toggle.setAttribute('aria-pressed', String(isDark)));
}

toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
        const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try {
            localStorage.setItem('theme-override', next);
        } catch (e) {}
        syncToggles();
    });
});

syncToggles();
