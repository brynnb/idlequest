# Client-Side Logic Migration Audit

This document outlines areas where game logic currently resides on the client-side and needs to be migrated to the server to ensure security, consistency, and authority.

## 1. Character Stats (HP/Mana)
**Status:** **High Priority / Partially Implemented**
*   **Conflict:**
    *   **Client (`src/utils/playerCharacterUtils.ts`):** Uses complex, class-specific multipliers (e.g., Paladin multiplier 21). This is the **CORRECT** logic we want to keep.
    *   **Server (`server/internal/combat/combat.go`):** Used a simplified placeholder formula (`20 + level*10 + sta*2`).
*   **Verdict:** **Port Client Logic to Server.** The server must adopt the complex class multiplier tables found in the client to be the single source of truth for MaxHP and MaxMana.

## 2. Economy (Loot & Selling)
**Status:** **Critical Security Risk**
*   **Conflict:**
    *   **Client (`src/utils/lootUtils.ts`):** `sellSingleItem` calculates item value and locally edits the player's platinum/gold store state.
    *   **Server:** Has no validation; accepts client state updates.
*   **Verdict:** **Move to Server.** Create endpoints like `SellItem(itemID)` that calculate the value and update currency on the backend, validated against the database prices.

## 3. Armor Class (AC) Calculation
**Status:** **High Integrity Risk**
*   **Conflict:**
    *   **Client (`src/utils/calculateArmorClass.ts`):** Contains extensive logic (~11KB) for calculating AC based on gear, stats, and class bonuses.
    *   **Server (`combat.go`):** Likely uses a placeholder or minimal check.
*   **Verdict:** **Port Client Logic to Server.** The server needs to know the player's exact AC to calculate combat hit chances correctly.

## 4. Inventory Management
**Status:** **Medium Risk**
*   **Conflict:**
    *   **Client (`src/utils/inventoryUtils.ts`, `src/utils/itemUtils.ts`):** Handles `isEquippableWithClass`/`Race` (using bitmasks), slot validation, and stacking logic.
    *   **Server:** NEEDS TO VALIDATE these actions using the same Bitmask logic found in `itemUtils.ts`.
*   **Verdict:** **Shared/Validation Model.** The client uses this for UI feedback (red background), but the **Server must replicate the Bitmask validation** on any `EquipItem` request.

## 5. Spell Effects
**Status:** **Medium Risk**
*   **Conflict:**
    *   **Client (`src/utils/spellCalculations.ts`):** Contains formulas 0-2650 for spell scaling. Used for tooltip display.
    *   **Server:** Needs this exact logic to apply the actual damage/healing.
*   **Verdict:** **Refactor to Shared Source (or Duplicate).** Ideally, we use the specific formulas found in the client as the reference implementation effectively, but the execution *must* happen on the server. The client version stays only for tooltips.

## 6. Experience Calculation
**Status:** **Low Risk (Display Only)**
*   **Conflict:**
    *   **Client (`src/utils/experienceUtils.ts`):** Calculates % progress bar logic using `EXPERIENCE_TABLE`.
    *   **Server:** Handles the actual level up event.
*   **Verdict:** **Keep Client Logic for Display.** As long as the server authorizes the actual Level Up event and XP gain, the client can calculate the % bar locally for responsiveness.

## 7. Verified Safe Areas (Already Server-Side)
*   **Combat Loop:** `src/services/combatService.ts` is a pure network wrapper, meaning the logic is already effectively on the server.
*   **Dialogue:** `src/utils/getNPCDialogue.ts` is also a network wrapper, fetching dialogue from the server.

