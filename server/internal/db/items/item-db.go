package items

import (
	"encoding/json"
	"fmt"
	"log"

	"idlequest/internal/cache"
	"idlequest/internal/constants"
	"idlequest/internal/db"
	"idlequest/internal/db/jetgen/eqgo/model"
	"idlequest/internal/db/jetgen/eqgo/table"
	"idlequest/internal/mechanics"

	"github.com/go-jet/jet/v2/mysql"
	"github.com/go-jet/jet/v2/stmtcache"
	_ "github.com/go-sql-driver/mysql"
)

type SlotUpdate struct {
	ItemInstanceID int32
	FromSlot       int8
	FromBag        int8
	ToSlot         int8
	ToBag          int8
}

// IsSellable checks if an item can be sold.
// An item is sellable if:
// - (Nodrop != 0 || Fvnodrop != 0) (EITHER being non-zero means it is tradeable)
// - Norent != 0 (norent = 0 means it is a temporary/no-rent item)
// - Itemclass != 1 (itemclass 1 are containers/bags)
// - Itemtype != 14 (Food)
// - Itemtype != 15 (Drink)
func IsSellable(item model.Items) bool {
	isTradeable := item.Nodrop != 0 || item.Fvnodrop != 0
	return isTradeable && item.Norent != 0 && item.Itemclass != 1 && item.Itemtype != 14 && item.Itemtype != 15
}

// CreateItemInstance creates a new item_instances row and returns its auto-increment ID.
func CreateDBItemInstance(tx *stmtcache.Tx, itemInstance constants.ItemInstance, ownerId int32) (int32, error) {
	// 1) marshal mods JSON
	modsJSON, err := json.Marshal(itemInstance.Mods)
	if err != nil {
		return 0, fmt.Errorf("failed to marshal mods: %v", err)
	}
	modsStr := string(modsJSON)

	// 2) build and exec the INSERT
	res, err := table.ItemInstances.
		INSERT(
			table.ItemInstances.ItemID,
			table.ItemInstances.Mods,
			table.ItemInstances.Charges,
			table.ItemInstances.Quantity,
			table.ItemInstances.OwnerID,
			table.ItemInstances.OwnerType,
			// leave OwnerID and OwnerType NULL/zero here
		).
		VALUES(
			itemInstance.ItemID,
			modsStr,
			itemInstance.Charges,
			itemInstance.Quantity,
			ownerId,
			itemInstance.OwnerType,
		).
		Exec(tx)
	if err != nil {
		return 0, fmt.Errorf("failed to insert item instance: %v", err)
	}

	// 3) grab the newly assigned auto-increment ID
	lastID, err := res.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("failed to fetch last insert id: %v", err)
	}

	return int32(lastID), nil
}

func SearchItems(nameMatch string) []model.Items {
	var items []model.Items
	err := table.Items.
		SELECT(table.Items.AllColumns).
		WHERE(table.Items.Name.LIKE(mysql.String("%"+nameMatch+"%"))).LIMIT(100).
		Query(db.GlobalWorldDB.DB, &items)
	if err != nil {
		log.Printf("failed to search items by name '%s': %v", nameMatch, err)
		return nil
	}
	return items
}

