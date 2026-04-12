import { describe, it, expect } from "vitest";
import { formatUsd, formatLedgerAmount } from "./formatMoney.js";

describe("formatMoney", () => {
  it("formatUsd uses en-US grouping and two decimals by default", () => {
    expect(formatUsd(3842.15)).toBe("$3,842.15");
    expect(formatUsd(100)).toBe("$100.00");
  });

  it("formatLedgerAmount shows sign and absolute cents", () => {
    expect(formatLedgerAmount(-10.5)).toBe("-$10.50");
    expect(formatLedgerAmount(3500)).toBe("+$3500.00");
  });
});
