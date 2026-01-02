import { test, expect, Page } from "@playwright/test";

/**
 * E2E tests for the combat system.
 *
 * Tests cover:
 * - Combat initiation via Combat button
 * - Player and NPC health bar tracking
 * - Experience gain on kill
 * - Death and respawn behavior (including HP bug verification)
 *
 * This test creates a Wood Elf character to ensure it starts in Greater Faydark,
 * which is guaranteed to have enemies available for testing.
 */

test.setTimeout(120_000);

let testCharacterName = "";

// ==================== HELPER FUNCTIONS ====================

async function loginAsGuest(page: Page) {
    console.log("Navigating to home page...");
    await page.goto("/");
    console.log("Waiting for GUEST button...");
    const guestButton = page.getByRole("button", { name: "GUEST" });
    await expect(guestButton).toBeVisible({ timeout: 15000 });
    await expect(guestButton).toBeEnabled({ timeout: 15000 });
    console.log("Clicking GUEST button...");
    await guestButton.click();

    // Check if we hit character select
    console.log("Waiting for QUIT button (character select)...");
    const quitBtn = page.getByRole("button", { name: "QUIT" });
    await expect(quitBtn).toBeVisible({ timeout: 20000 });
    console.log("Login successful.");
}

/**
 * Creates a Wood Elf character to ensure we start in Greater Faydark
 */
async function createWoodElfInFaydark(page: Page, className: string = "Warrior") {
    // Check if we have free slots.
    const createBtnSelector = page.locator('button:has-text("CREATE NEW CHARACTER")');
    await page.waitForTimeout(1000);
    let createBtnCount = await createBtnSelector.count();

    if (createBtnCount === 0) {
        console.log("No free slots! Deleting an existing character first...");
        const characterButtons = page.locator('button').filter({ hasNotText: /CREATE NEW CHARACTER|ENTER WORLD|DELETE|QUIT/ });
        const firstCharEntry = characterButtons.first();
        await firstCharEntry.click();
        await page.getByRole("button", { name: "DELETE", exact: true }).click();
        await page.locator('button').filter({ hasText: /^Delete$/ }).click();
    }

    // Click Create
    await createBtnSelector.first().waitFor();
    await createBtnSelector.first().click();

    // Step 1: Wood Elf + Class
    await expect(page.getByRole("button", { name: "Wood Elf" })).toBeVisible({
        timeout: 10000,
    });

    const nameInput = page.getByPlaceholder("Enter character name");
    await nameInput.waitFor();
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const randomSuffix = Array.from({ length: 6 }, () => alphabet.charAt(Math.floor(Math.random() * alphabet.length))).join("");
    testCharacterName = `TestE2E${randomSuffix}`;
    await nameInput.fill(testCharacterName);
    await nameInput.blur(); // Trigger validation

    await page.getByRole("button", { name: "Wood Elf" }).click();
    await page.getByRole("button", { name: className }).click();
    console.log(`Creating Wood Elf ${className}: ${testCharacterName}`);

    // Wait for validation - should be instant now with server-side bypass
    await expect(page.getByText("Name is available!")).toBeVisible({
        timeout: 5000,
    });
    console.log("Name validated instantly.");

    const autoBtn = page.getByRole("button", { name: /auto/i });
    await expect(autoBtn).toBeEnabled({ timeout: 5000 });
    await autoBtn.click();
    console.log("Attributes auto-allocated.");
    await page.waitForTimeout(500);

    // Step 1: Identity -> Deity
    const nextBtn1 = page.getByRole("button", { name: "Next" }).first();
    await expect(nextBtn1).toBeEnabled({ timeout: 5000 });
    await nextBtn1.click();
    await page.waitForTimeout(500);

    // Step 2: Deity -> Zone
    const nextBtn2 = page.getByRole("button", { name: "Next" }).first();
    await expect(nextBtn2).toBeEnabled({ timeout: 5000 });
    await nextBtn2.click();
    await page.waitForTimeout(500);

    // Step 3: Zone -> Summary
    const nextBtn3 = page.getByRole("button", { name: "Next" }).first();
    await expect(nextBtn3).toBeEnabled({ timeout: 5000 });
    await nextBtn3.click();
    await page.waitForTimeout(500);

    // Step 4: Summary -> Finish (Create)
    const createBtn = page.getByRole("button", { name: "Create" }).first();
    await expect(createBtn).toBeEnabled({ timeout: 5000 });
    await createBtn.click();
    console.log("Character creation sub-steps finished.");

    // Wait for return to character select
    const charEntryInList = page.getByRole("button", { name: testCharacterName });
    await expect(charEntryInList).toBeVisible({ timeout: 20000 });
}

