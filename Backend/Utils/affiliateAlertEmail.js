// utils/affiliateAlertEmail.js
module.exports = ({ category, domains }) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Affiliate Alert - ${category}</title>
    <style>
      /* Reset & global */
      body {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        background-color: #f0f2f5;
        margin: 0;
        padding: 0;
        color: #333;
      }
      a {
        color: #1976d2;
        text-decoration: none;
      }
      a:hover {
        text-decoration: underline;
      }

      /* Container */
      .container {
        max-width: 750px;
        margin: 40px auto;
        background-color: #fff;
        border-radius: 10px;
        padding: 25px 30px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.1);
      }

      /* Header */
      h2 {
        color: #d32f2f;
        text-align: center;
        margin-bottom: 15px;
      }
      p {
        font-size: 15px;
        line-height: 1.5;
        margin: 8px 0;
      }

      /* Table */
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
        font-size: 14px;
      }
      th, td {
        padding: 12px 10px;
        text-align: left;
        border-bottom: 1px solid #e0e0e0;
      }
      th {
        background-color: #1976d2;
        color: #fff;
        font-weight: 600;
        text-transform: uppercase;
      }

      /* Status badges */
      .status-ok {
        color: #2e7d32;
        font-weight: bold;
      }
      .status-error {
        color: #d32f2f;
        font-weight: bold;
      }
      .status-warning {
        color: #f57c00;
        font-weight: bold;
      }

      /* Badge-style indicators */
      .badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        color: #fff;
        margin-top: 4px;
      }
      .badge.ok { background-color: #2e7d32; }
      .badge.error { background-color: #d32f2f; }
      .badge.warning { background-color: #f57c00; }

      /* Mobile responsiveness */
      @media screen and (max-width: 600px) {
        table, thead, tbody, th, td, tr {
          display: block;
          width: 100%;
        }
        th {
          display: none;
        }
        td {
          border: none;
          position: relative;
          padding-left: 50%;
          text-align: left;
          margin-bottom: 15px;
        }
        td:before {
          position: absolute;
          left: 15px;
          top: 12px;
          width: 45%;
          font-weight: bold;
          white-space: nowrap;
        }
        td[data-label="Domain"]:before { content: "Domain"; }
        td[data-label="Primary"]:before { content: "Primary (Clocker)"; }
        td[data-label="Secondary"]:before { content: "Secondary (Main)"; }
      }

      /* Footer */
      .footer {
        margin-top: 25px;
        font-size: 13px;
        color: #555;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>🚨 Affiliate Links Alert</h2>
      <p><strong>Category:</strong> ${category}</p>
      <p>The following domains have broken or mismatched affiliate links. Please review and fix them to avoid revenue loss.</p>

      <table>
        <thead>
          <tr>
            <th>Domain</th>
            <th>Primary (Clocker)</th>
            <th>Secondary (Main)</th>
          </tr>
        </thead>
        <tbody>
          ${domains.map(d => `
            <tr>
              <td data-label="Domain">${d.domain}</td>
              <td data-label="Primary">
                <span class="badge ${d.primaryError ? 'error' : d.primary?.status === 'warning' ? 'warning' : 'ok'}">
                  ${d.primaryError ? 'Error' : d.primary?.status || 'Error'}
                </span><br/>
                ${d.primary?.url ? `<a href="${d.primary.url}" target="_blank">${d.primary.url}</a>` : ''}
                ${d.primary?.reason ? `<br/><small>${d.primary.reason}</small>` : ''}
              </td>
              <td data-label="Secondary">
                <span class="badge ${d.secondaryError ? 'error' : d.secondary?.status === 'warning' ? 'warning' : 'ok'}">
                  ${d.secondaryError ? 'Error' : d.secondary?.status || 'Error'}
                </span><br/>
                ${d.secondary?.url ? `<a href="${d.secondary.url}" target="_blank">${d.secondary.url}</a>` : ''}
                ${d.secondary?.reason ? `<br/><small>${d.secondary.reason}</small>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <p class="footer">Thank you for monitoring your affiliate links. Stay proactive!</p>
    </div>
  </body>
  </html>
  `;
};
