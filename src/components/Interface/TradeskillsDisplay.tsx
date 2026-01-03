import React, { useEffect, useState } from "react";
import styled from "styled-components";
import TradeskillList from "./TradeskillList";
import ForgeSlots from "./ForgeSlots";
import RecipeList from "./RecipeList";
import RecipeDetail from "./RecipeDetail";
import usePlayerCharacterStore from "@stores/PlayerCharacterStore";
import useGameStatusStore from "@stores/GameStatusStore";
import { useInventoryActions } from "@hooks/useInventoryActions";
import { InventorySlot } from "@entities/InventorySlot";
import { ItemClass } from "@entities/ItemClass";
import { InventoryKey } from "@entities/InventoryItem";
import ContainerInventoryModal from "@components/Inventory/ContainerInventoryModal";
import ActionButton from "@components/Interface/ActionButton";
import ItemInformationDisplay from "@components/Inventory/ItemInformationDisplay";

import generalInventoryBackground from "/images/ui/generalinventoryslots.png";

// Left sidebar container - matching AbilitiesDisplay structure
const TradeskillsSidebar = styled.div`
  width: 246px;
  height: 1080px;
  position: absolute;
  left: 0;
  top: 0;
`;

const SidebarBackground = styled.div`
  width: 246px;
  height: 1080px;
  background-image: url("/images/ui/lootpanebackground.png");
  background-size: 100% 100%;
  background-repeat: no-repeat;
  color: white;
  overflow-y: auto;
  padding-left: 24px;
`;

const PaneTitle = styled.div`
  font-size: 18px;
  font-weight: bold;
  top: 35px;
  left: 25px;
  position: absolute;
`;

// Center viewport container - matching MapAndZoneSelection positioning
const CenterViewport = styled.div`
height: 723px;
  width: 935px;
  position: absolute;
  left: 255px;
  top: 0px;
  background: url("/images/ui/charactercreation/charactercreatorbackground.png");
    background-repeat: repeat;
  background-repeat: no-repeat;
  z-index: 999999;

`;

// Forge area positioned in the top-left of center viewport
const ForgeArea = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000000;
`;

// Recipe detail area below the forge
const RecipeDetailArea = styled.div`
  position: absolute;
  top: 320px;
  left: 20px;
  z-index: 1000000;
`;

// Right sidebar container - matching InventoryLayout structure
const RightSidebarBackground = styled.div`
  position: absolute;
  right: 0;
  top: 0;
  width: 272px;
  height: 1080px;
  background-image: url("/images/ui/rightsidebarinventory.png");
  background-size: cover;
  background-repeat: no-repeat;
`;

// Recipe list area - right side of center viewport
const RecipeListArea = styled.div`
  position: absolute;
  right: 20px;
  top: 20px;
  width: 350px;
  height: 680px;
  background: rgba(20, 20, 20, 0.9);
  border: 1px solid rgba(80, 80, 80, 0.6);
  border-radius: 6px;
  padding: 15px;
  z-index: 1000000;
  display: flex;
  flex-direction: column;
`;

const RecipeListTitle = styled.div`
  color: #e0e0e0;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  text-align: center;
  border-bottom: 1px solid rgba(80, 80, 80, 0.6);
  padding-bottom: 10px;
`;

const GeneralInventory = styled.div`
  width: 219px;
  height: 439px;
  background-size: 100% 100%;
  position: absolute;
  background-image: url(${generalInventoryBackground});
  right: 25px;
  top: 570px;
`;

const Slot = styled.div<{ $row: number; $col: number }>`
  position: absolute;
  left: ${(props) => props.$col * 50}%;
  top: ${(props) => props.$row * 25}%;
  width: 50%;
  height: 25%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
`;

const ItemIcon = styled.img`
  width: 80px;
  height: 80px;
  object-fit: contain;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
