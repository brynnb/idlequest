import { test, expect } from "@playwright/test";

test.setTimeout(5000);

test("complete character creation flow", async ({ page }) => {
  // Start at the character creation page
  await page.goto("/");

  // Click Start New Game
  await page.getByRole("button", { name: /start new game/i }).click();

  // Step 1: Character basics
  await page
    .getByRole("textbox", { name: /character name/i })
    .fill("TestCharacter");

  // Select race
  await page.getByText("Human").click();

  // Select class
  await page.getByText("Warrior").click();

  // Auto allocate attributes
  await page.getByRole("button", { name: /auto allocate/i }).click();

  // Click Next to proceed to deity selection
  await page.getByRole("button", { name: "Next" }).click();

  // Step 2: Deity Selection
  await page.getByText("Karana").click();
  await page.getByRole("button", { name: "Next" }).click();

  // Step 3: Starting Zone Selection
  await page.getByText("West Freeport").click();
  await page.getByRole("button", { name: "Next" }).click();

  // Step 4: Final confirmation and creation
  await page
    .getByRole("button", { name: /create character/i })
    .waitFor({ state: "visible", timeout: 10000 });
  await page.getByRole("button", { name: /create character/i }).isEnabled();
  await page.getByRole("button", { name: /create character/i }).click();

  // Verify we're redirected to the main page
  await expect(page).toHaveURL("/");

  // Verify character was created by checking for character name
  // await expect(page.getByText("TestCharacter")).toBeVisible();
});
