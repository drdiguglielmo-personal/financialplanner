import { describe, it, expect } from "vitest";
import { BankService } from "./bank.js";

describe("BankService (mock bank layer)", () => {
  it("connect returns success and fake accounts", async () => {
    const result = await BankService.connect("chase");
    expect(result.success).toBe(true);
    expect(result.bank).toBe("chase");
    expect(Array.isArray(result.accounts)).toBe(true);
    expect(result.accounts.length).toBeGreaterThan(0);
    expect(result.accounts[0]).toHaveProperty("balance");
  });

  it("getTransactions returns categorized mock rows", async () => {
    const txs = await BankService.getTransactions();
    expect(txs.length).toBeGreaterThan(0);
    expect(txs[0]).toMatchObject({
      id: expect.any(String),
      category: expect.any(String),
      amount: expect.any(Number),
    });
  });

  it("getAccounts returns checking and savings", async () => {
    const accounts = await BankService.getAccounts();
    const types = accounts.map((a) => a.type);
    expect(types).toContain("checking");
    expect(types).toContain("savings");
  });
});
