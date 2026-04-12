import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStorage } from "../test/memoryStorage.js";
import {
  applySetCategoryBudget,
  applyAddManualExpense,
  applyDeleteManualExpense,
  applyUpdateGoal,
  applyAddGoal,
  applyRemoveGoal,
  loadLocalFinance,
  saveLocalFinance,
  getDefaultGoals,
  hasPersistedLocalFinance,
  createDefaultFinanceBundle,
} from "./userFinance.js";

describe("userFinance (pure + localStorage)", () => {
  beforeEach(() => {
    globalThis.localStorage = new MemoryStorage();
  });

  it("applySetCategoryBudget adds and clears category caps", () => {
    let budgets = {};
    budgets = applySetCategoryBudget(budgets, "2026-04", "Groceries", 400);
    expect(budgets["2026-04"].Groceries).toBe(400);
    budgets = applySetCategoryBudget(budgets, "2026-04", "Groceries", 0);
    expect(budgets["2026-04"]).toBeUndefined();
  });

  it("applySetCategoryBudget keeps different months independent", () => {
    let budgets = {};
    budgets = applySetCategoryBudget(budgets, "2026-03", "Dining", 100);
    budgets = applySetCategoryBudget(budgets, "2026-04", "Dining", 200);
    expect(budgets["2026-03"].Dining).toBe(100);
    expect(budgets["2026-04"].Dining).toBe(200);
  });

  it("applyAddManualExpense stores negative amount; delete removes", () => {
    let manual = [];
    const { manualExpenses } = applyAddManualExpense(manual, {
      name: "Coffee",
      amount: 4.5,
      category: "Dining",
      date: "2026-04-10",
    });
    manual = manualExpenses;
    expect(manual[0].amount).toBe(-4.5);
    expect(manual[0].category).toBe("Dining");
    expect(manual[0].source).toBe("manual");
    manual = applyDeleteManualExpense(manual, manual[0].id);
    expect(manual).toHaveLength(0);
  });

  it("applyAddManualExpense rounds amounts to two decimals", () => {
    const { manualExpenses } = applyAddManualExpense([], {
      name: "X",
      amount: 10.999,
      category: "Groceries",
      date: "2026-04-01",
    });
    expect(manualExpenses[0].amount).toBe(-11);
  });

  it("applyUpdateGoal patches one goal by id", () => {
    let goals = [{ id: "a", name: "A", target: 100, current: 0, color: "#fff", icon: "🎯" }];
    goals = applyUpdateGoal(goals, "a", { current: 50, target: 200 });
    expect(goals[0].current).toBe(50);
    expect(goals[0].target).toBe(200);
  });

  it("saveLocalFinance and loadLocalFinance round-trip budgets, goals, and bankConnected", () => {
    const uid = "user_roundtrip";
    const bundle = {
      budgets: { "2026-04": { Dining: 100 } },
      manualExpenses: [],
      goals: getDefaultGoals(),
      bankConnected: true,
    };
    saveLocalFinance(uid, bundle);
    expect(hasPersistedLocalFinance(uid)).toBe(true);
    const back = loadLocalFinance(uid);
    expect(back.budgets["2026-04"].Dining).toBe(100);
    expect(back.goals.length).toBeGreaterThan(0);
    expect(back.bankConnected).toBe(true);
  });

  it("loadLocalFinance defaults bankConnected to false when key missing", () => {
    const uid = "no_bank_flag";
    globalThis.localStorage.setItem(`smartbudget:${uid}:goals`, JSON.stringify(getDefaultGoals()));
    const back = loadLocalFinance(uid);
    expect(back.bankConnected).toBe(false);
  });

  it("applyAddGoal and applyRemoveGoal", () => {
    let goals = getDefaultGoals();
    goals = applyAddGoal(goals, { name: "Test", target: 500, icon: "🧪", color: "#fff" });
    const created = goals.find((g) => g.name === "Test");
    expect(created).toBeTruthy();
    goals = applyRemoveGoal(goals, created.id);
    expect(goals.some((g) => g.name === "Test")).toBe(false);
  });

  it("getDefaultGoals mirrors GOALS_DB shape", () => {
    const g = getDefaultGoals();
    expect(g.length).toBeGreaterThan(0);
    expect(g[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      target: expect.any(Number),
      current: expect.any(Number),
      color: expect.any(String),
      icon: expect.any(String),
    });
  });

  it("createDefaultFinanceBundle matches empty cloud shape", () => {
    const b = createDefaultFinanceBundle();
    expect(b.budgets).toEqual({});
    expect(b.manualExpenses).toEqual([]);
    expect(b.bankConnected).toBe(false);
    expect(b.goals.length).toBe(getDefaultGoals().length);
  });
});
