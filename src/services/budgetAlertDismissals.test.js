import { describe, it, expect, beforeEach } from "vitest";
import { MemoryStorage } from "../test/memoryStorage.js";
import {
  dismissBudgetAlert,
  pruneBudgetAlertDismissalsForMonth,
  readDismissalsForMonth,
} from "./budgetAlertDismissals.js";

describe("budgetAlertDismissals", () => {
  beforeEach(() => {
    globalThis.localStorage = new MemoryStorage();
  });

  it("dismiss and read round-trip per month", () => {
    dismissBudgetAlert("u1", "2026-04", "Groceries", "warn");
    expect(readDismissalsForMonth("u1", "2026-04")).toEqual({ Groceries: "warn" });
    expect(readDismissalsForMonth("u1", "2026-05")).toEqual({});
  });

  it("prune removes dismissal when spending falls below clear threshold", () => {
    dismissBudgetAlert("u1", "2026-04", "Groceries", "warn");
    pruneBudgetAlertDismissalsForMonth("u1", "2026-04", { Groceries: 100 }, { Groceries: 70 });
    expect(readDismissalsForMonth("u1", "2026-04")).toEqual({});
  });

  it("prune clears over-dismiss when no longer over budget", () => {
    dismissBudgetAlert("u1", "2026-04", "Dining", "over");
    pruneBudgetAlertDismissalsForMonth("u1", "2026-04", { Dining: 100 }, { Dining: 90 });
    expect(readDismissalsForMonth("u1", "2026-04")).toEqual({});
  });
});
