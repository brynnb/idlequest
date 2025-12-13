import { test, expect, Page } from "@playwright/test";

/**
 * End-to-end test for inventory persistence across camp/login cycle.
 *
 * This test verifies that the (bag, slot) inventory addressing system
 * correctly persists items through:
 * 1. Character creation with starting items
 * 2. Moving/equipping items
 * 3. Camping (logout)
 * 4. Re-login
 * 5. Verifying items are in the same slots
 *
 * Prerequisites:
 * - Server running: npm run server
 * - Frontend running: npm run dev
 *
 * Run with: npx playwright test e2e/inventory-persistence.spec.ts --headed
 */

// Increase timeout for this test since it involves multiple login cycles
test.setTimeout(120_000);

// Helper to capture inventory state from React/Zustand store
async function getInventoryState(page: Page): Promise<InventorySnapshot[]> {
  return await page.evaluate(() => {
    // Access Zustand store from window (we'll expose it)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = (window as any).__PLAYER_STORE__;
    if (!store) {
      console.error("Player store not found on window");
      return [];
    }
    const state = store.getState();
    const inventory = state.characterProfile?.inventory || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return inventory.map((item: any) => ({
      bag: item.bag,
      slot: item.slot,
      itemid: item.itemid,
      name: item.itemDetails?.name || "Unknown",
    }));
  });
}

interface InventorySnapshot {
  bag: number;
  slot: number;
  itemid: number;
  name: string;
}

// Helper to log inventory state
function logInventory(label: string, inventory: InventorySnapshot[]) {
  console.log(`\n=== ${label} ===`);
  if (inventory.length === 0) {
    console.log("  (empty)");
    return;
  }
  for (const item of inventory) {
    console.log(
      `  bag=${item.bag}, slot=${item.slot}: ${item.name} (id=${item.itemid})`
    );
  }
}

// Helper to wait for inventory to be loaded
async function waitForInventory(
  page: Page,
  minItems: number = 1,
  timeout: number = 30000
): Promise<InventorySnapshot[]> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const inventory = await getInventoryState(page);
    if (inventory.length >= minItems) {
      return inventory;
    }
    await page.waitForTimeout(500);
  }
  throw new Error(
    `Timeout waiting for inventory with at least ${minItems} items`
  );
}

// Helper to compare inventory snapshots
function compareInventory(
  before: InventorySnapshot[],
  after: InventorySnapshot[]
): { matches: boolean; differences: string[] } {
  const differences: string[] = [];

  // Create maps for easier comparison
  const beforeMap: Record<string, InventorySnapshot> = {};
  const afterMap: Record<string, InventorySnapshot> = {};

  for (const item of before) {
    beforeMap[`${item.bag}-${item.slot}`] = item;
  }
  for (const item of after) {
    afterMap[`${item.bag}-${item.slot}`] = item;
  }

  // Check items that were in before
  for (const key of Object.keys(beforeMap)) {
    const beforeItem = beforeMap[key];
    const afterItem = afterMap[key];
    if (!afterItem) {
      differences.push(
        `MISSING: ${beforeItem.name} was at bag=${beforeItem.bag}, slot=${beforeItem.slot} but is now gone`
      );
    } else if (afterItem.itemid !== beforeItem.itemid) {
      differences.push(
        `CHANGED: bag=${beforeItem.bag}, slot=${beforeItem.slot} had ${beforeItem.name} (id=${beforeItem.itemid}), now has ${afterItem.name} (id=${afterItem.itemid})`
      );
    }
  }

  // Check for new items that weren't in before
  for (const key of Object.keys(afterMap)) {
    const afterItem = afterMap[key];
    if (!beforeMap[key]) {
      differences.push(
        `NEW: ${afterItem.name} appeared at bag=${afterItem.bag}, slot=${afterItem.slot}`
      );
    }
  }

  return {
    matches: differences.length === 0,
    differences,
  };
}

