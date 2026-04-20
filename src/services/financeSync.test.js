import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryStorage } from "../test/memoryStorage.js";

vi.mock("./parseClient.js", () => ({
  isBack4AppConfigured: vi.fn(),
}));

vi.mock("./financeRemote.js", () => ({
  fetchUserFinanceState: vi.fn(),
  saveUserFinanceState: vi.fn(),
}));

import { isBack4AppConfigured } from "./parseClient.js";
import { fetchUserFinanceState, saveUserFinanceState } from "./financeRemote.js";
import { loadPersistedFinance, persistFinance } from "./financeSync.js";
import { getDefaultGoals } from "./userFinance.js";

describe("financeSync", () => {
  beforeEach(() => {
    globalThis.localStorage = new MemoryStorage();
    vi.mocked(isBack4AppConfigured).mockReset();
    vi.mocked(fetchUserFinanceState).mockReset();
    vi.mocked(saveUserFinanceState).mockReset();
  });

  it("loadPersistedFinance uses only localStorage when Back4App is not configured", async () => {
    vi.mocked(isBack4AppConfigured).mockReturnValue(false);
    const uid = "local_only";
    globalThis.localStorage.setItem(
      `smartbudget:${uid}:budgets`,
      JSON.stringify({ "2026-05": { Dining: 200 } })
    );
    globalThis.localStorage.setItem(`smartbudget:${uid}:expenses`, "[]");
    globalThis.localStorage.setItem(`smartbudget:${uid}:goals`, JSON.stringify([{ id: "g1", name: "A", target: 1, current: 0, color: "#fff", icon: "🎯" }]));
    globalThis.localStorage.setItem(`smartbudget:${uid}:bankConnected`, "1");

    const bundle = await loadPersistedFinance(uid);
    expect(bundle.budgets["2026-05"].Dining).toBe(200);
    expect(bundle.bankConnected).toBe(true);
    expect(fetchUserFinanceState).not.toHaveBeenCalled();
  });

  it("loadPersistedFinance returns defaults when cloud is configured but remote is missing and local is empty", async () => {
    vi.mocked(isBack4AppConfigured).mockReturnValue(true);
    vi.mocked(fetchUserFinanceState).mockResolvedValue(null);

    const bundle = await loadPersistedFinance("new_user");
    expect(bundle.budgets).toEqual({});
    expect(bundle.transactions).toEqual([]);
    expect(bundle.bankConnected).toBe(false);
    expect(bundle.goals.length).toBe(getDefaultGoals().length);
    expect(saveUserFinanceState).not.toHaveBeenCalled();
  });

  it("loadPersistedFinance migrates local-only data to cloud when remote is missing", async () => {
    vi.mocked(isBack4AppConfigured).mockReturnValue(true);
    vi.mocked(fetchUserFinanceState).mockResolvedValue(null);
    vi.mocked(saveUserFinanceState).mockResolvedValue(undefined);

    const uid = "migrate_me";
    globalThis.localStorage.setItem(`smartbudget:${uid}:budgets`, JSON.stringify({ "2026-01": { Groceries: 50 } }));

    const bundle = await loadPersistedFinance(uid);
    expect(bundle.budgets["2026-01"].Groceries).toBe(50);
    expect(saveUserFinanceState).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(saveUserFinanceState).mock.calls[0][0];
    expect(arg.budgets["2026-01"].Groceries).toBe(50);
  });

  it("loadPersistedFinance merges remote document and caches to localStorage", async () => {
    vi.mocked(isBack4AppConfigured).mockReturnValue(true);
    const remoteGoals = [{ id: "remote1", name: "Trip", target: 1000, current: 100, color: "#00f", icon: "✈️" }];
    vi.mocked(fetchUserFinanceState).mockResolvedValue({
      budgets: { "2026-06": { Transport: 80 } },
      transactions: [],
      manualExpenses: [{ id: "m1", name: "Lunch", amount: -5, category: "Dining", date: "2026-06-01", source: "manual" }],
      goals: remoteGoals,
      bankConnected: true,
    });

    const bundle = await loadPersistedFinance("cloud_user");
    expect(bundle.bankConnected).toBe(true);
    expect(bundle.transactions).toHaveLength(1);
    expect(bundle.transactions[0].id).toBe("m1");
    expect(bundle.goals).toEqual(remoteGoals);
    expect(globalThis.localStorage.getItem("smartbudget:cloud_user:bankConnected")).toBe("1");
  });

  it("loadPersistedFinance falls back to local when fetch throws", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.mocked(isBack4AppConfigured).mockReturnValue(true);
    vi.mocked(fetchUserFinanceState).mockRejectedValue(new Error("network"));

    const uid = "fallback";
    globalThis.localStorage.setItem(`smartbudget:${uid}:goals`, JSON.stringify(getDefaultGoals()));
    globalThis.localStorage.setItem(`smartbudget:${uid}:bankConnected`, "0");

    const bundle = await loadPersistedFinance(uid);
    expect(bundle.goals.length).toBeGreaterThan(0);
    expect(bundle.bankConnected).toBe(false);
    warn.mockRestore();
  });

  it("persistFinance always writes localStorage; calls cloud save when configured", async () => {
    vi.mocked(isBack4AppConfigured).mockReturnValue(true);
    vi.mocked(saveUserFinanceState).mockResolvedValue(undefined);

    const uid = "persist";
    const bundle = {
      budgets: {},
      transactions: [],
      goals: getDefaultGoals(),
      bankConnected: true,
    };
    await persistFinance(uid, bundle);

    expect(globalThis.localStorage.getItem("smartbudget:persist:bankConnected")).toBe("1");
    expect(saveUserFinanceState).toHaveBeenCalled();
    const saved = vi.mocked(saveUserFinanceState).mock.calls[0][0];
    expect(saved.transactions).toEqual([]);
    expect(saved.manualExpenses).toEqual([]);
  });

  it("persistFinance skips cloud when Back4App is not configured", async () => {
    vi.mocked(isBack4AppConfigured).mockReturnValue(false);

    await persistFinance("x", {
      budgets: {},
      transactions: [],
      goals: getDefaultGoals(),
      bankConnected: false,
    });
    expect(saveUserFinanceState).not.toHaveBeenCalled();
  });

  it("persistFinance swallows cloud save errors after local write", async () => {
    vi.mocked(isBack4AppConfigured).mockReturnValue(true);
    vi.mocked(saveUserFinanceState).mockRejectedValue(new Error("Parse error"));

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(
      persistFinance("err", {
        budgets: {},
        transactions: [],
        goals: getDefaultGoals(),
        bankConnected: false,
      })
    ).resolves.toBeUndefined();

    expect(globalThis.localStorage.getItem("smartbudget:err:goals")).toBeTruthy();
    warn.mockRestore();
  });
});