// SwapItemSlots swaps (or moves) two character‐inventory slots (and all children
// if general inventory‐level), returning a slice of SlotUpdate records for
// every row that actually changed.
func SwapItemSlots(
	playerID int32, fromSlot, toSlot,
	toBagSlot, fromBagSlot int8,
	fromItem, toItem *constants.ItemWithInstance,
) (u []SlotUpdate, err error) {
	const tempSlot = -1
	tx, err := db.GlobalWorldDB.DB.Begin()
	if err != nil {
		return nil, fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		} else if err != nil {
			tx.Rollback()
		} else {
			err = tx.Commit()
		}
	}()

	// 1) Lock the two target slots for update (including bag contents where Bag = slot+1)
	// Items inside a bag at general slot N have bag = N+1
	var inv []model.CharacterInventory
	if err = table.CharacterInventory.
		SELECT(
			table.CharacterInventory.Slot,
			table.CharacterInventory.Bag,
			table.CharacterInventory.ItemInstanceID,
		).
		WHERE(
			table.CharacterInventory.CharacterID.EQ(mysql.Int32(playerID)).
				AND(
					table.CharacterInventory.Slot.IN(
						mysql.Int8(fromSlot),
						mysql.Int8(toSlot),
					).OR(
						table.CharacterInventory.Bag.IN(
							mysql.Int8(fromSlot+1),
							mysql.Int8(toSlot+1),
						),
					),
				),
		).
		FOR(mysql.UPDATE()).
		Query(tx, &inv); err != nil {
		return nil, fmt.Errorf("lock inventory rows: %w", err)
	}

	// Map existing rows by (slot, bag)
	type loc struct {
		Slot int8
		Bag  int8
	}
	baseRows := make(map[loc]model.CharacterInventory, len(inv))
	childFromRows := make(map[loc]model.CharacterInventory, len(inv))
	childToRows := make(map[loc]model.CharacterInventory, len(inv))
	fromItemId, toItemId := int32(-1), int32(-1)
	if fromItem != nil {
		fromItemId = fromItem.ItemInstanceID
	}
	if toItem != nil {
		toItemId = toItem.ItemInstanceID
	}
	for _, ci := range inv {
		// Check if this is one of the items being moved (base items)
		if ci.ItemInstanceID == fromItemId && ci.Slot == fromSlot && ci.Bag == fromBagSlot {
			baseRows[loc{ci.Slot, ci.Bag}] = ci
		} else if ci.ItemInstanceID == toItemId && ci.Slot == toSlot && ci.Bag == toBagSlot {
			baseRows[loc{ci.Slot, ci.Bag}] = ci
		} else if fromBagSlot == 0 && ci.Bag == fromSlot+1 {
			// Items inside a bag at general slot N have bag = N+1
			// So items inside bag at slot 0 have bag=1, slot 1 has bag=2, etc.
			childFromRows[loc{ci.Slot, ci.Bag}] = ci
		} else if toBagSlot == 0 && ci.Bag == toSlot+1 {
			// Items inside a bag at general slot N have bag = N+1
			childToRows[loc{ci.Slot, ci.Bag}] = ci
		}
	}
	fromRow, hasFrom := baseRows[loc{fromSlot, fromBagSlot}]
	toRow, hasTo := baseRows[loc{toSlot, toBagSlot}]

	// 2) Handle the four move/swap cases
	switch {
	case !hasFrom && !hasTo:
		// nothing to do

	case hasFrom && !hasTo:
		// simple move: fromSlot → toSlot
		if _, err = table.CharacterInventory.
			UPDATE(table.CharacterInventory.Slot, table.CharacterInventory.Bag).
			SET(mysql.Int8(toSlot), mysql.Int8(toBagSlot)).
			WHERE(
				table.CharacterInventory.CharacterID.EQ(mysql.Int32(playerID)).
					AND(table.CharacterInventory.ItemInstanceID.EQ(mysql.Int32(fromRow.ItemInstanceID))),
			).
			Exec(tx); err != nil {
			return nil, fmt.Errorf("move fromSlot→toSlot: %w", err)
		}

	case !hasFrom && hasTo:
		// simple move: toSlot → fromSlot
		if _, err = table.CharacterInventory.
			UPDATE(table.CharacterInventory.Slot, table.CharacterInventory.Bag).
			SET(mysql.Int8(fromSlot), mysql.Int8(fromBagSlot)).
			WHERE(
				table.CharacterInventory.CharacterID.EQ(mysql.Int32(playerID)).
					AND(table.CharacterInventory.ItemInstanceID.EQ(mysql.Int32(toRow.ItemInstanceID))),
			).
			Exec(tx); err != nil {
			return nil, fmt.Errorf("move toSlot→fromSlot: %w", err)
		}

	default: // hasFrom && hasTo → full swap via temp

		// a) stash toSlot occupant → tempSlot
		if _, err = table.CharacterInventory.
			UPDATE(table.CharacterInventory.Slot).
			SET(mysql.Int32(tempSlot)).
			WHERE(
				table.CharacterInventory.CharacterID.EQ(mysql.Int32(playerID)).
					AND(table.CharacterInventory.ItemInstanceID.EQ(mysql.Int32(toRow.ItemInstanceID))),
			).
			Exec(tx); err != nil {
			return nil, fmt.Errorf("stash toSlot→tempSlot: %w", err)
		}

		// b) move fromSlot → toSlot
		if _, err = table.CharacterInventory.
			UPDATE(table.CharacterInventory.Slot, table.CharacterInventory.Bag).
			SET(mysql.Int8(toSlot), mysql.Int8(toBagSlot)).
			WHERE(
				table.CharacterInventory.CharacterID.EQ(mysql.Int32(playerID)).
					AND(table.CharacterInventory.ItemInstanceID.EQ(mysql.Int32(fromRow.ItemInstanceID))),
			).
			Exec(tx); err != nil {
			return nil, fmt.Errorf("move fromSlot→toSlot: %w", err)
		}
		// c) restore tempSlot → fromSlot
		if _, err = table.CharacterInventory.
			UPDATE(table.CharacterInventory.Slot, table.CharacterInventory.Bag).
			SET(mysql.Int8(fromSlot), mysql.Int8(fromRow.Bag)).
			WHERE(
				table.CharacterInventory.CharacterID.EQ(mysql.Int32(playerID)).
					AND(table.CharacterInventory.ItemInstanceID.EQ(mysql.Int32(toRow.ItemInstanceID))),
			).
			Exec(tx); err != nil {
			return nil, fmt.Errorf("restore tempSlot→fromSlot: %w", err)
		}
	}

	childFromRowLength, childToRowLength := len(childFromRows), len(childToRows)

	// Allocate with exact capacity. Updates will always contain items
	// So we can preallocate the slice
	updates := make([]SlotUpdate, 0, 1+childFromRowLength+childToRowLength)
	updates = append(updates, SlotUpdate{
		ItemInstanceID: fromRow.ItemInstanceID,
		FromSlot:       fromSlot,
		FromBag:        fromBagSlot,
		ToSlot:         toSlot,
		ToBag:          toBagSlot,
	})

	// Defer allocation with make until we know if we have children
	var fromChildIDs, toChildIDs []mysql.Expression
	if childFromRowLength > 0 || childToRowLength > 0 {
		fromChildIDs = make([]mysql.Expression, 0, childFromRowLength)
		toChildIDs = make([]mysql.Expression, 0, childToRowLength)
		for _, c := range childFromRows {
			fromChildIDs = append(fromChildIDs, mysql.Int32(c.ItemInstanceID))
			updates = append(updates, SlotUpdate{
				ItemInstanceID: c.ItemInstanceID,
				FromSlot:       fromSlot,
				FromBag:        c.Bag,
				ToSlot:         toSlot,
				ToBag:          c.Bag,
			})
		}
		for _, c := range childToRows {
			toChildIDs = append(toChildIDs, mysql.Int32(c.ItemInstanceID))
			existingEntry := false
			for _, u := range updates {
				if u.FromSlot == fromSlot && u.ToSlot == toSlot && u.FromBag == c.Bag && u.ToBag == c.Bag {
					existingEntry = true
					break
				}
			}
			if !existingEntry {
				updates = append(updates, SlotUpdate{
					ItemInstanceID: c.ItemInstanceID,
					FromSlot:       fromSlot,
					FromBag:        c.Bag,
					ToSlot:         toSlot,
					ToBag:          c.Bag,
				})
			}
		}
	}

	if fromItem.IsContainer() && toItem.IsContainer() {
		if len(fromChildIDs) > 0 || len(toChildIDs) > 0 {
			// Items inside a bag at general slot N have bag = N+1
			// When swapping bags, update child items' bag numbers accordingly
			if len(toChildIDs) > 0 {
				if _, err = table.CharacterInventory.
					UPDATE(table.CharacterInventory.Bag).
					SET(mysql.Int32(tempSlot)).
					WHERE(
						table.CharacterInventory.CharacterID.EQ(mysql.Int32(playerID)).
							AND(table.CharacterInventory.ItemInstanceID.IN(toChildIDs...)),
					).
					Exec(tx); err != nil {
					return nil, fmt.Errorf("stash to‐slot children→temp: %w", err)
				}
			}

			if len(fromChildIDs) > 0 {
				newBagNum := toSlot + 1
				if _, err = table.CharacterInventory.
					UPDATE(table.CharacterInventory.Bag).
					SET(mysql.Int8(newBagNum)).
					WHERE(
						table.CharacterInventory.CharacterID.EQ(mysql.Int32(playerID)).
							AND(table.CharacterInventory.ItemInstanceID.IN(fromChildIDs...)),
					).
					Exec(tx); err != nil {
					return nil, fmt.Errorf("move from‐slot children→to: %w", err)
				}
			}

			if len(toChildIDs) > 0 {
				newBagNum := fromSlot + 1
				if _, err = table.CharacterInventory.
					UPDATE(table.CharacterInventory.Bag).
					SET(mysql.Int8(newBagNum)).
					WHERE(
						table.CharacterInventory.CharacterID.EQ(mysql.Int32(playerID)).
							AND(table.CharacterInventory.ItemInstanceID.IN(toChildIDs...)),
					).
					Exec(tx); err != nil {
					return nil, fmt.Errorf("restore temp→from‐slot children: %w", err)
				}
			}

		}
	} else if fromItem.IsContainer() {
		if len(fromChildIDs) > 0 {
			// Items inside a bag at general slot N have bag = N+1
			// When moving bag from slot X to slot Y, update child items' bag from X+1 to Y+1
			newBagNum := toSlot + 1
			if _, err = table.CharacterInventory.
				UPDATE(table.CharacterInventory.Bag).
				SET(mysql.Int8(newBagNum)).
				WHERE(
					table.CharacterInventory.CharacterID.EQ(mysql.Int32(playerID)).
						AND(table.CharacterInventory.ItemInstanceID.IN(fromChildIDs...)),
				).
				Exec(tx); err != nil {
				return nil, fmt.Errorf("move child fromSlot→toSlot: %w", err)
			}
		}
	} else if toItem.IsContainer() {
		if len(toChildIDs) > 0 {
			if _, err = table.CharacterInventory.
				UPDATE(table.CharacterInventory.Slot).
				SET(mysql.Int8(fromSlot)).
				WHERE(
					table.CharacterInventory.CharacterID.EQ(mysql.Int32(playerID)).
						AND(table.CharacterInventory.Bag.GT(mysql.Int8(0))).
						AND(table.CharacterInventory.Slot.EQ(mysql.Int8(toSlot))),
				).
				Exec(tx); err != nil {
				return nil, fmt.Errorf("move child toSlot->fromSlot: %w", err)
			}
		}
	}

	return updates, nil
}
func AddItemToPlayerInventoryFreeSlot(itemInstance constants.ItemInstance, playerID int32) (int8, int8, int32, error) {
	tx, err := db.GlobalWorldDB.DB.Begin()
	if err != nil {
		return 0, 0, 0, fmt.Errorf("begin tx: %v", err)
	}
	// if we ever return a non‐nil err, roll back
	defer func() {
		if err != nil {
			tx.Rollback()
		}
	}()
	// 1) create the item_instance
	itemInstanceID, err := CreateDBItemInstance(tx, itemInstance, playerID)
	if err != nil {
		return 0, 0, 0, fmt.Errorf("create item instance: %v", err)
	}

	// 2) move it onto the character
	if _, err = table.ItemInstances.
		UPDATE(table.ItemInstances.OwnerID, table.ItemInstances.OwnerType).
		SET(mysql.Int32(playerID), constants.OwnerTypeCharacter).
		WHERE(table.ItemInstances.ID.EQ(mysql.Int32(itemInstanceID))).
		Exec(tx); err != nil {
		return 0, 0, 0, fmt.Errorf("move item instance: %v", err)
	}

	// 3) lock all *currently* occupied slots (gap‐lock them)
	var occupied []model.CharacterInventory
	if err = table.CharacterInventory.
		SELECT(table.CharacterInventory.Bag, table.CharacterInventory.Slot).
		WHERE(table.CharacterInventory.CharacterID.EQ(mysql.Int32(playerID))).
		FOR(mysql.UPDATE()). // ← here's the magic
		Query(tx, &occupied); err != nil {
		return 0, 0, 0, fmt.Errorf("lock occupied slots: %v", err)
	}

	// Build a map of occupied slots keyed by (bag, slot)
	type bagSlotKey struct {
		bag  int8
		slot int8
	}
	used := map[bagSlotKey]bool{}
	for _, ci := range occupied {
		used[bagSlotKey{int8(ci.Bag), int8(ci.Slot)}] = true
	}

	// General inventory: bag=0, slot=22-29 (General1 through General8)
	// Equipment slots are 0-21, general inventory is 22-29, cursor is 30
	freeSlot := int8(-1)
	freeBag := int8(0) // General inventory bag
	for slot := int8(constants.SlotGeneral1); slot <= int8(constants.SlotGeneral8); slot++ {
		if !used[bagSlotKey{0, slot}] {
			freeSlot = slot
			break
		}
	}

	// If no free general slot, use cursor (bag=0, slot=30)
	if freeSlot < 0 {
		freeSlot = int8(constants.SlotCursor)
	}

	if _, err = table.CharacterInventory.
		INSERT(
			table.CharacterInventory.CharacterID,
			table.CharacterInventory.Slot,
			table.CharacterInventory.ItemInstanceID,
			table.CharacterInventory.Bag,
		).
		VALUES(
			playerID,
			freeSlot,
			itemInstanceID,
			freeBag,
		).
		Exec(tx); err != nil {
		return 0, 0, 0, fmt.Errorf("insert inventory row: %v", err)
	}

	if err = tx.Commit(); err != nil {
		return 0, 0, 0, fmt.Errorf("commit tx: %v", err)
	}

	// Return bag and slot (bag=0 for general, slot=0-7 or 30 for cursor)
	return freeBag, freeSlot, itemInstanceID, nil
}

