(function() {
    const RULES = {
        metric: {
            weight: { min: 1, max: 500, label: 'Weight', unit: 'kg' },
            height: { min: 30, max: 300, label: 'Height', unit: 'cm' }
        },
        imperial: {
            weight: { min: 1, max: 1100, label: 'Weight', unit: 'lb' },
            feet: { min: 1, max: 8, label: 'Height (feet)', unit: 'ft' },
            inches: { min: 0, max: 11.9, label: 'Height (inches)', unit: 'in' }
        }
    };

    function isNumber(value) {
        if (value === '' || value === null || value === undefined) return false;
        const num = parseFloat(value);
        return !isNaN(num) && isFinite(num);
    }

    function isPositive(value) {
        if (!isNumber(value)) return false;
        return parseFloat(value) > 0;
    }

    function inRange(value, min, max) {
        if (!isNumber(value)) return false;
        const num = parseFloat(value);
        return num >= min && num <= max;
    }

    function validateField(input, rule) {
        if (!input) return { valid: false, message: 'Input not found' };

        const value = input.value.trim();

        if (value === '') {
            return {
                valid: false,
                message: rule.label + ' is required'
            };
        }

        if (!isNumber(value)) {
            return {
                valid: false,
                message: rule.label + ' must be a number'
            };
        }

        if (!isPositive(value)) {
            return {
                valid: false,
                message: rule.label + ' must be greater than 0'
            };
        }

        if (!inRange(value, rule.min, rule.max)) {
            return {
                valid: false,
                message: rule.label + ' must be between ' + rule.min + ' and ' + rule.max + ' ' + rule.unit
            };
        }

        return { valid: true, message: '' };
    }

    function validateMetricForm() {
        const weightInput = document.getElementById('metricWeight');
        const heightInput = document.getElementById('metricHeight');

        const weightResult = validateField(weightInput, RULES.metric.weight);
        const heightResult = validateField(heightInput, RULES.metric.height);

        const errors = [];
        if (!weightResult.valid) errors.push(weightResult.message);
        if (!heightResult.valid) errors.push(heightResult.message);

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    function validateImperialForm() {
        const weightInput = document.getElementById('imperialWeight');
        const feetInput = document.getElementById('imperialFeet');
        const inchesInput = document.getElementById('imperialInches');

        const weightResult = validateField(weightInput, RULES.imperial.weight);
        const feetResult = validateField(feetInput, RULES.imperial.feet);
        const inchesResult = validateField(inchesInput, RULES.imperial.inches);

        const errors = [];
        if (!weightResult.valid) errors.push(weightResult.message);
        if (!feetResult.valid) errors.push(feetResult.message);
        if (!inchesResult.valid) errors.push(inchesResult.message);

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    function validateBMIResult(bmi) {
        if (!isNumber(bmi)) {
            return { valid: false, message: 'Invalid BMI value' };
        }
        const num = parseFloat(bmi);
        if (num < 5 || num > 100) {
            return {
                valid: false,
                message: 'BMI value seems unrealistic. Please check your inputs.'
            };
        }
        return { valid: true, message: '' };
    }

    function showFieldError(input, message) {
        if (!input) return;
        input.classList.add('input-error');

        let errorEl = input.parentElement.querySelector('.field-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'field-error';
            input.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = message;
    }

    function clearFieldError(input) {
        if (!input) return;
        input.classList.remove('input-error');

        const errorEl = input.parentElement.querySelector('.field-error');
        if (errorEl) {
            errorEl.remove();
        }
    }

    function clearAllFieldErrors() {
        document.querySelectorAll('.input-error').forEach(function(input) {
            input.classList.remove('input-error');
        });
        document.querySelectorAll('.field-error').forEach(function(el) {
            el.remove();
        });
    }

    function attachLiveValidation(inputId, rule) {
        const input = document.getElementById(inputId);
        if (!input) return;

        input.addEventListener('input', function() {
            clearFieldError(this);
        });

        input.addEventListener('blur', function() {
            const value = this.value.trim();
            if (value === '') {
                clearFieldError(this);
                return;
            }
            const result = validateField(this, rule);
            if (!result.valid) {
                showFieldError(this, result.message);
            } else {
                clearFieldError(this);
            }
        });
    }

    function attachLiveValidationMetric() {
        attachLiveValidation('metricWeight', RULES.metric.weight);
        attachLiveValidation('metricHeight', RULES.metric.height);
    }

    function attachLiveValidationImperial() {
        attachLiveValidation('imperialWeight', RULES.imperial.weight);
        attachLiveValidation('imperialFeet', RULES.imperial.feet);
        attachLiveValidation('imperialInches', RULES.imperial.inches);
    }

    function preventInvalidChars(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;

        input.addEventListener('keypress', function(e) {
            const char = String.fromCharCode(e.which);
            if (!/[0-9.]/.test(char)) {
                e.preventDefault();
            }
            if (char === '.' && this.value.includes('.')) {
                e.preventDefault();
            }
        });

        input.addEventListener('paste', function(e) {
            const pasted = (e.clipboardData || window.clipboardData).getData('text');
            if (!/^[0-9]*\.?[0-9]*$/.test(pasted)) {
                e.preventDefault();
            }
        });
    }

    function init() {
        attachLiveValidationMetric();
        attachLiveValidationImperial();
        preventInvalidChars('metricWeight');
        preventInvalidChars('metricHeight');
        preventInvalidChars('imperialWeight');
        preventInvalidChars('imperialFeet');
        preventInvalidChars('imperialInches');
    }

    window.BMIValidation = {
        metric: validateMetricForm,
        imperial: validateImperialForm,
        bmi: validateBMIResult,
        showError: showFieldError,
        clearError: clearFieldError,
        clearAll: clearAllFieldErrors,
        rules: RULES
    };

    document.addEventListener('DOMContentLoaded', init);
})();