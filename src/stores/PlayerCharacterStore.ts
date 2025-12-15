import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import CharacterProfile from "@entities/CharacterProfile";
import { CharacterAttributes } from "@entities/CharacterAttributes";
import { InventoryItem, InventoryKey } from "@entities/InventoryItem";
import { eqDataService } from "@utils/eqDataService";
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
import { ItemClass } from "@entities/ItemClass";
import {
  WorldSocket,
  OpCodes,
  CharacterSelect,
  CharacterState,
  capnpToPlainObject,
  MoveItem,
  DeleteItem,
} from "@/net";
import races from "@data/json/races.json";
import classes from "@data/json/classes.json";
import deities from "@data/json/deities.json";

const defaultAttributes: CharacterAttributes = {
  str: 0,
  sta: 0,
  dex: 0,
  agi: 0,
  int: 0,
  wis: 0,
  cha: 0,
};

function createDefaultCharacterProfile(): CharacterProfile {
  return {
    inventory: [],
    attributes: { ...defaultAttributes },
    totalAttributes: { ...defaultAttributes },
    stats: { ac: 0, atk: 0 },
  } as CharacterProfile;
}

interface PlayerCharacterStore {
  characterProfile: CharacterProfile;
  setCharacterProfile: (profile: CharacterProfile) => void;
  setInventory: (inventory: InventoryItem[]) => Promise<void>;
  addInventoryItem: (item: InventoryItem) => Promise<void>;
  removeInventoryItem: (bag: number, slot: number) => void;
  clearInventory: () => void;
  loadItemDetails: () => Promise<void>;
  hoveredItem: Item | null;
  setHoveredItem: (item: Item | null) => void;
  setCharacterZone: (zoneId: number) => void;
  moveItemToSlot: (from: InventoryKey, to: InventoryKey) => void;
  swapItems: (from: InventoryKey, to: InventoryKey) => void;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  applyCharacterState: (state: any) => Promise<void>;
}

const getBagNumForContainerSlot = (key: InventoryKey): number => {
  // Containers only "own" child slots when the container itself is in bag=0
  if (key.bag !== 0) return -1;
  // Server convention: items inside a container at slot N have bag = N + 1
  // General inventory slots 22-29 map to bag numbers 23-30
  if (
    key.slot >= InventorySlot.General1 &&
    key.slot <= InventorySlot.General8
  ) {
    return key.slot + 1;
  }
  // Cursor slot 30 maps to bag number 31
  if (key.slot === InventorySlot.Cursor) return key.slot + 1;
  return -1;
};

const relocateContainerContents = (
  inventory: InventoryItem[],
  oldBagNum: number,
  newBagNum: number
): InventoryItem[] => {
  if (oldBagNum <= 0 || newBagNum <= 0 || oldBagNum === newBagNum) {
    return inventory;
  }
  return inventory.map((it) =>
    it.bag === oldBagNum ? { ...it, bag: newBagNum } : it
  );
};

