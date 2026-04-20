/**
 * Plaid integration — **stub only**. Implement server-side token exchange and `/transactions/sync`
 * before wiring this provider from the UI.
 *
 * Security: store `PLAID_CLIENT_ID`, `PLAID_SECRET`, and item access tokens only on the server
 * (Back4App Cloud Code environment, or a small Node service). The browser should only receive
 * short-lived `link_token` and call Plaid Link; never embed secrets in Vite env for production.
 */
export function createPlaidBankProviderStub() {
  return {
    id: "plaid",
    displayName: "Plaid (not configured)",
    async connect() {
      throw new Error(
        "Plaid is not implemented yet. Add Cloud Code routes (link_token, exchange_public_token, sync_transactions) and wire createPlaidBankProviderStub."
      );
    },
    async getAccounts() {
      throw new Error("Plaid getAccounts is not implemented.");
    },
    async getTransactions() {
      throw new Error("Plaid getTransactions is not implemented.");
    },
  };
}
