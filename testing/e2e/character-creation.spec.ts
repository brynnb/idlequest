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
    // Wait for the Character Select page to load
    await expect(page.getByRole("button", { name: "QUIT" })).toBeVisible({
      timeout: 15000,
    });

    const createBtnSelector = page.getByRole("button", {
      name: "CREATE NEW CHARACTER",
    });

    // Check if we have free slots. If not, delete one character.
    const createBtnCount = await createBtnSelector.count();
    console.log(`Available empty slots: ${createBtnCount}`);

    if (createBtnCount === 0) {
      console.log("No free slots! Deleting an existing character first...");
      // Select the first character in the list (if any)
      const firstCharEntry = page
        .locator("button")
        .filter({ hasNotText: "CREATE NEW CHARACTER" })
        .filter({ hasNotText: /ENTER WORLD|DELETE|QUIT/ })
        .first();

      await firstCharEntry.click();

      // Click DELETE
      await page.getByRole("button", { name: "DELETE" }).click();

      // Confirm deletion in modal
      const confirmBtn = page.getByRole("button", { name: "Delete" });
      await expect(confirmBtn).toBeVisible();
      await confirmBtn.click();

      // Ensure a "CREATE NEW CHARACTER" button appeared
      await expect(createBtnSelector.first()).toBeVisible({ timeout: 10000 });
    }

    // Now proceed with creation
    await createBtnSelector.first().click();

    // === Step 1: Identity & Stats ===
    await expect(page.getByRole("button", { name: "Human" })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole("button", { name: "Human" }).click();
    await page.getByRole("button", { name: "Warrior" }).click();

    // Generate a unique name
    const uniqueName = `Test${Date.now().toString().slice(-6)}`;
    const nameInput = page.getByPlaceholder("Enter character name");
    await nameInput.fill(uniqueName);

    // Wait for name validation
    await expect(page.getByText("Name is available!")).toBeVisible({
      timeout: 10000,
    });

    // Auto-allocate
    await page.getByRole("button", { name: /auto/i }).click();
    await page.waitForTimeout(500);

    // Continue
    const nextBtn = page.getByRole("button", { name: "Next" }).first();
    await expect(nextBtn).toBeEnabled();
    await nextBtn.click();

    // === Step 2: Deity ===
    await expect(page.getByText("Choose A Deity")).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();

    // === Step 3: Zone ===
    await page.waitForTimeout(500); // UI transition
    await page.getByRole("button", { name: "Next" }).click();

    // === Step 4: Finalize ===
    await expect(page.getByText(/Your journey begins/i)).toBeVisible();
    const finalizeBtn = page.getByRole("button", { name: "Create" });
    await expect(finalizeBtn).toBeEnabled();
    await finalizeBtn.click();

    // === Verify returning to Character Select ===
    // The SubmitCharacter component redirects back and sets pendingSelectName
    const charEntryInList = page.getByRole("button", { name: uniqueName });
    await expect(charEntryInList).toBeVisible({ timeout: 15000 });

    // Verify it is the ACTIVE selection
    // In our UI, the active button uses the 'actionbuttonpress.png' background
    // We can also check if the Character Preview area shows the class/level
    await expect(page.getByText("CURRENT LOCATION")).toBeVisible();

    // Check for the "selected" state. 
    // Since styled-components uses props, we check if the button has the expected visual state
    // In CharacterSelectPage: $isSelected={selectedCharacter?.name === character?.name}
    // We can verify that the "ENTER WORLD" button is enabled, which implies selection
    await expect(page.getByRole("button", { name: "ENTER WORLD" })).toBeEnabled();

    // === Test Character Deletion ===
    console.log(`Verifying deletion of ${uniqueName}...`);
    // Ensure our new char is selected (should be by default)
    await charEntryInList.click();

    const deleteBtn = page.getByRole("button", { name: "DELETE" });
    await expect(deleteBtn).toBeEnabled();
    await deleteBtn.click();

    // Modal confirmation
    const modalConfirm = page.getByRole("button", { name: "Delete" });
    await expect(modalConfirm).toBeVisible();
    await modalConfirm.click();

    // Verify character is gone and slot is back to "CREATE NEW CHARACTER"
    await expect(charEntryInList).not.toBeVisible({ timeout: 10000 });
    // Check if the slot became a create button again (or count increased)
    const newCreateBtnCount = await createBtnSelector.count();
    expect(newCreateBtnCount).toBeGreaterThan(0);

    console.log("Cleanup: Character deleted successfully.");
  });
});