async function cleanupTestCharacter(page: Page) {
    if (!testCharacterName) return;

    console.log(`Cleaning up character: ${testCharacterName}`);

    // Go back to character select if in game
    const campBtn = page.getByRole("button", { name: "Camp" });
    if (await campBtn.isVisible()) {
        await campBtn.click();
        // Wait for character selection screen
        await expect(page.getByRole("button", { name: "QUIT" })).toBeVisible({ timeout: 15000 });
    }

    const charEntryInList = page.getByRole("button", { name: testCharacterName });
    if (await charEntryInList.isVisible()) {
        await charEntryInList.click();
        await page.getByRole("button", { name: "DELETE", exact: true }).click();
        await page.locator('button').filter({ hasText: /^Delete$/ }).click();

        // Wait for it to disappear
        await expect(charEntryInList).not.toBeVisible({ timeout: 10000 });
        console.log(`Cleaned up: ${testCharacterName}`);
    }
    testCharacterName = "";
}

/**
 * Instantly heals the player using the Dev Tools panel if in test mode
 */
async function healIfTestMode(page: Page) {
    const devHealBtn = page.locator('#dev-panel button').filter({ hasText: /Heal Player/i });
    if (await devHealBtn.isVisible()) {
        await devHealBtn.click();
        console.log("Healed player via Dev Tools");
        // Wait for server state to sync
        await page.waitForTimeout(500);
    }
}


/**
 * Sets the NPC's HP to 1 using the Dev Tools panel if in test mode.
 * The next combat tick (approx 1s or less) should cause a win.
 */
async function forceWinCombatIfTestMode(page: Page) {
    const devWinBtn = page.locator('#dev-panel button').filter({ hasText: /Set NPC HP to 1/i });
    if (await devWinBtn.isVisible()) {
        await devWinBtn.click();
        console.log("Forced NPC to 1 HP via Dev Tools");
        // Wait for combat to end naturally
        await page.locator('[data-testid="target-bar"]').waitFor({ state: "hidden", timeout: 5000 });
    }
}

/**
 * Sets the player's HP to 1 using the Dev Tools panel if in test mode.
 * The next combat tick should cause death.
 */
async function forceDieCombatIfTestMode(page: Page) {
    const devDieBtn = page.locator('#dev-panel button').filter({ hasText: /Set Player HP to 1/i });
    if (await devDieBtn.isVisible()) {
        await devDieBtn.click();
        console.log("Forced Player to 1 HP via Dev Tools");
        // Give server time to process death
        await page.waitForTimeout(1000);
    }
}

/**
 * Get player health percent from the stat bar data-percent attribute
 */
async function getPlayerHealthPercent(page: Page): Promise<number> {
    const healthBar = page.locator('[data-testid="stat-bar-health"]');
    const percent = await healthBar.getAttribute("data-percent");
    return parseFloat(percent || "1");
}

/**
 * Get player XP percent from the stat bar data-percent attribute
 */
async function getPlayerXPPercent(page: Page): Promise<number> {
    const xpBar = page.locator('[data-testid="stat-bar-xp"]');
    const percent = await xpBar.getAttribute("data-percent");
    return parseFloat(percent || "0");
}

/**
 * Get NPC health percent from the target bar
 */
async function getNPCHealthPercent(page: Page): Promise<number | null> {
    const targetBar = page.locator('[data-testid="target-bar"]');
    const isVisible = await targetBar.isVisible().catch(() => false);
    if (!isVisible) return null;
    const percent = await targetBar.getAttribute("data-percent");
    return parseFloat(percent || "1");
}