func MoveItemInPlayerInventory(itemInstanceId int32, playerId int32, slot int32) error {
	stmt := table.ItemInstances.
		UPDATE(table.ItemInstances.OwnerID, table.ItemInstances.OwnerType).
		SET(playerId, constants.OwnerTypeCharacter).
		WHERE(table.ItemInstances.ID.EQ(mysql.Int32(itemInstanceId)))

	if _, err := stmt.Exec(db.GlobalWorldDB.DB); err != nil {
		return fmt.Errorf("failed to move item instance: %v", err)
	}

	stmt = table.CharacterInventory.
		UPDATE(table.CharacterInventory.Slot).
		SET(slot).
		WHERE(table.CharacterInventory.ItemInstanceID.EQ(mysql.Int32(itemInstanceId)))

	if _, err := stmt.Exec(db.GlobalWorldDB.DB); err != nil {
		return fmt.Errorf("failed to update inventory slot: %v", err)
	}

	return nil
}

// GetItemInstanceByID retrieves an item instance (with caching) and its associated item
func GetItemInstanceByID(guid int32) (constants.ItemInstance, error) {
	cacheKey := fmt.Sprintf("iteminstance:guid:%d", guid)
	if val, found, err := cache.GetCache().Get(cacheKey); err == nil && found {
		if inst, ok := val.(constants.ItemInstance); ok {
			return inst, nil
		}
	}

	var jetInstance model.ItemInstances
	stmt := table.ItemInstances.
		SELECT(table.ItemInstances.AllColumns).
		WHERE(table.ItemInstances.ID.EQ(mysql.Int32(guid)))

	err := stmt.Query(db.GlobalWorldDB.DB, &jetInstance)
	if err != nil {
		return constants.ItemInstance{}, fmt.Errorf("failed to query item instance: %v", err)
	}

	var mods constants.Mods
	if jetInstance.Mods != nil {
		if err := json.Unmarshal([]byte(*jetInstance.Mods), &mods); err != nil {
			return constants.ItemInstance{}, fmt.Errorf("failed to unmarshal mods: %v", err)
		}
	}

	item, err := GetItemTemplateByID(jetInstance.ID)
	if err != nil {
		return constants.ItemInstance{}, err
	}

	inst := constants.ItemInstance{
		Item:      item,
		ID:        jetInstance.ID,
		ItemID:    jetInstance.ItemID,
		Mods:      mods,
		Charges:   jetInstance.Charges,
		Quantity:  jetInstance.Quantity,
		OwnerID:   jetInstance.OwnerID,
		OwnerType: constants.OwnerType(jetInstance.OwnerType),
	}

	// Cache the instance
	cache.GetCache().Set(cacheKey, inst)

	return inst, nil
}

