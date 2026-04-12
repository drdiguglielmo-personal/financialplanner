import { describe, it, expect } from "vitest";
import { MONTHLY_SPENDING_DB, GOALS_DB, FAKE_TRANSACTIONS_DB, EXPENSE_CATEGORIES } from "./mockData.js";

describe("mockData (dashboard + bank fixtures)", () => {
  it("EXPENSE_CATEGORIES excludes Income", () => {
    expect(EXPENSE_CATEGORIES).not.toContain("Income");
    expect(EXPENSE_CATEGORIES.length).toBeGreaterThan(0);
    expect(new Set(EXPENSE_CATEGORIES).size).toBe(EXPENSE_CATEGORIES.length);
  });

  it("has six months of spending trend data", () => {
    expect(MONTHLY_SPENDING_DB).toHaveLength(6);
    MONTHLY_SPENDING_DB.forEach((row) => {
      expect(row).toHaveProperty("month");
      expect(row).toHaveProperty("total");
    });
  });

  it("lists savings goals with targets", () => {
    expect(GOALS_DB.length).toBeGreaterThan(0);
    GOALS_DB.forEach((g) => {
      expect(g.target).toBeGreaterThan(0);
      expect(g.current).toBeGreaterThanOrEqual(0);
    });
  });

  it("fake transactions include income and expenses", () => {
    const amounts = FAKE_TRANSACTIONS_DB.map((t) => t.amount);
    expect(amounts.some((a) => a > 0)).toBe(true);
    expect(amounts.some((a) => a < 0)).toBe(true);
  });
});