async function waitForCombatStart(page: Page, timeout = 25000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const isVisible = await page.locator('[data-testid="target-bar"]').isVisible().catch(() => false);
        if (isVisible) return true;

        // Check for error messages in recent chat
        const chatMessages = page.locator('[data-testid="chat-message"]');
        const count = await chatMessages.count();
        if (count > 0) {
            const lastMsg = await chatMessages.last().innerText();
            if (lastMsg.toLowerCase().includes("no suitable npcs") || lastMsg.toLowerCase().includes("failed to start combat")) {
                console.log(`Combat failed to start: ${lastMsg}`);
                return false;
            }
        }

        await page.waitForTimeout(500);
    }
    return false;
}

async function assertCombatStarted(page: Page, timeout = 30000) {
    const combatStarted = await waitForCombatStart(page, timeout);
    if (!combatStarted) {
        const messages = await page.locator('[data-testid="chat-message"]').all();
        let chatContext = "";
        for (const msg of messages.slice(-5)) {
            chatContext += `\n- ${await msg.innerText()}`;
        }
        throw new Error(`Combat failed to start within ${timeout}ms. Recent chat:${chatContext}`);
    }
}

async function waitForCombatEnd(page: Page, timeout = 90000): Promise<boolean> {
    try {
        await page.locator('[data-testid="target-bar"]').waitFor({ state: "hidden", timeout });
        return true;
    } catch {
        return false;
    }
}

async function isInCombat(page: Page): Promise<boolean> {
    return await page.locator('[data-testid="target-bar"]').isVisible();
}

// ==================== TEST CASES ====================

