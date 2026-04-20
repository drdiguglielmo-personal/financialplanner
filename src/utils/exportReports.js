function csvEscape(value) {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * @param {string} filename
 * @param {string[]} header
 * @param {Array<Array<string|number>>} rows
 */
export function downloadCsv(filename, header, rows) {
  const lines = [];
  lines.push(header.map(csvEscape).join(","));
  for (const r of rows) lines.push(r.map(csvEscape).join(","));
  const csv = lines.join("\n") + "\n";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Opens a printable HTML report. Users can “Save as PDF” from the browser print dialog.
 *
 * @param {{ title: string, subtitle?: string, columns: string[], rows: Array<Array<string|number>> }} params
 */
export function openPrintableReport(params) {
  const safe = (x) =>
    String(x ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const head = `
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safe(params.title)}</title>
    <style>
      :root { color-scheme: light; }
      body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 32px; color: #111827; }
      h1 { margin: 0; font-size: 22px; }
      .sub { margin-top: 6px; color: #4b5563; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; margin-top: 18px; }
      th, td { text-align: left; border-bottom: 1px solid #e5e7eb; padding: 10px 8px; font-size: 13px; }
      th { font-weight: 700; color: #111827; }
      td.num { text-align: right; font-variant-numeric: tabular-nums; }
      .footer { margin-top: 18px; color: #6b7280; font-size: 12px; }
      @media print { body { padding: 0; } }
    </style>
  `;

  const colHtml = params.columns.map((c) => `<th>${safe(c)}</th>`).join("");
  const bodyRows = params.rows
    .map((r) => {
      const tds = r
        .map((cell, idx) => {
          const cls = idx === r.length - 1 || typeof cell === "number" ? "num" : "";
          return `<td class="${cls}">${safe(cell)}</td>`;
        })
        .join("");
      return `<tr>${tds}</tr>`;
    })
    .join("");

  const html = `
    <!doctype html>
    <html>
      <head>${head}</head>
      <body>
        <h1>${safe(params.title)}</h1>
        ${params.subtitle ? `<div class="sub">${safe(params.subtitle)}</div>` : ""}
        <table>
          <thead><tr>${colHtml}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
        <div class="footer">Tip: In the print dialog, choose “Save as PDF”.</div>
      </body>
    </html>
  `;

  // Prefer an iframe-based print flow (more reliable than popups/new tabs).
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    throw new Error("Could not open print frame. Try a different browser.");
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Wait a tick so layout/paint completes before printing.
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => iframe.remove(), 500);
    }
  }, 50);
}

