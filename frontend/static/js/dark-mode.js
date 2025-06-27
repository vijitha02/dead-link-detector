// Dark mode functionality
const DARK_MODE_KEY = 'darkMode';

// Initialize dark mode based on user preference
function initDarkMode() {
    const isDarkMode = localStorage.getItem(DARK_MODE_KEY) === 'true';
    document.body.classList.toggle('dark-mode', isDarkMode);
    updateThemeToggleIcon(isDarkMode);
}

// Toggle dark mode
function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    localStorage.setItem(DARK_MODE_KEY, isDarkMode);
    updateThemeToggleIcon(isDarkMode);
    updateChartsTheme(isDarkMode); // Only runs if charts exist
}

// Update theme toggle icon
function updateThemeToggleIcon(isDarkMode) {
    const themeToggles = document.querySelectorAll('.theme-toggle i');
    themeToggles.forEach(icon => {
        icon.classList.remove('fa-sun', 'fa-moon');
        icon.classList.add(isDarkMode ? 'fa-sun' : 'fa-moon');
    });
}

// Update Chart.js theme if charts exist
function updateChartsTheme(isDarkMode) {
    if (typeof Chart === 'undefined') return;
    
    const textColor = isDarkMode ? '#e1e4e8' : '#2c3e50';
    const gridColor = isDarkMode ? '#30363d' : '#e1e4e8';
    
    Chart.defaults.color = textColor;
    Chart.defaults.borderColor = gridColor;
    
    // Update all existing charts
    Chart.instances.forEach(chart => {
        chart.options.scales.x.grid.color = gridColor;
        chart.options.scales.y.grid.color = gridColor;
        chart.update();
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    
    const themeToggles = document.querySelectorAll('.theme-toggle');
    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', toggleDarkMode);
    });
});