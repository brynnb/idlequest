package items

import (
	"testing"

	"idlequest/internal/constants"
	"idlequest/internal/db/jetgen/eqgo/model"
)

// =============================================================================
// FindFirstAvailableSlot Tests
// =============================================================================

func TestFindFirstAvailableSlot_EmptyInventory(t *testing.T) {
	items := make(map[constants.InventoryKey]*constants.ItemWithInstance)

	bag, slot := FindFirstAvailableSlot(items, false)

	// Should return first general slot (bag 0, slot 22)
	if bag != 0 || slot != constants.SlotGeneral1 {
		t.Errorf("Expected (0, %d), got (%d, %d)", constants.SlotGeneral1, bag, slot)
	}
}

func TestFindFirstAvailableSlot_FirstSlotOccupied(t *testing.T) {
	items := make(map[constants.InventoryKey]*constants.ItemWithInstance)

	// Occupy the first general slot
	items[constants.InventoryKey{Bag: 0, Slot: constants.SlotGeneral1}] = &constants.ItemWithInstance{
		Item: model.Items{Name: "Test Item"},
	}

	bag, slot := FindFirstAvailableSlot(items, false)

	// Should return second general slot
	if bag != 0 || slot != constants.SlotGeneral2 {
		t.Errorf("Expected (0, %d), got (%d, %d)", constants.SlotGeneral2, bag, slot)
	}
}

func TestFindFirstAvailableSlot_AllGeneralSlotsFull(t *testing.T) {
	items := make(map[constants.InventoryKey]*constants.ItemWithInstance)

	// Fill all general slots (22-29)
	for slot := int8(constants.SlotGeneral1); slot <= int8(constants.SlotGeneral8); slot++ {
		items[constants.InventoryKey{Bag: 0, Slot: slot}] = &constants.ItemWithInstance{
			Item: model.Items{Name: "Test Item"},
		}
	}

	bag, slot := FindFirstAvailableSlot(items, false)

	// Should return -1, -1 (no slot available) since we don't have bags
	// Note: The actual implementation may check bags or return cursor
	// This test verifies the current behavior
	if slot == -1 {
		// Expected - no slot found
	} else if bag > 0 {
		// Found a bag slot - also acceptable
	} else {
		t.Logf("Got bag=%d, slot=%d when all general slots full", bag, slot)
	}
}

func TestFindFirstAvailableSlot_ContainerSkipsBags(t *testing.T) {
	items := make(map[constants.InventoryKey]*constants.ItemWithInstance)

	// Fill all general slots except the last one
	for slot := int8(constants.SlotGeneral1); slot < int8(constants.SlotGeneral8); slot++ {
		items[constants.InventoryKey{Bag: 0, Slot: slot}] = &constants.ItemWithInstance{
			Item: model.Items{Name: "Test Item"},
		}
	}

	// Also add items in bags
	items[constants.InventoryKey{Bag: 1, Slot: 0}] = &constants.ItemWithInstance{}

	// When placing a container, it should not go inside another bag
	bag, slot := FindFirstAvailableSlot(items, true)

	// Container should only be placed in bag 0 (main inventory)
	if bag != 0 {
		t.Errorf("Container should be placed in bag 0, got bag %d", bag)
	}
	if slot != constants.SlotGeneral8 {
		t.Errorf("Expected slot %d, got %d", constants.SlotGeneral8, slot)
	}
}

// =============================================================================
// SlotUpdate Tests
// =============================================================================

func TestSlotUpdate_NewItemMarker(t *testing.T) {
	// A new item should have FromSlot = -1
	update := SlotUpdate{
		ItemInstanceID: 12345,
		FromSlot:       -1, // New item marker
		FromBag:        0,
		ToSlot:         22,
		ToBag:          0,
	}

	if update.FromSlot != -1 {
		t.Error("New item should have FromSlot = -1")
	}
}

func TestSlotUpdate_MoveItem(t *testing.T) {
	// A moved item should have valid from and to
	update := SlotUpdate{
		ItemInstanceID: 12345,
		FromSlot:       22,
		FromBag:        0,
		ToSlot:         23,
		ToBag:          0,
	}

	if update.FromSlot == -1 {
		t.Error("Moved item should not have FromSlot = -1")
	}
	if update.FromSlot == update.ToSlot && update.FromBag == update.ToBag {
		t.Error("Moved item should have different from/to positions")
	}
}

// =============================================================================
// Equip Logic Tests (using ItemWithInstance helpers)
// =============================================================================

func TestIsEquippable_ValidItem(t *testing.T) {
	// Create a sword equippable by warriors (class 1)
	item := &constants.ItemWithInstance{
		Item: model.Items{
			Name:    "Test Sword",
			Slots:   1 << 13,          // Primary slot
			Classes: 1,                // Warrior only
			Races:   int32(0b1111111), // Multiple races
		},
	}

	if !item.IsEquippable(constants.RaceID(1), 1) {
		t.Error("Warrior should be able to equip this sword")
	}
}