// UpdateItemInstance updates fields of an existing item instance
func UpdateItemInstance(instance constants.ItemInstance) error {
	// Prepare mods JSON
	modsJSON, err := json.Marshal(instance.Mods)
	if err != nil {
		return fmt.Errorf("failed to marshal mods: %v", err)
	}
	modsStr := string(modsJSON)

	// Perform update
	stmt := table.ItemInstances.
		UPDATE(
			table.ItemInstances.Mods,
			table.ItemInstances.Charges,
			table.ItemInstances.Quantity,
			table.ItemInstances.OwnerID,
			table.ItemInstances.OwnerType,
		).
		SET(
			modsStr,
			instance.Charges,
			instance.Quantity,
			instance.OwnerID,
			instance.OwnerType,
		).
		WHERE(table.ItemInstances.ID.EQ(mysql.Int32(instance.ID)))

	if _, err := stmt.Exec(db.GlobalWorldDB.DB); err != nil {
		return fmt.Errorf("failed to update item instance: %v", err)
	}

	// Invalidate cache
	cacheKey := fmt.Sprintf("iteminstance:guid:%d", instance.ID)
	cache.GetCache().Delete(cacheKey)

	return nil
}

// FindFirstAvailableSlot finds the first empty inventory or bag slot.
// If isContainer is true, it only checks general slots (bag 0) to prevent nested containers.
func FindFirstAvailableSlot(items map[constants.InventoryKey]*constants.ItemWithInstance, isContainer bool) (bag int8, slot int8) {
	// 1. Check general slots (bag 0, slots 22-29)
	for s := int8(constants.SlotGeneral1); s <= int8(constants.SlotGeneral8); s++ {
		key := constants.InventoryKey{Bag: 0, Slot: s}
		if items[key] == nil {
			return 0, s
		}
	}

	// 2. Check inside bags (only if the item being placed is NOT a container)
	if !isContainer {
		for s := int8(constants.SlotGeneral1); s <= int8(constants.SlotGeneral8); s++ {
			container := items[constants.InventoryKey{Bag: 0, Slot: s}]
			if container != nil && container.IsContainer() {
				bagID := s + 1
				for slotIdx := int8(0); slotIdx < int8(container.Item.Bagslots); slotIdx++ {
					key := constants.InventoryKey{Bag: bagID, Slot: slotIdx}
					if items[key] == nil {
						return bagID, slotIdx
					}
				}
			}
		}
	}

	// No room in general inventory or bags!
	return -1, -1
}

