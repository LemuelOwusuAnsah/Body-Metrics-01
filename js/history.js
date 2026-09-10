(function() {
    const STORAGE_KEY = 'bmi_history';

    function loadHistory() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {}
        return [];
    }

    function saveHistory(history) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (e) {}
    }

    function addEntry(entry) {
        const history = loadHistory();
        const newEntry = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            bmi: parseFloat(entry.bmi),
            weight: parseFloat(entry.weight),
            height: parseFloat(entry.height),
            unit: entry.unit || 'metric',
            category: entry.category || 'Unknown',
            timestamp: new Date().toISOString()
        };
        history.push(newEntry);
        if (history.length > 100) {
            history.shift();
        }
        saveHistory(history);
        return newEntry;
    }

    function deleteEntry(id) {
        let history = loadHistory();
        history = history.filter(function(item) {
            return item.id !== id;
        });
        saveHistory(history);
        return history;
    }

    function clearHistory() {
        saveHistory([]);
    }

    function getLatest() {
        const history = loadHistory();
        if (history.length === 0) return null;
        return history[history.length - 1];
    }

    function getStats() {
        const history = loadHistory();
        if (history.length === 0) {
            return { count: 0, average: 0, highest: 0, lowest: 0 };
        }
        let sum = 0;
        let highest = -Infinity;
        let lowest = Infinity;
        history.forEach(function(item) {
            sum += item.bmi;
            if (item.bmi > highest) highest = item.bmi;
            if (item.bmi < lowest) lowest = item.bmi;
        });
        return {
            count: history.length,
            average: parseFloat((sum / history.length).toFixed(1)),
            highest: parseFloat(highest.toFixed(1)),
            lowest: parseFloat(lowest.toFixed(1))
        };
    }

    function formatDate(isoString) {
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }

    function renderHistory(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const history = loadHistory();
        if (history.length === 0) {
            container.innerHTML = '<div class="empty-history">No BMI records yet. Calculate your first BMI!</div>';
            return;
        }

        let html = '';
        history.slice().reverse().forEach(function(item) {
            html += '<div class="history-entry" data-id="' + item.id + '">';
            html += '<div class="history-entry-main">';
            html += '<div class="history-entry-bmi">' + item.bmi + '</div>';
            html += '<div class="history-entry-details">';
            html += '<span class="history-entry-category category-' + item.category.toLowerCase().replace(/\s+/g, '-') + '">' + item.category + '</span>';
            html += '<span class="history-entry-date">' + formatDate(item.timestamp) + '</span>';
            html += '</div>';
            html += '</div>';
            html += '<button class="history-entry-delete" data-delete-id="' + item.id + '" aria-label="Delete entry">';
            html += '<i class="bi bi-trash3"></i>';
            html += '</button>';
            html += '</div>';
        });

        container.innerHTML = html;

        container.querySelectorAll('[data-delete-id]').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.deleteId;
                if (confirm('Delete this record?')) {
                    deleteEntry(id);
                    renderHistory(containerId);
                    if (typeof window.BMICharts !== 'undefined') {
                        window.BMICharts.render();
                    }
                }
            });
        });
    }

    window.BMIHistory = {
        load: loadHistory,
        save: saveHistory,
        add: addEntry,
        delete: deleteEntry,
        clear: clearHistory,
        getLatest: getLatest,
        getStats: getStats,
        formatDate: formatDate,
        render: renderHistory
    };
})();