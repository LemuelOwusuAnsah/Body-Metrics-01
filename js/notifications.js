(function() {
    const STORAGE_KEY = 'bmi_notifications';
    const CHECK_INTERVAL = 60000;
    const DAYS_BETWEEN_REMINDERS = 7;

    let permissionStatus = 'default';
    let checkInterval = null;

    function loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {}
        return {
            enabled: false,
            lastReminder: null,
            frequency: DAYS_BETWEEN_REMINDERS,
            reminderTime: '09:00'
        };
    }

    function saveSettings(settings) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {}
    }

    function isSupported() {
        return 'Notification' in window;
    }

    function getPermission() {
        if (!isSupported()) return 'unsupported';
        return Notification.permission;
    }

    function requestPermission() {
        if (!isSupported()) {
            showToast('Notifications not supported in this browser', 'warning');
            return Promise.resolve('unsupported');
        }

        return Notification.requestPermission().then(function(result) {
            permissionStatus = result;
            updateUIState();
            if (result === 'granted') {
                showToast('Notifications enabled', 'success');
            } else if (result === 'denied') {
                showToast('Notifications blocked. Check browser settings.', 'warning');
            }
            return result;
        });
    }

    function enableReminders() {
        if (!isSupported()) {
            showToast('Notifications not supported', 'warning');
            return;
        }

        if (Notification.permission === 'granted') {
            const settings = loadSettings();
            settings.enabled = true;
            saveSettings(settings);
            startChecking();
            updateUIState();
            showToast('Weekly reminders enabled', 'success');
            return;
        }

        if (Notification.permission === 'denied') {
            showToast('Please enable notifications in your browser settings', 'warning');
            return;
        }

        requestPermission().then(function(result) {
            if (result === 'granted') {
                const settings = loadSettings();
                settings.enabled = true;
                saveSettings(settings);
                startChecking();
                updateUIState();
                showToast('Weekly reminders enabled', 'success');
            }
        });
    }

    function disableReminders() {
        const settings = loadSettings();
        settings.enabled = false;
        saveSettings(settings);
        stopChecking();
        updateUIState();
        showToast('Reminders disabled', 'info');
    }

    function toggleReminders() {
        const settings = loadSettings();
        if (settings.enabled) {
            disableReminders();
        } else {
            enableReminders();
        }
    }

    function shouldSendReminder() {
        const settings = loadSettings();
        if (!settings.enabled) return false;

        if (!settings.lastReminder) return true;

        const last = new Date(settings.lastReminder);
        const now = new Date();
        const diffDays = (now - last) / (1000 * 60 * 60 * 24);

        return diffDays >= settings.frequency;
    }

    function sendReminder() {
        if (!isSupported() || Notification.permission !== 'granted') return;

        const title = 'Time to log your BMI';
        const options = {
            body: 'Keep track of your health progress. Open BMI Calculator to log today.',
            icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y=".9em" font-size="90"%3E💪%3C/text%3E%3C/svg%3E',
            badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext y=".9em" font-size="90"%3E💪%3C/text%3E%3C/svg%3E',
            tag: 'bmi-reminder',
            renotify: true,
            requireInteraction: false,
            silent: false
        };

        try {
            const notification = new Notification(title, options);

            notification.onclick = function() {
                window.focus();
                notification.close();
            };

            setTimeout(function() {
                notification.close();
            }, 10000);

            const settings = loadSettings();
            settings.lastReminder = new Date().toISOString();
            saveSettings(settings);

        } catch (e) {}
    }

    function checkReminder() {
        if (shouldSendReminder()) {
            sendReminder();
        }
    }

    function startChecking() {
        if (checkInterval) return;
        checkReminder();
        checkInterval = setInterval(checkReminder, CHECK_INTERVAL);
    }

    function stopChecking() {
        if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
        }
    }

    function getNextReminderTime() {
        const settings = loadSettings();
        if (!settings.enabled) return null;

        if (!settings.lastReminder) {
            return new Date();
        }

        const last = new Date(settings.lastReminder);
        const next = new Date(last.getTime() + settings.frequency * 24 * 60 * 60 * 1000);
        return next;
    }

    function formatNextReminder() {
        const next = getNextReminderTime();
        if (!next) return 'Not scheduled';

        const now = new Date();
        const diffMs = next - now;

        if (diffMs <= 0) return 'Due now';

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        if (diffDays > 0) {
            return 'In ' + diffDays + ' day' + (diffDays > 1 ? 's' : '');
        }

        if (diffHours > 0) {
            return 'In ' + diffHours + ' hour' + (diffHours > 1 ? 's' : '');
        }

        return 'Soon';
    }

    function updateUIState() {
        const toggleBtn = document.getElementById('notificationToggleBtn');
        const statusEl = document.getElementById('notificationStatus');
        const nextEl = document.getElementById('notificationNext');
        const iconEl = document.getElementById('notificationIcon');

        const settings = loadSettings();
        const permission = getPermission();

        if (toggleBtn) {
            if (settings.enabled && permission === 'granted') {
                toggleBtn.classList.add('active');
                toggleBtn.innerHTML = '<i class="bi bi-bell-fill"></i> Reminders On';
            } else {
                toggleBtn.classList.remove('active');
                toggleBtn.innerHTML = '<i class="bi bi-bell-slash"></i> Enable Reminders';
            }
        }

        if (iconEl) {
            if (settings.enabled && permission === 'granted') {
                iconEl.className = 'bi bi-bell-fill notification-icon-active';
            } else {
                iconEl.className = 'bi bi-bell-slash notification-icon-inactive';
            }
        }

        if (statusEl) {
            if (!isSupported()) {
                statusEl.textContent = 'Not supported in this browser';
                statusEl.className = 'notification-status notification-status-warning';
            } else if (permission === 'denied') {
                statusEl.textContent = 'Blocked by browser settings';
                statusEl.className = 'notification-status notification-status-danger';
            } else if (settings.enabled && permission === 'granted') {
                statusEl.textContent = 'Active';
                statusEl.className = 'notification-status notification-status-active';
            } else {
                statusEl.textContent = 'Disabled';
                statusEl.className = 'notification-status notification-status-inactive';
            }
        }

        if (nextEl) {
            if (settings.enabled && permission === 'granted') {
                nextEl.textContent = formatNextReminder();
            } else {
                nextEl.textContent = '--';
            }
        }
    }

    function showToast(message, type) {
        const existing = document.querySelector('.notification-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'notification-toast notification-toast-' + (type || 'info');
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function() {
            toast.classList.add('show');
        }, 10);

        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() {
                toast.remove();
            }, 300);
        }, 2500);
    }

    function renderNotificationPanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const settings = loadSettings();
        const permission = getPermission();

        const html = [
            '<div class="notification-panel">',
            '  <div class="notification-header">',
            '    <div class="notification-header-icon">',
            '      <i class="bi bi-bell notification-icon" id="notificationIcon"></i>',
            '    </div>',
            '    <div class="notification-header-text">',
            '      <h4 class="notification-title">Weekly Reminders</h4>',
            '      <p class="notification-desc">Get notified to log your BMI every week</p>',
            '    </div>',
            '  </div>',
            '  <div class="notification-info">',
            '    <div class="notification-info-row">',
            '      <span class="notification-info-label">Status:</span>',
            '      <span class="notification-status" id="notificationStatus">Disabled</span>',
            '    </div>',
            '    <div class="notification-info-row">',
            '      <span class="notification-info-label">Next reminder:</span>',
            '      <span class="notification-next" id="notificationNext">--</span>',
            '    </div>',
            '  </div>',
            '  <button class="notification-toggle" id="notificationToggleBtn">',
            '    <i class="bi bi-bell-slash"></i> Enable Reminders',
            '  </button>',
            '</div>'
        ].join('');

        container.innerHTML = html;

        const toggleBtn = document.getElementById('notificationToggleBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleReminders);
        }

        updateUIState();
    }

    function init() {
        permissionStatus = getPermission();
        const settings = loadSettings();
        if (settings.enabled && permissionStatus === 'granted') {
            startChecking();
        }
        renderNotificationPanel('notificationPanel');
        updateUIState();
    }

    window.BMINotifications = {
        enable: enableReminders,
        disable: disableReminders,
        toggle: toggleReminders,
        request: requestPermission,
        isSupported: isSupported,
        permission: getPermission,
        next: getNextReminderTime,
        format: formatNextReminder,
        render: renderNotificationPanel,
        settings: loadSettings
    };

    document.addEventListener('DOMContentLoaded', init);
})();