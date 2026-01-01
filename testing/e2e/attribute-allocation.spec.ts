import { test, expect, Page } from "@playwright/test";

/**
 * E2E tests for character creation attribute allocation.
 *
 * Tests cover:
 * - Manual attribute point allocation (+/- buttons)
 * - Auto-allocate button functionality
 * - Mixing manual allocation with auto-allocate
 * - Edge cases: can't decrement below base, can't increment when no points
 * - Validation that all points must be allocated
 *
 * Prerequisites:
 * - Server running: npm run dev:all
 *
 * Run with: npx playwright test testing/e2e/attribute-allocation.spec.ts
 */

test.setTimeout(60_000);

// Helper to read the points display from the DOM
async function getPointsFromDOM(page: Page): Promise<number> {
    const pointsText = await page
        .locator("text=Ability Points Left")
        .textContent();
    const match = pointsText?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : -1;
}

// Helper to get attribute value from the DOM using data-testid
async function getAttributeValue(page: Page, attr: string): Promise<number> {
    const valueElement = page.locator(`[data-testid="attr-${attr}-value"]`);
    const text = await valueElement.textContent();
    return parseInt(text || "0", 10);
}

// Helper to get the attribute controls using data-testid
function getAttributeControls(page: Page, attr: string) {
    return {
        minusButton: page.locator(`[data-testid="attr-${attr}-minus"]`),
        plusButton: page.locator(`[data-testid="attr-${attr}-plus"]`),
    };
}

// Helper to navigate to character creation via login flow
async function setupCharacterCreation(page: Page) {
    await page.goto("/");

    // Wait for the login page and click GUEST
    const guestButton = page.getByRole("button", { name: "GUEST" });
    await expect(guestButton).toBeVisible({ timeout: 10000 });
    await guestButton.click();

    // Wait for Character Select page
    const createButton = page
        .getByRole("button", { name: "CREATE NEW CHARACTER" })
        .first();
    await expect(createButton).toBeVisible({ timeout: 15000 });
    await createButton.click();

    // Wait for character creator to load
    const humanRace = page.getByRole("button", { name: "Human" });
    await expect(humanRace).toBeVisible({ timeout: 10000 });
    await humanRace.click();

    // Select Warrior class
    const warriorClass = page.getByRole("button", { name: "Warrior" });
    await expect(warriorClass).toBeVisible({ timeout: 5000 });
    await warriorClass.click();

    // Wait for attributes to load
    await expect(page.getByText("Ability Points Left")).toBeVisible({
        timeout: 5000,
    });
}

