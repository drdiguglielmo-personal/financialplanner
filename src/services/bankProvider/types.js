/**
 * @typedef {object} BankAccount
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {number} balance
 * @property {string} bank
 */

/**
 * @typedef {object} BankTransaction
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {number} amount
 * @property {string} date
 * @property {string} [icon]
 * @property {string} [color]
 * @property {'bank_mock'|'plaid'|'csv'|'manual'} [source]
 */

/**
 * Plaid (future): exchange public token and sync transactions on a **trusted server**
 * (Parse Cloud Code or small backend). Never put Plaid secret in the browser.
 *
 * Suggested Cloud Code / HTTP routes (not implemented):
 * - POST /plaid/link_token — body: { userId } → { link_token }
 * - POST /plaid/exchange_public_token — body: { public_token } → { item_id }
 * - POST /plaid/sync_transactions — body: { cursor? } → { added, modified, removed }
 *
 * @typedef {object} PlaidIntegrationOutline
 * @property {string} linkTokenEndpoint
 * @property {string} exchangeEndpoint
 * @property {string} syncEndpoint
 */

export {};
