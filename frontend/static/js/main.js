document.getElementById("scan-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  const data = Object.fromEntries(formData);
  const resultsDiv = document.getElementById("results");

  resultsDiv.innerHTML = "<p class='scanning'>Scanning...</p>";

  try {
    const response = await fetch("http://127.0.0.1:5000/scan", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = 'http://127.0.0.1:5000/login';
        return;
      }
      resultsDiv.innerHTML = `<div class="error-message">${result.error || 'An error occurred during scanning'}</div>`;
      return;
    }

    if (result.error) {
      resultsDiv.innerHTML = `<div class="error-message">${result.error}</div>`;
      return;
    }

    const scanData = result.data;
    let html = `
      <div class="scan-results">
        <div class="summary-stats">
          <div class="stat">
            <h3>Total Links</h3>
            <p>${scanData.total_links}</p>
          </div>
          <div class="stat">
            <h3>Internal Links</h3>
            <p>${scanData.internal_links}</p>
          </div>
          <div class="stat">
            <h3>External Links</h3>
            <p>${scanData.external_links}</p>
          </div>
          <div class="stat">
            <h3>Broken Links</h3>
            <p>${scanData.broken_links.length}</p>
          </div>
          <div class="stat">
            <h3>Avg Response Time</h3>
            <p>${scanData.avg_response_time.toFixed(2)}ms</p>
          </div>
        </div>
    `;

    if (scanData.broken_links.length > 0) {
      html += `
        <div class="broken-links">
          <h3>Broken Links Found:</h3>
          <table>
            <thead>
              <tr>
                <th>URL</th>
                <th>Status</th>
                <th>Element Type</th>
              </tr>
            </thead>
            <tbody>
              ${scanData.broken_links.map(link => `
                <tr>
                  <td>
                    <div class="url-actions">
                      <a href="${link.url}" target="_blank">${link.url}</a>
                      <button class="icon-button copy-url" title="Copy URL" onclick="navigator.clipboard.writeText('${link.url}')"><i class="fas fa-copy"></i></button>
                      <a href="https://www.google.com/search?q=${encodeURIComponent(link.url)}" target="_blank" class="icon-button google-search" title="Search on Google"><i class="fas fa-search"></i></a>
                    </div>
                  </td>
                  <td>${link.status}</td>
                  <td>${link.element_type}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    html += '</div>';
    resultsDiv.innerHTML = html;
  } catch (error) {
    console.error('Scan error:', error);
    resultsDiv.innerHTML = `<div class="error-message">Failed to complete the scan. Please try again later.</div>`;
  }
});
