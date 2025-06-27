document.addEventListener('DOMContentLoaded', () => {
    const scheduleForm = document.getElementById('schedule-form');
    const scanSettingsForm = document.getElementById('scan-settings-form');
    const displaySettingsForm = document.getElementById('display-settings-form');
    const saveButton = document.getElementById('save-settings');
    const resetButton = document.getElementById('reset-settings');

    // Default settings
    const defaultSettings = {
        schedule: {
            enabled: false,
            frequency: 'weekly',
            time: '00:00',
            email: ''
        },
        scan: {
            timeout: 5,
            maxDepth: 3,
            concurrentRequests: 5,
            followRedirects: true,
            checkImages: true,
            checkScripts: true,
            checkStyles: true
        },
        display: {
            dateFormat: 'local'
        }
    };

    // Load settings from localStorage or use defaults
    function loadSettings() {
        const savedSettings = localStorage.getItem('deadLinkDetectorSettings');
        return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    }

    // Save settings to localStorage
    function saveSettings(settings) {
        localStorage.setItem('deadLinkDetectorSettings', JSON.stringify(settings));
    }

    // Update form fields with settings
    function updateForms(settings) {
        // Schedule settings
        scheduleForm.enabled.checked = settings.schedule.enabled;
        scheduleForm.frequency.value = settings.schedule.frequency;
        scheduleForm.time.value = settings.schedule.time;
        scheduleForm.email.value = settings.schedule.email;

        // Scan settings
        scanSettingsForm.timeout.value = settings.scan.timeout;
        scanSettingsForm.maxDepth.value = settings.scan.maxDepth;
        scanSettingsForm.concurrentRequests.value = settings.scan.concurrentRequests;
        scanSettingsForm.followRedirects.checked = settings.scan.followRedirects;
        scanSettingsForm.checkImages.checked = settings.scan.checkImages;
        scanSettingsForm.checkScripts.checked = settings.scan.checkScripts;
        scanSettingsForm.checkStyles.checked = settings.scan.checkStyles;

        // Display settings
        displaySettingsForm.dateFormat.value = settings.display.dateFormat;
    }

    // Collect current settings from forms
    function collectFormSettings() {
        return {
            schedule: {
                enabled: scheduleForm.enabled.checked,
                frequency: scheduleForm.frequency.value,
                time: scheduleForm.time.value,
                email: scheduleForm.email.value
            },
            scan: {
                timeout: parseInt(scanSettingsForm.timeout.value),
                maxDepth: parseInt(scanSettingsForm.maxDepth.value),
                concurrentRequests: parseInt(scanSettingsForm.concurrentRequests.value),
                followRedirects: scanSettingsForm.followRedirects.checked,
                checkImages: scanSettingsForm.checkImages.checked,
                checkScripts: scanSettingsForm.checkScripts.checked,
                checkStyles: scanSettingsForm.checkStyles.checked
            },
            display: {
                dateFormat: displaySettingsForm.dateFormat.value
            }
        };
    }



    // Save settings to server
    async function saveSettingsToServer(settings) {
        try {
            const response = await fetch('/api/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });

            if (!response.ok) {
                throw new Error('Failed to save settings');
            }

            showNotification('Settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            showNotification('Failed to save settings', 'error');
        }
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Event Listeners
    saveButton.addEventListener('click', async () => {
        const newSettings = collectFormSettings();
        saveSettings(newSettings);
        await saveSettingsToServer(newSettings);
        applyTheme(newSettings.display.theme);
    });

    resetButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            updateForms(defaultSettings);
            saveSettings(defaultSettings);
            saveSettingsToServer(defaultSettings);
            showNotification('Settings reset to default', 'info');
        }
    });

    // Theme change handler
    displaySettingsForm.theme.addEventListener('change', (e) => {
        applyTheme(e.target.value);
    });

    // Initialize settings
    const currentSettings = loadSettings();
    updateForms(currentSettings);
});