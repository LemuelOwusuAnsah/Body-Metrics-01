(function() {
    const CATEGORIES = {
        underweight: {
            key: 'underweight',
            name: 'Underweight',
            range: 'Below 18.5',
            color: '#80b9ff',
            icon: 'bi-arrow-down-circle',
            summary: 'Below the standard healthy range.',
            description: 'A BMI below 18.5 may indicate that you are underweight for your height. This can be caused by a variety of factors including genetics, metabolism, or underlying health conditions.',
            risks: [
                'Nutritional deficiencies',
                'Weakened immune system',
                'Bone density loss',
                'Fatigue and low energy',
                'Hormonal imbalances'
            ],
            tips: [
                'Eat nutrient-dense foods regularly',
                'Add healthy fats and proteins to meals',
                'Eat smaller meals more frequently',
                'Consult a nutritionist or doctor',
                'Include strength training in your routine'
            ]
        },
        healthy: {
            key: 'healthy',
            name: 'Healthy range',
            range: '18.5 - 24.9',
            color: '#d5ff3f',
            icon: 'bi-check-circle',
            summary: 'Within the standard healthy range.',
            description: 'A BMI between 18.5 and 24.9 is considered a healthy range for most adults. This suggests that your weight is appropriate for your height.',
            risks: [
                'Low risk of weight-related diseases',
                'Better cardiovascular health',
                'Improved metabolic function'
            ],
            tips: [
                'Maintain a balanced diet',
                'Exercise regularly (150 min/week)',
                'Get 7-9 hours of sleep',
                'Stay hydrated',
                'Manage stress levels'
            ]
        },
        overweight: {
            key: 'overweight',
            name: 'Overweight',
            range: '25 - 29.9',
            color: '#ffc36c',
            icon: 'bi-exclamation-circle',
            summary: 'Above the standard healthy range.',
            description: 'A BMI between 25 and 29.9 is considered overweight. This may increase the risk of certain health conditions, though BMI alone does not determine health.',
            risks: [
                'Increased risk of heart disease',
                'Higher chance of type 2 diabetes',
                'Joint and bone stress',
                'Sleep apnea risk',
                'High blood pressure'
            ],
            tips: [
                'Aim for gradual weight loss (1-2 lbs/week)',
                'Increase physical activity',
                'Reduce processed foods and sugars',
                'Track your calorie intake',
                'Consult a healthcare provider'
            ]
        },
        obese: {
            key: 'obese',
            name: 'Obesity range',
            range: '30 and above',
            color: '#ff8c78',
            icon: 'bi-shield-exclamation',
            summary: 'A result worth discussing with a professional.',
            description: 'A BMI of 30 or higher falls within the obesity range. This significantly increases the risk of various health conditions. Consulting with a healthcare professional is strongly recommended.',
            risks: [
                'High risk of heart disease',
                'Type 2 diabetes',
                'Severe joint problems',
                'Sleep apnea and breathing issues',
                'Certain types of cancer'
            ],
            tips: [
                'Consult a doctor for personalized advice',
                'Set realistic weight loss goals',
                'Start with low-impact exercises',
                'Seek support groups or counseling',
                'Focus on sustainable lifestyle changes'
            ]
        }
    };

    function getCategoryKey(bmi) {
        if (bmi < 18.5) return 'underweight';
        if (bmi < 25) return 'healthy';
        if (bmi < 30) return 'overweight';
        return 'obese';
    }

    function getCategory(bmi) {
        const key = getCategoryKey(bmi);
        return CATEGORIES[key];
    }

    function getCategoryByName(name) {
        const normalized = name.toLowerCase().trim();
        if (normalized.indexOf('under') !== -1) return CATEGORIES.underweight;
        if (normalized.indexOf('healthy') !== -1 || normalized.indexOf('normal') !== -1) return CATEGORIES.healthy;
        if (normalized.indexOf('over') !== -1) return CATEGORIES.overweight;
        if (normalized.indexOf('obes') !== -1) return CATEGORIES.obese;
        return CATEGORIES.healthy;
    }

    function renderEducationalContent(bmi, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const category = getCategory(bmi);

        let risksHtml = '';
        category.risks.forEach(function(risk) {
            risksHtml += '<li>' + risk + '</li>';
        });

        let tipsHtml = '';
        category.tips.forEach(function(tip) {
            tipsHtml += '<li>' + tip + '</li>';
        });

        const html = [
            '<div class="category-info category-' + category.key + '">',
            '  <div class="category-header">',
            '    <div class="category-icon"><i class="bi ' + category.icon + '"></i></div>',
            '    <div class="category-title-block">',
            '      <h3 class="category-name">' + category.name + '</h3>',
            '      <p class="category-range">BMI: ' + category.range + '</p>',
            '    </div>',
            '  </div>',
            '  <p class="category-description">' + category.description + '</p>',
            '  <div class="category-grid">',
            '    <div class="category-block">',
            '      <h4 class="category-block-title"><i class="bi bi-exclamation-triangle"></i> Health Risks</h4>',
            '      <ul class="category-list">' + risksHtml + '</ul>',
            '    </div>',
            '    <div class="category-block">',
            '      <h4 class="category-block-title"><i class="bi bi-lightbulb"></i> Recommendations</h4>',
            '      <ul class="category-list">' + tipsHtml + '</ul>',
            '    </div>',
            '  </div>',
            '  <div class="category-disclaimer">',
            '    <i class="bi bi-info-circle"></i>',
            '    <span>This information is general guidance and does not replace professional medical advice.</span>',
            '  </div>',
            '</div>'
        ].join('');

        container.innerHTML = html;
    }

    function renderAllCategories(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const order = ['underweight', 'healthy', 'overweight', 'obese'];
        let html = '<div class="all-categories-grid">';

        order.forEach(function(key) {
            const cat = CATEGORIES[key];
            html += '<div class="all-category-card category-' + cat.key + '">';
            html += '<div class="all-category-icon"><i class="bi ' + cat.icon + '"></i></div>';
            html += '<h4 class="all-category-name">' + cat.name + '</h4>';
            html += '<p class="all-category-range">' + cat.range + '</p>';
            html += '<p class="all-category-summary">' + cat.summary + '</p>';
            html += '</div>';
        });

        html += '</div>';
        container.innerHTML = html;
    }

    function getCategoryClass(bmi) {
        const category = getCategory(bmi);
        return 'category-' + category.key;
    }

    function getCategoryColor(bmi) {
        const category = getCategory(bmi);
        return category.color;
    }

    function init() {
        renderAllCategories('allCategoriesContainer');
    }

    window.BMICategories = {
        get: getCategory,
        getByKey: function(key) {
            return CATEGORIES[key] || CATEGORIES.healthy;
        },
        getByName: getCategoryByName,
        getKey: getCategoryKey,
        getClass: getCategoryClass,
        getColor: getCategoryColor,
        render: renderEducationalContent,
        renderAll: renderAllCategories,
        all: CATEGORIES
    };

    document.addEventListener('DOMContentLoaded', init);
})();