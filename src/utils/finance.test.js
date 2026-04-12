import { describe, it, expect } from "vitest";
import {
  mergeTransactions,
  spendingByCategoryForMonth,
  totalSpendingForMonth,
  isExpenseTransaction,
  transactionMonth,
} from "./finance.js";

describe("finance utils", () => {
  const bank = [
    { id: "t1", name: "A", category: "Groceries", amount: -10, date: "2026-04-05" },
    { id: "t2", name: "B", category: "Income", amount: 100, date: "2026-04-05" },
  ];
  const manual = [{ id: "m1", name: "C", category: "Dining", amount: -5, date: "2026-04-06", source: "manual" }];

  it("mergeTransactions combines and dedupes by id", () => {
    const merged = mergeTransactions(bank, manual);
    expect(merged).toHaveLength(3);
    expect(merged[0].date >= merged[1].date).toBe(true);
  });

  it("mergeTransactions: same id in manual overwrites bank row", () => {
    const dup = [
      { id: "t1", name: "Bank", category: "Groceries", amount: -1, date: "2026-04-01" },
      { id: "t1", name: "Manual wins", category: "Groceries", amount: -99, date: "2026-04-02" },
    ];
    const merged = mergeTransactions(dup.slice(0, 1), dup.slice(1));
    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe("Manual wins");
  });

  it("transactionMonth returns YYYY-MM", () => {
    expect(transactionMonth({ date: "2026-12-31" })).toBe("2026-12");
  });

  it("isExpenseTransaction ignores income", () => {
    expect(isExpenseTransaction({ amount: -1, category: "Groceries" })).toBe(true);
    expect(isExpenseTransaction({ amount: 100, category: "Income" })).toBe(false);
    expect(isExpenseTransaction({ amount: 100, category: "Groceries" })).toBe(false);
    expect(isExpenseTransaction({ amount: -100, category: "Income" })).toBe(false);
  });

  it("spendingByCategoryForMonth sums expenses for YYYY-MM", () => {
    const txs = [
      { category: "Groceries", amount: -10, date: "2026-04-01" },
      { category: "Groceries", amount: -5, date: "2026-04-15" },
      { category: "Groceries", amount: -3, date: "2026-03-30" },
    ];
    const byCat = spendingByCategoryForMonth(txs, "2026-04");
    expect(byCat.Groceries).toBe(15);
  });

  it("spendingByCategoryForMonth excludes income even if negative-looking category", () => {
    const txs = [{ category: "Income", amount: -500, date: "2026-04-01" }];
    expect(spendingByCategoryForMonth(txs, "2026-04")).toEqual({});
  });

  it("totalSpendingForMonth aggregates categories", () => {
    const txs = [
      { category: "Groceries", amount: -10, date: "2026-04-01" },
      { category: "Dining", amount: -5, date: "2026-04-02" },
    ];
    expect(totalSpendingForMonth(txs, "2026-04")).toBe(15);
  });

  it("totalSpendingForMonth is zero when no expenses in month", () => {
    expect(totalSpendingForMonth([], "2026-04")).toBe(0);
    expect(
      totalSpendingForMonth([{ category: "Groceries", amount: -10, date: "2026-03-01" }], "2026-04")
    ).toBe(0);
  });
});