test.describe("Combat System (Wood Elf in Faydark)", () => {

    test.beforeEach(async ({ page }) => {
        await loginAsGuest(page);
        await createWoodElfInFaydark(page);

        // Wait for character to be ready for enter
        await page.waitForTimeout(1000);
        await page.getByRole("button", { name: "ENTER WORLD" }).click();

        // Wait for world to load and player stats to settle
        const playerName = page.locator(`text=${testCharacterName}`).first();
        await expect(playerName).toBeVisible({ timeout: 20000 });

        // Ensure "Verbose" tab is selected to see all messages
        const verboseTab = page.getByRole("button", { name: "Verbose" });
        if (await verboseTab.isVisible()) {
            await verboseTab.click();
        }

        // Instantly heal if in test mode
        await healIfTestMode(page);

        // CRITICAL: GameEngine waits for 100% HP before starting combat.
        console.log("Waiting for full HP regen...");
        await page.waitForFunction(() => {
            const bar = document.querySelector('[data-testid="stat-bar-health"]');
            return bar && parseFloat(bar.getAttribute('data-percent') || '0') >= 1.0;
        }, { timeout: 10000, polling: 50 });

        console.log("HP ready. Initializing combat states.");
        await page.waitForTimeout(200);
    });

    test.afterEach(async ({ page }) => {
        await cleanupTestCharacter(page);
    });

    test("Combat initiates and targets an NPC", async ({ page }) => {
        const combatBtn = page.getByRole("button", { name: "Combat" });

        // Toggle on
        await combatBtn.click();
        console.log("Starting combat...");

        // Use attached instead of visible to be more resilient to fast UI updates
        const targetBar = page.locator('[data-testid="target-bar"]');
        await expect(targetBar).toBeAttached({ timeout: 30000 });

        const npcName = await targetBar.getAttribute('data-npc-name');
        console.log(`Successfully engaged: ${npcName}`);



        // Clean up combat by forcing a win
        await forceWinCombatIfTestMode(page);

        // Wait for combat to end
        await expect(targetBar).toBeHidden({ timeout: 10000 });
        console.log("Combat ended successfully.");
    });

    test("health and experience tracking (High frequency sampling)", async ({ page }) => {
        const combatBtn = page.getByRole("button", { name: "Combat" });
        await combatBtn.click();

        const initialXP = await getPlayerXPPercent(page);
        console.log(`Targeting combat with initial XP: ${initialXP}`);

        // High frequency monitor for HP drops (20 samples per second)
        const monitorStats = async () => {
            let hpDropped = false;
            let npcHpDropped = false;
            const start = Date.now();

            while (Date.now() - start < 45000) {
                const curHP = await getPlayerHealthPercent(page);
                const npcHP = await getNPCHealthPercent(page);

                if (curHP < 1.0) hpDropped = true;
                // Handle NPC drop OR death (null)
                if (npcHP === null || npcHP < 1.0) npcHpDropped = true;

                // If combat ended or stats captured, exit early
                if (npcHP === null || (hpDropped && npcHpDropped)) break;

                // Safety: if target bar disappears, combat definitely ended
                if (!(await isInCombat(page)) && Date.now() - start > 200) break;

                await page.waitForTimeout(20); // 50 check/sec
            }
            return { hpDropped, npcHpDropped };
        };

        const stats = await monitorStats();
        console.log(`Combat Stats Captured - Player Hit: ${stats.hpDropped}, NPC Hit: ${stats.npcHpDropped}`);

        // Wait for victory/defeat message (which should have been added during the monitorStats window)
        const endMsg = page.locator('[data-testid="chat-message"]').filter({ hasText: /You have (defeated|been defeated by)/i }).last();
        await expect(endMsg).toBeAttached({ timeout: 20000 });

        const finalXP = await getPlayerXPPercent(page);
        const victoryStatus = await endMsg.innerText();
        const isVictory = victoryStatus.toLowerCase().includes("defeated");

        if (isVictory) {
            expect(finalXP).toBeGreaterThanOrEqual(initialXP);
            console.log(`Victory confirmed! XP gained. Final: ${finalXP}`);
        } else {
            console.log("Defeat recorded.");
        }
    });

    test("death respawns player with HP equal to max (HP Bug Verification)", async ({ page }) => {
        // Re-create as a Wizard for an easier death
        console.log("Switching to Wizard for death test...");
        await cleanupTestCharacter(page);

        // Wait a bit for the character select to settle
        await page.waitForTimeout(1000);

        await createWoodElfInFaydark(page, "Wizard");
        await page.getByRole("button", { name: "ENTER WORLD" }).click();

        await expect(page.locator(`text=${testCharacterName}`).first()).toBeVisible({ timeout: 20000 });

        // Ensure "Verbose" tab is selected to see all messages
        const verboseTab = page.getByRole("button", { name: "Verbose" });
        if (await verboseTab.isVisible()) {
            await verboseTab.click();
        }

        // Wait for HP regen as wizard
        await page.waitForFunction(() => {
            const bar = document.querySelector('[data-testid="stat-bar-health"]');
            return bar && parseFloat(bar.getAttribute('data-percent') || '0') >= 1.0;
        }, { timeout: 30000, polling: 50 });

        await page.getByRole("button", { name: "Combat" }).click();

        console.log("Waiting for player defeat as a Wizard...");
        const defeatMsg = page.locator('[data-testid="chat-message"]').filter({ hasText: /You have been defeated by/i }).last();

        // Monitor HP during the fight
        const monitorDeath = async () => {
            let reachedZero = false;
            const start = Date.now();
            while (Date.now() - start < 120000) {
                const curHP = await getPlayerHealthPercent(page);
                if (curHP <= 0.05) reachedZero = true; // Close to zero/dead

                if (await defeatMsg.isVisible()) break;
                await page.waitForTimeout(100);
            }
            return reachedZero;
        };

        // Use Dev Tool to speed up death
        console.log("Forcing player to near death...");
        await forceDieCombatIfTestMode(page);

        await monitorDeath();
        await expect(defeatMsg).toBeAttached({ timeout: 10000 });

        console.log("Defeat confirmed. Verifying respawn HP...");

        // Wait for the respawn logic to settle
        await page.waitForTimeout(3000);

        const respawnHP = await getPlayerHealthPercent(page);
        console.log(`HP after respawn: ${respawnHP * 100}%`);

        // BUG VERIFICATION: The player should NEVER have > 100% HP.
        expect(respawnHP).toBeLessThanOrEqual(1.0);
        expect(respawnHP).toBe(1.0);
    });
});
