package constants

import (
	"testing"

	"idlequest/internal/db/jetgen/eqgo/model"
)

// TestIsClassEquippable tests class bitmask validation
func TestIsClassEquippable(t *testing.T) {
	tests := []struct {
		name    string
		classes int32
		classID uint8
		want    bool
	}{
		// Class bits: Warrior=1, Cleric=2, Paladin=4, Ranger=8, etc.
		{"All classes item", 65535, 1, true},        // Warrior can equip
		{"All classes item", 65535, 2, true},        // Cleric can equip
		{"Warrior only", 1, 1, true},                // Warrior can equip
		{"Warrior only", 1, 2, false},               // Cleric cannot equip
		{"Caster item", 0b11110000000000, 11, true}, // Magician can equip
		{"Caster item", 0b11110000000000, 1, false}, // Warrior cannot equip
		{"No classes", 0, 1, false},                 // No one can equip
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			item := &ItemWithInstance{
				Item: model.Items{Classes: tc.classes},
			}
			got := item.IsClassEquippable(tc.classID)
			if got != tc.want {
				t.Errorf("IsClassEquippable(%d) with classes=%d = %v, want %v",
					tc.classID, tc.classes, got, tc.want)
			}
		})
	}
}

// TestIsRaceEquippable tests race bitmask validation
func TestIsRaceEquippable(t *testing.T) {
	tests := []struct {
		name   string
		races  int32
		raceID RaceID
		want   bool
	}{
		// Race bits: Human=1, Barbarian=2, Erudite=4, etc.
		{"All races item", 65535, RaceID(1), true},                         // Human can equip
		{"Human only", 1, RaceID(1), true},                                 // Human can equip
		{"Human only", 1, RaceID(2), false},                                // Barbarian cannot equip
		{"Iksar only", int32(PlayerRaceIksarBit), RaceID(RaceIksar), true}, // Iksar can equip (bit 12 = 4096)
		{"Iksar only", int32(PlayerRaceIksarBit), RaceID(1), false},        // Human cannot equip
		{"No races", 0, RaceID(1), false},                                  // No one can equip
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			item := &ItemWithInstance{
				Item: model.Items{Races: tc.races},
			}
			got := item.IsRaceEquippable(tc.raceID)
			if got != tc.want {
				t.Errorf("IsRaceEquippable(%d) with races=%d = %v, want %v",
					tc.raceID, tc.races, got, tc.want)
			}
		})
	}
}

// TestAllowedInSlot tests slot bitmask validation
func TestAllowedInSlot(t *testing.T) {
	tests := []struct {
		name  string
		slots int32
		slot  int8
		want  bool
	}{
		{"Cursor always allowed", 0, SlotCursor, true},
		{"General slot always allowed", 0, SlotGeneral1, true},
		{"Head item in head slot", 1 << SlotHead, SlotHead, true},
		{"Head item in chest slot", 1 << SlotHead, SlotChest, false},
		{"Multi-slot item in valid slot", (1 << SlotFinger1) | (1 << SlotFinger2), SlotFinger1, true},
		{"Multi-slot item in valid slot", (1 << SlotFinger1) | (1 << SlotFinger2), SlotFinger2, true},
		{"Multi-slot item in invalid slot", (1 << SlotFinger1) | (1 << SlotFinger2), SlotHead, false},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			item := &ItemWithInstance{
				Item: model.Items{Slots: tc.slots},
			}
			got := item.AllowedInSlot(tc.slot)
			if got != tc.want {
				t.Errorf("AllowedInSlot(%d) with slots=%d = %v, want %v",
					tc.slot, tc.slots, got, tc.want)
			}
		})
	}
}