test.describe("Attribute Allocation", () => {
    test.describe("Manual Allocation", () => {
        test("initial points are greater than 0 and decrement on + click", async ({
            page,
        }) => {
            await setupCharacterCreation(page);

            // Get initial points
            const initialPoints = await getPointsFromDOM(page);
            expect(initialPoints).toBeGreaterThan(0);

            // Click the + button for STR
            const { plusButton } = getAttributeControls(page, "str");
            await plusButton.click();

            // Points should decrease by 1
            const afterPoints = await getPointsFromDOM(page);
            expect(afterPoints).toBe(initialPoints - 1);
        });

        test("+ button is disabled when points = 0", async ({ page }) => {
            await setupCharacterCreation(page);

            // Auto-allocate to use all points
            await page.getByRole("button", { name: /auto/i }).click();
            await page.waitForTimeout(300);

            // Verify points are 0
            const points = await getPointsFromDOM(page);
            expect(points).toBe(0);

            // + button should be disabled
            const { plusButton } = getAttributeControls(page, "str");
            await expect(plusButton).toBeDisabled();
        });

        test("- button decrements and returns point to pool", async ({ page }) => {
            await setupCharacterCreation(page);

            const initialPoints = await getPointsFromDOM(page);
            const { plusButton, minusButton } = getAttributeControls(page, "str");

            // Click + twice
            await plusButton.click();
            await plusButton.click();

            // Points should decrease by 2
            let currentPoints = await getPointsFromDOM(page);
            expect(currentPoints).toBe(initialPoints - 2);

            // Click - once
            await minusButton.click();

            // Points should increase by 1
            currentPoints = await getPointsFromDOM(page);
            expect(currentPoints).toBe(initialPoints - 1);
        });

        test("- button is disabled at base value", async ({ page }) => {
            await setupCharacterCreation(page);

            // All - buttons should be disabled at start (no points allocated)
            const { minusButton: strMinus } = getAttributeControls(page, "str");
            const { minusButton: staMinus } = getAttributeControls(page, "sta");
            const { minusButton: intMinus } = getAttributeControls(page, "int");

            await expect(strMinus).toBeDisabled();
            await expect(staMinus).toBeDisabled();
            await expect(intMinus).toBeDisabled();
        });

        test("can only decrement points that were manually added", async ({
            page,
        }) => {
            await setupCharacterCreation(page);

            const initialStr = await getAttributeValue(page, "str");
            const { plusButton, minusButton } = getAttributeControls(page, "str");

            // Initially - button should be disabled
            await expect(minusButton).toBeDisabled();

            // Add 3 points to STR
            await plusButton.click();
            await plusButton.click();
            await plusButton.click();

            // Now - button should be enabled
            await expect(minusButton).toBeEnabled();

            // STR should be base + 3
            let strValue = await getAttributeValue(page, "str");
            expect(strValue).toBe(initialStr + 3);

            // Decrement 3 times to get back to base
            await minusButton.click();
            await minusButton.click();
            await minusButton.click();

            // STR should be back to base
            strValue = await getAttributeValue(page, "str");
            expect(strValue).toBe(initialStr);

            // - button should be disabled again
            await expect(minusButton).toBeDisabled();
        });

        test("total points stay consistent during increment/decrement cycles", async ({
            page,
        }) => {
            await setupCharacterCreation(page);

            const initialPoints = await getPointsFromDOM(page);
            const initialStr = await getAttributeValue(page, "str");

            const { plusButton, minusButton } = getAttributeControls(page, "str");

            // Perform multiple operations
            await plusButton.click(); // -1 point, +1 STR
            await plusButton.click(); // -1 point, +1 STR
            await plusButton.click(); // -1 point, +1 STR
            await minusButton.click(); // +1 point, -1 STR
            await plusButton.click(); // -1 point, +1 STR

            // Net effect: -3 points, +3 STR
            const finalPoints = await getPointsFromDOM(page);
            const finalStr = await getAttributeValue(page, "str");

            expect(finalPoints).toBe(initialPoints - 3);
            expect(finalStr).toBe(initialStr + 3);
        });
    });

    test.describe("Auto Allocate", () => {
        test("auto-allocate sets points to 0", async ({ page }) => {
            await setupCharacterCreation(page);

            await page.getByRole("button", { name: /auto/i }).click();
            await page.waitForTimeout(300);

            const points = await getPointsFromDOM(page);
            expect(points).toBe(0);
        });

        test("auto-allocate button is disabled when points = 0", async ({
            page,
        }) => {
            await setupCharacterCreation(page);

            await page.getByRole("button", { name: /auto/i }).click();
            await page.waitForTimeout(300);

            const autoAllocBtn = page.getByRole("button", { name: /auto/i });
            await expect(autoAllocBtn).toBeDisabled();
        });
    });

    test.describe("Mixed Allocation (Manual + Auto + Manual)", () => {
        test("manual then auto-allocate resets to optimal", async ({ page }) => {
            await setupCharacterCreation(page);

            const initialPoints = await getPointsFromDOM(page);
            const { plusButton } = getAttributeControls(page, "str");

            // Manually allocate 5 points to STR
            for (let i = 0; i < 5; i++) {
                await plusButton.click();
            }

            // Verify 5 points were spent
            let currentPoints = await getPointsFromDOM(page);
            expect(currentPoints).toBe(initialPoints - 5);

            // Click auto-allocate
            await page.getByRole("button", { name: /auto/i }).click();
            await page.waitForTimeout(300);

            // Points should now be 0
            currentPoints = await getPointsFromDOM(page);
            expect(currentPoints).toBe(0);
        });

        test("auto-allocate then manual adjustment then auto again", async ({
            page,
        }) => {
            await setupCharacterCreation(page);

            // Auto-allocate first
            await page.getByRole("button", { name: /auto/i }).click();
            await page.waitForTimeout(300);

            // Points should be 0
            let currentPoints = await getPointsFromDOM(page);
            expect(currentPoints).toBe(0);

            // Find an attribute and remove a point if possible
            const { minusButton, plusButton } = getAttributeControls(page, "str");

            const isDisabled = await minusButton.isDisabled();
            if (!isDisabled) {
                await minusButton.click();
                currentPoints = await getPointsFromDOM(page);
                expect(currentPoints).toBe(1);

                // + button should be enabled
                await expect(plusButton).toBeEnabled();

                // Add the point back
                await plusButton.click();
                currentPoints = await getPointsFromDOM(page);
                expect(currentPoints).toBe(0);
            }
        });

        test("manual allocate, auto-allocate, then manually adjust further", async ({
            page,
        }) => {
            await setupCharacterCreation(page);

            const initialPoints = await getPointsFromDOM(page);
            const { plusButton: chaPlusButton } = getAttributeControls(page, "cha");

            // Manually allocate 3 points to CHA
            for (let i = 0; i < 3; i++) {
                await chaPlusButton.click();
            }

            let currentPoints = await getPointsFromDOM(page);
            expect(currentPoints).toBe(initialPoints - 3);

            // Auto-allocate - this should reset to optimal
            await page.getByRole("button", { name: /auto/i }).click();
            await page.waitForTimeout(300);

            currentPoints = await getPointsFromDOM(page);
            expect(currentPoints).toBe(0);

            // Now try to manually adjust
            const { minusButton } = getAttributeControls(page, "str");
            const isDisabled = await minusButton.isDisabled();
            if (!isDisabled) {
                await minusButton.click();
                currentPoints = await getPointsFromDOM(page);
                expect(currentPoints).toBe(1);

                // Can redistribute that point
                const { plusButton: intPlusButton } = getAttributeControls(page, "int");
                await intPlusButton.click();
                currentPoints = await getPointsFromDOM(page);
                expect(currentPoints).toBe(0);
            }
        });
    });

    test.describe("Edge Cases", () => {
        test("cannot allocate more points than available", async ({ page }) => {
            await setupCharacterCreation(page);

            const initialPoints = await getPointsFromDOM(page);
            const { plusButton } = getAttributeControls(page, "str");

            // Allocate all points to STR
            for (let i = 0; i < initialPoints; i++) {
                await plusButton.click();
            }

            // Points should be 0
            const finalPoints = await getPointsFromDOM(page);
            expect(finalPoints).toBe(0);

            // + button should be disabled
            await expect(plusButton).toBeDisabled();
        });

        test("all - buttons are disabled at base values", async ({ page }) => {
            await setupCharacterCreation(page);

            const attrs = ["str", "sta", "dex", "agi", "int", "wis", "cha"];
            for (const attr of attrs) {
                const { minusButton } = getAttributeControls(page, attr);
                await expect(minusButton).toBeDisabled();
            }
        });

        test("allocating to one attribute doesnt affect others", async ({
            page,
        }) => {
            await setupCharacterCreation(page);

            const initialStr = await getAttributeValue(page, "str");
            const initialSta = await getAttributeValue(page, "sta");
            const initialInt = await getAttributeValue(page, "int");

            // Add points only to STR
            const { plusButton } = getAttributeControls(page, "str");
            await plusButton.click();
            await plusButton.click();

            // STR should increase by 2
            expect(await getAttributeValue(page, "str")).toBe(initialStr + 2);

            // Other attributes unchanged
            expect(await getAttributeValue(page, "sta")).toBe(initialSta);
            expect(await getAttributeValue(page, "int")).toBe(initialInt);
        });
    });

    test.describe("Race/Class Change Reset", () => {
        test("changing class resets points", async ({ page }) => {
            await setupCharacterCreation(page);

            const warriorPoints = await getPointsFromDOM(page);
            const { plusButton } = getAttributeControls(page, "str");

            // Allocate some points
            await plusButton.click();
            await plusButton.click();

            let currentPoints = await getPointsFromDOM(page);
            expect(currentPoints).toBe(warriorPoints - 2);

            // Change class to Cleric
            await page.getByRole("button", { name: "Cleric" }).click();
            await page.waitForTimeout(300);

            // Points should reset
            currentPoints = await getPointsFromDOM(page);
            expect(currentPoints).toBeGreaterThan(0);
        });
    });

    test.describe("Validation", () => {
        test("Next button disabled when points remain", async ({ page }) => {
            await setupCharacterCreation(page);

            // Use random name for validation
            await page.getByRole("button", { name: /random name/i }).click();
            await page.waitForTimeout(1000);

            const points = await getPointsFromDOM(page);
            expect(points).toBeGreaterThan(0);

            const nextButton = page.getByRole("button", { name: "Next" }).first();
            await expect(nextButton).toBeDisabled();
        });

        test("Next button enabled after auto-allocate", async ({ page }) => {
            await setupCharacterCreation(page);

            await page.getByRole("button", { name: /random name/i }).click();
            await page.waitForTimeout(1000);

            await page.getByRole("button", { name: /auto/i }).click();
            await page.waitForTimeout(300);

            const nextButton = page.getByRole("button", { name: "Next" }).first();
            await expect(nextButton).toBeEnabled({ timeout: 5000 });
        });

        test("Next button enabled after full manual allocation", async ({
            page,
        }) => {
            await setupCharacterCreation(page);

            await page.getByRole("button", { name: /random name/i }).click();
            await page.waitForTimeout(1000);

            let points = await getPointsFromDOM(page);
            const { plusButton } = getAttributeControls(page, "str");

            while (points > 0) {
                await plusButton.click();
                points = await getPointsFromDOM(page);
            }

            expect(points).toBe(0);

            const nextButton = page.getByRole("button", { name: "Next" }).first();
            await expect(nextButton).toBeEnabled({ timeout: 5000 });
        });
    });
});
