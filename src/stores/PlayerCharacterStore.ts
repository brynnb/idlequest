import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import CharacterProfile from "@entities/CharacterProfile";
import { InventoryItem } from "@entities/InventoryItem";
import { getItemById } from "@utils/databaseOperations";
import { Item } from "@entities/Item";
import { InventorySlot } from "@entities/InventorySlot";
import useChatStore, { MessageType } from "./ChatStore";
import useGameStatusStore from "./GameStatusStore";
import { calculateSimpleArmorClass } from "@utils/calculateSimpleArmorClass";
import { getExperienceLevel } from "@entities/ExperienceLevel";
import {
  calculatePlayerHP,
  calculatePlayerMana,
} from "@utils/playerCharacterUtils";
import {
  calculateTotalWeight,
  calculateTotalResistances,
  calculateTotalAttributes,
} from "@utils/inventoryUtils";
import { getBagStartingSlot } from "@utils/inventoryUtils";
import { ItemClass } from "@entities/ItemClass";

function createDefaultCharacterProfile(): CharacterProfile {
  return {
    inventory: [],
    attributes: {},
    totalAttributes: {},
    stats: {},
  } as CharacterProfile;
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
  updateArmorClass: () => void;
  updateMaxHP: () => void;
  addExperience: (experience: number) => void;
  updateMaxMana: () => void;
  updateHealthAndMana: (newHealth: number, newMana: number) => void;
  updateWeight: () => void;
  updateWeightAllowance: () => void;
  updateAllStats: () => void;
}

const moveBagContents = (
  inventory: InventoryItem[],
  bagSlot: number,
  newSlot: number,
  bagSize: number
) => {
  const oldStartingSlot = Number(getBagStartingSlot(bagSlot));
  const newStartingSlot = Number(getBagStartingSlot(newSlot));

  return inventory.map((item) => {
    if (item.slotid === bagSlot) {
      return { ...item, slotid: newSlot };
    }

    const isInOldBag =
      item.slotid >= oldStartingSlot && item.slotid < oldStartingSlot + bagSize;
    if (isInOldBag) {
      const relativeSlot = item.slotid - oldStartingSlot;
      return { ...item, slotid: newStartingSlot + relativeSlot };
    }

    return item;
  });
};