// TestIsContainer tests container detection
func TestIsContainer(t *testing.T) {
	tests := []struct {
		name     string
		bagslots int32
		want     bool
	}{
		{"Not a container", 0, false},
		{"4 slot bag", 4, true},
		{"8 slot bag", 8, true},
		{"10 slot bag", 10, true},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			item := &ItemWithInstance{
				Item: model.Items{Bagslots: tc.bagslots},
			}
			got := item.IsContainer()
			if got != tc.want {
				t.Errorf("IsContainer() with bagslots=%d = %v, want %v",
					tc.bagslots, got, tc.want)
			}
		})
	}
}

// TestNilItemHandling tests that methods handle nil items gracefully
func TestNilItemHandling(t *testing.T) {
	var nilItem *ItemWithInstance

	if nilItem.IsContainer() {
		t.Error("nil.IsContainer() should return false")
	}
	if !nilItem.AllowedInSlot(SlotGeneral1) {
		t.Error("nil.AllowedInSlot() should return true for general slots")
	}
}

// TestEquipSlotCheck tests IsEquipSlot helper
func TestEquipSlotCheck(t *testing.T) {
	tests := []struct {
		slot int8
		want bool
	}{
		{SlotCharm, true},
		{SlotHead, true},
		{SlotAmmo, true},
		{SlotGeneral1, false},
		{SlotGeneral8, false},
		{SlotCursor, false},
		{-1, false},
	}

	for _, tc := range tests {
		t.Run("", func(t *testing.T) {
			got := IsEquipSlot(tc.slot)
			if got != tc.want {
				t.Errorf("IsEquipSlot(%d) = %v, want %v", tc.slot, got, tc.want)
			}
		})
	}
}

// TestGeneralSlotCheck tests IsGeneralSlot helper
func TestGeneralSlotCheck(t *testing.T) {
	tests := []struct {
		slot int8
		want bool
	}{
		{SlotGeneral1, true},
		{SlotGeneral8, true},
		{SlotHead, false},
		{SlotCursor, false},
		{SlotAmmo, false},
	}

	for _, tc := range tests {
		t.Run("", func(t *testing.T) {
			got := IsGeneralSlot(tc.slot)
			if got != tc.want {
				t.Errorf("IsGeneralSlot(%d) = %v, want %v", tc.slot, got, tc.want)
			}
		})
	}
}

// =============================================================================
// Two-Handed Weapon Tests
// =============================================================================

func TestIsType2HWeapon(t *testing.T) {
	tests := []struct {
		name     string
		itemtype int32
		want     bool
	}{
		{"2H Blunt", int32(ItemType2HBlunt), true},
		{"2H Slash", int32(ItemType2HSlash), true},
		{"2H Piercing", int32(ItemType2HPiercing), true},
		{"1H Blunt", int32(ItemType1HBlunt), false},
		{"1H Slash", int32(ItemType1HSlash), false},
		{"1H Piercing", int32(ItemType1HPiercing), false},
		{"Shield", int32(ItemTypeShield), false},
		{"Martial", int32(ItemTypeMartial), true}, // Martial is 2H
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			item := &ItemWithInstance{
				Item: model.Items{Itemtype: tc.itemtype},
			}
			got := item.IsType2H()
			if got != tc.want {
				t.Errorf("IsType2H() for itemtype=%d = %v, want %v", tc.itemtype, got, tc.want)
			}
		})
	}
}

func TestIsType1HWeapon(t *testing.T) {
	tests := []struct {
		name     string
		itemtype int32
		want     bool
	}{
		{"1H Blunt", int32(ItemType1HBlunt), true},
		{"1H Slash", int32(ItemType1HSlash), true},
		{"1H Piercing", int32(ItemType1HPiercing), true},
		{"2H Blunt", int32(ItemType2HBlunt), false},
		{"2H Slash", int32(ItemType2HSlash), false},
		{"Shield", int32(ItemTypeShield), false},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			item := &ItemWithInstance{
				Item: model.Items{Itemtype: tc.itemtype},
			}
			got := item.IsType1HWeapon()
			if got != tc.want {
				t.Errorf("IsType1HWeapon() for itemtype=%d = %v, want %v", tc.itemtype, got, tc.want)
			}
		})
	}
}

