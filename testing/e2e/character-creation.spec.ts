import { test, expect } from "@playwright/test";

// Allow enough time for server communication and UI transitions
test.setTimeout(90000);

test.describe("Advanced Character Creation & Selection", () => {
  test("creation flow with verification, selection and deletion", async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto("/");

    // Login as Guest
    const guestButton = page.getByRole("button", { name: "GUEST" });
    await expect(guestButton).toBeVisible({ timeout: 10000 });
    await guestButton.click();

    // === Handle Slots and Selection ===
    await expect(page.getByRole("button", { name: "QUIT" })).toBeVisible({
      timeout: 15000,
    });

    const createBtnSelector = page.getByRole("button", {
      name: "CREATE NEW CHARACTER",
    });

    // Check if we have free slots.
    await page.waitForTimeout(1000);
    let createBtnCount = await createBtnSelector.count();
    console.log(`Initial available empty slots: ${createBtnCount}`);

    if (createBtnCount === 0) {
      console.log("No free slots! Deleting an existing character first...");
      const characterButtons = page.locator('button').filter({ hasNotText: /CREATE NEW CHARACTER|ENTER WORLD|DELETE|QUIT/ });
      const firstCharEntry = characterButtons.first();

      const charName = await firstCharEntry.textContent();
      console.log(`Deleting existing character for room: ${charName}`);

      await firstCharEntry.click();
      // Using exact: true to distinguish from the modal's Delete button
      await page.getByRole("button", { name: "DELETE", exact: true }).click();
      // The modal button is usually different (check for lowercase 'Delete' or its container)
      await page.locator('button').filter({ hasText: /^Delete$/ }).click();

      await expect(createBtnSelector.first()).toBeVisible({ timeout: 10000 });
      createBtnCount = await createBtnSelector.count();
    }

    // Now proceed with creation
    await createBtnSelector.first().click();

    // === Step 1: Identity & Stats ===
    await expect(page.getByRole("button", { name: "Human" })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole("button", { name: "Human" }).click();
    await page.getByRole("button", { name: "Warrior" }).click();

    // Use Random Name button
    const randomNameBtn = page.getByRole("button", { name: "Random Name" });
    await randomNameBtn.click();

    const nameInput = page.getByPlaceholder("Enter character name");
    const uniqueName = await nameInput.inputValue();
    console.log(`Generated random name: ${uniqueName}`);

    // Wait for name validation
    await expect(page.getByText("Name is available!")).toBeVisible({
      timeout: 15000,
    });

    // Auto-allocate
    await page.getByRole("button", { name: /auto/i }).click();
    await page.waitForTimeout(500);

    // Continue
    await page.getByRole("button", { name: "Next" }).first().click();

    // === Step 2: Deity ===
    await expect(page.getByText("Choose A Deity")).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();

    // === Step 3: Zone ===
    await page.waitForTimeout(500);
    await page.getByRole("button", { name: "Next" }).click();

    // === Step 4: Finalize ===
    await expect(page.getByText(/Your journey begins/i)).toBeVisible();
    await page.getByRole("button", { name: "Create" }).click();

    // === Verify returning to Character Select ===
    console.log(`Verifying character ${uniqueName} in list...`);
    const charEntryInList = page.getByRole("button", { name: uniqueName });
    await expect(charEntryInList).toBeVisible({ timeout: 20000 });

    // Verify Selection
    // 1. ENTER WORLD is enabled
    await expect(page.getByRole("button", { name: "ENTER WORLD" })).toBeEnabled({ timeout: 10000 });
    // 2. Character info area should show Warrior
    await expect(page.locator('div').filter({ hasText: "Warrior" }).last()).toBeVisible();

    // === Test Character Deletion ===
    console.log(`Verifying deletion of ${uniqueName}...`);
    await charEntryInList.click();

    // Distinguish between DELETE (action) and Delete (modal confirm)
    await page.getByRole("button", { name: "DELETE", exact: true }).click();
    // Modal confirmation button has text "Delete" and is usually in a centered div
    const confirmDeleteBtn = page.locator('button').filter({ hasText: /^Delete$/ });
    await expect(confirmDeleteBtn).toBeVisible();
    await confirmDeleteBtn.click();

    // Verify character is gone
    await expect(charEntryInList).not.toBeVisible({ timeout: 15000 });
    console.log("Cleanup: Character deleted successfully.");
  });
});