// SoldItemInfo contains information about an item that was auto-sold
type SoldItemInfo struct {
	ItemName string
	Platinum int
	Gold     int
	Silver   int
	Copper   int
}

// AutoSellAllInventoryItems finds and sells all eligible items in the player's general inventory or bags.
// Returns the consolidated sold item info, or nil if no items could be sold.
// Also removes the items from the DB and the currentItems map.
func AutoSellAllInventoryItems(
	playerID int32,
	currentItems map[constants.InventoryKey]*constants.ItemWithInstance,
) (*SoldItemInfo, error) {
	totalCopper := 0
	itemsSold := []string{}

	// Helper to sell one item
	sellOne := func(key constants.InventoryKey, item *constants.ItemWithInstance) error {
		price := int(item.Item.Price)
		totalCopper += price
		itemsSold = append(itemsSold, item.Item.Name)

		// Remove from DB
		_, err := table.CharacterInventory.
			DELETE().
			WHERE(
				table.CharacterInventory.CharacterID.EQ(mysql.Int32(playerID)).
					AND(table.CharacterInventory.ItemInstanceID.EQ(mysql.Int32(item.ItemInstanceID))),
			).
			Exec(db.GlobalWorldDB.DB)
		if err != nil {
			return err
		}

		// Remove from memory map
		delete(currentItems, key)
		return nil
	}

	// 1. Check general inventory slots (22-29) first
	for s := int8(constants.SlotGeneral1); s <= int8(constants.SlotGeneral8); s++ {
		key := constants.InventoryKey{Bag: 0, Slot: s}
		item := currentItems[key]
		if item != nil && IsSellable(item.Item) {
			if err := sellOne(key, item); err != nil {
				return nil, fmt.Errorf("failed to sell item %s: %v", item.Item.Name, err)
			}
		}
	}

	// 2. Check inside bags
	for s := int8(constants.SlotGeneral1); s <= int8(constants.SlotGeneral8); s++ {
		container := currentItems[constants.InventoryKey{Bag: 0, Slot: s}]
		if container != nil && container.IsContainer() {
			bagID := s + 1
			for slotIdx := int8(0); slotIdx < int8(container.Item.Bagslots); slotIdx++ {
				key := constants.InventoryKey{Bag: bagID, Slot: slotIdx}
				item := currentItems[key]
				if item != nil && IsSellable(item.Item) {
					if err := sellOne(key, item); err != nil {
						return nil, fmt.Errorf("failed to sell item %s from bag: %v", item.Item.Name, err)
					}
				}
			}
		}
	}

	if len(itemsSold) == 0 {
		return nil, fmt.Errorf("no sellable items found")
	}

	summaryName := fmt.Sprintf("%d items", len(itemsSold))
	if len(itemsSold) == 1 {
		summaryName = itemsSold[0]
	}

	log.Printf("Bulk Auto-sold %d items for character %d, total value: %d copper", len(itemsSold), playerID, totalCopper)

	return &SoldItemInfo{
		ItemName: summaryName,
		Platinum: totalCopper / 1000,
		Gold:     (totalCopper % 1000) / 100,
		Silver:   (totalCopper % 100) / 10,
		Copper:   totalCopper % 10,
	}, nil
}

