(function() {
    // DOM Elements
    const surface = document.getElementById('calculatorSurface');
    const metricTab = document.getElementById('metricTab');
    const imperialTab = document.getElementById('imperialTab');
    const metricForm = document.getElementById('metricForm');
    const imperialForm = document.getElementById('imperialForm');
    const resultBlock = document.getElementById('resultBlock');
    const bmiNumber = document.getElementById('bmiNumber');
    const bmiCategory = document.getElementById('bmiCategory');
    const bmiDescription = document.getElementById('bmiDescription');
    const scaleMarker = document.getElementById('scaleMarker');
    const metricError = document.getElementById('metricError');
    const imperialError = document.getElementById('imperialError');

    // Check if elements exist
    if (!surface || !metricTab || !imperialTab) {
        console.error('BMI Calculator: Required elements not found');
        return;
    }

    function setUnit(unit) {
        const metricActive = unit === 'metric';
        metricForm.classList.toggle('d-none', !metricActive);
        imperialForm.classList.toggle('d-none', metricActive);
        metricTab.classList.toggle('active', metricActive);
        imperialTab.classList.toggle('active', !metricActive);
        clearErrors();
        resultBlock.classList.add('d-none');
    }

    function clearErrors() {
        metricError.classList.add('d-none');
        imperialError.classList.add('d-none');
        metricError.textContent = '';
        imperialError.textContent = '';
    }

    function showError(errorElement, message) {
        errorElement.textContent = message;
        errorElement.classList.remove('d-none');
        resultBlock.classList.add('d-none');
    }

    function categoryFor(bmi) {
        if (bmi < 18.5) {
            return { title: 'Underweight', detail: 'Below the standard healthy range.' };
        }
        if (bmi < 25) {
            return { title: 'Healthy range', detail: 'Within the standard healthy range.' };
        }
        if (bmi < 30) {
            return { title: 'Overweight', detail: 'Above the standard healthy range.' };
        }
        return { title: 'Obesity range', detail: 'Consider discussing your health goals with a professional.' };
    }

    function displayResult(bmi) {
        const category = categoryFor(bmi);
        const markerPosition = Math.max(2, Math.min(98, ((bmi - 15) / 25) * 100));

        bmiNumber.textContent = bmi.toFixed(1);
        bmiCategory.textContent = category.title;
        bmiDescription.textContent = category.detail;
        scaleMarker.style.left = markerPosition + '%';
        resultBlock.classList.remove('d-none');
    }

    function calculateMetric(event) {
        event.preventDefault();
        clearErrors();

        const weight = parseFloat(document.getElementById('metricWeight').value);
        const heightCm = parseFloat(document.getElementById('metricHeight').value);

        if (!weight || !heightCm || weight <= 0 || heightCm <= 0) {
            showError(metricError, 'Enter a valid weight and height to calculate your BMI.');
            return;
        }

        const heightMetres = heightCm / 100;
        displayResult(weight / (heightMetres * heightMetres));
    }

    function calculateImperial(event) {
        event.preventDefault();
        clearErrors();

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
            showError(imperialError, 'Enter a valid height in inches (0–11.9).');
            return;
        }

        const totalInches = (feet * 12) + inches;
        if (totalInches <= 0) {
            showError(imperialError, 'Your height must be greater than zero.');
            return;
        }

        displayResult((weight / (totalInches * totalInches)) * 703);
    }

    function resetCalculator(form) {
        form.reset();
        clearErrors();
        resultBlock.classList.add('d-none');
    }

    // Unit toggle
    metricTab.addEventListener('click', function() {
        setUnit('metric');
    });

    imperialTab.addEventListener('click', function() {
        setUnit('imperial');
    });

    // Form submissions
    metricForm.addEventListener('submit', calculateMetric);
    imperialForm.addEventListener('submit', calculateImperial);

    // Reset buttons
    document.getElementById('resetMetric').addEventListener('click', function() {
        resetCalculator(metricForm);
    });

    document.getElementById('resetImperial').addEventListener('click', function() {
        resetCalculator(imperialForm);
    });

    // 3D Perspective Effect
    if (surface) {
        surface.addEventListener('mousemove', function(event) {
            const bounds = surface.getBoundingClientRect();
            const x = (event.clientX - bounds.left) / bounds.width;
            const y = (event.clientY - bounds.top) / bounds.height;
            const rotateY = (x - 0.5) * 7;
            const rotateX = (0.5 - y) * 6;
            surface.style.transform = 'rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
        });

        surface.addEventListener('mouseleave', function() {
            surface.style.transform = 'rotateX(0deg) rotateY(0deg)';
        });

        surface.addEventListener('touchmove', function(event) {
            const touch = event.touches[0];
            const bounds = surface.getBoundingClientRect();
            const x = (touch.clientX - bounds.left) / bounds.width;
            const y = (touch.clientY - bounds.top) / bounds.height;
            const rotateY = (x - 0.5) * 5;
            const rotateX = (0.5 - y) * 4;
            surface.style.transform = 'rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg)';
        }, { passive: true });

        surface.addEventListener('touchend', function() {
            surface.style.transform = 'rotateX(0deg) rotateY(0deg)';
        });
    }

    // Dark/Light Mode Toggle
    document.addEventListener('DOMContentLoaded', function() {
        const htmlEl = document.documentElement;
        
        // Check if toggle already exists
        let themeToggle = document.querySelector('.theme-toggle-btn');
        if (!themeToggle) {
            themeToggle = document.createElement('button');
            themeToggle.className = 'btn btn-outline-secondary btn-sm position-fixed bottom-0 end-0 m-3 rounded-circle theme-toggle-btn';
            themeToggle.style.width = '44px';
            themeToggle.style.height = '44px';
            themeToggle.style.zIndex = '1050';
            themeToggle.style.backgroundColor = 'var(--bmi-panel, #151515)';
            themeToggle.style.borderColor = 'var(--bmi-line, #313131)';
            themeToggle.style.color = 'var(--bmi-text, #f5f5f1)';
            themeToggle.style.border = '1px solid var(--bmi-line, #313131)';
            themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
            themeToggle.setAttribute('aria-label', 'Toggle dark mode');
            document.body.appendChild(themeToggle);
        }

        themeToggle.addEventListener('click', function() {
            const currentTheme = htmlEl.getAttribute('data-bs-theme');
            if (currentTheme === 'dark') {
                htmlEl.setAttribute('data-bs-theme', 'light');
                themeToggle.innerHTML = '<i class="bi bi-moon-fill"></i>';
            } else {
                htmlEl.setAttribute('data-bs-theme', 'dark');
                themeToggle.innerHTML = '<i class="bi bi-sun-fill"></i>';
            }
        });
    });

    // License check (simple, non-breaking)
    const footerAttr = document.querySelector('.footer-attribution');
    if (footerAttr && !footerAttr.textContent.includes('Lemuel Owusu-Ansah')) {
        console.warn('License: Attribution removed');
    }

})();