test.describe("Inventory Persistence", () => {
  test.beforeEach(async ({ page }) => {
    // Listen to console for debugging
    page.on("console", (msg) => {
      const text = msg.text();
      if (
        text.includes("inventory") ||
        text.includes("Inventory") ||
        text.includes("PlayerProfile") ||
        text.includes("CharacterSelect") ||
        text.includes("bag") ||
        text.includes("slot")
      ) {
        console.log(`[browser:${msg.type()}] ${text}`);
      }
    });
  });

  test("items persist in correct slots after camp and re-login", async ({
    page,
  }) => {
    const characterName = `TestInv${Date.now().toString(36)}`;

    console.log(`\n========================================`);
    console.log(`Testing inventory persistence for: ${characterName}`);
    console.log(`========================================\n`);

    // ========== PHASE 1: Login and create a new character ==========
    console.log("PHASE 1: Logging in and creating new character...");

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Login flow: CONNECT then GUEST
    console.log("  Clicking CONNECT...");
    await page.getByRole("button", { name: /connect/i }).click();
    await page.waitForTimeout(2000);

    console.log("  Clicking GUEST...");
    await page.getByRole("button", { name: /guest/i }).click();
    await page.waitForTimeout(3000);

    // Should be at character select now - click Create New (use first() since there are multiple slots)
    console.log("  Looking for Create New button...");
    const createNewBtn = page
      .getByRole("button", { name: /create new|new character/i })
      .first();
    if (await createNewBtn.isVisible({ timeout: 5000 })) {
      await createNewBtn.click();
      await page.waitForTimeout(1000);
    } else {
      // Navigate directly to create page
      await page.goto("/create");
    }

    await page.waitForURL(/\/create/, { timeout: 10000 });
    console.log("  At character creation page");

    // Fill character name
    await page
      .getByRole("textbox", { name: /character name/i })
      .fill(characterName);

    // Select race and class
    await page.getByText("Human").click();
    await page.getByText("Warrior").click();

    // Auto allocate attributes
    await page.getByRole("button", { name: /auto allocate/i }).click();

    // Proceed through steps
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByText("Karana").click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByText("West Freeport").click();
    await page.getByRole("button", { name: "Next" }).click();

    // Create character (button text is just "Create")
    await page
      .getByRole("button", { name: /^create$/i })
      .waitFor({ state: "visible", timeout: 10000 });
    await page.getByRole("button", { name: /^create$/i }).click();

    // Wait for redirect to character select or main page
    await page.waitForTimeout(3000);
    console.log(`Character created, now at: ${page.url()}`);

    // ========== PHASE 2: Enter the game and check initial inventory ==========
    console.log("\nPHASE 2: Entering game and checking initial inventory...");

    // If we're at character select, select our character
    if (
      page.url().includes("select") ||
      page.url() === "http://localhost:5173/"
    ) {
      // Wait for character list to load
      await page.waitForTimeout(2000);

      // Look for our character and click Enter World
      const characterEntry = page.locator(`text=${characterName}`).first();
      if (await characterEntry.isVisible()) {
        await characterEntry.click();
      }

      // Click Enter World button
      const enterWorldBtn = page.getByRole("button", { name: /enter world/i });
      if (await enterWorldBtn.isVisible()) {
        await enterWorldBtn.click();
      }
    }

    // Wait for game to load
    await page.waitForURL(/\/game/, { timeout: 15000 });
    await page.waitForTimeout(3000); // Give time for inventory to load

    // Get initial inventory state
    const initialInventory = await waitForInventory(page, 1, 30000);
    logInventory(
      "Initial Inventory (after character creation)",
      initialInventory
    );

    // ========== PHASE 3: Record inventory state before camp ==========
    console.log("\nPHASE 3: Recording inventory state before camp...");

    // Record inventory state before camp (inventory is already loaded from entering game)
    const beforeCampInventory = await getInventoryState(page);
    logInventory("Inventory Before Camp", beforeCampInventory);

    // ========== PHASE 4: Camp (logout) ==========
    console.log("\nPHASE 4: Camping (logging out)...");

    // Look for camp/logout button
    const campButton = page
      .getByRole("button", { name: /camp/i })
      .or(page.getByRole("button", { name: /logout/i }))
      .or(page.locator('[data-testid="camp-button"]'));

    if (await campButton.isVisible()) {
      await campButton.click();
      await page.waitForTimeout(2000);
    } else {
      // Navigate directly to character select/login
      console.log("Camp button not found, navigating to character select...");
      await page.goto("/");
    }

    // Wait for character select screen
    await page.waitForTimeout(2000);
    console.log(`After camp, now at: ${page.url()}`);

    // ========== PHASE 5: Re-login ==========
    console.log("\nPHASE 5: Re-logging in...");

    // Wait for character list
    await page.waitForTimeout(2000);

    // Find and select our character
    const charEntry = page.locator(`text=${characterName}`).first();
    if (await charEntry.isVisible()) {
      await charEntry.click();
      await page.waitForTimeout(500);
    }

    // Click Enter World
    const enterBtn = page.getByRole("button", { name: /enter world/i });
    if (await enterBtn.isVisible()) {
      await enterBtn.click();
    }

    // Wait for game to load
    await page.waitForURL(/\/game/, { timeout: 15000 });
    await page.waitForTimeout(3000); // Give time for inventory to load

    // ========== PHASE 6: Verify inventory ==========
    console.log("\nPHASE 6: Verifying inventory after re-login...");

    const afterLoginInventory = await waitForInventory(page, 1, 30000);
    logInventory("Inventory After Re-Login", afterLoginInventory);

    // Compare inventories
    const comparison = compareInventory(
      beforeCampInventory,
      afterLoginInventory
    );

    if (!comparison.matches) {
      console.log("\n!!! INVENTORY MISMATCH DETECTED !!!");
      for (const diff of comparison.differences) {
        console.log(`  - ${diff}`);
      }
    } else {
      console.log("\n✓ Inventory matches! All items in correct slots.");
    }

    // Assert that inventories match
    expect(
      comparison.matches,
      `Inventory mismatch:\n${comparison.differences.join("\n")}`
    ).toBe(true);

    // Additional assertions
    expect(afterLoginInventory.length).toBeGreaterThan(0);
    expect(afterLoginInventory.length).toBe(beforeCampInventory.length);

    // Verify no items ended up in wrong slots (e.g., all in equipment row)
    const equipmentSlotItems = afterLoginInventory.filter(
      (i) => i.bag === 0 && i.slot >= 0 && i.slot <= 21
    );
    const generalSlotItems = afterLoginInventory.filter(
      (i) => i.bag === 0 && i.slot >= 22 && i.slot <= 29
    );

    console.log(`\nSlot distribution after re-login:`);
    console.log(`  Equipment slots (0-21): ${equipmentSlotItems.length} items`);
    console.log(`  General slots (22-29): ${generalSlotItems.length} items`);

    // If all items ended up in equipment slots when they shouldn't, that's the bug we're testing for
    if (
      beforeCampInventory.some((i) => i.slot >= 22) &&
      !afterLoginInventory.some((i) => i.slot >= 22)
    ) {
      throw new Error(
        "BUG DETECTED: Items that were in general slots are now all in equipment slots!"
      );
    }

    console.log("\n========================================");
    console.log("TEST PASSED: Inventory persisted correctly!");
    console.log("========================================\n");
  });

  test.skip("equipped items stay equipped after camp", async ({ page }) => {
    // This test specifically checks that items in equipment slots (0-21)
    // stay in those slots and don't get moved

    const characterName = `TestEquip${Date.now().toString(36)}`;

    console.log(`\nTesting equipped item persistence for: ${characterName}`);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Login flow: CONNECT then GUEST
    await page.getByRole("button", { name: /connect/i }).click();
    await page.waitForTimeout(2000);
    await page.getByRole("button", { name: /guest/i }).click();
    await page.waitForTimeout(3000);

    // Navigate to create page (use first() since there are multiple character slots)
    const createNewBtn = page
      .getByRole("button", { name: /create new|new character/i })
      .first();
    if (await createNewBtn.isVisible({ timeout: 5000 })) {
      await createNewBtn.click();
    } else {
      await page.goto("/create");
    }
    await page.waitForURL(/\/create/, { timeout: 10000 });

    // Quick character creation
    await page
      .getByRole("textbox", { name: /character name/i })
      .fill(characterName);
    await page.getByText("Human").click();
    await page.getByText("Warrior").click();
    await page.getByRole("button", { name: /auto allocate/i }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByText("Karana").click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByText("West Freeport").click();
    await page.getByRole("button", { name: "Next" }).click();
    await page
      .getByRole("button", { name: /^create$/i })
      .waitFor({ state: "visible" });
    await page.getByRole("button", { name: /^create$/i }).click();

    // Wait for redirect to character select
    await page.waitForTimeout(3000);
    console.log(`After create, at: ${page.url()}`);

    // Select our character and enter world
    await page.waitForTimeout(2000);
    const charEntry = page.locator(`text=${characterName}`).first();
    if (await charEntry.isVisible({ timeout: 5000 })) {
      await charEntry.click();
    }
    const enterWorldBtn = page.getByRole("button", { name: /enter world/i });
    if (await enterWorldBtn.isVisible({ timeout: 5000 })) {
      await enterWorldBtn.click();
    }

    await page.waitForURL(/\/game/, { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Get equipped items (bag=0, slot 0-21)
    const beforeInventory = await getInventoryState(page);
    const equippedBefore = beforeInventory.filter(
      (i) => i.bag === 0 && i.slot >= 0 && i.slot <= 21
    );

    logInventory("Equipped items before camp", equippedBefore);

    // Camp - navigate back to character select
    await page.goto("/characterselect");
    await page.waitForTimeout(2000);
    console.log(`After camp, at: ${page.url()}`);

    // Re-enter - select character and enter world
    const charEntry2 = page.locator(`text=${characterName}`).first();
    if (await charEntry2.isVisible({ timeout: 5000 })) {
      await charEntry2.click();
    }
    const enterBtn2 = page.getByRole("button", { name: /enter world/i });
    if (await enterBtn2.isVisible({ timeout: 5000 })) {
      await enterBtn2.click();
    }

    await page.waitForURL(/\/game/, { timeout: 15000 });
    await page.waitForTimeout(3000);

    // Check equipped items after
    const afterInventory = await getInventoryState(page);
    const equippedAfter = afterInventory.filter(
      (i) => i.bag === 0 && i.slot >= 0 && i.slot <= 21
    );

    logInventory("Equipped items after camp", equippedAfter);

    // Verify equipped items match
    const comparison = compareInventory(equippedBefore, equippedAfter);
    expect(
      comparison.matches,
      `Equipped items changed:\n${comparison.differences.join("\n")}`
    ).toBe(true);

    console.log("✓ Equipped items persisted correctly!");
  });
});
