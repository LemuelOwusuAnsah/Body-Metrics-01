(function() {
    const STORAGE_KEY = 'bmi_goal';

    let currentGoal = null;

    function loadGoal() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                currentGoal = JSON.parse(saved);
                return currentGoal;
            }
        } catch (e) {}
        currentGoal = null;
        return null;
    }

    function saveGoal(goal) {
        try {
            if (goal === null) {
                localStorage.removeItem(STORAGE_KEY);
                currentGoal = null;
            } else {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(goal));
                currentGoal = goal;
            }
        } catch (e) {}
    }

    function setGoal(targetWeight, targetBMI, startWeight, startBMI, unit) {
        const goal = {
            targetWeight: parseFloat(targetWeight),
            targetBMI: parseFloat(targetBMI),
            startWeight: parseFloat(startWeight),
            startBMI: parseFloat(startBMI),
            unit: unit || 'metric',
            createdAt: new Date().toISOString()
        };
        saveGoal(goal);
        return goal;
    }

    function clearGoal() {
        saveGoal(null);
    }

    function hasGoal() {
        if (currentGoal === null) {
            loadGoal();
        }
        return currentGoal !== null;
    }

    function getGoal() {
        if (currentGoal === null) {
            loadGoal();
        }
        return currentGoal;
    }

    function calculateProgress(currentWeight, currentBMI) {
        const goal = getGoal();
        if (!goal) return null;

        const startWeight = goal.startWeight;
        const targetWeight = goal.targetWeight;
        const totalToChange = Math.abs(startWeight - targetWeight);
        const changed = Math.abs(startWeight - currentWeight);
        const remaining = Math.abs(currentWeight - targetWeight);

        let percentage = 0;
        if (totalToChange > 0) {
            percentage = (changed / totalToChange) * 100;
        }
        if (percentage > 100) percentage = 100;
        if (percentage < 0) percentage = 0;

        const isLoss = targetWeight < startWeight;
        const isGain = targetWeight > startWeight;
        const reached = isLoss ? currentWeight <= targetWeight : currentWeight >= targetWeight;

        return {
            percentage: parseFloat(percentage.toFixed(1)),
            currentWeight: currentWeight,
            currentBMI: currentBMI,
            startWeight: startWeight,
            startBMI: goal.startBMI,
            targetWeight: targetWeight,
            targetBMI: goal.targetBMI,
            remaining: parseFloat(remaining.toFixed(1)),
            changed: parseFloat(changed.toFixed(1)),
            totalToChange: parseFloat(totalToChange.toFixed(1)),
            isLoss: isLoss,
            isGain: isGain,
            reached: reached,
            unit: goal.unit
        };
    }

    function estimateTimeToGoal(currentWeight, weeklyRate) {
        const goal = getGoal();
        if (!goal) return null;

        const targetWeight = goal.targetWeight;
        const remaining = Math.abs(currentWeight - targetWeight);
        const rate = parseFloat(weeklyRate) || 1;

        if (rate <= 0) return null;

        const weeks = Math.ceil(remaining / rate);

        return {
            weeks: weeks,
            months: parseFloat((weeks / 4.33).toFixed(1)),
            rate: rate,
            remaining: parseFloat(remaining.toFixed(1))
        };
    }

    function calculateTargetBMI(targetWeight, height, unit) {
        const w = parseFloat(targetWeight);
        if (isNaN(w) || w <= 0) return 0;

        if (unit === 'imperial') {
            const h = parseFloat(height);
            if (isNaN(h) || h <= 0) return 0;
            return parseFloat(((w / (h * h)) * 703).toFixed(1));
        } else {
            const hMetres = parseFloat(height) / 100;
            if (isNaN(hMetres) || hMetres <= 0) return 0;
            return parseFloat((w / (hMetres * hMetres)).toFixed(1));
        }
    }

    function getWeightForBMI(targetBMI, height, unit) {
        const bmi = parseFloat(targetBMI);
        if (isNaN(bmi) || bmi <= 0) return 0;

        if (unit === 'imperial') {
            const h = parseFloat(height);
            if (isNaN(h) || h <= 0) return 0;
            return parseFloat(((bmi * h * h) / 703).toFixed(1));
        } else {
            const hMetres = parseFloat(height) / 100;
            if (isNaN(hMetres) || hMetres <= 0) return 0;
            return parseFloat((bmi * hMetres * hMetres).toFixed(1));
        }
    }

    function renderGoalPanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!hasGoal()) {
            container.innerHTML = renderEmptyState();
            attachEmptyStateHandlers(container);
            return;
        }

        const goal = getGoal();
        container.innerHTML = renderGoalState(goal);
        attachGoalStateHandlers(container);
    }

    function renderEmptyState() {
        return [
            '<div class="goal-empty">',
            '  <div class="goal-empty-icon"><i class="bi bi-bullseye"></i></div>',
            '  <h3 class="goal-empty-title">Set Your Target Weight</h3>',
            '  <p class="goal-empty-desc">Track your progress toward your health goal with visual feedback and milestones.</p>',
            '  <button class="btn-set-goal" id="openGoalFormBtn">',
            '    <i class="bi bi-plus-circle"></i> Set Goal',
            '  </button>',
            '</div>',
            '<div class="goal-form hidden" id="goalForm">',
            '  <h4 class="goal-form-title">Set Your Goal</h4>',
            '  <div class="goal-form-row">',
            '    <label>Target Weight</label>',
            '    <input type="number" id="goalTargetWeight" step="0.1" min="1" placeholder="e.g. 70">',
            '  </div>',
            '  <div class="goal-form-row">',
            '    <label>Target BMI (optional)</label>',
            '    <input type="number" id="goalTargetBMI" step="0.1" min="5" max="50" placeholder="e.g. 22">',
            '  </div>',
            '  <div class="goal-form-row">',
            '    <label>Your Current Weight</label>',
            '    <input type="number" id="goalStartWeight" step="0.1" min="1" placeholder="e.g. 85">',
            '  </div>',
            '  <div class="goal-form-row">',
            '    <label>Your Current BMI</label>',
            '    <input type="number" id="goalStartBMI" step="0.1" min="5" max="50" placeholder="e.g. 27.5">',
            '  </div>',
            '  <div class="goal-form-row">',
            '    <label>Unit</label>',
            '    <select id="goalUnit">',
            '      <option value="metric">Metric (kg)</option>',
            '      <option value="imperial">Imperial (lb)</option>',
            '    </select>',
            '  </div>',
            '  <div class="goal-form-actions">',
            '    <button class="btn-cancel-goal" id="cancelGoalBtn">Cancel</button>',
            '    <button class="btn-save-goal" id="saveGoalBtn">Save Goal</button>',
            '  </div>',
            '</div>'
        ].join('');
    }

    function renderGoalState(goal) {
        const unitLabel = goal.unit === 'imperial' ? 'lb' : 'kg';
        return [
            '<div class="goal-active">',
            '  <div class="goal-header">',
            '    <div class="goal-header-icon"><i class="bi bi-bullseye"></i></div>',
            '    <div class="goal-header-text">',
            '      <h3 class="goal-title">Active Goal</h3>',
            '      <p class="goal-subtitle">Target: ' + goal.targetWeight + ' ' + unitLabel + '</p>',
            '    </div>',
            '    <button class="goal-clear-btn" id="clearGoalBtn" aria-label="Clear goal">',
            '      <i class="bi bi-x-lg"></i>',
            '    </button>',
            '  </div>',
            '  <div class="goal-progress-wrapper">',
            '    <div class="goal-progress-track">',
            '      <div class="goal-progress-fill" id="goalProgressFill" style="width: 0%"></div>',
            '    </div>',
            '    <div class="goal-progress-label" id="goalProgressLabel">0%</div>',
            '  </div>',
            '  <div class="goal-stats" id="goalStats"></div>',
            '  <div class="goal-message" id="goalMessage"></div>',
            '</div>'
        ].join('');
    }

    function attachEmptyStateHandlers(container) {
        const openBtn = container.querySelector('#openGoalFormBtn');
        const cancelBtn = container.querySelector('#cancelGoalBtn');
        const saveBtn = container.querySelector('#saveGoalBtn');
        const form = container.querySelector('#goalForm');

        if (openBtn && form) {
            openBtn.addEventListener('click', function() {
                form.classList.remove('hidden');
                openBtn.parentElement.classList.add('hidden');
            });
        }

        if (cancelBtn && form) {
            cancelBtn.addEventListener('click', function() {
                form.classList.add('hidden');
                const empty = container.querySelector('.goal-empty');
                if (empty) empty.classList.remove('hidden');
            });
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                const targetWeight = parseFloat(container.querySelector('#goalTargetWeight').value);
                const targetBMI = parseFloat(container.querySelector('#goalTargetBMI').value) || 0;
                const startWeight = parseFloat(container.querySelector('#goalStartWeight').value);
                const startBMI = parseFloat(container.querySelector('#goalStartBMI').value) || 0;
                const unit = container.querySelector('#goalUnit').value;

                if (isNaN(targetWeight) || targetWeight <= 0) {
                    showToast('Enter a valid target weight', 'warning');
                    return;
                }
                if (isNaN(startWeight) || startWeight <= 0) {
                    showToast('Enter your current weight', 'warning');
                    return;
                }

                setGoal(targetWeight, targetBMI, startWeight, startBMI, unit);
                showToast('Goal set successfully', 'success');
                renderGoalPanel(container.id);
            });
        }
    }

    function attachGoalStateHandlers(container) {
        const clearBtn = container.querySelector('#clearGoalBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                if (confirm('Clear your goal?')) {
                    clearGoal();
                    renderGoalPanel(container.id);
                    showToast('Goal cleared', 'info');
                }
            });
        }
    }

    function updateProgress(currentWeight, currentBMI) {
        const container = document.getElementById('goalPanel');
        if (!container || !hasGoal()) return;

        const progress = calculateProgress(currentWeight, currentBMI);
        if (!progress) return;

        const fill = document.getElementById('goalProgressFill');
        const label = document.getElementById('goalProgressLabel');
        const stats = document.getElementById('goalStats');
        const message = document.getElementById('goalMessage');

        if (fill) fill.style.width = progress.percentage + '%';
        if (label) label.textContent = progress.percentage + '%';

        const unitLabel = progress.unit === 'imperial' ? 'lb' : 'kg';

        if (stats) {
            const direction = progress.isLoss ? 'lose' : (progress.isGain ? 'gain' : 'maintain');
            stats.innerHTML = [
                '<div class="goal-stat">',
                '  <div class="goal-stat-value">' + progress.currentWeight + '</div>',
                '  <div class="goal-stat-label">Current (' + unitLabel + ')</div>',
                '</div>',
                '<div class="goal-stat">',
                '  <div class="goal-stat-value">' + progress.targetWeight + '</div>',
                '  <div class="goal-stat-label">Target (' + unitLabel + ')</div>',
                '</div>',
                '<div class="goal-stat">',
                '  <div class="goal-stat-value">' + progress.remaining + '</div>',
                '  <div class="goal-stat-label">Remaining (' + unitLabel + ')</div>',
                '</div>',
                '<div class="goal-stat">',
                '  <div class="goal-stat-value">' + progress.changed + '</div>',
                '  <div class="goal-stat-label">Changed (' + unitLabel + ')</div>',
                '</div>'
            ].join('');
        }

        if (message) {
            if (progress.reached) {
                message.className = 'goal-message goal-reached';
                message.innerHTML = '<i class="bi bi-trophy-fill"></i> Goal reached! Congratulations!';
            } else if (progress.percentage >= 75) {
                message.className = 'goal-message goal-close';
                message.innerHTML = '<i class="bi bi-fire"></i> You are ' + progress.percentage + '% there. Keep going!';
            } else if (progress.percentage >= 50) {
                message.className = 'goal-message goal-half';
                message.innerHTML = '<i class="bi bi-lightning-fill"></i> Halfway there. Stay consistent!';
            } else if (progress.percentage >= 25) {
                message.className = 'goal-message goal-progress';
                message.innerHTML = '<i class="bi bi-graph-up"></i> You are making progress. Keep it up!';
            } else {
                message.className = 'goal-message goal-start';
                message.innerHTML = '<i class="bi bi-flag-fill"></i> Every journey begins with a single step.';
            }
        }
    }

    function showToast(message, type) {
        const existing = document.querySelector('.goal-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'goal-toast goal-toast-' + (type || 'info');
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
        loadGoal();
        renderGoalPanel('goalPanel');
    }

    window.BMIGoals = {
        set: setGoal,
        clear: clearGoal,
        get: getGoal,
        has: hasGoal,
        progress: calculateProgress,
        estimate: estimateTimeToGoal,
        targetBMI: calculateTargetBMI,
        weightForBMI: getWeightForBMI,
        render: renderGoalPanel,
        update: updateProgress
    };

    document.addEventListener('DOMContentLoaded', init);
})();