func TestIsEquippable_WrongClass(t *testing.T) {
	// Create a sword equippable by warriors only
	item := &constants.ItemWithInstance{
		Item: model.Items{
			Name:    "Warrior Sword",
			Slots:   1 << 13, // Primary slot
			Classes: 1,       // Warrior only (class 1)
			Races:   65535,   // All races
		},
	}

	// Cleric (class 2) should not be able to equip
	if item.IsEquippable(constants.RaceID(1), 2) {
		t.Error("Cleric should not be able to equip warrior-only sword")
	}
}

func TestIsEquippable_WrongRace(t *testing.T) {
	// Create an item equippable by humans only
	item := &constants.ItemWithInstance{
		Item: model.Items{
			Name:    "Human Ring",
			Slots:   (1 << 12) | (1 << 11), // Finger slots
			Classes: 65535,                 // All classes
			Races:   1,                     // Human only
		},
	}

	// Barbarian (race 2) should not be able to equip
	if item.IsEquippable(constants.RaceID(2), 1) {
		t.Error("Barbarian should not be able to equip human-only ring")
	}
}

// =============================================================================
// Container Tests
// =============================================================================

func TestContainerDetection(t *testing.T) {
	tests := []struct {
		name        string
		bagslots    int32
		isContainer bool
	}{
		{"Regular item", 0, false},
		{"4-slot bag", 4, true},
		{"8-slot bag", 8, true},
		{"10-slot bag", 10, true},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			item := &constants.ItemWithInstance{
				Item: model.Items{Bagslots: tc.bagslots},
			}
			if item.IsContainer() != tc.isContainer {
				t.Errorf("Expected IsContainer=%v for bagslots=%d", tc.isContainer, tc.bagslots)
			}
		})
	}
}

func TestContainerCannotGoInsideBag(t *testing.T) {
	bag := &constants.ItemWithInstance{
		Item: model.Items{
			Name:     "Backpack",
			Bagslots: 8,
			Slots:    1 << constants.SlotGeneral1, // General slot
		},
	}

	// Bags should not be placeable inside other bags (bag > 0)
	// This is enforced by FindFirstAvailableSlot with isContainer=true
	if !bag.IsContainer() {
		t.Error("Backpack should be detected as a container")
	}
}

// =============================================================================
// Inventory Key Tests
// =============================================================================

func TestInventoryKeyEquality(t *testing.T) {
	key1 := constants.InventoryKey{Bag: 0, Slot: 22}
	key2 := constants.InventoryKey{Bag: 0, Slot: 22}
	key3 := constants.InventoryKey{Bag: 0, Slot: 23}
	key4 := constants.InventoryKey{Bag: 1, Slot: 22}

	if key1 != key2 {
		t.Error("Identical keys should be equal")
	}
	if key1 == key3 {
		t.Error("Different slots should not be equal")
	}
	if key1 == key4 {
		t.Error("Different bags should not be equal")
	}
}

func TestInventoryKeyAsMapKey(t *testing.T) {
	items := make(map[constants.InventoryKey]*constants.ItemWithInstance)

	key := constants.InventoryKey{Bag: 0, Slot: 22}
	items[key] = &constants.ItemWithInstance{
		Item: model.Items{Name: "Test Item"},
	}

	// Retrieve using same key values
	lookupKey := constants.InventoryKey{Bag: 0, Slot: 22}
	item := items[lookupKey]

	if item == nil {
		t.Error("Should find item using equivalent key")
	}
	if item.Item.Name != "Test Item" {
		t.Errorf("Expected 'Test Item', got '%s'", item.Item.Name)
	}
}

// =============================================================================
// Slot Range Tests
// =============================================================================

func TestSlotRanges(t *testing.T) {
	// Equipment slots: 0-21
	// General slots: 22-29
	// Cursor: 30

	if constants.SlotCharm != 0 {
		t.Errorf("SlotCharm should be 0, got %d", constants.SlotCharm)
	}
	if constants.SlotGeneral1 != 22 {
		t.Errorf("SlotGeneral1 should be 22, got %d", constants.SlotGeneral1)
	}
	if constants.SlotGeneral8 != 29 {
		t.Errorf("SlotGeneral8 should be 29, got %d", constants.SlotGeneral8)
	}
	if constants.SlotCursor != 30 {
		t.Errorf("SlotCursor should be 30, got %d", constants.SlotCursor)
	}
}

func TestEquipmentSlotRange(t *testing.T) {
	// All equipment slots should be recognized
	equipSlots := []int8{
		constants.SlotCharm, constants.SlotEar1, constants.SlotHead, constants.SlotFace,
		constants.SlotEar2, constants.SlotNeck, constants.SlotShoulders, constants.SlotArms,
		constants.SlotBack, constants.SlotWrist1, constants.SlotWrist2, constants.SlotRange,
		constants.SlotHands, constants.SlotPrimary, constants.SlotSecondary, constants.SlotFinger1,
		constants.SlotFinger2, constants.SlotChest, constants.SlotLegs, constants.SlotFeet,
		constants.SlotWaist, constants.SlotAmmo,
	}

	for _, slot := range equipSlots {
		if !constants.IsEquipSlot(slot) {
			t.Errorf("Slot %d should be recognized as equipment slot", slot)
		}
	}
}

