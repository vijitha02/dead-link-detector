document.addEventListener('DOMContentLoaded', () => {
    const timeRange = document.getElementById('time-range');
    let analyticsData = null;
    let charts = {};

    // Chart configuration
    const chartConfig = {
        maxWidth: 600,  // Maximum width for charts
        aspectRatio: 1.6,  // Default aspect ratio (16:10)
        smallScreenRatio: 1.2  // Aspect ratio for small screens
    };

    async function fetchAnalytics() {
        try {
            const response = await fetch('/api/analytics');
            if (!response.ok) throw new Error('Failed to fetch analytics');
            analyticsData = await response.json();
            updateDashboard();
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    }

    function updateDashboard() {
        if (!analyticsData) return;

        // Update overview stats
        document.getElementById('total-scans').textContent = analyticsData.total_scans;
        document.getElementById('avg-broken-links').textContent = 
            analyticsData.avg_broken_links.toFixed(1);

        // Update charts
        updateErrorDistributionChart();
        updateLinksDistributionChart();
        updateResponseTimeTrendChart();
    }

    function getChartDimensions(container) {
        const width = Math.min(container.offsetWidth, chartConfig.maxWidth);
        const aspectRatio = window.innerWidth < 768 ? chartConfig.smallScreenRatio : chartConfig.aspectRatio;
        return { width, height: width / aspectRatio };
    }

    function updateErrorDistributionChart() {
        const container = document.getElementById('error-distribution-chart').parentElement;
        const { width, height } = getChartDimensions(container);
        const ctx = document.getElementById('error-distribution-chart');
        ctx.style.width = `${width}px`;
        ctx.style.height = `${height}px`;

        const errorTypes = {
            '404': 'Not Found',
            '500': 'Internal Server Error',
            '503': 'Service Unavailable',
            '0': 'Connection Error'
        };

        const data = {
            labels: Object.entries(analyticsData.error_distribution).map(
                ([code, _]) => errorTypes[code] || `Status ${code}`
            ),
            datasets: [{
                data: Object.values(analyticsData.error_distribution),
                backgroundColor: [
                    '#e74c3c',  // red
                    '#e67e22',  // orange
                    '#f1c40f',  // yellow
                    '#95a5a6'   // gray
                ]
            }]
        };

        if (charts.errorDistribution) {
            charts.errorDistribution.destroy();
        }

        charts.errorDistribution = new Chart(ctx, {
            type: 'pie',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            boxWidth: 12
                        }
                    },
                    title: {
                        display: true,
                        text: 'Error Types Distribution',
                        padding: 20
                    }
                }
            }
        });
    }

    function updateLinksDistributionChart() {
        const container = document.getElementById('links-distribution-chart').parentElement;
        const { width, height } = getChartDimensions(container);
        const ctx = document.getElementById('links-distribution-chart');
        ctx.style.width = `${width}px`;
        ctx.style.height = `${height}px`;

        const { internal, external } = analyticsData.links_distribution;

        const data = {
            labels: ['Internal Links', 'External Links'],
            datasets: [{
                data: [internal, external],
                backgroundColor: ['#3498db', '#2ecc71']
            }]
        };

        if (charts.linksDistribution) {
            charts.linksDistribution.destroy();
        }

        charts.linksDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            boxWidth: 12
                        }
                    },
                    title: {
                        display: true,
                        text: 'Links Distribution',
                        padding: 20
                    }
                }
            }
        });
    }

    function updateResponseTimeTrendChart() {
        const container = document.getElementById('response-time-trend-chart').parentElement;
        const { width, height } = getChartDimensions(container);
        const ctx = document.getElementById('response-time-trend-chart');
        ctx.style.width = `${width}px`;
        ctx.style.height = `${height}px`;

        const data = {
            labels: analyticsData.response_time_trend.map(d => d.date),
            datasets: [{
                label: 'Average Response Time (ms)',
                data: analyticsData.response_time_trend.map(d => d.avg_time),
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: true
            }]
        };

        if (charts.responseTimeTrend) {
            charts.responseTimeTrend.destroy();
        }

        charts.responseTimeTrend = new Chart(ctx, {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            padding: 20,
                            boxWidth: 12
                        }
                    },
                    title: {
                        display: true,
                        text: 'Response Time Trend',
                        padding: 20
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Recommendations feature removed

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateDashboard();
        }, 250);
    });

    // Initial fetch
    fetchAnalytics();

    // Handle time range changes
    timeRange.addEventListener('change', fetchAnalytics);
});