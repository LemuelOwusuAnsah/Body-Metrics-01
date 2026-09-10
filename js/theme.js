(function() {
    const STORAGE_KEY = 'bmi_theme';
    const LIGHT = 'light';
    const DARK = 'dark';

    function getSavedTheme() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === LIGHT || saved === DARK) {
                return saved;
            }
        } catch (e) {}
        return null;
    }

    function getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return DARK;
        }
        return LIGHT;
    }

    function getCurrentTheme() {
        const attr = document.documentElement.getAttribute('data-bs-theme');
        if (attr === LIGHT || attr === DARK) {
            return attr;
        }
        return LIGHT;
    }

    function applyTheme(theme) {
        if (theme !== LIGHT && theme !== DARK) {
            theme = LIGHT;
        }
        document.documentElement.setAttribute('data-bs-theme', theme);
        updateToggleIcon(theme);
        updateMetaThemeColor(theme);
        saveTheme(theme);
        dispatchThemeChange(theme);
    }

    function saveTheme(theme) {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {}
    }

    function updateToggleIcon(theme) {
        const btn = document.getElementById('themeToggleBtn');
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (!icon) return;
        if (theme === DARK) {
            icon.className = 'bi bi-sun-fill';
        } else {
            icon.className = 'bi bi-moon-fill';
        }
    }

    function updateMetaThemeColor(theme) {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) return;
        if (theme === DARK) {
            meta.setAttribute('content', '#0f172a');
        } else {
            meta.setAttribute('content', '#7dbd1a');
        }
    }

    function dispatchThemeChange(theme) {
        const event = new CustomEvent('themechange', { detail: { theme: theme } });
        document.dispatchEvent(event);
    }

    function toggleTheme() {
        const current = getCurrentTheme();
        const next = current === DARK ? LIGHT : DARK;
        applyTheme(next);
    }

    function initTheme() {
        const saved = getSavedTheme();
        const system = getSystemTheme();
        const initial = saved || system;
        document.documentElement.setAttribute('data-bs-theme', initial);
        updateToggleIcon(initial);
        updateMetaThemeColor(initial);
    }

    function createToggleButton() {
        const existing = document.getElementById('themeToggleBtn');
        if (existing) return existing;

        const btn = document.createElement('button');
        btn.id = 'themeToggleBtn';
        btn.className = 'theme-toggle-btn';
        btn.setAttribute('aria-label', 'Toggle dark mode');
        btn.innerHTML = '<i class="bi bi-moon-fill"></i>';
        document.body.appendChild(btn);

        btn.addEventListener('click', toggleTheme);

        return btn;
    }

    function watchSystemTheme() {
        if (!window.matchMedia) return;
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = function(e) {
            if (!getSavedTheme()) {
                applyTheme(e.matches ? DARK : LIGHT);
            }
        };
        if (media.addEventListener) {
            media.addEventListener('change', listener);
        } else if (media.addListener) {
            media.addListener(listener);
        }
    }

    function init() {
        initTheme();
        createToggleButton();
        updateToggleIcon(getCurrentTheme());
        watchSystemTheme();
    }

    window.BMITheme = {
        init: init,
        toggle: toggleTheme,
        apply: applyTheme,
        current: getCurrentTheme,
        isDark: function() {
            return getCurrentTheme() === DARK;
        },
        isLight: function() {
            return getCurrentTheme() === LIGHT;
        }
    };

    document.addEventListener('DOMContentLoaded', init);
})();