import { describe, it, expect } from "vitest";
import { FAKE_TRANSACTIONS_DB } from "../data/mockData.js";
import { mergeTransactions, totalSpendingForMonth } from "../utils/finance.js";
import { BankService } from "./bank.js";

describe("BankService (mock bank layer)", () => {
  it("connect returns success and fake accounts", async () => {
    const result = await BankService.connect("chase");
    expect(result.success).toBe(true);
    expect(result.bank).toBe("chase");
    expect(Array.isArray(result.accounts)).toBe(true);
    expect(result.accounts.length).toBeGreaterThan(0);
    expect(result.accounts[0]).toHaveProperty("balance");
  });

  it("getTransactions returns categorized mock rows", async () => {
    const txs = await BankService.getTransactions();
    expect(txs.length).toBeGreaterThan(0);
    expect(txs[0]).toMatchObject({
      id: expect.any(String),
      category: expect.any(String),
      amount: expect.any(Number),
    });
  });

  it("getAccounts returns checking and savings", async () => {
    const accounts = await BankService.getAccounts();
    const types = accounts.map((a) => a.type);
    expect(types).toContain("checking");
    expect(types).toContain("savings");
  });

  it("FAKE_TRANSACTIONS_DB rows use YYYY-MM-DD dates in 2026-04 for sprint demos", () => {
    for (const tx of FAKE_TRANSACTIONS_DB) {
      expect(tx.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(tx.date.startsWith("2026-04")).toBe(true);
    }
  });

  it("merged bank + manual transactions support monthly spend totals", async () => {
    const bankTxs = await BankService.getTransactions();
    const manual = [
      {
        id: "m_test",
        name: "Manual",
        category: "Dining",
        amount: -20,
        date: "2026-04-15",
        source: "manual",
      },
    ];
    const merged = mergeTransactions(bankTxs, manual);
    expect(merged.some((t) => t.id === "m_test")).toBe(true);
    const april = totalSpendingForMonth(merged, "2026-04");
    expect(april).toBeGreaterThan(0);
    const incomeOnly = totalSpendingForMonth([{ category: "Income", amount: 3500, date: "2026-04-01" }], "2026-04");
    expect(incomeOnly).toBe(0);
  });
});
