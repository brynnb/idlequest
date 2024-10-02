import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import CharacterProfile from "../entities/CharacterProfile";
import { InventoryItem } from "../entities/InventoryItem";
import { getItemById } from "../utils/databaseOperations";
import { Item } from "../entities/Item";
import { InventorySlot } from "../entities/InventorySlot";

function createDefaultCharacterProfile(): CharacterProfile {
  return {} as CharacterProfile;
}

interface PlayerCharacterStore {
  characterProfile: CharacterProfile;
  setCharacterProfile: (profile: CharacterProfile) => void;
  setInventory: (inventory: InventoryItem[]) => Promise<void>;
  addInventoryItem: (item: InventoryItem) => Promise<void>;
  removeInventoryItem: (slotId: number) => void;
  clearInventory: () => void;
  loadItemDetails: () => Promise<void>;
  hoveredItem: Item | null;
  setHoveredItem: (item: Item | null) => void;
  setCharacterZone: (zoneId: number) => void;
  moveItemToSlot: (fromSlot: number, toSlot: number) => void;
  swapItems: (fromSlot: number, toSlot: number) => void;
  deleteItemOnCursor: () => void;
}

const usePlayerCharacterStore = create<PlayerCharacterStore>()(
  devtools(
    persist(
      (set, get) => ({
        characterProfile: createDefaultCharacterProfile(),
        setCharacterProfile: (profile) => set({ characterProfile: profile }),
        setInventory: async (inventory) => {
          set((state) => ({
            characterProfile: { ...state.characterProfile, inventory },
          }));
          await get().loadItemDetails();
        },
        addInventoryItem: async (item: InventoryItem) => {
          const itemDetails = await getItemById(item.itemid || 0);
          if (!itemDetails) {
            console.error(
              `Item with ID ${item.itemid} not found in the database.`
            );
            return;
          } // Prevent adding if item not found
          const newItem = { ...item, itemDetails };

          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              inventory: [...state.characterProfile.inventory, newItem],
            },
          }));
        },
        removeInventoryItem: (slotId) =>
          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              inventory: state.characterProfile?.inventory?.filter(
                (item) => item.slotid !== slotId
              ),
            },
          })),
        clearInventory: () =>
          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              inventory: [],
              platinum: 0,
              gold: 0,
              silver: 0,
              copper: 0,
            },
          })),
        loadItemDetails: async () => {
          const { characterProfile } = get();
          const itemsToLoad = characterProfile?.inventory?.filter(
            (item) => !item.itemDetails
          );

          if (itemsToLoad.length === 0) return;

          const loadedItems = await Promise.all(
            itemsToLoad.map(async (item) => {
              try {
                const itemDetails = await getItemById(item.itemid);
                return { ...item, itemDetails };
              } catch (error) {
                console.error(
                  `Failed to load details for item ${item.itemid}:`,
                  error
                );
                return item;
              }
            })
          );

          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              inventory: state.characterProfile?.inventory?.map(
                (item) =>
                  loadedItems.find(
                    (loadedItem) => loadedItem.slotid === item.slotid
                  ) || item
              ),
            },
          }));
        },
        hoveredItem: null,
        setHoveredItem: (item) => set({ hoveredItem: item }),
        setCharacterZone: (zoneId) =>
          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              zoneId: zoneId,
            },
          })),
        swapItems: (fromSlot: number, toSlot: number) =>
          set((state) => {
            const updatedInventory = state.characterProfile?.inventory?.map(
              (item) => {
                if (item.slotid === fromSlot) {
                  return { ...item, slotid: toSlot };
                }
                if (item.slotid === toSlot) {
                  return { ...item, slotid: fromSlot };
                }
                return item;
              }
            );

            return {
              characterProfile: {
                ...state.characterProfile,
                inventory: updatedInventory,
              },
            };
          }),
        moveItemToSlot: (fromSlot: number, toSlot: number) =>
          set((state) => {
            if (!state.characterProfile) return state;

            const updatedInventory = state.characterProfile.inventory.map(
              (item) => {
                if (item.slotid === fromSlot) {
                  return { ...item, slotid: toSlot };
                }
                return item;
              }
            );

            return {
              characterProfile: {
                ...state.characterProfile,
                inventory: updatedInventory,
              },
            };
          }),
        deleteItemOnCursor: () =>
          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              inventory: state.characterProfile.inventory.filter(
                (item) => item.slotid !== InventorySlot.Cursor
              ),
            },
          })),
      }),
      { name: "player-character-storage" }
    ),
    { name: "Player Character Store" }
  )
);

export default usePlayerCharacterStore;
