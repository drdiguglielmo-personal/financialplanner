import { describe, it, expect } from "vitest";
import {
  addCadenceToDate,
  buildUpcomingRecurringOccurrences,
  defaultNextDueFromPostedDate,
  isValidRecurring,
  rollDueToPresent,
} from "./recurring.js";

describe("recurring", () => {
  it("addCadenceToDate steps weekly, monthly, yearly", () => {
    expect(addCadenceToDate("2026-01-15", "weekly")).toBe("2026-01-22");
    expect(addCadenceToDate("2026-01-15", "monthly")).toBe("2026-02-15");
    expect(addCadenceToDate("2026-04-01", "yearly")).toBe("2027-04-01");
  });

  it("defaultNextDueFromPostedDate is one period after posted date", () => {
    expect(defaultNextDueFromPostedDate("2026-04-01", "monthly")).toBe("2026-05-01");
  });

  it("rollDueToPresent advances stale nextDue", () => {
    expect(rollDueToPresent("2026-01-01", "monthly", "2026-06-01")).toBe("2026-06-01");
  });

  it("isValidRecurring validates shape", () => {
    expect(isValidRecurring({ cadence: "monthly", nextDue: "2026-04-01" })).toBe(true);
    expect(isValidRecurring({ cadence: "daily", nextDue: "2026-04-01" })).toBe(false);
    expect(isValidRecurring({ cadence: "monthly", nextDue: "bad" })).toBe(false);
  });

  it("buildUpcomingRecurringOccurrences projects within horizon", () => {
    const txs = [
      {
        id: "m1",
        name: "Gym",
        category: "Health",
        amount: -30,
        date: "2026-04-01",
        source: "manual",
        recurring: { cadence: "monthly", nextDue: "2026-04-15" },
      },
    ];
    const rows = buildUpcomingRecurringOccurrences(txs, { todayStr: "2026-04-01", horizonDays: 60 });
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows[0].dueDate).toBe("2026-04-15");
    expect(rows[0].name).toBe("Gym");
  });

  it("skips positive amounts for upcoming", () => {
    const txs = [
      {
        id: "x",
        name: "Paycheck",
        category: "Income",
        amount: 100,
        date: "2026-04-01",
        source: "manual",
        recurring: { cadence: "monthly", nextDue: "2026-04-05" },
      },
    ];
    expect(buildUpcomingRecurringOccurrences(txs, { todayStr: "2026-04-01" })).toEqual([]);
  });
});
