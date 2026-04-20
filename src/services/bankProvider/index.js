import { createMockBankProvider } from "./mockBankProvider.js";
import { createPlaidBankProviderStub } from "./plaidBankProvider.js";

/**
 * @returns ReturnType<typeof createMockBankProvider>
 */
export function getDefaultBankProvider() {
  return createMockBankProvider();
}

export { createMockBankProvider, createPlaidBankProviderStub };
