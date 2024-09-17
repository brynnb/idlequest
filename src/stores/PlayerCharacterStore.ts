import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import CharacterProfile from "../entities/CharacterProfile";
import { InventoryItem } from "../entities/InventoryItem";
import { getItemById } from "../utils/databaseOperations";

interface PlayerCharacterStore {
  characterProfile: CharacterProfile;
  setCharacterProfile: (profile: CharacterProfile) => void;
  setInventory: (inventory: InventoryItem[]) => Promise<void>;
  addInventoryItem: (item: InventoryItem) => Promise<void>;
  removeInventoryItem: (slotId: number) => void;
  loadItemDetails: () => Promise<void>;
}

const usePlayerCharacterStore = create<PlayerCharacterStore>()(
  devtools(
    persist(
      (set, get) => ({
        characterProfile: {
          name: "",
          race: null,
          class: null,
          deity: null,
          startingZone: null,
          attributes: {
            str: 0, sta: 0, cha: 0, dex: 0, int: 0, agi: 0, wis: 0,
          },
          inventory: [],
        },
        setCharacterProfile: (profile) => set({ characterProfile: profile }),
        setInventory: async (inventory) => {
          set((state) => ({
            characterProfile: { ...state.characterProfile, inventory }
          }));
          await get().loadItemDetails();
        },
        addInventoryItem: async (item) => {
          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              inventory: [...state.characterProfile.inventory, item],
            }
          }));
          await get().loadItemDetails();
        },
        removeInventoryItem: (slotId) => set((state) => ({
          characterProfile: {
            ...state.characterProfile,
            inventory: state.characterProfile.inventory.filter(item => item.slotid !== slotId),
          }
        })),
        loadItemDetails: async () => {
          const { characterProfile } = get();
          const itemsToLoad = characterProfile.inventory.filter(item => !item.itemDetails);
          
          if (itemsToLoad.length === 0) return;

          const loadedItems = await Promise.all(
            itemsToLoad.map(async (item) => {
              try {
                const itemDetails = await getItemById(item.itemid);
                return { ...item, itemDetails };
              } catch (error) {
                console.error(`Failed to load details for item ${item.itemid}:`, error);
                return item;
              }
            })
          );

          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              inventory: state.characterProfile.inventory.map(
                item => loadedItems.find(loadedItem => loadedItem.slotid === item.slotid) || item
              ),
            }
          }));
        },
      }),
      { name: "player-character-storage" }
    ),
    { name: "Player Character Store" }
  )
);

export default usePlayerCharacterStore;
