const URL = import.meta.env.VITE_OVERSPEND_WEBHOOK_URL;

/**
 * Sends an overspend event to an automation service (Zapier/Make/IFTTT) which can email the user.
 * This avoids storing SMTP/API keys in the browser.
 *
 * @param {{
 *   userId: string,
 *   userEmail?: string,
 *   scopeKey: string,
 *   month: string,
 *   category: string,
 *   spent: number,
 *   cap: number,
 * }} payload
 */
export async function sendOverspendWebhook(payload) {
  if (!URL || typeof URL !== "string") return { ok: false, skipped: true };
  const url = URL.trim();
  if (!url) return { ok: false, skipped: true };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "budget_over",
      at: new Date().toISOString(),
      ...payload,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Webhook failed (${res.status}) ${txt}`.trim());
  }
  return { ok: true };
}

