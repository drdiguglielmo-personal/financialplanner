import { describe, it, expect } from "vitest";
import { parseCsv, normalizeDateCell, normalizeAmountCell, buildTransactionsFromMappedRows, dedupeCsvAgainstExisting, rowContentHash } from "./csvImport.js";

describe("csvImport", () => {
  it("parseCsv handles quoted commas and newlines", () => {
    const text = 'a,"b, c",d\n1,2,3';
    const rows = parseCsv(text);
    expect(rows).toEqual([
      ["a", "b, c", "d"],
      ["1", "2", "3"],
    ]);
  });

  it("normalizeDateCell parses ISO and M/D/YYYY", () => {
    expect(normalizeDateCell("2026-04-19")).toBe("2026-04-19");
    expect(normalizeDateCell("4/19/2026")).toBe("2026-04-19");
  });

  it("normalizeAmountCell handles currency and parentheses", () => {
    expect(normalizeAmountCell("$1,234.50")).toBe(1234.5);
    expect(normalizeAmountCell("(12.00)")).toBe(-12);
  });

  it("buildTransactionsFromMappedRows maps columns and flips positive expenses", () => {
    const rows = [
      ["Date", "Payee", "Amount"],
      ["2026-04-01", "Coffee Shop", "5.00"],
    ];
    const { transactions, errors } = buildTransactionsFromMappedRows({
      rows,
      headerRow: true,
      colDate: 0,
      colName: 1,
      colAmount: 2,
      colCategory: null,
      expenseAmountsPositive: true,
      fileName: "t.csv",
    });
    expect(errors.length).toBe(0);
    expect(transactions).toHaveLength(1);
    expect(transactions[0].amount).toBe(-5);
    expect(transactions[0].source).toBe("csv");
    expect(transactions[0].importMeta?.rowHash).toBe(rowContentHash("2026-04-01", "Coffee Shop", -5, "Uncategorized"));
  });

  it("dedupeCsvAgainstExisting skips duplicate row hashes", () => {
    const existing = [
      {
        id: "x",
        name: "A",
        amount: -1,
        date: "2026-01-01",
        category: "Uncategorized",
        source: "csv",
        importMeta: { rowHash: "habc" },
      },
    ];
    const incoming = [
      {
        id: "y",
        name: "A",
        amount: -1,
        date: "2026-01-01",
        category: "Uncategorized",
        source: "csv",
        importMeta: { rowHash: "habc" },
      },
      {
        id: "z",
        name: "B",
        amount: -2,
        date: "2026-01-02",
        category: "Uncategorized",
        source: "csv",
        importMeta: { rowHash: "hdef" },
      },
    ];
    const out = dedupeCsvAgainstExisting(existing, incoming);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("z");
  });
});
