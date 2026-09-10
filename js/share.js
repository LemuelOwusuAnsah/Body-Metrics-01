(function() {
    function getLatestResult() {
        if (typeof window.BMIHistory !== 'undefined') {
            return window.BMIHistory.getLatest();
        }
        return null;
    }

    function getCurrentResult() {
        const bmiEl = document.getElementById('bmiNumber');
        const categoryEl = document.getElementById('bmiCategory');
        const descEl = document.getElementById('bmiDescription');

        if (!bmiEl || !bmiEl.textContent || bmiEl.textContent.trim() === '') {
            return null;
        }

        return {
            bmi: bmiEl.textContent.trim(),
            category: categoryEl ? categoryEl.textContent.trim() : '',
            description: descEl ? descEl.textContent.trim() : '',
            weight: getInputValue('metricWeight') || getInputValue('imperialWeight'),
            height: getInputValue('metricHeight') || getInputValue('imperialFeet'),
            unit: isImperialActive() ? 'imperial' : 'metric'
        };
    }

    function getInputValue(id) {
        const el = document.getElementById(id);
        return el ? el.value : '';
    }

    function isImperialActive() {
        const imperialTab = document.getElementById('imperialTab');
        return imperialTab && imperialTab.classList.contains('active');
    }

    function buildShareText(result) {
        if (!result) return '';

        let text = '';
        text += 'BMI Calculator - Body Metrics\n';
        text += '================================\n\n';
        text += 'BMI Score: ' + result.bmi + '\n';
        text += 'Category: ' + result.category + '\n';
        if (result.description) {
            text += 'Status: ' + result.description + '\n';
        }
        text += '\n';
        text += 'Calculated on ' + new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }) + '\n';
        text += '================================\n';
        text += 'Apps by Lemuel Owusu-Ansah\n';

        return text;
    }

    function buildShareUrl() {
        const baseUrl = window.location.origin + window.location.pathname;
        return baseUrl;
    }

    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise(function(resolve, reject) {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    }

    function shareResult() {
        const result = getCurrentResult() || getLatestResult();
        if (!result) {
            showToast('Calculate your BMI first', 'warning');
            return;
        }

        const text = buildShareText(result);
        const url = buildShareUrl();

        if (navigator.share) {
            navigator.share({
                title: 'My BMI Result',
                text: text,
                url: url
            }).then(function() {
                showToast('Shared successfully', 'success');
            }).catch(function(err) {
                if (err.name !== 'AbortError') {
                    fallbackCopy(text);
                }
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        copyToClipboard(text).then(function() {
            showToast('Result copied to clipboard', 'success');
        }).catch(function() {
            showCopyDialog(text);
        });
    }

    function shareLink() {
        const url = buildShareUrl();
        if (navigator.share) {
            navigator.share({
                title: 'BMI Calculator - Body Metrics',
                text: 'Track your BMI with this free calculator',
                url: url
            }).catch(function(err) {
                if (err.name !== 'AbortError') {
                    copyToClipboard(url).then(function() {
                        showToast('Link copied', 'success');
                    });
                }
            });
        } else {
            copyToClipboard(url).then(function() {
                showToast('Link copied to clipboard', 'success');
            }).catch(function() {
                showCopyDialog(url);
            });
        }
    }

    function shareViaWhatsApp() {
        const result = getCurrentResult() || getLatestResult();
        const text = result ? buildShareText(result) : 'Check out this BMI calculator';
        const url = 'https://wa.me/?text=' + encodeURIComponent(text);
        window.open(url, '_blank');
    }

    function shareViaTwitter() {
        const result = getCurrentResult() || getLatestResult();
        const text = result ? 'My BMI is ' + result.bmi + ' (' + result.category + '). Track yours:' : 'Track your BMI:';
        const url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(buildShareUrl());
        window.open(url, '_blank');
    }

    function shareViaEmail() {
        const result = getCurrentResult() || getLatestResult();
        const subject = 'My BMI Result';
        const body = result ? buildShareText(result) : 'Check out this BMI calculator';
        const url = 'mailto:?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        window.location.href = url;
    }

    function showCopyDialog(text) {
        const dialog = document.createElement('div');
        dialog.className = 'copy-dialog-overlay';
        dialog.innerHTML = [
            '<div class="copy-dialog">',
            '  <h3>Copy Result</h3>',
            '  <textarea readonly>' + escapeHtml(text) + '</textarea>',
            '  <div class="copy-dialog-actions">',
            '    <button class="btn-copy-close">Close</button>',
            '  </div>',
            '</div>'
        ].join('');

        document.body.appendChild(dialog);

        const textarea = dialog.querySelector('textarea');
        textarea.select();

        dialog.querySelector('.btn-copy-close').addEventListener('click', function() {
            dialog.remove();
        });

        dialog.addEventListener('click', function(e) {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showToast(message, type) {
        const existing = document.querySelector('.share-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'share-toast share-toast-' + (type || 'info');
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
        const shareBtn = document.getElementById('shareResultBtn');
        const linkBtn = document.getElementById('shareLinkBtn');
        const whatsappBtn = document.getElementById('shareWhatsappBtn');
        const twitterBtn = document.getElementById('shareTwitterBtn');
        const emailBtn = document.getElementById('shareEmailBtn');

        if (shareBtn) shareBtn.addEventListener('click', shareResult);
        if (linkBtn) linkBtn.addEventListener('click', shareLink);
        if (whatsappBtn) whatsappBtn.addEventListener('click', shareViaWhatsApp);
        if (twitterBtn) twitterBtn.addEventListener('click', shareViaTwitter);
        if (emailBtn) emailBtn.addEventListener('click', shareViaEmail);
    }

    window.BMIShare = {
        result: shareResult,
        link: shareLink,
        whatsapp: shareViaWhatsApp,
        twitter: shareViaTwitter,
        email: shareViaEmail,
        copyText: copyToClipboard,
        buildText: buildShareText
    };

    document.addEventListener('DOMContentLoaded', init);
})();