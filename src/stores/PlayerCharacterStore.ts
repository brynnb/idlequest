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
import {
  WorldSocket,
  OpCodes,
  CharacterSelect,
  capnpToPlainObject,
} from "@/net";
import races from "@data/json/races.json";
import classes from "@data/json/classes.json";
import deities from "@data/json/deities.json";

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
  initializeCharacterSync: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  applyServerCharacterState: (state: any) => Promise<void>;
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

            const oldLevel = characterProfile.level || 0;
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

        // Subscribe to SendCharInfo messages from server (Cap'n Proto)
        initializeCharacterSync: () => {
          WorldSocket.registerOpCodeHandler(
            OpCodes.SendCharInfo,
            CharacterSelect,
            (charSelect) => {
              console.log("Received SendCharInfo:", charSelect);
              // Convert Cap'n Proto object to plain JS object
              const plainData = capnpToPlainObject(charSelect);
              get().applyServerCharacterState(plainData);
            }
          );
        },

        // Apply server-pushed character state from Cap'n Proto CharacterSelect
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applyServerCharacterState: async (charSelectData: any) => {
          console.log("Processing CharacterSelect:", charSelectData);

          if (
            !charSelectData.characters ||
            charSelectData.characters.length === 0
          ) {
            console.warn("CharacterSelect has no characters, ignoring");
            return;
          }

          // Get the first (or most recently created) character
          const serverChar = charSelectData.characters[0];

          // Look up race/class/deity from JSON data
          const raceData = races.find(
            (r: { id: number }) => r.id === serverChar.race
          );
          const classData = classes.find(
            (c: { id: number }) => c.id === serverChar.charClass
          );
          // CharacterSelectEntry doesn't include deity, default to first
          const deityData = deities[0];

          // Build inventory items from the character's items
          const inventoryItems: InventoryItem[] = await Promise.all(
            (serverChar.items || [])
              .filter((item: any) => {
                const itemId = item.itemId || item.id;
                return itemId && itemId > 0; // Skip items with no valid ID
              })
              .map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                async (item: any) => {
                  const itemId = item.itemId || item.id;
                  const itemDetails = await getItemById(itemId);
                  return {
                    slotid: item.slotId || item.slot || 0,
                    itemid: itemId,
                    charges: item.charges || 0,
                    itemDetails: itemDetails || undefined,
                  } as InventoryItem;
                }
              )
          );

          const newProfile: CharacterProfile = {
            id: serverChar.id || 0,
            name: serverChar.name,
            lastName: "",
            race: raceData,
            class: classData,
            deity: deityData,
            zoneId: serverChar.zone,
            level: serverChar.level,
            exp: 0,
            // For new characters, set curHp to maxHp (calculated below)
            curHp: 0,
            mana: 0,
            endurance: 0,
            attributes: {
              // CharacterSelectEntry doesn't have attributes, use defaults
              str: 75,
              sta: 75,
              cha: 75,
              dex: 75,
              int: 75,
              agi: 75,
              wis: 75,
            },
            inventory: inventoryItems,
            stats: {
              ac: 0,
              atk: 100,
            },
          };

          // Calculate derived stats from attributes
          newProfile.maxHp = calculatePlayerHP(newProfile);
          newProfile.maxMana = calculatePlayerMana(newProfile);
          // For new characters, start at full HP
          newProfile.curHp = newProfile.maxHp;

          set({ characterProfile: newProfile });
          get().updateAllStats();

          console.log("Applied server character state:", serverChar.name);
        },
      }),
      { name: "player-character-storage" }
    ),
    { name: "Player Character Store" }
  )
);

export default usePlayerCharacterStore;