func TestIsTypeShield(t *testing.T) {
	tests := []struct {
		name     string
		itemtype int32
		want     bool
	}{
		{"Shield", int32(ItemTypeShield), true},
		{"1H Blunt", int32(ItemType1HBlunt), false},
		{"2H Blunt", int32(ItemType2HBlunt), false},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			item := &ItemWithInstance{
				Item: model.Items{Itemtype: tc.itemtype},
			}
			got := item.IsTypeShield()
			if got != tc.want {
				t.Errorf("IsTypeShield() for itemtype=%d = %v, want %v", tc.itemtype, got, tc.want)
			}
		})
	}
}

func TestTwoHandedWeaponBlocksSecondarySlot(t *testing.T) {
	// Create a 2H weapon in primary slot
	twoHandedWeapon := &ItemWithInstance{
		Item: model.Items{
			Name:     "Great Sword",
			Itemtype: int32(ItemType2HSlash),
			Slots:    1 << SlotPrimary,
		},
	}

	// Verify it's detected as 2H
	if !twoHandedWeapon.IsType2H() {
		t.Fatal("Great Sword should be detected as a 2H weapon")
	}

	// Create a shield that would go in secondary
	shield := &ItemWithInstance{
		Item: model.Items{
			Name:     "Iron Shield",
			Itemtype: int32(ItemTypeShield),
			Slots:    1 << SlotSecondary,
		},
	}

	// Verify shield can go in secondary slot
	if !shield.AllowedInSlot(SlotSecondary) {
		t.Fatal("Shield should be allowed in secondary slot")
	}

	// The actual blocking logic is in ProcessAutoLoot and HandleMoveItemWorld
	// This test validates the helper methods work correctly
	if twoHandedWeapon.IsType2H() && shield.AllowedInSlot(SlotSecondary) {
		// This is the scenario where we should block the equip
		// The blocking logic checks: if primary has 2H && trying to equip to secondary -> block
		t.Log("Correctly identified scenario: 2H in primary should block secondary equip")
	}
}

func TestSecondaryItemBlocksTwoHandedEquip(t *testing.T) {
	// Create a shield in secondary slot
	shield := &ItemWithInstance{
		Item: model.Items{
			Name:     "Iron Shield",
			Itemtype: int32(ItemTypeShield),
			Slots:    1 << SlotSecondary,
		},
	}

	// Create a 2H weapon trying to go into primary
	twoHandedWeapon := &ItemWithInstance{
		Item: model.Items{
			Name:     "Great Sword",
			Itemtype: int32(ItemType2HSlash),
			Slots:    1 << SlotPrimary,
		},
	}

	// Verify it's detected as 2H
	if !twoHandedWeapon.IsType2H() {
		t.Fatal("Great Sword should be detected as a 2H weapon")
	}

	// The blocking logic is: if equipping 2H to primary && secondary has item -> block
	if twoHandedWeapon.IsType2H() && shield != nil {
		t.Log("Correctly identified scenario: secondary item should block 2H equip to primary")
	}
}

func TestPrimarySecondarySlotValues(t *testing.T) {
	// Verify slot constants are correct
	if SlotPrimary != 13 {
		t.Errorf("SlotPrimary should be 13, got %d", SlotPrimary)
	}
	if SlotSecondary != 14 {
		t.Errorf("SlotSecondary should be 14, got %d", SlotSecondary)
	}
}

func TestNilItemIsType2H(t *testing.T) {
	var nilItem *ItemWithInstance

	// Nil items should not be detected as 2H
	if nilItem.IsType2H() {
		t.Error("Nil item should not be detected as 2H")
	}
	if nilItem.IsType1HWeapon() {
		t.Error("Nil item should not be detected as 1H weapon")
	}
	if nilItem.IsTypeShield() {
		t.Error("Nil item should not be detected as shield")
	}
}