`;

const TradeskillsDisplay: React.FC = () => {
    const { characterProfile, setHoveredItem, hoveredItem } = usePlayerCharacterStore();
    const { toggleTradeskills } = useGameStatusStore();
    const { handleItemClick } = useInventoryActions();
    const [openBagSlots, setOpenBagSlots] = useState<Set<number>>(new Set());

    // Build a map of item ID -> quantity owned for crafting checks
    const playerInventory = React.useMemo(() => {
        const map = new Map<number, number>();
        if (characterProfile?.inventory) {
            for (const item of characterProfile.inventory) {
                if (item.itemDetails && item.itemDetails.id !== undefined) {
                    const currentQty = map.get(item.itemDetails.id) || 0;
                    map.set(item.itemDetails.id, currentQty + 1);
                }
            }
        }
        return map;
    }, [characterProfile?.inventory]);

    // General inventory slots 22-29 (matches server slot IDs)
    const generalSlots = [
        InventorySlot.General1, // 22
        InventorySlot.General2, // 23
        InventorySlot.General3, // 24
        InventorySlot.General4, // 25
        InventorySlot.General5, // 26
        InventorySlot.General6, // 27
        InventorySlot.General7, // 28
        InventorySlot.General8, // 29
    ];

    const getInventoryItemForSlot = (slotId: number) => {
        return characterProfile?.inventory?.find(
            (item) => item.bag === 0 && item.slot === slotId
        );
    };

    useEffect(() => {
        const inv = characterProfile?.inventory || [];

        setOpenBagSlots((prev) => {
            if (prev.size === 0) return prev;

            const next = new Set<number>();
            for (const slot of prev) {
                const slotItem = inv.find((item) => item.bag === 0 && item.slot === slot);
                if (slotItem?.itemDetails?.itemclass === ItemClass.CONTAINER) {
                    next.add(slot);
                }
            }

            return next;
        });
    }, [characterProfile?.inventory]);

    const handleBagClick = (slot: number) => {
        setOpenBagSlots((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(slot)) {
                newSet.delete(slot);
            } else {
                newSet.add(slot);
            }
            return newSet;
        });
    };

    const handleCraft = () => {
        // TODO: Send craft request to server
        console.log("Craft button clicked - not yet implemented");
    };

    return (
        <>
            {/* Left sidebar with tradeskills list */}
            <TradeskillsSidebar>
                <SidebarBackground>
                    <PaneTitle>Tradeskills</PaneTitle>
                    <TradeskillList />
                </SidebarBackground>
            </TradeskillsSidebar>

            {/* Center viewport with character creation background */}
            <CenterViewport>
                {/* Forge slots - top left of viewport */}
                <ForgeArea>
                    <ForgeSlots playerInventory={playerInventory} />
                </ForgeArea>

                {/* Recipe detail - below forge */}
                <RecipeDetailArea>
                    <RecipeDetail
                        playerInventory={playerInventory}
                        playerSkillLevel={characterProfile?.blacksmithing || 0}
                        onCraft={handleCraft}
                    />
                </RecipeDetailArea>
                {/* Recipe list - right side of viewport */}
                <RecipeListArea>
                    <RecipeListTitle>Blacksmithing Recipes</RecipeListTitle>
                    <RecipeList playerSkillLevel={characterProfile?.blacksmithing || 0} />
                </RecipeListArea>
            </CenterViewport>

            {/* Right sidebar background - same as inventory */}
            <RightSidebarBackground />

            {/* General inventory slots */}
            <GeneralInventory>
                {generalSlots.map((slot, index) => {
                    const inventoryItem = getInventoryItemForSlot(slot);
                    const itemDetails = inventoryItem?.itemDetails;

                    const row = Math.floor(index / 2);
                    const col = index % 2;

                    return (
                        <Slot
                            key={`tradeskill-slot-${slot}`}
                            $row={row}
                            $col={col}
                            onMouseEnter={() => setHoveredItem(itemDetails || null)}
                            onMouseLeave={() => setHoveredItem(null)}
                            onClick={() => handleItemClick({ bag: 0, slot })}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                if (itemDetails?.itemclass === ItemClass.CONTAINER) {
                                    handleBagClick(slot);
                                }
                            }}
                        >
                            {itemDetails && (
                                <ItemIcon
                                    src={`/icons/${itemDetails.icon}.gif`}
                                    alt={itemDetails.name}
                                    title={itemDetails.name}
                                />
                            )}
                        </Slot>
                    );
                })}
            </GeneralInventory>

            {/* Container modals for opened bags */}
            {Array.from(openBagSlots).map((slot) => (
                <ContainerInventoryModal
                    key={`tradeskill-container-modal-${slot}`}
                    containerKey={{ bag: 0, slot } as InventoryKey}
                    onClose={() => handleBagClick(slot)}
                />
            ))}

            {/* Done button */}
            <ActionButton
                text="Done"
                onClick={toggleTradeskills}
                customCSS={`position: absolute; bottom: 15px; right: 75px; z-index: 1000; width: 120px;`}
            />

            {/* Item info display */}
            <ItemInformationDisplay
                item={hoveredItem}
                isVisible={true}
            />


        </>
    );
};

export default TradeskillsDisplay;

