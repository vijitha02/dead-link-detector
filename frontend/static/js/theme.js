// Theme management for all pages
const THEME_KEY = 'theme';
const DARK_MODE = 'dark';
const LIGHT_MODE = 'light';

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    setupThemeToggle();
    updateChartThemes();
});

// Initialize theme based on stored preference or system preference
function initializeTheme() {
    const storedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (storedTheme) {
        applyTheme(storedTheme);
    } else {
        applyTheme(prefersDark ? DARK_MODE : LIGHT_MODE);
    }
}

// Setup theme toggle button
function setupThemeToggle() {
    const toggleButtons = document.querySelectorAll('.theme-toggle');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const isDark = document.body.classList.contains('dark-mode');
            const newTheme = isDark ? LIGHT_MODE : DARK_MODE;
            applyTheme(newTheme);
        });
    });
}

// Apply theme to the page
function applyTheme(theme) {
    const isDark = theme === DARK_MODE;
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem(THEME_KEY, theme);
    updateThemeIcon(isDark);
    updateChartThemes();
}

// Update theme toggle icon
function updateThemeIcon(isDark) {
    const icons = document.querySelectorAll('.theme-toggle i');
    icons.forEach(icon => {
        icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    });
}

// Update Chart.js themes if charts exist
function updateChartThemes() {
    if (typeof Chart === 'undefined') return;

    const isDark = document.body.classList.contains('dark-mode');
    const textColor = isDark ? '#e1e4e8' : '#2c3e50';
    const gridColor = isDark ? '#30363d' : '#e1e4e8';
    const backgroundColor = isDark ? '#1a1f24' : '#ffffff';

    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;
    
    // Update all existing charts
    Object.values(Chart.instances).forEach(chart => {
        // Update chart options
        chart.options.scales.x.grid.color = gridColor;
        chart.options.scales.x.ticks.color = textColor;
        chart.options.scales.y.grid.color = gridColor;
        chart.options.scales.y.ticks.color = textColor;
        
        // Update dataset colors if needed
        chart.data.datasets.forEach(dataset => {
            if (dataset.backgroundColor && !Array.isArray(dataset.backgroundColor)) {
                dataset.backgroundColor = backgroundColor;
            }
        });
        
        chart.update('none'); // Update without animation
    });
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem(THEME_KEY)) {
        applyTheme(e.matches ? DARK_MODE : LIGHT_MODE);
    }
});
