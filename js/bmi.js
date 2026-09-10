(function() {
    const metricForm = document.getElementById('metricForm');
    const imperialForm = document.getElementById('imperialForm');
    const metricTab = document.getElementById('metricTab');
    const imperialTab = document.getElementById('imperialTab');
    const resultBlock = document.getElementById('resultBlock');
    const bmiNumber = document.getElementById('bmiNumber');
    const bmiCategory = document.getElementById('bmiCategory');
    const bmiDescription = document.getElementById('bmiDescription');
    const scaleMarker = document.getElementById('scaleMarker');
    const metricError = document.getElementById('metricError');
    const imperialError = document.getElementById('imperialError');

    let currentUnit = 'metric';
    let currentBMI = null;
    let currentWeight = null;
    let currentHeight = null;

    function setUnit(unit) {
        currentUnit = unit;
        const metricActive = unit === 'metric';

        metricForm.classList.toggle('d-none', !metricActive);
        imperialForm.classList.toggle('d-none', metricActive);
        metricTab.classList.toggle('active', metricActive);
        imperialTab.classList.toggle('active', !metricActive);

        clearErrors();
        resultBlock.classList.add('d-none');
    }

    function clearErrors() {
        if (metricError) {
            metricError.classList.add('d-none');
            metricError.textContent = '';
        }
        if (imperialError) {
            imperialError.classList.add('d-none');
            imperialError.textContent = '';
        }
        if (typeof window.BMIValidation !== 'undefined') {
            window.BMIValidation.clearAll();
        }
    }

    function showError(errorElement, message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('d-none');
        }
        resultBlock.classList.add('d-none');
    }

    function getCategoryFromBMI(bmi) {
        if (typeof window.BMICategories !== 'undefined') {
            return window.BMICategories.get(bmi);
        }
        if (bmi < 18.5) return { name: 'Underweight', summary: 'Below the standard healthy range.' };
        if (bmi < 25) return { name: 'Healthy range', summary: 'Within the standard healthy range.' };
        if (bmi < 30) return { name: 'Overweight', summary: 'Above the standard healthy range.' };
        return { name: 'Obesity range', summary: 'Consider discussing your health goals with a professional.' };
    }

    function displayResult(bmi, weight, height) {
        const category = getCategoryFromBMI(bmi);
        const markerPosition = Math.max(2, Math.min(98, ((bmi - 15) / 25) * 100));

        currentBMI = bmi;
        currentWeight = weight;
        currentHeight = height;

        if (bmiNumber) bmiNumber.textContent = bmi.toFixed(1);
        if (bmiCategory) bmiCategory.textContent = category.name;
        if (bmiDescription) bmiDescription.textContent = category.summary;
        if (scaleMarker) scaleMarker.style.left = markerPosition + '%';

        if (resultBlock) resultBlock.classList.remove('d-none');

        if (typeof window.BMIHistory !== 'undefined') {
            window.BMIHistory.add({
                bmi: bmi,
                weight: weight,
                height: height,
                unit: currentUnit,
                category: category.name
            });
            window.BMIHistory.render('historyList');
        }

        if (typeof window.BMICharts !== 'undefined') {
            window.BMICharts.reload();
        }

        if (typeof window.BMICategories !== 'undefined') {
            window.BMICategories.render(bmi, 'categoryDetail');
        }

        if (typeof window.BMIGoals !== 'undefined') {
            window.BMIGoals.update(weight, bmi);
        }

        if (typeof window.BMIShare !== 'undefined') {
            const shareBtn = document.getElementById('shareResultBtn');
            if (shareBtn) shareBtn.disabled = false;
        }

        const exportBtns = ['exportCsvBtn', 'exportJsonBtn', 'exportTxtBtn', 'exportPdfBtn'];
        exportBtns.forEach(function(id) {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = false;
        });

        const statsEl = document.getElementById('historyStats');
        if (statsEl && typeof window.BMIHistory !== 'undefined') {
            const stats = window.BMIHistory.getStats();
            statsEl.innerHTML = [
                '<div class="stat-item"><span class="stat-value">' + stats.count + '</span><span class="stat-label">Records</span></div>',
                '<div class="stat-item"><span class="stat-value">' + stats.average + '</span><span class="stat-label">Average</span></div>',
                '<div class="stat-item"><span class="stat-value">' + stats.lowest + '</span><span class="stat-label">Lowest</span></div>',
                '<div class="stat-item"><span class="stat-value">' + stats.highest + '</span><span class="stat-label">Highest</span></div>'
            ].join('');
        }
    }

    function calculateMetric(event) {
        if (event) event.preventDefault();
        clearErrors();

        if (typeof window.BMIValidation !== 'undefined') {
            const validation = window.BMIValidation.metric();
            if (!validation.valid) {
                showError(metricError, validation.errors[0]);
                return;
            }
        }

        const weight = parseFloat(document.getElementById('metricWeight').value);
        const heightCm = parseFloat(document.getElementById('metricHeight').value);

        if (!weight || !heightCm || weight <= 0 || heightCm <= 0) {
            showError(metricError, 'Enter a valid weight and height to calculate your BMI.');
            return;
        }

        const heightMetres = heightCm / 100;
        const bmi = weight / (heightMetres * heightMetres);

        if (typeof window.BMIValidation !== 'undefined') {
            const bmiCheck = window.BMIValidation.bmi(bmi);
            if (!bmiCheck.valid) {
                showError(metricError, bmiCheck.message);
                return;
            }
        }

        displayResult(bmi, weight, heightCm);
    }

    function calculateImperial(event) {
        if (event) event.preventDefault();
        clearErrors();

        if (typeof window.BMIValidation !== 'undefined') {
            const validation = window.BMIValidation.imperial();
            if (!validation.valid) {
                showError(imperialError, validation.errors[0]);
                return;
            }
        }

        const weight = parseFloat(document.getElementById('imperialWeight').value);
        const feet = parseFloat(document.getElementById('imperialFeet').value);
        const inches = parseFloat(document.getElementById('imperialInches').value);

        if (!weight || weight <= 0) {
            showError(imperialError, 'Enter a valid weight.');
            return;
        }

        if (!feet || feet < 0 || isNaN(feet)) {
            showError(imperialError, 'Enter a valid height in feet.');
            return;
        }

        if (isNaN(inches) || inches < 0 || inches >= 12) {
            showError(imperialError, 'Enter a valid height in inches (0-11.9).');
            return;
        }

        const totalInches = (feet * 12) + inches;
        if (totalInches <= 0) {
            showError(imperialError, 'Your height must be greater than zero.');
            return;
        }

        const bmi = (weight / (totalInches * totalInches)) * 703;

        if (typeof window.BMIValidation !== 'undefined') {
            const bmiCheck = window.BMIValidation.bmi(bmi);
            if (!bmiCheck.valid) {
                showError(imperialError, bmiCheck.message);
                return;
            }
        }

        displayResult(bmi, weight, totalInches);
    }

    function resetCalculator(form) {
        if (form) form.reset();
        clearErrors();
        if (resultBlock) resultBlock.classList.add('d-none');
        currentBMI = null;
        currentWeight = null;
        currentHeight = null;

        const shareBtn = document.getElementById('shareResultBtn');
        if (shareBtn) shareBtn.disabled = true;

        const exportBtns = ['exportCsvBtn', 'exportJsonBtn', 'exportTxtBtn', 'exportPdfBtn'];
        exportBtns.forEach(function(id) {
            const btn = document.getElementById(id);
            if (btn) btn.disabled = false;
        });
    }

    function getCurrentResult() {
        if (currentBMI === null) return null;
        return {
            bmi: currentBMI.toFixed(1),
            weight: currentWeight,
            height: currentHeight,
            unit: currentUnit,
            category: getCategoryFromBMI(currentBMI).name,
            description: getCategoryFromBMI(currentBMI).summary
        };
    }

    function attachPersistence() {
        const resultData = {
            bmi: currentBMI,
            weight: currentWeight,
            height: currentHeight,
            unit: currentUnit
        };
        try {
            sessionStorage.setItem('bmi_last_result', JSON.stringify(resultData));
        } catch (e) {}
    }

    function restorePersistence() {
        try {
            const saved = sessionStorage.getItem('bmi_last_result');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.bmi) {
                    currentBMI = data.bmi;
                    currentWeight = data.weight;
                    currentHeight = data.height;
                    currentUnit = data.unit || 'metric';
                    displayResult(data.bmi, data.weight, data.height);
                }
            }
        } catch (e) {}
    }

    function initEventListeners() {
        if (metricTab) metricTab.addEventListener('click', function() { setUnit('metric'); });
        if (imperialTab) imperialTab.addEventListener('click', function() { setUnit('imperial'); });
        if (metricForm) metricForm.addEventListener('submit', calculateMetric);
        if (imperialForm) imperialForm.addEventListener('submit', calculateImperial);

        const resetMetric = document.getElementById('resetMetric');
        const resetImperial = document.getElementById('resetImperial');
        if (resetMetric) resetMetric.addEventListener('click', function() { resetCalculator(metricForm); });
        if (resetImperial) resetImperial.addEventListener('click', function() { resetCalculator(imperialForm); });

        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', function() {
                if (confirm('Clear all BMI history?')) {
                    if (typeof window.BMIHistory !== 'undefined') {
                        window.BMIHistory.clear();
                        window.BMIHistory.render('historyList');
                    }
                    if (typeof window.BMICharts !== 'undefined') {
                        window.BMICharts.reload();
                    }
                    const statsEl = document.getElementById('historyStats');
                    if (statsEl) statsEl.innerHTML = '';
                }
            });
        }
    }

    function init() {
        initEventListeners();
        restorePersistence();

        if (typeof window.BMIHistory !== 'undefined') {
            window.BMIHistory.render('historyList');
            const stats = window.BMIHistory.getStats();
            const statsEl = document.getElementById('historyStats');
            if (statsEl && stats.count > 0) {
                statsEl.innerHTML = [
                    '<div class="stat-item"><span class="stat-value">' + stats.count + '</span><span class="stat-label">Records</span></div>',
                    '<div class="stat-item"><span class="stat-value">' + stats.average + '</span><span class="stat-label">Average</span></div>',
                    '<div class="stat-item"><span class="stat-value">' + stats.lowest + '</span><span class="stat-label">Lowest</span></div>',
                    '<div class="stat-item"><span class="stat-value">' + stats.highest + '</span><span class="stat-label">Highest</span></div>'
                ].join('');
            }
        }

        if (typeof window.BMIGoals !== 'undefined') {
            window.BMIGoals.render('goalPanel');
        }

        if (typeof window.BNotifications !== 'undefined') {
            window.BNotifications.render('notificationPanel');
        }
    }

    window.BMICalc = {
        setUnit: setUnit,
        getCurrentResult: getCurrentResult,
        calculateMetric: calculateMetric,
        calculateImperial: calculateImperial,
        reset: resetCalculator,
        displayResult: displayResult
    };

    document.addEventListener('DOMContentLoaded', init);
})();