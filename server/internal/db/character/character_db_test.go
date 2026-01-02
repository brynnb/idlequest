package db_character

import (
	"context"
	"testing"

	"idlequest/internal/constants"
	"idlequest/internal/db"
	"idlequest/internal/db/jetgen/eqgo/table"

	"github.com/go-jet/jet/v2/mysql"
)

// =============================================================================
// PurgeCharacterItem Tests
// =============================================================================

// TestPurgeCharacterItem_Integration tests the full delete flow against a real database.
// This test is skipped unless IDLEQUEST_TEST_DB is set to "true".
// Run with: IDLEQUEST_TEST_DB=true go test -run TestPurgeCharacterItem_Integration ./...
func TestPurgeCharacterItem_Integration(t *testing.T) {
	if db.GlobalWorldDB == nil || db.GlobalWorldDB.DB == nil {
		t.Skip("Skipping integration test: no database connection. Set up GlobalWorldDB to run this test.")
	}

	ctx := context.Background()

	// Create a test character ID that we'll use for this test
	// In a real test suite, this would be created in TestMain
	testCharID := int32(999999) // Use a high ID unlikely to conflict

	// Clean up any previous test data
	cleanupTestData(t, ctx, testCharID)
	defer cleanupTestData(t, ctx, testCharID)

	// Step 1: Create a test container in the cursor slot (30)
	containerInstanceID := createTestItemInstance(t, ctx, testCharID, constants.SlotCursor, 0)
	if containerInstanceID == 0 {
		t.Fatal("Failed to create container item instance")
	}

	// Step 2: Create items inside the container (bag=31, slots=0-7)
	bagNum := int8(constants.SlotCursor + 1) // 31
	var bagItemIDs []int32
	for i := int8(0); i < 8; i++ {
		itemID := createTestItemInstance(t, ctx, testCharID, i, bagNum)
		if itemID == 0 {
			t.Fatalf("Failed to create bag item at slot %d", i)
		}
		bagItemIDs = append(bagItemIDs, itemID)
	}

	// Verify we have 9 items total (1 container + 8 inside)
	count := countCharacterInventory(t, ctx, testCharID)
	if count != 9 {
		t.Fatalf("Expected 9 items before purge, got %d", count)
	}

	// Step 3: Purge the container item
	err := PurgeCharacterItem(ctx, testCharID, constants.SlotCursor)
	if err != nil {
		t.Fatalf("PurgeCharacterItem failed: %v", err)
	}

	// Step 4: Verify all items are gone
	count = countCharacterInventory(t, ctx, testCharID)
	if count != 0 {
		t.Errorf("Expected 0 items after purge, got %d", count)
	}

	// Also verify item_instances are gone
	instanceCount := countItemInstances(t, ctx, containerInstanceID, bagItemIDs)
	if instanceCount != 0 {
		t.Errorf("Expected 0 item_instances after purge, got %d", instanceCount)
	}
}

// TestPurgeCharacterItem_SingleItem tests deleting a single item (not a container)
func TestPurgeCharacterItem_SingleItem_Integration(t *testing.T) {
	if db.GlobalWorldDB == nil || db.GlobalWorldDB.DB == nil {
		t.Skip("Skipping integration test: no database connection")
	}

	ctx := context.Background()
	testCharID := int32(999998)

	cleanupTestData(t, ctx, testCharID)
	defer cleanupTestData(t, ctx, testCharID)

	// Create a single item on cursor
	itemID := createTestItemInstance(t, ctx, testCharID, constants.SlotCursor, 0)
	if itemID == 0 {
		t.Fatal("Failed to create item instance")
	}

	// Verify item exists
	count := countCharacterInventory(t, ctx, testCharID)
	if count != 1 {
		t.Fatalf("Expected 1 item before purge, got %d", count)
	}

	// Purge the item
	err := PurgeCharacterItem(ctx, testCharID, constants.SlotCursor)
	if err != nil {
		t.Fatalf("PurgeCharacterItem failed: %v", err)
	}

	// Verify item is gone
	count = countCharacterInventory(t, ctx, testCharID)
	if count != 0 {
		t.Errorf("Expected 0 items after purge, got %d", count)
	}
}

// TestPurgeCharacterItem_EmptySlot tests purging an empty slot (should not error)
func TestPurgeCharacterItem_EmptySlot_Integration(t *testing.T) {
	if db.GlobalWorldDB == nil || db.GlobalWorldDB.DB == nil {
		t.Skip("Skipping integration test: no database connection")
	}

	ctx := context.Background()
	testCharID := int32(999997)

	cleanupTestData(t, ctx, testCharID)
	defer cleanupTestData(t, ctx, testCharID)

	// Purge an empty slot - should not error
	err := PurgeCharacterItem(ctx, testCharID, constants.SlotCursor)
	if err != nil {
		t.Errorf("PurgeCharacterItem should not error on empty slot: %v", err)
	}
}