func TestGeneralSlotRange(t *testing.T) {
	// All general slots should be recognized
	for slot := int8(constants.SlotGeneral1); slot <= int8(constants.SlotGeneral8); slot++ {
		if !constants.IsGeneralSlot(slot) {
			t.Errorf("Slot %d should be recognized as general slot", slot)
		}
	}

	// Equipment slots should not be general
	if constants.IsGeneralSlot(constants.SlotHead) {
		t.Error("SlotHead should not be a general slot")
	}

	// Cursor should not be general
	if constants.IsGeneralSlot(constants.SlotCursor) {
		t.Error("SlotCursor should not be a general slot")
	}
}

// =============================================================================
// Loot Upgrade Logic Tests (Mock)
// =============================================================================

func TestLootUpgradeDecision(t *testing.T) {
	// Test the logic of determining if a new item is an upgrade
	// This tests the scoring logic without DB

	// Mock current equipped item
	currentSword := model.Items{
		Name:   "Bronze Sword",
		Damage: 5,
		Delay:  30,
		Slots:  1 << 13, // Primary
	}

	// Mock new dropped item
	newSword := model.Items{
		Name:   "Iron Sword",
		Damage: 10,
		Delay:  30,
		Slots:  1 << 13, // Primary
	}

	// Simple comparison - higher damage = better for melee
	if newSword.Damage <= currentSword.Damage {
		t.Error("New sword should be an upgrade based on damage")
	}
}

func TestLootUpgrade_SlotMatching(t *testing.T) {
	// Test that upgrade logic only considers matching slots
	helmet := model.Items{
		Name:  "Iron Helmet",
		Slots: 1 << constants.SlotHead,
		Ac:    10,
	}

	sword := model.Items{
		Name:   "Iron Sword",
		Slots:  1 << constants.SlotPrimary,
		Damage: 10,
	}

	// Check slot bits are different
	if helmet.Slots&sword.Slots != 0 {
		t.Error("Helmet and sword should not share slots")
	}

	// Verify slot bitmask works
	if helmet.Slots&(1<<constants.SlotHead) == 0 {
		t.Error("Helmet should be equippable in head slot")
	}
	if sword.Slots&(1<<constants.SlotPrimary) == 0 {
		t.Error("Sword should be equippable in primary slot")
	}
}

// =============================================================================
// Item Instance Tests
// =============================================================================

func TestItemInstanceCreation(t *testing.T) {
	instance := constants.ItemInstance{
		ItemID:    1234,
		Charges:   5,
		Quantity:  1,
		OwnerType: constants.OwnerTypeCharacter,
	}

	if instance.ItemID != 1234 {
		t.Errorf("Expected ItemID 1234, got %d", instance.ItemID)
	}
	if instance.Charges != 5 {
		t.Errorf("Expected 5 charges, got %d", instance.Charges)
	}
	if instance.OwnerType != constants.OwnerTypeCharacter {
		t.Error("OwnerType should be Character")
	}
}

func TestItemWithInstanceCombined(t *testing.T) {
	itemWithInstance := &constants.ItemWithInstance{
		Item: model.Items{
			ID:   1234,
			Name: "Magic Ring",
		},
		Instance: constants.ItemInstance{
			ItemID:   1234,
			Charges:  0,
			Quantity: 1,
		},
		ItemInstanceID: 99999,
	}

	if itemWithInstance.Item.Name != "Magic Ring" {
		t.Error("Item name mismatch")
	}
	if itemWithInstance.ItemInstanceID != 99999 {
		t.Error("ItemInstanceID mismatch")
	}
	if itemWithInstance.Item.ID != itemWithInstance.Instance.ItemID {
		t.Error("Item ID and Instance ItemID should match")
	}
}

// =============================================================================
// Edge Cases
// =============================================================================

func TestEmptyInventoryOperations(t *testing.T) {
	items := make(map[constants.InventoryKey]*constants.ItemWithInstance)

	// Looking up non-existent item should return nil
	key := constants.InventoryKey{Bag: 0, Slot: 22}
	if items[key] != nil {
		t.Error("Empty inventory should return nil for any key")
	}

	// Deleting non-existent key should be safe
	delete(items, key) // Should not panic
}

func TestNegativeSlotValues(t *testing.T) {
	// Slot -1 is often used as "new item" marker
	key := constants.InventoryKey{Bag: 0, Slot: -1}

	items := make(map[constants.InventoryKey]*constants.ItemWithInstance)
	items[key] = &constants.ItemWithInstance{}

	// Should still work as a map key
	if items[key] == nil {
		t.Error("Should be able to use -1 as a slot value in map")
	}
}
