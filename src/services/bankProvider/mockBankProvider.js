import { BankService } from "../bank.js";

/**
 * Demo / Sprint 1 provider — wraps the existing mock `BankService`.
 * Swap the dashboard to use this via `getDefaultBankProvider()` for a single seam toward Plaid later.
 */
export function createMockBankProvider() {
  return {
    id: "mock",
    displayName: "Demo bank (mock data)",
    async connect(bankName) {
      return BankService.connect(bankName);
    },
    async getAccounts() {
      return BankService.getAccounts();
    },
    async getTransactions() {
      return BankService.getTransactions();
    },
  };
}
