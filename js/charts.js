(function() {
    let chartCanvas = null;
    let chartCtx = null;
    let chartData = [];
    let hoverIndex = -1;
    let animationProgress = 0;
    let animationFrame = null;

    const PADDING = { top: 30, right: 20, bottom: 40, left: 45 };
    const COLORS = {
        line: '#0d6efd',
        lineDark: '#3b82f6',
        point: '#0d6efd',
        pointDark: '#3b82f6',
        grid: 'rgba(0,0,0,0.08)',
        gridDark: 'rgba(255,255,255,0.08)',
        text: '#6c757d',
        textDark: '#adb5bd',
        zoneUnder: 'rgba(128, 185, 255, 0.15)',
        zoneHealthy: 'rgba(213, 255, 63, 0.15)',
        zoneOver: 'rgba(255, 189, 95, 0.15)',
        zoneObese: 'rgba(255, 115, 92, 0.15)'
    };

    function isDarkMode() {
        return document.documentElement.getAttribute('data-bs-theme') === 'dark';
    }

    function getCanvas() {
        if (!chartCanvas) {
            chartCanvas = document.getElementById('bmiChart');
            if (chartCanvas) {
                chartCtx = chartCanvas.getContext('2d');
                setupCanvas();
                setupInteractions();
            }
        }
        return chartCanvas;
    }

    function setupCanvas() {
        if (!chartCanvas) return;
        const rect = chartCanvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        chartCanvas.width = rect.width * dpr;
        chartCanvas.height = 320 * dpr;
        chartCanvas.style.width = rect.width + 'px';
        chartCanvas.style.height = '320px';
        chartCtx.scale(dpr, dpr);
    }

    function setupInteractions() {
        if (!chartCanvas) return;
        chartCanvas.addEventListener('mousemove', handleMouseMove);
        chartCanvas.addEventListener('mouseleave', function() {
            hoverIndex = -1;
            draw();
        });
        chartCanvas.addEventListener('touchmove', handleTouchMove, { passive: true });
        chartCanvas.addEventListener('touchend', function() {
            hoverIndex = -1;
            draw();
        });
        window.addEventListener('resize', function() {
            setupCanvas();
            draw();
        });
    }

    function handleMouseMove(e) {
        const rect = chartCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        hoverIndex = findNearestPoint(x);
        draw();
    }

    function handleTouchMove(e) {
        const rect = chartCanvas.getBoundingClientRect();
        const x = e.touches[0].clientX - rect.left;
        hoverIndex = findNearestPoint(x);
        draw();
    }

    function findNearestPoint(mouseX) {
        if (chartData.length === 0) return -1;
        const rect = chartCanvas.getBoundingClientRect();
        const width = rect.width;
        const chartWidth = width - PADDING.left - PADDING.right;
        const step = chartData.length > 1 ? chartWidth / (chartData.length - 1) : 0;
        let nearest = -1;
        let nearestDist = Infinity;
        chartData.forEach(function(_, index) {
            const pointX = PADDING.left + (chartData.length > 1 ? index * step : chartWidth / 2);
            const dist = Math.abs(pointX - mouseX);
            if (dist < nearestDist && dist < 30) {
                nearestDist = dist;
                nearest = index;
            }
        });
        return nearest;
    }

    function loadData() {
        if (typeof window.BMIHistory !== 'undefined') {
            const history = window.BMIHistory.load();
            chartData = history.map(function(item) {
                return {
                    bmi: item.bmi,
                    date: item.timestamp,
                    category: item.category
                };
            });
        } else {
            chartData = [];
        }
    }

    function getBMIRange() {
        if (chartData.length === 0) return { min: 15, max: 40 };
        let min = Infinity;
        let max = -Infinity;
        chartData.forEach(function(item) {
            if (item.bmi < min) min = item.bmi;
            if (item.bmi > max) max = item.bmi;
        });
        min = Math.floor(min - 2);
        max = Math.ceil(max + 2);
        if (min < 10) min = 10;
        if (max > 50) max = 50;
        return { min: min, max: max };
    }

    function draw() {
        if (!chartCtx || !chartCanvas) return;
        const rect = chartCanvas.getBoundingClientRect();
        const width = rect.width;
        const height = 320;
        const chartWidth = width - PADDING.left - PADDING.right;
        const chartHeight = height - PADDING.top - PADDING.bottom;

        chartCtx.clearRect(0, 0, width, height);

        const dark = isDarkMode();
        const range = getBMIRange();

        drawZones(chartWidth, chartHeight, range, dark);
        drawGrid(chartWidth, chartHeight, range, dark);

        if (chartData.length === 0) {
            chartCtx.fillStyle = dark ? COLORS.textDark : COLORS.text;
            chartCtx.font = '14px system-ui, sans-serif';
            chartCtx.textAlign = 'center';
            chartCtx.fillText('No data yet. Add BMI records to see your progress.', width / 2, height / 2);
            return;
        }

        const points = calculatePoints(chartWidth, chartHeight, range);
        drawLine(points, dark);
        drawPoints(points, dark);
        drawLabels(points, dark);

        if (hoverIndex >= 0 && hoverIndex < points.length) {
            drawTooltip(points[hoverIndex], dark);
        }
    }

    function calculatePoints(chartWidth, chartHeight, range) {
        const step = chartData.length > 1 ? chartWidth / (chartData.length - 1) : 0;
        return chartData.map(function(item, index) {
            const x = PADDING.left + (chartData.length > 1 ? index * step : chartWidth / 2);
            const ratio = (item.bmi - range.min) / (range.max - range.min);
            const y = PADDING.top + chartHeight - (ratio * chartHeight);
            return { x: x, y: y, data: item };
        });
    }

    function drawZones(chartWidth, chartHeight, range, dark) {
        const zones = [
            { min: 15, max: 18.5, color: COLORS.zoneUnder },
            { min: 18.5, max: 25, color: COLORS.zoneHealthy },
            { min: 25, max: 30, color: COLORS.zoneOver },
            { min: 30, max: 50, color: COLORS.zoneObese }
        ];

        zones.forEach(function(zone) {
            const zoneMin = Math.max(zone.min, range.min);
            const zoneMax = Math.min(zone.max, range.max);
            if (zoneMin >= zoneMax) return;
            const y1 = PADDING.top + chartHeight - ((zoneMin - range.min) / (range.max - range.min)) * chartHeight;
            const y2 = PADDING.top + chartHeight - ((zoneMax - range.min) / (range.max - range.min)) * chartHeight;
            chartCtx.fillStyle = zone.color;
            chartCtx.fillRect(PADDING.left, y2, chartWidth, y1 - y2);
        });
    }

    function drawGrid(chartWidth, chartHeight, range, dark) {
        chartCtx.strokeStyle = dark ? COLORS.gridDark : COLORS.grid;
        chartCtx.lineWidth = 1;
        chartCtx.font = '11px system-ui, sans-serif';
        chartCtx.fillStyle = dark ? COLORS.textDark : COLORS.text;
        chartCtx.textAlign = 'right';
        chartCtx.textBaseline = 'middle';

        const steps = 5;
        for (let i = 0; i <= steps; i++) {
            const bmiValue = range.min + (range.max - range.min) * (i / steps);
            const y = PADDING.top + chartHeight - (i / steps) * chartHeight;
            chartCtx.beginPath();
            chartCtx.moveTo(PADDING.left, y);
            chartCtx.lineTo(PADDING.left + chartWidth, y);
            chartCtx.stroke();
            chartCtx.fillText(bmiValue.toFixed(1), PADDING.left - 8, y);
        }

        chartCtx.textAlign = 'center';
        chartCtx.textBaseline = 'top';
        const labelCount = Math.min(chartData.length, 6);
        for (let i = 0; i < labelCount; i++) {
            const index = Math.floor((chartData.length - 1) * (i / (labelCount - 1)));
            if (chartData[index]) {
                const step = chartData.length > 1 ? chartWidth / (chartData.length - 1) : 0;
                const x = PADDING.left + (chartData.length > 1 ? index * step : chartWidth / 2);
                const date = new Date(chartData[index].date);
                const label = (date.getMonth() + 1) + '/' + date.getDate();
                chartCtx.fillText(label, x, PADDING.top + chartHeight + 10);
            }
        }
    }

    function drawLine(points, dark) {
        if (points.length < 2) return;
        chartCtx.strokeStyle = dark ? COLORS.lineDark : COLORS.line;
        chartCtx.lineWidth = 2.5;
        chartCtx.lineJoin = 'round';
        chartCtx.lineCap = 'round';
        chartCtx.beginPath();
        points.forEach(function(point, index) {
            const progress = animationProgress;
            const targetIndex = Math.min(index, Math.floor(progress * (points.length - 1)));
            if (index <= targetIndex) {
                if (index === 0) {
                    chartCtx.moveTo(point.x, point.y);
                } else {
                    chartCtx.lineTo(point.x, point.y);
                }
            }
        });
        chartCtx.stroke();
    }

    function drawPoints(points, dark) {
        points.forEach(function(point, index) {
            const progress = animationProgress;
            const targetIndex = Math.floor(progress * (points.length - 1));
            if (index > targetIndex) return;

            const isHovered = index === hoverIndex;
            const radius = isHovered ? 7 : 5;

            chartCtx.beginPath();
            chartCtx.arc(point.x, point.y, radius + 2, 0, Math.PI * 2);
            chartCtx.fillStyle = dark ? '#1a1a2e' : '#ffffff';
            chartCtx.fill();

            chartCtx.beginPath();
            chartCtx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            chartCtx.fillStyle = dark ? COLORS.pointDark : COLORS.point;
            chartCtx.fill();
        });
    }

    function drawLabels(points, dark) {
        if (points.length === 0) return;
        chartCtx.font = 'bold 11px system-ui, sans-serif';
        chartCtx.fillStyle = dark ? COLORS.textDark : COLORS.text;
        chartCtx.textAlign = 'center';
        chartCtx.textBaseline = 'bottom';
        points.forEach(function(point) {
            chartCtx.fillText(point.data.bmi.toFixed(1), point.x, point.y - 12);
        });
    }

    function drawTooltip(point, dark) {
        const date = new Date(point.data.date);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const bmiStr = 'BMI: ' + point.data.bmi.toFixed(1);
        const catStr = point.data.category;

        chartCtx.font = '12px system-ui, sans-serif';
        const bmiWidth = chartCtx.measureText(bmiStr).width;
        const catWidth = chartCtx.measureText(catStr).width;
        const dateWidth = chartCtx.measureText(dateStr).width;
        const boxWidth = Math.max(bmiWidth, catWidth, dateWidth) + 20;
        const boxHeight = 68;

        let boxX = point.x - boxWidth / 2;
        let boxY = point.y - boxHeight - 15;

        if (boxX < PADDING.left) boxX = PADDING.left;
        if (boxX + boxWidth > chartCanvas.getBoundingClientRect().width - PADDING.right) {
            boxX = chartCanvas.getBoundingClientRect().width - PADDING.right - boxWidth;
        }
        if (boxY < 0) boxY = point.y + 15;

        chartCtx.fillStyle = dark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        chartCtx.strokeStyle = dark ? COLORS.lineDark : COLORS.line;
        chartCtx.lineWidth = 1.5;
        roundRect(chartCtx, boxX, boxY, boxWidth, boxHeight, 8);
        chartCtx.fill();
        chartCtx.stroke();

        chartCtx.fillStyle = dark ? '#f1f5f9' : '#1e293b';
        chartCtx.textAlign = 'left';
        chartCtx.textBaseline = 'top';

        chartCtx.font = 'bold 13px system-ui, sans-serif';
        chartCtx.fillText(bmiStr, boxX + 10, boxY + 10);

        chartCtx.font = '11px system-ui, sans-serif';
        chartCtx.fillStyle = dark ? '#94a3b8' : '#64748b';
        chartCtx.fillText(catStr, boxX + 10, boxY + 30);
        chartCtx.fillText(dateStr, boxX + 10, boxY + 48);
    }

    function roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    function animate() {
        animationProgress = 0;
        if (animationFrame) cancelAnimationFrame(animationFrame);
        const start = performance.now();
        const duration = 800;

        function step(now) {
            const elapsed = now - start;
            animationProgress = Math.min(1, elapsed / duration);
            draw();
            if (animationProgress < 1) {
                animationFrame = requestAnimationFrame(step);
            }
        }
        animationFrame = requestAnimationFrame(step);
    }

    function render() {
        loadData();
        if (!getCanvas()) return;
        setupCanvas();
        animate();
    }

    function init() {
        const canvas = getCanvas();
        if (canvas) {
            loadData();
            animate();
        }
    }

    window.BMICharts = {
        render: render,
        init: init,
        reload: function() {
            loadData();
            animate();
        }
    };

    document.addEventListener('DOMContentLoaded', init);
})();