// sellAndRemoveItem performs the DB deletion and returns the sold item info.
func sellAndRemoveItem(
	playerID int32,
	key constants.InventoryKey,
	item *constants.ItemWithInstance,
	currentItems map[constants.InventoryKey]*constants.ItemWithInstance,
) (*SoldItemInfo, error) {
	// Calculate currency from price
	price := int(item.Item.Price)
	platinum := price / 1000
	gold := (price % 1000) / 100
	silver := (price % 100) / 10
	copper := price % 10

	// Remove from DB
	_, err := table.CharacterInventory.
		DELETE().
		WHERE(
			table.CharacterInventory.CharacterID.EQ(mysql.Int32(playerID)).
				AND(table.CharacterInventory.ItemInstanceID.EQ(mysql.Int32(item.ItemInstanceID))),
		).
		Exec(db.GlobalWorldDB.DB)
	if err != nil {
		return nil, fmt.Errorf("failed to delete item from inventory: %v", err)
	}

	// Remove from memory map
	delete(currentItems, key)

	log.Printf("Auto-sold item %s (ID=%d) for %dp %dg %ds %dc", item.Item.Name, item.ItemInstanceID, platinum, gold, silver, copper)

	return &SoldItemInfo{
		ItemName: item.Item.Name,
		Platinum: platinum,
		Gold:     gold,
		Silver:   silver,
		Copper:   copper,
	}, nil
}

