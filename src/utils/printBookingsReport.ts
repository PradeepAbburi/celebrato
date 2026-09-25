import { Booking } from '../types';

export interface PrintBookingsReportParams {
  bookings: Booking[];
  title: string;
  filterName: string;
  totalRevenue: number;
  totalGuests: number;
}

export function printBookingsReport({
  bookings,
  title,
  filterName,
  totalRevenue,
  totalGuests,
}: PrintBookingsReportParams) {
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    // If pop-ups blocked, fallback to standard window.print()
    window.print();
    return;
  }

  const generatedDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const rowsHtml = bookings
    .map((b, idx) => {
      const code = b.shareCode || b.id.slice(-6).toUpperCase();
      const statusBadgeClass =
        b.status === 'confirmed'
          ? 'color: #166534; background: #dcfce7; border: 1px solid #86efac;'
          : b.status === 'checked-in'
          ? 'color: #1e40af; background: #dbeafe; border: 1px solid #93c5fd;'
          : b.status === 'completed'
          ? 'color: #6b21a8; background: #f3e8ff; border: 1px solid #d8b4fe;'
          : 'color: #991b1b; background: #fee2e2; border: 1px solid #fca5a5;';

      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
          <td style="padding: 8px 6px; text-align: center; color: #64748b;">${idx + 1}</td>
          <td style="padding: 8px 6px; font-family: monospace; font-weight: bold; color: #0f172a;">${code}</td>
          <td style="padding: 8px 6px; font-weight: bold; color: #0f172a;">
            ${b.eventName || 'Celebration Event'}
          </td>
          <td style="padding: 8px 6px; color: #334155;">${b.roomName || 'Party Suite'}</td>
          <td style="padding: 8px 6px; color: #334155; white-space: nowrap;">
            ${b.date}<br/>
            <span style="color: #64748b; font-size: 10px;">${b.timeSlot} (${b.durationHours}h)</span>
          </td>
          <td style="padding: 8px 6px; color: #0f172a;">
            <strong>${b.userName || 'Guest'}</strong><br/>
            <span style="color: #64748b; font-size: 10px;">${b.userPhone || 'N/A'}</span>
          </td>
          <td style="padding: 8px 6px; text-align: center; font-weight: bold; color: #0f172a;">${b.guestsCount}</td>
          <td style="padding: 8px 6px; text-align: right; font-weight: bold; font-family: monospace; color: #0f172a;">
            Rs. ${b.finalPrice.toLocaleString('en-IN')}
          </td>
          <td style="padding: 8px 6px; text-align: center;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9.5px; font-weight: bold; text-transform: uppercase; ${statusBadgeClass}">
              ${b.status}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Celebrato - Bookings Total Data Report</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 12mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 16px;
            font-size: 12px;
          }
          .header-box {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 16px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #0f172a;
            margin: 0;
          }
          .brand-subtitle {
            font-size: 11px;
            color: #64748b;
            margin: 2px 0 0 0;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 16px;
          }
          .metric-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
          }
          .metric-label {
            font-size: 9.5px;
            text-transform: uppercase;
            font-weight: bold;
            color: #64748b;
            display: block;
          }
          .metric-value {
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 8px 6px;
            text-align: left;
          }
          .footer-note {
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
            font-size: 10px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
          }
          @media print {
            body { padding: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <h1 class="brand-title">CELEBRATO PARTY SUITES & THEATRES</h1>
            <p class="brand-subtitle">Venue Operations • Bookings Total Data & Revenue Ledger</p>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold; font-size: 13px; color: #0f172a;">${title}</div>
            <div style="font-size: 10px; color: #64748b;">Filter: ${filterName} | Generated: ${generatedDate}</div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <span class="metric-label">Total Reservations</span>
            <div class="metric-value">${bookings.length} Bookings</div>
          </div>
          <div class="metric-card">
            <span class="metric-label">Total Gross Revenue</span>
            <div class="metric-value" style="color: #b45309;">Rs. ${totalRevenue.toLocaleString('en-IN')}</div>
          </div>
          <div class="metric-card">
            <span class="metric-label">Total Guests Attending</span>
            <div class="metric-value">${totalGuests} Guests</div>
          </div>
          <div class="metric-card">
            <span class="metric-label">Average Order Value</span>
            <div class="metric-value">Rs. ${bookings.length ? Math.round(totalRevenue / bookings.length).toLocaleString('en-IN') : 0}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">#</th>
              <th style="width: 80px;">Ref Code</th>
              <th>Celebration / Event Name</th>
              <th>Suite</th>
              <th style="width: 130px;">Date & Time</th>
              <th>Host Profile</th>
              <th style="width: 50px; text-align: center;">Guests</th>
              <th style="width: 100px; text-align: right;">Total (INR)</th>
              <th style="width: 90px; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr style="background: #f1f5f9; font-weight: bold; font-size: 11px;">
              <td colspan="6" style="padding: 10px 8px; text-align: right;">TOTALS SUMMARY:</td>
              <td style="padding: 10px 8px; text-align: center;">${totalGuests}</td>
              <td style="padding: 10px 8px; text-align: right; font-family: monospace; color: #b45309;">
                Rs. ${totalRevenue.toLocaleString('en-IN')}
              </td>
              <td style="padding: 10px 8px; text-align: center;">${bookings.length} Events</td>
            </tr>
          </tfoot>
        </table>

        <div class="footer-note">
          <span>Celebrato Venue Management Console • Official Operational Record</span>
          <span>Confidential • Internal Administration Use Only</span>
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();

  // Give resources time to load before prompting print dialog
  setTimeout(() => {
    printWindow.print();
  }, 400);
}
