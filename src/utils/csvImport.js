import { CATEGORY_COLORS } from "../data/mockData.js";

function roundMoney(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Minimal RFC-style CSV parser: commas, quoted fields, doubled quotes.
 * @param {string} text
 * @returns {string[][]}
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let i = 0;
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    if (row.length === 1 && row[0] === "") {
      row = [];
      return;
    }
    if (row.some((c) => String(c).trim() !== "")) rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ",") {
      pushField();
      i += 1;
      continue;
    }
    if (c === "\r") {
      i += 1;
      continue;
    }
    if (c === "\n") {
      pushField();
      pushRow();
      i += 1;
      continue;
    }
    field += c;
    i += 1;
  }
  pushField();
  if (row.length) pushRow();
  return rows;
}

/**
 * @param {string} raw
 * @returns {string | null} YYYY-MM-DD or null
 */
export function normalizeDateCell(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const mdy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (mdy) {
    const mm = String(mdy[1]).padStart(2, "0");
    const dd = String(mdy[2]).padStart(2, "0");
    return `${mdy[3]}-${mm}-${dd}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return null;
}

/**
 * @param {string} raw
 * @returns {number | null}
 */
export function normalizeAmountCell(raw) {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  s = s.replace(/[$€£,\s]/g, "");
  const paren = /^\((.*)\)$/.exec(s);
  if (paren) s = `-${paren[1]}`;
  const n = parseFloat(s);
  return Number.isFinite(n) ? roundMoney(n) : null;
}

export function rowContentHash(date, name, amount, category) {
  const norm = `${date}|${String(name).trim().toLowerCase()}|${amount}|${String(category).trim()}`;
  let h = 0;
  for (let j = 0; j < norm.length; j += 1) h = (h * 31 + norm.charCodeAt(j)) | 0;
  return `h${(h >>> 0).toString(16)}`;
}

/**
 * @param {{
 *   rows: string[][],
 *   headerRow: boolean,
 *   colDate: number,
 *   colName: number,
 *   colAmount: number,
 *   colCategory: number | null,
 *   expenseAmountsPositive: boolean,
 *   fileName: string,
 *   defaultCategory?: string,
 * }} opts
 * @returns {{ transactions: object[], skipped: number, errors: string[] }}
 */
export function buildTransactionsFromMappedRows(opts) {
  const {
    rows,
    headerRow,
    colDate,
    colName,
    colAmount,
    colCategory,
    expenseAmountsPositive,
    fileName,
    defaultCategory = "Uncategorized",
  } = opts;

  const errors = [];
  const transactions = [];
  let skipped = 0;
  const dataStart = headerRow ? 1 : 0;

  for (let r = dataStart; r < rows.length; r += 1) {
    const line = rows[r];
    if (!line || line.every((c) => String(c).trim() === "")) {
      skipped += 1;
      continue;
    }
    const dateRaw = line[colDate];
    const nameRaw = line[colName];
    const amtRaw = line[colAmount];
    const date = normalizeDateCell(dateRaw);
    const name = nameRaw != null ? String(nameRaw).trim() : "";
    let amount = normalizeAmountCell(amtRaw);
    if (!date || !name || amount == null) {
      skipped += 1;
      errors.push(`Row ${r + 1}: missing date, description, or amount`);
      continue;
    }
    if (expenseAmountsPositive && amount > 0) amount = -roundMoney(amount);
    if (expenseAmountsPositive && amount === 0) {
      skipped += 1;
      continue;
    }
    const category =
      colCategory != null && colCategory >= 0 && line[colCategory] != null && String(line[colCategory]).trim()
        ? String(line[colCategory]).trim()
        : defaultCategory;
    const rowHash = rowContentHash(date, name, amount, category);
    const color = CATEGORY_COLORS[category] || "#8899b0";
    const id = `c_${Date.now().toString(36)}_${r}_${Math.random().toString(36).slice(2, 8)}`;
    transactions.push({
      id,
      name,
      category,
      amount,
      date,
      icon: "📄",
      color,
      source: "csv",
      importMeta: { fileName, importedAt: new Date().toISOString(), rowHash },
    });
  }
  return { transactions, skipped, errors };
}

/**
 * Dedupe imported rows against existing ledger by importMeta.rowHash (and same hash without importMeta on csv rows).
 * @param {object[]} existing
 * @param {object[]} incoming
 */
export function dedupeCsvAgainstExisting(existing, incoming) {
  const seen = new Set();
  for (const t of existing) {
    const h = t.importMeta?.rowHash;
    if (h) seen.add(h);
  }
  const out = [];
  for (const t of incoming) {
    const h = t.importMeta?.rowHash;
    if (h && seen.has(h)) continue;
    if (h) seen.add(h);
    out.push(t);
  }
  return out;
}