// ProcessAutoLoot determines where to put a looted item (equip, upgrade, or inventory) and performs the DB update.
// Returns a list of slot updates (including the new item), the new item's instance ID, any sold item info, and any error.
func ProcessAutoLoot(
	playerID int32,
	classID int,
	raceID int,
	currentItems map[constants.InventoryKey]*constants.ItemWithInstance,
	itemTemplate model.Items,
	charges uint8,
	autoSellEnabled bool,
) ([]SlotUpdate, int32, *SoldItemInfo, error) {
	// Wrap newItem for helper methods
	newItemWithInstance := &constants.ItemWithInstance{Item: itemTemplate}

	targetBag := int8(0)
	targetSlot := int8(-1)
	isUpgrade := false
	var oldItem *constants.ItemWithInstance

	// Step 1: Check if equippable
	if newItemWithInstance.IsEquippable(constants.RaceID(raceID), uint8(classID)) {
		// Check if primary slot has a 2H weapon (blocks secondary slot)
		primaryItem := currentItems[constants.InventoryKey{Bag: 0, Slot: int8(constants.SlotPrimary)}]
		primaryHas2H := primaryItem != nil && primaryItem.IsType2H()

		var equippableSlots []int8
		for s := int8(0); s <= 30; s++ {
			if newItemWithInstance.AllowedInSlot(s) && constants.IsEquipSlot(s) {
				// Skip secondary slot if primary has a 2H weapon
				if s == int8(constants.SlotSecondary) && primaryHas2H {
					continue
				}
				equippableSlots = append(equippableSlots, s)
			}
		}

		// A. Try empty equipment slots
		for _, s := range equippableSlots {
			if currentItems[constants.InventoryKey{Bag: 0, Slot: s}] == nil {
				targetSlot = s
				break
			}
		}

		// B. Check for upgrades if no empty slots found
		if targetSlot == -1 {
			newScore := mechanics.GetItemScore(&itemTemplate, classID)
			bestSlot := int8(-1)
			maxDiff := 0

			for _, s := range equippableSlots {
				existing := currentItems[constants.InventoryKey{Bag: 0, Slot: s}]
				if existing != nil {
					existingScore := mechanics.GetItemScore(&existing.Item, classID)
					diff := newScore - existingScore
					if diff > maxDiff {
						maxDiff = diff
						bestSlot = s
					}
				}
			}

			if bestSlot != -1 {
				targetSlot = bestSlot
				isUpgrade = true
				oldItem = currentItems[constants.InventoryKey{Bag: 0, Slot: bestSlot}]
			}
		}
	}

	// Step 2: If not equipped/upgraded, find free inventory/bag slot
	if targetSlot == -1 {
		targetBag, targetSlot = FindFirstAvailableSlot(currentItems, itemTemplate.Bagslots > 0)
	}

	// No slot found even after checking bags and cursor
	if targetSlot == -1 {
		// If auto-sell is enabled, try to sell items to make room
		if autoSellEnabled {
			soldInfo, sellErr := AutoSellAllInventoryItems(playerID, currentItems)
			if sellErr != nil {
				return nil, 0, nil, fmt.Errorf("inventory is full and no sellable items found")
			}
			// Try to find a slot again after selling
			targetBag, targetSlot = FindFirstAvailableSlot(currentItems, itemTemplate.Bagslots > 0)
			if targetSlot == -1 {
				return nil, 0, soldInfo, fmt.Errorf("inventory still full after auto-selling all qualifying items")
			}
			// Continue below with the slot we found, passing soldInfo through
			return finishProcessAutoLoot(playerID, currentItems, itemTemplate, charges, targetBag, targetSlot, false, nil, soldInfo)
		}
		return nil, 0, nil, fmt.Errorf("inventory is full")
	}

	return finishProcessAutoLoot(playerID, currentItems, itemTemplate, charges, targetBag, targetSlot, isUpgrade, oldItem, nil)
}

