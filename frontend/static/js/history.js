document.addEventListener('DOMContentLoaded', () => {
    const historyList = document.querySelector('.history-list');
    const sortSelect = document.getElementById('sort-by');
    const exportButton = document.getElementById('export-csv');
    const template = document.getElementById('history-item-template');

    let scanHistory = [];

    // Fetch scan history
    async function fetchHistory() {
        try {
            const response = await fetch('/api/history');
            if (!response.ok) throw new Error('Failed to fetch history');
            scanHistory = await response.json();
            displayHistory(scanHistory);
        } catch (error) {
            historyList.innerHTML = `<div class="error-message">Error loading history: ${error.message}</div>`;
        }
    }

    // Display history items
    function displayHistory(items) {
        historyList.innerHTML = '';
        items.forEach(item => {
            const historyItem = template.content.cloneNode(true);

            // Fill in the template
            historyItem.querySelector('.url').textContent = item.url;
            historyItem.querySelector('.date').textContent = new Date(item.scan_date).toLocaleString();
            historyItem.querySelector('.total-links').textContent = item.total_links;
            historyItem.querySelector('.broken-links').textContent = item.broken_links;
            historyItem.querySelector('.internal-links').textContent = item.internal_links;
            historyItem.querySelector('.external-links').textContent = item.external_links;
            historyItem.querySelector('.avg-response-time').textContent = `${Math.round(item.avg_response_time)}ms`;

            // Setup view details button
            const viewDetailsBtn = historyItem.querySelector('.view-details');
            const detailsSection = historyItem.querySelector('.broken-links-details');

            viewDetailsBtn.addEventListener('click', () => {
                detailsSection.classList.toggle('hidden');
                if (!detailsSection.classList.contains('hidden')) {
                    displayBrokenLinks(detailsSection, item.scan_data.broken_links);
                }
            });

            // Setup download report button
            const downloadBtn = historyItem.querySelector('.download-report');
            downloadBtn.addEventListener('click', () => downloadReport(item));

            historyList.appendChild(historyItem);
        });
    }

    // Display broken links details
    function displayBrokenLinks(container, brokenLinks) {
        if (!brokenLinks || brokenLinks.length === 0) {
            container.innerHTML = '<p>No broken links found in this scan.</p>';
            return;
        }

        const linksHtml = brokenLinks.map(link => `
            <div class="broken-link-item">
                <div class="link-url">${link.url}</div>
                <div class="link-status">${link.status === 0 ? 'Connection Error' : `Status ${link.status}`}</div>
                <div class="link-type">${link.element_type}</div>
            </div>
        `).join('');

        container.innerHTML = `
            <h4>Broken Links (${brokenLinks.length})</h4>
            <div class="broken-links-grid">
                ${linksHtml}
            </div>
        `;
    }

    // Download report as CSV
    function downloadReport(scanData) {
        const brokenLinks = scanData.scan_data.broken_links;
        if (!brokenLinks || brokenLinks.length === 0) {
            alert('No broken links to export.');
            return;
        }

        const csvContent = [
            ['URL', 'Status', 'Element Type'],
            ...brokenLinks.map(link => [
                link.url,
                link.status === 0 ? 'Connection Error' : `Status ${link.status}`,
                link.element_type
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scan-report-${new Date(scanData.scan_date).toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // Export all history to CSV
    exportButton.addEventListener('click', () => {
        const csvContent = [
            ['URL', 'Date', 'Total Links', 'Broken Links', 'Internal Links', 'External Links', 'Avg Response Time'],
            ...scanHistory.map(item => [
                item.url,
                new Date(item.scan_date).toLocaleString(),
                item.total_links,
                item.broken_links,
                item.internal_links,
                item.external_links,
                Math.round(item.avg_response_time)
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scan-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    });

    // Sort history items
    sortSelect.addEventListener('change', () => {
        const sortBy = sortSelect.value;
        const sortedHistory = [...scanHistory].sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.scan_date) - new Date(a.scan_date);
                case 'broken':
                    return b.broken_links - a.broken_links;
                case 'total':
                    return b.total_links - a.total_links;
                default:
                    return 0;
            }
        });
        displayHistory(sortedHistory);
    });

    // Initial fetch
    fetchHistory();
});