const usePlayerCharacterStore = create<PlayerCharacterStore>()(
  devtools(
    persist(
      (set, get) => ({
        characterProfile: createDefaultCharacterProfile(),
        setCharacterProfile: (profile) => {
          const totalAttributes = calculateTotalAttributes(profile);
          set({
            characterProfile: {
              ...createDefaultCharacterProfile(),
              ...profile,
              attributes: profile.attributes || {},
              totalAttributes,
              stats: profile.stats || {},
            },
          });
          get().updateAllStats();
        },
        setInventory: async (inventory) => {
          set((state) => {
            // Deduplicate inventory items
            const deduplicatedInventory = inventory.reduce((acc, item) => {
              const existingItem = acc.find((i) => i.slotid === item.slotid);
              if (!existingItem) {
                acc.push(item);
              } else {
                console.warn("Prevented duplicate item in slot:", item.slotid);
              }
              return acc;
            }, [] as InventoryItem[]);

            return {
              characterProfile: {
                ...state.characterProfile,
                inventory: deduplicatedInventory,
              },
            };
          });
          await get().loadItemDetails();
          get().updateAllStats();
        },

        addInventoryItem: async (item: InventoryItem, itemDetails?: Item) => {
          if (!itemDetails) {
            itemDetails = await getItemById(item.itemid || 0);
          }
          if (!itemDetails) {
            console.error(
              `Item with ID ${item.itemid} not found in the database.`
            );
            return;
          }

          set((state) => {
            const existingItem = (state.characterProfile.inventory || []).find(
              (i) => i.slotid === item.slotid
            );

            if (existingItem) {
              console.warn("Slot already occupied:", item.slotid);
              return state;
            }

            return {
              characterProfile: {
                ...state.characterProfile,
                inventory: [
                  ...(state.characterProfile.inventory || []),
                  { ...item, itemDetails },
                ],
              },
            };
          });

          get().updateAllStats();
        },
        removeInventoryItem: (slotId) => {
          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              inventory: (state.characterProfile.inventory || []).filter(
                (item) => item.slotid !== slotId
              ),
            },
          }));
          get().updateAllStats();
        },
        clearInventory: () => {
          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              inventory: [],
              platinum: 0,
              gold: 0,
              silver: 0,
              copper: 0,
            },
          }));
          get().updateAllStats();
        },
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
        setCharacterZone: (zoneId) => {
          const zoneName =
            useGameStatusStore.getState().getZoneLongNameById(zoneId) ||
            "Unknown Zone";
          useChatStore
            .getState()
            .addMessage(
              `Traveling to ${zoneName}`,
              MessageType.ZONE_ANNOUNCEMENT
            );
          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              zoneId: zoneId,
            },
          }));
        },
        moveItemToSlot: (fromSlot: number, toSlot: number) => {
          set((state) => {
            if (!state.characterProfile) return state;
            const existingItem = state.characterProfile.inventory?.find(
              (item) => item.slotid === toSlot
            );
            if (existingItem) {
              console.warn("Attempted to move item to occupied slot:", toSlot);
              return state;
            }

            const movingItem = state.characterProfile.inventory?.find(
              (item) => item.slotid === fromSlot
            );

            let updatedInventory = state.characterProfile.inventory || [];
            if (movingItem?.itemDetails?.itemclass === ItemClass.CONTAINER) {
              console.log(
                `Moving bag from ${fromSlot} to ${toSlot} with size ${movingItem.itemDetails.bagslots}`
              );
              updatedInventory = moveBagContents(
                updatedInventory,
                fromSlot,
                toSlot,
                movingItem.itemDetails?.bagslots || 0
              );
            } else {
              updatedInventory = updatedInventory.map((item) => {
                if (item.slotid === fromSlot) {
                  return { ...item, slotid: toSlot };
                }
                return item;
              });
            }

            const newState = {
              characterProfile: {
                ...state.characterProfile,
                inventory: updatedInventory,
                totalAttributes: calculateTotalAttributes({
                  ...state.characterProfile,
                  inventory: updatedInventory,
                }),
              },
            };

            return newState;
          });
          get().updateAllStats();
        },
        swapItems: (fromSlot: number, toSlot: number) =>
          set((state) => {
            if (!state.characterProfile) return state;

            const fromItem = state.characterProfile.inventory?.find(
              (item) => item.slotid === fromSlot
            );
            const toItem = state.characterProfile.inventory?.find(
              (item) => item.slotid === toSlot
            );

            if (!fromItem) return state;

            let newInventory = [...(state.characterProfile.inventory || [])];

            const fromItemIsBag =
              fromItem.itemDetails?.itemclass === ItemClass.CONTAINER;
            const toItemIsBag =
              toItem?.itemDetails?.itemclass === ItemClass.CONTAINER;

            if (fromItemIsBag && toItemIsBag) {
              const firstBag = fromItem;
              const secondBag = toItem;

              const firstBagItems = newInventory.filter(
                (item) =>
                  item.slotid >= getBagStartingSlot(fromSlot) &&
                  item.slotid < getBagStartingSlot(fromSlot) + 10
              );

              const secondBagItems = newInventory.filter(
                (item) =>
                  item.slotid >= getBagStartingSlot(toSlot) &&
                  item.slotid < getBagStartingSlot(toSlot) + 10
              );

              newInventory = newInventory.filter(
                (item) =>
                  !firstBagItems.includes(item) &&
                  !secondBagItems.includes(item) &&
                  item.slotid !== fromSlot &&
                  item.slotid !== toSlot
              );

              const relocatedFirstBagItems = firstBagItems.map((item) => ({
                ...item,
                slotid:
                  getBagStartingSlot(toSlot) +
                  (item.slotid - getBagStartingSlot(fromSlot)),
              }));

              const relocatedSecondBagItems = secondBagItems.map((item) => ({
                ...item,
                slotid:
                  getBagStartingSlot(fromSlot) +
                  (item.slotid - getBagStartingSlot(toSlot)),
              }));

              newInventory = [
                ...newInventory,
                { ...firstBag, slotid: toSlot },
                { ...secondBag, slotid: fromSlot },
                ...relocatedFirstBagItems,
                ...relocatedSecondBagItems,
              ];
            } else if (fromItemIsBag) {
              newInventory = moveBagContents(
                newInventory,
                fromSlot,
                toSlot,
                fromItem.itemDetails?.bagslots || 0
              );
            } else if (toItemIsBag) {
              newInventory = moveBagContents(
                newInventory,
                toSlot,
                fromSlot,
                toItem.itemDetails?.bagslots || 0
              );
            }

            newInventory = newInventory
              .filter(
                (item) => item.slotid !== fromSlot && item.slotid !== toSlot
              )
              .concat([
                { ...fromItem, slotid: toSlot },
                ...(toItem ? [{ ...toItem, slotid: fromSlot }] : []),
              ]);

            const newState = {
              characterProfile: {
                ...state.characterProfile,
                inventory: newInventory,
                totalAttributes: calculateTotalAttributes({
                  ...state.characterProfile,
                  inventory: newInventory,
                }),
              },
            };

            return newState;
          }),
        deleteItemOnCursor: () =>
          set((state) => {
            const newState = {
              characterProfile: {
                ...state.characterProfile,
                inventory: state.characterProfile.inventory.filter(
                  (item) => item.slotid !== InventorySlot.Cursor
                ),
              },
            };
            get().updateAllStats();
            return newState;
          }),
        updateArmorClass: () => {
          const { characterProfile } = get();
          const newAC = calculateSimpleArmorClass(characterProfile);
          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              stats: {
                ...state.characterProfile.stats,
                ac: newAC,
              },
            },
          }));
        },
        updateMaxHP: () => {
          const { characterProfile } = get();
          const newMaxHP = calculatePlayerHP(characterProfile);
          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              maxHp: newMaxHP,
            },
          }));
        },
        updateMaxMana: () => {
          const { characterProfile } = get();
          const newMaxMana = calculatePlayerMana(characterProfile);
          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              maxMana: newMaxMana,
            },
          }));
        },
        updateHealthAndMana: (newHealth: number, newMana: number) => {
          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              curHp: newHealth,
              curMana: newMana,
            },
          }));
        },
        addExperience: (experience: number) =>
          set((state) => {
            const { characterProfile } = state;
            if (!characterProfile) return state;

            const oldLevel = characterProfile.level;
            const newExp = characterProfile.exp + experience;
            const { level } = getExperienceLevel(newExp);

            const newState = {
              characterProfile: {
                ...characterProfile,
                exp: newExp,
                level: level,
              } as CharacterProfile,
            };

            if (level > oldLevel) {
              setTimeout(() => {
                const { addMessage } = useChatStore.getState();

                addMessage(
                  `Congratulations! You have reached level ${level}!`,
                  MessageType.EXPERIENCE_GAIN
                );
                get().updateAllStats();
              }, 0);
            }

            return newState;
          }),
        updateWeight: () => {
          const { characterProfile } = get();
          const newWeight = calculateTotalWeight(characterProfile);
          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              weight: newWeight,
            },
          }));
        },
        updateWeightAllowance: () => {
          const { characterProfile } = get();
          const newWeightAllowance = calculateTotalWeight(characterProfile);
          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              weightAllowance: newWeightAllowance,
            },
          }));
        },
        updateAllStats: () => {
          const resistances = calculateTotalResistances(get().characterProfile);
          const totalAttributes = calculateTotalAttributes(
            get().characterProfile
          );
          const ac = calculateSimpleArmorClass(get().characterProfile);
          const newMaxHp = calculatePlayerHP({
            ...get().characterProfile,
            totalAttributes,
          });

          set((state) => {
            const hpRatio =
              state.characterProfile.curHp / state.characterProfile.maxHp;
            const newCurHp = Math.floor(hpRatio * newMaxHp);

            return {
              characterProfile: {
                ...state.characterProfile,
                stats: {
                  ...resistances,
                  ac,
                  atk: 100 + Math.floor((totalAttributes.str ?? 0) / 4),
                },
                attributes: state.characterProfile.attributes || {},
                totalAttributes: { ...totalAttributes },
                maxHp: newMaxHp,
                curHp: newCurHp || newMaxHp,
                weightAllowance: totalAttributes.str ?? 0,
              },
            };
          });
        },
      }),
      { name: "player-character-storage" }
    ),
    { name: "Player Character Store" }
  )
);

export default usePlayerCharacterStore;
