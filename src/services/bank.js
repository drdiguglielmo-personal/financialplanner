import { FAKE_ACCOUNTS_DB, FAKE_TRANSACTIONS_DB } from "../data/mockData.js";

export const BankService = {
  async connect(bankName) {
    await new Promise((r) => setTimeout(r, 1200));
    return { success: true, bank: bankName, accounts: Object.values(FAKE_ACCOUNTS_DB) };
  },
  async getTransactions() {
    await new Promise((r) => setTimeout(r, 600));
    return FAKE_TRANSACTIONS_DB;
  },
  async getAccounts() {
    await new Promise((r) => setTimeout(r, 400));
    return Object.values(FAKE_ACCOUNTS_DB);
  },
};
