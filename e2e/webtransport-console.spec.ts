import { test } from "@playwright/test";

// This spec opens the IdleQuest frontend and streams browser console output
// (especially WebTransport-related logs) to the Playwright terminal.
//
// Usage:
//   1. In one terminal: npm run server:go
//   2. In another:      npm run dev
//   3. In a third:      npx playwright test e2e/webtransport-console.spec.ts
//
// You can then watch this test's output to see what the browser is logging.

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

test("log WebTransport-related console output", async ({ page }) => {
  console.log(`Opening frontend at ${FRONTEND_URL}`);

  page.on("console", (msg) => {
    const text = msg.text();

    // Only print the most relevant lines by default, but still include type
    if (
      text.includes("WebTransport") ||
      text.includes("WT certificate") ||
      text.includes("connecting https://localhost:8443/eq") ||
      text.includes("Opening handshake failed") ||
      text.includes("CERTIFICATE_UNKNOWN") ||
      text.includes("QUIC_TLS_CERTIFICATE_UNKNOWN") ||
      text.includes("getZoneNPCs not yet migrated to WebTransport")
    ) {
      console.log(`[browser:${msg.type()}] ${text}`);
    }
  });

  await page.goto(FRONTEND_URL, { waitUntil: "networkidle" });

  // Give the app some time to initialize WebTransport and log errors/success.
  await page.waitForTimeout(10_000);

  console.log("Finished capturing console output.");
});
