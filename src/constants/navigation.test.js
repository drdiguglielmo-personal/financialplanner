import { describe, it, expect } from "vitest";
import { NAV, NAV_ITEMS, secondaryPageTitle } from "./navigation.js";

describe("navigation", () => {
  it("NAV_ITEMS covers every NAV id once", () => {
    const ids = new Set(NAV_ITEMS.map((i) => i.id));
    expect(ids.size).toBe(NAV_ITEMS.length);
    expect(ids.has(NAV.DASHBOARD)).toBe(true);
    expect(ids.has(NAV.BUDGETS)).toBe(true);
  });

  it("secondaryPageTitle maps known routes", () => {
    expect(secondaryPageTitle(NAV.DASHBOARD)).toBe("Overview");
    expect(secondaryPageTitle(NAV.BUDGETS)).toBe("Budgets");
    expect(secondaryPageTitle(NAV.GOALS)).toBe("Savings goals");
  });
});
