import { test, expect } from "@playwright/test";

// Simple smoke test that opens the HTTPS /online endpoint directly.
// This helps debug TLS / certificate issues independently of the SPA.
//
// Usage (from project root, with Go server running via `npm run server:go`):
//   npx playwright test e2e/https-online.spec.ts
//
// It will print any browser console messages and assert that the response
// body contains "Server is online".

const ONLINE_URL = process.env.ONLINE_URL ?? "https://localhost:8443/online";

test("HTTPS /online responds and logs console output", async ({ page }) => {
  console.log(`Opening ${ONLINE_URL}`);

  page.on("console", (msg) => {
    console.log(`[browser:${msg.type()}] ${msg.text()}`);
  });

  const response = await page.goto(ONLINE_URL, {
    waitUntil: "networkidle",
  });

  expect(response).not.toBeNull();
  if (response) {
    console.log(`HTTP status: ${response.status()}`);
  }

  const body = await page.textContent("body");
  console.log(`Body: ${body}`);

  expect(body).toContain("Server is online");
});
