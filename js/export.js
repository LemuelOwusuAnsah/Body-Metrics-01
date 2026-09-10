(function() {
    function getHistory() {
        if (typeof window.BMIHistory !== 'undefined') {
            return window.BMIHistory.load();
        }
        return [];
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function getTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return year + '-' + month + '-' + day + '_' + hours + '-' + minutes;
    }

    function exportCSV() {
        const history = getHistory();
        if (history.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }

        let csv = 'Date,BMI,Category,Weight,Height,Unit\n';
        history.forEach(function(item) {
            const date = new Date(item.timestamp).toLocaleString('en-US');
            const category = item.category || 'Unknown';
            const weight = item.weight || '';
            const height = item.height || '';
            const unit = item.unit || 'metric';
            csv += '"' + date + '",' + item.bmi + ',"' + category + '",' + weight + ',' + height + ',' + unit + '\n';
        });

        downloadFile(csv, 'bmi_history_' + getTimestamp() + '.csv', 'text/csv;charset=utf-8;');
        showToast('CSV exported successfully', 'success');
    }

    function exportJSON() {
        const history = getHistory();
        if (history.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }

        const data = {
            app: 'BMI Calculator - Body Metrics',
            exported: new Date().toISOString(),
            author: 'Lemuel Owusu-Ansah',
            totalRecords: history.length,
            records: history
        };

        const json = JSON.stringify(data, null, 2);
        downloadFile(json, 'bmi_history_' + getTimestamp() + '.json', 'application/json;charset=utf-8;');
        showToast('JSON exported successfully', 'success');
    }

    function exportTXT() {
        const history = getHistory();
        if (history.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }

        let txt = 'BMI CALCULATOR - BODY METRICS\n';
        txt += '================================\n';
        txt += 'Exported: ' + new Date().toLocaleString('en-US') + '\n';
        txt += 'Total Records: ' + history.length + '\n';
        txt += '================================\n\n';

        const stats = calculateStats(history);
        txt += 'STATISTICS\n';
        txt += '--------------------------------\n';
        txt += 'Average BMI: ' + stats.average + '\n';
        txt += 'Highest BMI: ' + stats.highest + '\n';
        txt += 'Lowest BMI: ' + stats.lowest + '\n';
        txt += '================================\n\n';

        txt += 'HISTORY\n';
        txt += '--------------------------------\n';
        history.slice().reverse().forEach(function(item, index) {
            const date = new Date(item.timestamp).toLocaleString('en-US');
            txt += (index + 1) + '. ' + date + '\n';
            txt += '   BMI: ' + item.bmi + ' (' + item.category + ')\n';
            if (item.weight) txt += '   Weight: ' + item.weight + '\n';
            if (item.height) txt += '   Height: ' + item.height + '\n';
            txt += '\n';
        });

        txt += '================================\n';
        txt += 'Made with BMI Calculator\n';
        txt += 'Apps by Lemuel Owusu-Ansah\n';

        downloadFile(txt, 'bmi_history_' + getTimestamp() + '.txt', 'text/plain;charset=utf-8;');
        showToast('TXT exported successfully', 'success');
    }

    function calculateStats(history) {
        if (history.length === 0) {
            return { average: 0, highest: 0, lowest: 0 };
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
            average: parseFloat((sum / history.length).toFixed(1)),
            highest: parseFloat(highest.toFixed(1)),
            lowest: parseFloat(lowest.toFixed(1))
        };
    }

    function exportPDF() {
        const history = getHistory();
        if (history.length === 0) {
            showToast('No data to export', 'warning');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showToast('Please allow popups for PDF export', 'warning');
            return;
        }

        const stats = calculateStats(history);
        let rowsHtml = '';
        history.slice().reverse().forEach(function(item) {
            const date = new Date(item.timestamp).toLocaleString('en-US');
            rowsHtml += '<tr>';
            rowsHtml += '<td>' + date + '</td>';
            rowsHtml += '<td>' + item.bmi + '</td>';
            rowsHtml += '<td>' + (item.category || 'Unknown') + '</td>';
            rowsHtml += '<td>' + (item.weight || '-') + '</td>';
            rowsHtml += '<td>' + (item.height || '-') + '</td>';
            rowsHtml += '</tr>';
        });

        const html = '<!DOCTYPE html><html><head><title>BMI History Report</title>';
        html += '<style>';
        html += 'body { font-family: Arial, sans-serif; padding: 30px; color: #333; }';
        html += 'h1 { color: #0d6efd; border-bottom: 3px solid #0d6efd; padding-bottom: 10px; }';
        html += 'h2 { color: #495057; margin-top: 30px; }';
        html += '.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }';
        html += '.stat { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }';
        html += '.stat-value { font-size: 24px; font-weight: bold; color: #0d6efd; }';
        html += '.stat-label { font-size: 12px; color: #6c757d; text-transform: uppercase; margin-top: 5px; }';
        html += 'table { width: 100%; border-collapse: collapse; margin-top: 15px; }';
        html += 'th, td { padding: 10px; text-align: left; border-bottom: 1px solid #dee2e6; }';
        html += 'th { background: #0d6efd; color: white; font-weight: 600; }';
        html += 'tr:nth-child(even) { background: #f8f9fa; }';
        html += '.footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px; }';
        html += '@media print { body { padding: 0; } }';
        html += '</style></head><body>';
        html += '<h1>BMI History Report</h1>';
        html += '<p><strong>Generated:</strong> ' + new Date().toLocaleString('en-US') + '</p>';
        html += '<p><strong>Total Records:</strong> ' + history.length + '</p>';
        html += '<h2>Statistics</h2>';
        html += '<div class="stats">';
        html += '<div class="stat"><div class="stat-value">' + stats.average + '</div><div class="stat-label">Average BMI</div></div>';
        html += '<div class="stat"><div class="stat-value">' + stats.highest + '</div><div class="stat-label">Highest BMI</div></div>';
        html += '<div class="stat"><div class="stat-value">' + stats.lowest + '</div><div class="stat-label">Lowest BMI</div></div>';
        html += '<div class="stat"><div class="stat-value">' + history.length + '</div><div class="stat-label">Total Records</div></div>';
        html += '</div>';
        html += '<h2>History</h2>';
        html += '<table><thead><tr><th>Date</th><th>BMI</th><th>Category</th><th>Weight</th><th>Height</th></tr></thead><tbody>';
        html += rowsHtml;
        html += '</tbody></table>';
        html += '<div class="footer">Made with BMI Calculator &middot; Apps by Lemuel Owusu-Ansah</div>';
        html += '</body></html>';

        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.onload = function() {
            setTimeout(function() {
                printWindow.print();
            }, 300);
        };

        showToast('PDF report opened', 'success');
    }

    function showToast(message, type) {
        const existing = document.querySelector('.export-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'export-toast export-toast-' + (type || 'info');
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

    function init() {
        const csvBtn = document.getElementById('exportCsvBtn');
        const jsonBtn = document.getElementById('exportJsonBtn');
        const txtBtn = document.getElementById('exportTxtBtn');
        const pdfBtn = document.getElementById('exportPdfBtn');

        if (csvBtn) csvBtn.addEventListener('click', exportCSV);
        if (jsonBtn) jsonBtn.addEventListener('click', exportJSON);
        if (txtBtn) txtBtn.addEventListener('click', exportTXT);
        if (pdfBtn) pdfBtn.addEventListener('click', exportPDF);
    }

    window.BMIExport = {
        csv: exportCSV,
        json: exportJSON,
        txt: exportTXT,
        pdf: exportPDF,
        toast: showToast
    };

    document.addEventListener('DOMContentLoaded', init);
})();