// finishProcessAutoLoot performs the DB operations for ProcessAutoLoot
func finishProcessAutoLoot(
	playerID int32,
	currentItems map[constants.InventoryKey]*constants.ItemWithInstance,
	itemTemplate model.Items,
	charges uint8,
	targetBag int8,
	targetSlot int8,
	isUpgrade bool,
	oldItem *constants.ItemWithInstance,
	soldInfo *SoldItemInfo,
) ([]SlotUpdate, int32, *SoldItemInfo, error) {
	newItemWithInstance := &constants.ItemWithInstance{Item: itemTemplate}

	// Step 3: Execute DB operations
	var err error
	tx, err := db.GlobalWorldDB.DB.Begin()
	if err != nil {
		return nil, 0, soldInfo, fmt.Errorf("begin tx: %v", err)
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			tx.Commit()
		}
	}()

	var updates []SlotUpdate

	// If equipping a 2H weapon to primary slot and secondary has an item, block the action
	if targetSlot == int8(constants.SlotPrimary) && newItemWithInstance.IsType2H() {
		secondaryItem := currentItems[constants.InventoryKey{Bag: 0, Slot: int8(constants.SlotSecondary)}]
		if secondaryItem != nil {
			return nil, 0, soldInfo, fmt.Errorf("You cannot equip a two-handed weapon while holding an item in your off-hand.")
		}
	}

	// Handle upgrade/swap
	if isUpgrade && oldItem != nil {
		// Find home for old item
		freeBag, freeSlot := FindFirstAvailableSlot(currentItems, oldItem.IsContainer())
		// Update old item in DB
		_, err = table.CharacterInventory.
			UPDATE(table.CharacterInventory.Bag, table.CharacterInventory.Slot).
			SET(mysql.Int8(freeBag), mysql.Int8(freeSlot)).
			WHERE(
				table.CharacterInventory.CharacterID.EQ(mysql.Int32(playerID)).
					AND(table.CharacterInventory.ItemInstanceID.EQ(mysql.Int32(oldItem.ItemInstanceID))),
			).
			Exec(tx)
		if err != nil {
			return nil, 0, soldInfo, fmt.Errorf("failed to move old item: %v", err)
		}

		// Add to updates list
		updates = append(updates, SlotUpdate{
			ItemInstanceID: oldItem.ItemInstanceID,
			FromSlot:       targetSlot,
			FromBag:        0,
			ToSlot:         freeSlot,
			ToBag:          freeBag,
		})

		// Update old item in memory map
		oldKey := constants.InventoryKey{Bag: 0, Slot: targetSlot}
		newKey := constants.InventoryKey{Bag: freeBag, Slot: freeSlot}
		delete(currentItems, oldKey)
		currentItems[newKey] = oldItem
	}

	// Create new item instance
	instance := constants.ItemInstance{
		ItemID:    itemTemplate.ID,
		Charges:   charges,
		Quantity:  1,
		OwnerType: constants.OwnerTypeCharacter,
	}
	instanceID, err := CreateDBItemInstance(tx, instance, playerID)
	if err != nil {
		return nil, 0, soldInfo, fmt.Errorf("create item instance: %v", err)
	}

	// Add to inventory
	_, err = table.CharacterInventory.
		INSERT(
			table.CharacterInventory.CharacterID,
			table.CharacterInventory.Slot,
			table.CharacterInventory.ItemInstanceID,
			table.CharacterInventory.Bag,
		).
		VALUES(
			playerID,
			targetSlot,
			instanceID,
			targetBag,
		).
		Exec(tx)
	if err != nil {
		return nil, 0, soldInfo, fmt.Errorf("insert inventory row: %v", err)
	}

	// Add new item to updates list
	updates = append(updates, SlotUpdate{
		ItemInstanceID: instanceID,
		FromSlot:       -1, // New item
		FromBag:        0,
		ToSlot:         targetSlot,
		ToBag:          targetBag,
	})

	// Update memory map for new item
	newItem := &constants.ItemWithInstance{
		Item:           itemTemplate,
		ItemInstanceID: instanceID,
		Instance:       instance,
	}
	currentItems[constants.InventoryKey{Bag: targetBag, Slot: targetSlot}] = newItem

	return updates, instanceID, soldInfo, nil
}
