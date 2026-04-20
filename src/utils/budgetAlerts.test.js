import { describe, it, expect } from "vitest";
import { BUDGET_WARN_RATIO, computeBudgetAlerts, filterVisibleBudgetAlerts } from "./budgetAlerts.js";

describe("budgetAlerts", () => {
  it("computeBudgetAlerts warns at 80% and flags over cap", () => {
    const categoryBudgets = { Groceries: 100, Dining: 50 };
    const spending = { Groceries: 80, Dining: 55 };
    const alerts = computeBudgetAlerts(categoryBudgets, spending);
    expect(alerts.find((a) => a.category === "Dining")?.level).toBe("over");
    expect(alerts.find((a) => a.category === "Groceries")?.level).toBe("warn");
    expect(alerts[0].level).toBe("over");
  });

  it("ignores categories with zero or missing cap", () => {
    expect(computeBudgetAlerts({ Groceries: 0 }, { Groceries: 999 })).toEqual([]);
    expect(computeBudgetAlerts({}, { Groceries: 50 })).toEqual([]);
  });

  it("filterVisibleBudgetAlerts hides dismissed warn and over", () => {
    const alerts = [
      { category: "A", spent: 90, cap: 100, ratio: 0.9, level: "warn" },
      { category: "B", spent: 120, cap: 100, ratio: 1.2, level: "over" },
    ];
    expect(filterVisibleBudgetAlerts(alerts, { A: "warn" })).toEqual([alerts[1]]);
    expect(filterVisibleBudgetAlerts(alerts, { B: "over" })).toEqual([alerts[0]]);
    expect(filterVisibleBudgetAlerts(alerts, { A: "warn", B: "over" })).toEqual([]);
  });

  it("warn is hidden if user dismissed over for same category (storage edge)", () => {
    const alerts = [{ category: "A", spent: 85, cap: 100, ratio: 0.85, level: "warn" }];
    expect(filterVisibleBudgetAlerts(alerts, { A: "over" })).toEqual([]);
  });

  it("exports 0.8 warn threshold", () => {
    expect(BUDGET_WARN_RATIO).toBe(0.8);
  });
});