const swapContainerContents = (
  inventory: InventoryItem[],
  bagA: number,
  bagB: number
): InventoryItem[] => {
  if (bagA <= 0 || bagB <= 0 || bagA === bagB) return inventory;
  return inventory.map((it) => {
    if (it.bag === bagA) return { ...it, bag: bagB };
    if (it.bag === bagB) return { ...it, bag: bagA };
    return it;
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
              attributes: profile.attributes || { ...defaultAttributes },
              totalAttributes,
              stats: profile.stats || {},
            },
          });
          get().updateAllStats();
        },
        setInventory: async (inventory) => {
          set((state) => {
            // Deduplicate inventory items (server may send inventory on both EnterWorld and zone change)
            const deduplicatedInventory = inventory.reduce((acc, item) => {
              const existingItem = acc.find(
                (i) => i.bag === item.bag && i.slot === item.slot
              );
              if (!existingItem) {
                acc.push(item);
              }
              // Silently skip duplicates - this is expected when zoning
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
            itemDetails =
              (await eqDataService.getItemById(item.itemid || 0)) ?? undefined;
          }
          if (!itemDetails) {
            console.error(
              `Item with ID ${item.itemid} not found in the database.`
            );
            return;
          }

          set((state) => {
            const existingItem = (state.characterProfile.inventory || []).find(
              (i) => i.bag === item.bag && i.slot === item.slot
            );

            if (existingItem) {
              console.warn("Slot already occupied:", item.bag, item.slot);
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
        removeInventoryItem: (bag: number, slot: number) => {
          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              inventory: (state.characterProfile.inventory || []).filter(
                (item) => item.bag !== bag || item.slot !== slot
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

          if (!itemsToLoad || itemsToLoad.length === 0) return;

          const loadedItems = await Promise.all(
            itemsToLoad.map(async (item) => {
              try {
                const itemDetails =
                  (await eqDataService.getItemById(item.itemid ?? 0)) ??
                  undefined;
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
                    (loadedItem) =>
                      loadedItem.bag === item.bag &&
                      loadedItem.slot === item.slot
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
          // Stop combat and clear target when zoning
          useGameStatusStore.getState().setIsRunning(false);
          useGameStatusStore.setState({
            targetNPC: null,
            currentNPCHealth: null,
          });
          set((state) => ({
            characterProfile: {
              ...state.characterProfile,
              zoneId: zoneId,
            },
          }));
        },
        moveItemToSlot: (from: InventoryKey, to: InventoryKey) => {
          const characterId = get().characterProfile?.id;

          set((state) => {
            if (!state.characterProfile) return state;
            const existingItem = state.characterProfile.inventory?.find(
              (item) => item.bag === to.bag && item.slot === to.slot
            );
            if (existingItem) {
              console.warn("Attempted to move item to occupied slot:", to);
              return state;
            }

            const movingItem = state.characterProfile.inventory?.find(
              (item) => item.bag === from.bag && item.slot === from.slot
            );

            let updatedInventory = state.characterProfile.inventory || [];
            // Move the base item
            updatedInventory = updatedInventory.map((item) => {
              if (item.bag === from.bag && item.slot === from.slot) {
                return { ...item, bag: to.bag, slot: to.slot };
              }
              return item;
            });

            // If moving a container that lives in bag=0 between general/cursor slots,
            // relabel the bag number of its contents.
            if (movingItem?.itemDetails?.itemclass === ItemClass.CONTAINER) {
              const oldBagNum = getBagNumForContainerSlot(from);
              const newBagNum = getBagNumForContainerSlot(to);
              updatedInventory = relocateContainerContents(
                updatedInventory,
                oldBagNum,
                newBagNum
              );
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

          // Sync with server via Cap'n Proto
          if (characterId) {
            WorldSocket.sendMessage(OpCodes.MoveItem, MoveItem, {
              fromSlot: from.slot,
              toSlot: to.slot,
              numberInStack: 0,
              fromBagSlot: from.bag,
              toBagSlot: to.bag,
            });
          }
        },
        swapItems: (from: InventoryKey, to: InventoryKey) => {
          const characterId = get().characterProfile?.id;

          set((state) => {
            if (!state.characterProfile) return state;

            const fromItem = state.characterProfile.inventory?.find(
              (item) => item.bag === from.bag && item.slot === from.slot
            );
            const toItem = state.characterProfile.inventory?.find(
              (item) => item.bag === to.bag && item.slot === to.slot
            );

            if (!fromItem) return state;

            let newInventory = [...(state.characterProfile.inventory || [])];

            const fromItemIsBag =
              fromItem.itemDetails?.itemclass === ItemClass.CONTAINER;
            const toItemIsBag =
              toItem?.itemDetails?.itemclass === ItemClass.CONTAINER;

            // Swap the base items
            newInventory = newInventory
              .filter(
                (item) =>
                  !(item.bag === from.bag && item.slot === from.slot) &&
                  !(item.bag === to.bag && item.slot === to.slot)
              )
              .concat([
                { ...fromItem, bag: to.bag, slot: to.slot },
                ...(toItem
                  ? [{ ...toItem, bag: from.bag, slot: from.slot }]
                  : []),
              ]);

            // If swapping/moving containers in bag=0 general/cursor slots, swap/relocate contents.
            const fromBagNum = fromItemIsBag
              ? getBagNumForContainerSlot(from)
              : -1;
            const toBagNum = toItemIsBag ? getBagNumForContainerSlot(to) : -1;

            if (fromItemIsBag && toItemIsBag) {
              newInventory = swapContainerContents(
                newInventory,
                fromBagNum,
                toBagNum
              );
            } else if (fromItemIsBag) {
              // container moved from -> to
              const newBagNum = getBagNumForContainerSlot(to);
              newInventory = relocateContainerContents(
                newInventory,
                fromBagNum,
                newBagNum
              );
            } else if (toItemIsBag) {
              // container moved to -> from
              const newBagNum = getBagNumForContainerSlot(from);
              newInventory = relocateContainerContents(
                newInventory,
                toBagNum,
                newBagNum
              );
            }

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
          });

          // Sync with server via Cap'n Proto - swap is just a move when dest has item
          if (characterId) {
            WorldSocket.sendMessage(OpCodes.MoveItem, MoveItem, {
              fromSlot: from.slot,
              toSlot: to.slot,
              numberInStack: 0,
              fromBagSlot: from.bag,
              toBagSlot: to.bag,
            });
          }
        },
        deleteItemOnCursor: () => {
          const characterId = get().characterProfile?.id;

          set((state) => {
            const newState = {
              characterProfile: {
                ...state.characterProfile,
                inventory: (state.characterProfile.inventory || []).filter(
                  (item) =>
                    !(item.bag === 0 && item.slot === InventorySlot.Cursor)
                ),
              },
            };
            return newState;
          });
          get().updateAllStats();

          // Sync with server via Cap'n Proto
          if (characterId) {
            // Cursor is bag=0, slot=30
            WorldSocket.sendMessage(OpCodes.DeleteItem, DeleteItem, {
              bag: 0,
              slot: 30,
            });
          }
        },
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
            const newExp = (characterProfile.exp || 0) + experience;
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
            const curHp = state.characterProfile.curHp || 0;
            const maxHp = state.characterProfile.maxHp || 1;
            const hpRatio = curHp / maxHp;
            const newCurHp = Math.floor(hpRatio * newMaxHp);

            return {
              characterProfile: {
                ...state.characterProfile,
                stats: {
                  ...resistances,
                  ac,
                  atk: 100 + Math.floor((totalAttributes.str ?? 0) / 4),
                },
                attributes: state.characterProfile.attributes || {
                  ...defaultAttributes,
                },
                totalAttributes: { ...totalAttributes },
                maxHp: newMaxHp,
                curHp: newCurHp || newMaxHp,
                weightAllowance: totalAttributes.str ?? 0,
              },
            };
          });
        },

        // Subscribe to character messages from server (Cap'n Proto)
        initializeCharacterSync: () => {
          // Handler for SendCharInfo (character select list)
          WorldSocket.registerOpCodeHandler(
            OpCodes.SendCharInfo,
            CharacterSelect,
            (charSelect) => {
              console.log("Received SendCharInfo:", charSelect);
              const plainData = capnpToPlainObject(charSelect);
              get().applyServerCharacterState(plainData);
            }
          );

          // Handler for CharacterState (unified character data from server)
          WorldSocket.registerOpCodeHandler(
            OpCodes.CharacterState,
            CharacterState,
            (charState) => {
              console.log("=== CHARACTERSTATE HANDLER FIRED ===");
              console.log("Received CharacterState:", charState);
              const plainData = capnpToPlainObject(charState);
              console.log("=== CHARACTERSTATE PLAIN DATA ===", plainData);
              get().applyCharacterState(plainData);
            }
          );
        },

        // Apply server-pushed character state from Cap'n Proto CharacterSelect
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applyServerCharacterState: async (charSelectData: any) => {
          console.log("[CharData] Processing CharacterSelect:", charSelectData);

          if (
            !charSelectData.characters ||
            charSelectData.characters.length === 0
          ) {
            console.warn(
              "[CharData] CharacterSelect has no characters, ignoring"
            );
            return;
          }

          // Get the first (or most recently created) character
          const serverChar = charSelectData.characters[0];
          console.log("[CharData] Server sent character:", {
            id: serverChar.id,
            name: serverChar.name,
            level: serverChar.level,
            curHp: serverChar.curHp,
            exp: serverChar.exp,
            zone: serverChar.zone,
          });

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
          // Server sends bag+slot format: bag=0 for equipment/general, bag=1-8 for bag contents
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
                  const itemDetails = await eqDataService.getItemById(itemId);
                  return {
                    bag: item.bagSlot ?? 0,
                    slot: item.slot ?? 0,
                    itemid: itemId,
                    charges: item.charges || 0,
                    itemDetails: itemDetails || undefined,
                  } as InventoryItem;
                }
              )
          );

          // Use server-computed values directly
          const newProfile: CharacterProfile = {
            id: serverChar.id || 0,
            name: serverChar.name,
            lastName: "",
            race: raceData,
            class: classData,
            deity: deityData,
            zoneId: serverChar.zone,
            level: serverChar.level,
            exp: serverChar.exp || 0,
            // Use server-computed HP values
            curHp: serverChar.curHp || 0,
            maxHp: serverChar.maxHp || 0,
            // Use server-computed mana values
            mana: serverChar.curMana || 0,
            maxMana: serverChar.maxMana || 0,
            endurance: 0,
            // Use server-provided attributes
            attributes: {
              str: serverChar.str || 75,
              sta: serverChar.sta || 75,
              cha: serverChar.cha || 75,
              dex: serverChar.dex || 75,
              int: serverChar.intel || 75,
              agi: serverChar.agi || 75,
              wis: serverChar.wis || 75,
            },
            inventory: inventoryItems,
            // Use server-computed stats
            stats: {
              ac: serverChar.ac || 0,
              atk: serverChar.atk || 100,
            },
          };

          console.log("[CharData] Using server-computed values:");
          console.log(
            "[CharData]   HP: %d/%d",
            newProfile.curHp,
            newProfile.maxHp
          );
          console.log(
            "[CharData]   Mana: %d/%d",
            newProfile.mana,
            newProfile.maxMana
          );
          console.log(
            "[CharData]   AC: %d, ATK: %d",
            newProfile.stats?.ac,
            newProfile.stats?.atk
          );

          // Server is authoritative - use values directly, no fallbacks
          set({ characterProfile: newProfile });
          get().updateAllStats();

          console.log("[CharData] Final applied state:", {
            name: newProfile.name,
            level: newProfile.level,
            curHp: newProfile.curHp,
            maxHp: newProfile.maxHp,
            exp: newProfile.exp,
          });
        },

        // Apply unified CharacterState from server - single source of truth
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        applyCharacterState: async (serverState: any) => {
          console.log(
            "[CharacterState] Processing unified state:",
            serverState
          );

          // Look up race/class/deity from JSON data
          const raceData = races.find(
            (r: { id: number }) => r.id === serverState.race
          );
          const classData = classes.find(
            (c: { id: number }) => c.id === serverState.charClass
          );
          const deityData =
            deities.find((d: { id: number }) => d.id === serverState.deity) ||
            deities[0];

          // Build inventory items from server data
          const inventoryItems: InventoryItem[] = await Promise.all(
            (serverState.inventoryItems || [])
              .filter((item: { itemId?: number; id?: number }) => {
                const itemId = item.itemId || item.id;
                return itemId && itemId > 0;
              })
              .map(
                async (item: {
                  itemId?: number;
                  id?: number;
                  bagSlot?: number;
                  slot?: number;
                  charges?: number;
                }) => {
                  const itemId = item.itemId || item.id;
                  const itemDetails = await eqDataService.getItemById(
                    itemId as number
                  );
                  return {
                    bag: item.bagSlot ?? 0,
                    slot: item.slot ?? 0,
                    itemid: itemId,
                    charges: item.charges || 0,
                    itemDetails: itemDetails || undefined,
                  } as InventoryItem;
                }
              )
          );

          // Build profile directly from server values - no client calculations
          const newProfile: CharacterProfile = {
            id: serverState.id || 0,
            name: serverState.name,
            lastName: serverState.lastName || "",
            race: raceData,
            class: classData,
            deity: deityData,
            zoneId: serverState.zoneId,
            level: serverState.level,
            exp: serverState.exp || 0,
            // Server-computed HP/Mana - use directly
            curHp: serverState.curHp,
            maxHp: serverState.maxHp,
            mana: serverState.curMana,
            maxMana: serverState.maxMana,
            endurance: serverState.endurance || 0,
            // Server-provided attributes
            attributes: {
              str: serverState.str,
              sta: serverState.sta,
              cha: serverState.cha,
              dex: serverState.dex,
              int: serverState.intel,
              agi: serverState.agi,
              wis: serverState.wis,
            },
            inventory: inventoryItems,
            // Server-computed stats
            stats: {
              ac: serverState.ac,
              atk: serverState.atk,
            },
            // Currency
            platinum: serverState.platinum || 0,
            gold: serverState.gold || 0,
            silver: serverState.silver || 0,
            copper: serverState.copper || 0,
          };

          console.log("[CharacterState] Applied server values:", {
            name: newProfile.name,
            level: newProfile.level,
            curHp: newProfile.curHp,
            maxHp: newProfile.maxHp,
            curMana: newProfile.mana,
            maxMana: newProfile.maxMana,
            ac: newProfile.stats?.ac,
            atk: newProfile.stats?.atk,
            items: inventoryItems.length,
          });

          set({ characterProfile: newProfile });
          get().updateAllStats();
        },
      }),
      { name: "player-character-storage" }
    ),
    { name: "Player Character Store" }
  )
);

// Expose store on window for E2E testing
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__PLAYER_STORE__ = usePlayerCharacterStore;
}

export default usePlayerCharacterStore;
