import { initDatabase, getItemById } from "../src/utils/databaseOperations";
import usePlayerCharacterStore from "../src/stores/PlayerCharacterStore";
import { InventorySlot } from "../src/entities/InventorySlot";
import { Item } from "../src/entities/Item";
import { processLootItems } from "../src/utils/lootUtils";
import useGameStatusStore from "../src/stores/GameStatusStore";
import {
  GENERAL_SLOTS,
  createBasicCharacterProfile,
  createMockInventoryItem,
  createMockLootCallbacks,
} from "./testUtils";

describe("Combat Loot Integration Tests", () => {
  beforeAll(async () => {
    await initDatabase(true);
  });

  beforeEach(() => {
    usePlayerCharacterStore.setState({
      characterProfile: createBasicCharacterProfile(),
    });
  });

  it("should handle equipping loot items in appropriate slots", async () => {
    const { characterProfile } = usePlayerCharacterStore.getState();

    const clothCap = await getItemById(1001);
    const snowGriffinEgg = await getItemById(1429);
    const shackleKey = await getItemById(1046);

    if (!clothCap || !snowGriffinEgg || !shackleKey) {
      throw new Error("Failed to load test items");
    }

    await processLootItems(
      [clothCap, snowGriffinEgg, shackleKey],
      characterProfile,
      createMockLootCallbacks()
    );

    const { characterProfile: updatedProfile } =
      usePlayerCharacterStore.getState();
    const inventory = updatedProfile.inventory;

    const equippedHeadItem = inventory.find(
      (item) => item.slotid === InventorySlot.Head
    );
    expect(equippedHeadItem?.itemid).toBe(1001);

    const generalItems = inventory.filter((item) =>
      GENERAL_SLOTS.includes(item.slotid)
    );
    expect(generalItems).toHaveLength(2);
    expect(generalItems.map((item) => item.itemid)).toContain(1429);
    expect(generalItems.map((item) => item.itemid)).toContain(1046);
  });

  it("should handle inventory overflow correctly", async () => {
    const fillerItem = await getItemById(1001);
    if (!fillerItem) throw new Error("Failed to load filler item");

    const initialInventory = GENERAL_SLOTS.map((slot) =>
      createMockInventoryItem(fillerItem.id, slot, fillerItem)
    );

    usePlayerCharacterStore.setState((state) => ({
      characterProfile: {
        ...state.characterProfile,
        inventory: initialInventory,
      },
    }));

    const newItems = await Promise.all([getItemById(1429), getItemById(1046)]);

    if (newItems.some((item) => !item)) {
      throw new Error("Failed to load test items");
    }

    useGameStatusStore.setState({ autoSellEnabled: false });

    const updatedProfile = usePlayerCharacterStore.getState().characterProfile;

    await processLootItems(
      newItems as Item[],
      updatedProfile,
      createMockLootCallbacks()
    );

    const { characterProfile: finalProfile } =
      usePlayerCharacterStore.getState();
    const inventory = finalProfile.inventory;

    const generalItems = inventory.filter((item) =>
      GENERAL_SLOTS.includes(item.slotid)
    );
    expect(generalItems).toHaveLength(8);
  });

  it("should handle equipping upgrades correctly", async () => {
    const { characterProfile } = usePlayerCharacterStore.getState();

    const lowerQualityArmor = await getItemById(2140);
    const higherQualityArmor = await getItemById(3307);

    if (!lowerQualityArmor || !higherQualityArmor) {
      throw new Error("Failed to load test items");
    }

    await processLootItems(
      [lowerQualityArmor],
      characterProfile,
      createMockLootCallbacks()
    );

    let { characterProfile: updatedProfile } =
      usePlayerCharacterStore.getState();
    let equippedItem = updatedProfile.inventory.find(
      (item) => item.slotid === InventorySlot.Chest
    );
    expect(equippedItem?.itemid).toBe(2140);

    await processLootItems(
      [higherQualityArmor],
      updatedProfile,
      createMockLootCallbacks()
    );

    updatedProfile = usePlayerCharacterStore.getState().characterProfile;
    equippedItem = updatedProfile.inventory.find(
      (item) => item.slotid === InventorySlot.Chest
    );
    expect(equippedItem?.itemid).toBe(3307);

    const generalItems = updatedProfile.inventory.filter((item) =>
      GENERAL_SLOTS.includes(item.slotid)
    );
    expect(generalItems.map((item) => item.itemid)).toContain(2140);
  });
});