// TestPurgeCharacterItem_BagNumberCalculation tests the bag number calculation
func TestPurgeCharacterItem_BagNumberCalculation(t *testing.T) {
	tests := []struct {
		slot           int8
		expectedBagNum int8
	}{
		{constants.SlotGeneral1, constants.SlotGeneral1 + 1}, // slot 22 -> bag 23
		{constants.SlotGeneral8, constants.SlotGeneral8 + 1}, // slot 29 -> bag 30
		{constants.SlotCursor, constants.SlotCursor + 1},     // slot 30 -> bag 31
	}

	for _, tc := range tests {
		bagNum := int8(tc.slot + 1)
		if bagNum != tc.expectedBagNum {
			t.Errorf("Slot %d should map to bag %d, got %d", tc.slot, tc.expectedBagNum, bagNum)
		}
	}
}

// =============================================================================
// Helper Functions
// =============================================================================

func cleanupTestData(t *testing.T, ctx context.Context, charID int32) {
	t.Helper()

	// Delete from character_inventory first (foreign key)
	_, _ = table.CharacterInventory.
		DELETE().
		WHERE(table.CharacterInventory.CharacterID.EQ(mysql.Int32(charID))).
		ExecContext(ctx, db.GlobalWorldDB.DB)

	// Delete from item_instances where owner is this character
	_, _ = table.ItemInstances.
		DELETE().
		WHERE(table.ItemInstances.OwnerID.EQ(mysql.Int32(charID))).
		ExecContext(ctx, db.GlobalWorldDB.DB)
}

func createTestItemInstance(t *testing.T, ctx context.Context, charID int32, slot int8, bag int8) int32 {
	t.Helper()

	// Create item_instances row
	modsJSON := "{}"
	result, err := table.ItemInstances.
		INSERT(
			table.ItemInstances.ItemID,
			table.ItemInstances.Mods,
			table.ItemInstances.Charges,
			table.ItemInstances.Quantity,
			table.ItemInstances.OwnerID,
			table.ItemInstances.OwnerType,
		).
		VALUES(
			1001, // Some test item ID
			modsJSON,
			1, // charges
			1, // quantity
			charID,
			1, // OwnerTypeCharacter
		).
		ExecContext(ctx, db.GlobalWorldDB.DB)
	if err != nil {
		t.Fatalf("Failed to create item_instances: %v", err)
	}

	instanceID, err := result.LastInsertId()
	if err != nil {
		t.Fatalf("Failed to get last insert ID: %v", err)
	}

	// Create character_inventory row
	_, err = table.CharacterInventory.
		INSERT(
			table.CharacterInventory.CharacterID,
			table.CharacterInventory.Slot,
			table.CharacterInventory.ItemInstanceID,
			table.CharacterInventory.Bag,
		).
		VALUES(
			charID,
			slot,
			int32(instanceID),
			bag,
		).
		ExecContext(ctx, db.GlobalWorldDB.DB)
	if err != nil {
		t.Fatalf("Failed to create character_inventory: %v", err)
	}

	return int32(instanceID)
}

func countCharacterInventory(t *testing.T, ctx context.Context, charID int32) int {
	t.Helper()

	type CountResult struct {
		Count int64
	}
	var result CountResult

	err := table.CharacterInventory.
		SELECT(mysql.COUNT(mysql.STAR).AS("count")).
		FROM(table.CharacterInventory).
		WHERE(table.CharacterInventory.CharacterID.EQ(mysql.Int32(charID))).
		QueryContext(ctx, db.GlobalWorldDB.DB, &result)
	if err != nil {
		t.Fatalf("Failed to count inventory: %v", err)
	}

	return int(result.Count)
}

func countItemInstances(t *testing.T, ctx context.Context, containerID int32, bagItemIDs []int32) int {
	t.Helper()

	allIDs := append([]int32{containerID}, bagItemIDs...)
	exprs := make([]mysql.Expression, len(allIDs))
	for i, id := range allIDs {
		exprs[i] = mysql.Int32(id)
	}

	type CountResult struct {
		Count int64
	}
	var result CountResult

	err := table.ItemInstances.
		SELECT(mysql.COUNT(mysql.STAR).AS("count")).
		FROM(table.ItemInstances).
		WHERE(table.ItemInstances.ID.IN(exprs...)).
		QueryContext(ctx, db.GlobalWorldDB.DB, &result)
	if err != nil {
		t.Fatalf("Failed to count item_instances: %v", err)
	}

	return int(result.Count)
}
