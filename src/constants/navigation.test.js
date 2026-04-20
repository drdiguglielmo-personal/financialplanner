import { describe, it, expect } from "vitest";
import { NAV, NAV_ITEMS, secondaryPageTitle } from "./navigation.js";

describe("navigation", () => {
  it("NAV_ITEMS covers every NAV id once", () => {
    const ids = new Set(NAV_ITEMS.map((i) => i.id));
    expect(ids.size).toBe(NAV_ITEMS.length);
    for (const id of Object.values(NAV)) {
      expect(ids.has(id)).toBe(true);
    }
  });

  it("secondaryPageTitle maps known routes", () => {
    expect(secondaryPageTitle(NAV.DASHBOARD)).toBe("Overview");
    expect(secondaryPageTitle(NAV.BUDGETS)).toBe("Budgets");
    expect(secondaryPageTitle(NAV.GOALS)).toBe("Savings goals");
    expect(secondaryPageTitle(NAV.HOUSEHOLD)).toBe("Household sharing");
  });
});
