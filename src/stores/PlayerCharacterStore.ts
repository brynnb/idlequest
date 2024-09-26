import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import CharacterProfile from "../entities/CharacterProfile";
import { InventoryItem } from "../entities/InventoryItem";
import { getItemById } from "../utils/databaseOperations";
import { Item } from "../entities/Item";
import { InventorySlot } from '../entities/InventorySlot';

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
  moveItemToSlot: (itemId: number, newSlot: InventorySlot) => void;
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
        addInventoryItem: async (item: InventoryItem) => {
          const itemDetails = await getItemById(item.itemid);
          if (!itemDetails) {
            console.error(`Item with ID ${item.itemid} not found in the database.`);
            return;
          }; // Prevent adding if item not found
          const newItem = { ...item, itemDetails };
          
          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              inventory: [...state.characterProfile.inventory, newItem],
            }
          }));
        },
        removeInventoryItem: (slotId) => set((state) => ({
          characterProfile: {
            ...state.characterProfile,
            inventory: state.characterProfile.inventory.filter(item => item.slotid !== slotId),
          }
        })),
        clearInventory: () => set((state) => ({
          characterProfile: {
            ...state.characterProfile,
            inventory: [],
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
        hoveredItem: null,
        setHoveredItem: (item) => set({ hoveredItem: item }),
        setCharacterZone: (zoneId) => set((state) => ({
          characterProfile: {
            ...state.characterProfile,
            startingZone: zoneId,
          }
        })),
        moveItemToSlot: (itemId, newSlot) => set((state) => {
          if (!state.characterProfile) return state;

          const updatedInventory = state.characterProfile?.inventory?.map((invItem) => {
            if (invItem.id === itemId) {
              return { ...invItem, slotid: newSlot };
            }
            return invItem;
          });

          return {
            characterProfile: {
              ...state.characterProfile,
              inventory: updatedInventory,
            },
          };
        }),
      }),
      { name: "player-character-storage" }
    ),
    { name: "Player Character Store" }
  )
);

export default usePlayerCharacterStore;
