package db_character

import (
	"context"
	"encoding/json"
	"fmt"
	"slices"
	"strconv"
	"strings"

	"idlequest/internal/cache"
	"idlequest/internal/constants"
	"idlequest/internal/db"
	"idlequest/internal/db/items"
	"idlequest/internal/db/jetgen/eqgo/model"
	"idlequest/internal/db/jetgen/eqgo/table"
	entity "idlequest/internal/zone/interface"

	"github.com/go-jet/jet/v2/mysql"
	_ "github.com/go-sql-driver/mysql"
)

// GetCharacterByName loads character data from the database.
// NOTE: We intentionally do NOT cache character data because:
// 1. Active sessions use the Client object as the authoritative source of truth
// 2. Caching mutable data caused staleness issues (HP reset bugs)
// 3. Character data is only loaded on login/zone-in, not frequently
func GetCharacterByName(name string) (*model.CharacterData, error) {
	var character model.CharacterData
	ctx := context.Background()
	err := table.CharacterData.
		SELECT(table.CharacterData.AllColumns).
		FROM(table.CharacterData).
		WHERE(
			table.CharacterData.Name.EQ(mysql.String(name)).
				AND(table.CharacterData.DeletedAt.IS_NULL()),
		).
		QueryContext(ctx, db.GlobalWorldDB.DB, &character)
	if err != nil {
		return nil, fmt.Errorf("query character_data: %w", err)
	}

	return &character, nil
}

// GetCharacterByID loads character data from the database by ID.
// NOTE: We intentionally do NOT cache character data - see GetCharacterByName for reasoning.
func GetCharacterByID(id int32) (*model.CharacterData, error) {
	var character model.CharacterData
	ctx := context.Background()
	err := table.CharacterData.
		SELECT(table.CharacterData.AllColumns).
		FROM(table.CharacterData).
		WHERE(
			table.CharacterData.ID.EQ(mysql.Int32(id)).
				AND(table.CharacterData.DeletedAt.IS_NULL()),
		).
		QueryContext(ctx, db.GlobalWorldDB.DB, &character)
	if err != nil {
		return nil, fmt.Errorf("query character_data by id: %w", err)
	}

	return &character, nil
}

func GetCharacterSkills(ctx context.Context, characterID int64) ([]model.CharacterSkills, error) {
	var skills []model.CharacterSkills
	if err := table.CharacterSkills.
		SELECT(
			table.CharacterSkills.SkillID,
			table.CharacterSkills.Value,
		).
		FROM(table.CharacterSkills).
		WHERE(table.CharacterSkills.ID.EQ(mysql.Int64(characterID))).
		QueryContext(ctx, db.GlobalWorldDB.DB, &skills); err != nil {
		return nil, fmt.Errorf("query character skills: %w", err)
	}
	return skills, nil
}

// UpdateCharacter saves character data to the database.
// NOTE: We don't cache mutable character data - see GetCharacterByName for reasoning.
// We do still invalidate character select cache since that's a list display.
func UpdateCharacter(charData *model.CharacterData, accountID int64) error {
	// Invalidate character select cache to ensure the list display is up-to-date
	charSelectCacheKey := fmt.Sprintf("account:characters:%d", accountID)
	cache.GetCache().Delete(charSelectCacheKey)

	stmt := table.CharacterData.
		UPDATE(
			table.CharacterData.ZoneID,
			table.CharacterData.ZoneInstance,
			table.CharacterData.X,
			table.CharacterData.Y,
			table.CharacterData.Z,
			table.CharacterData.Heading,
			table.CharacterData.Level,
			table.CharacterData.Exp,
			table.CharacterData.CurHp,
			table.CharacterData.Mana,
			table.CharacterData.Endurance,
			table.CharacterData.HungerLevel,
			table.CharacterData.ThirstLevel,
			table.CharacterData.AaPoints,
			table.CharacterData.AaPointsSpent,
			table.CharacterData.AaExp,
			table.CharacterData.TimePlayed,
			table.CharacterData.LastLogin,
		).
		SET(
			charData.ZoneID,
			charData.ZoneInstance,
			charData.X,
			charData.Y,
			charData.Z,
			charData.Heading,
			charData.Level,
			charData.Exp,
			charData.CurHp,
			charData.Mana,
			charData.Endurance,
			charData.HungerLevel,
			charData.ThirstLevel,
			charData.AaPoints,
			charData.AaPointsSpent,
			charData.AaExp,
			charData.TimePlayed,
			charData.LastLogin,
		).
		WHERE(table.CharacterData.ID.EQ(mysql.Int32(int32(charData.ID))))

	if result, err := stmt.Exec(db.GlobalWorldDB.DB); err != nil {
		return fmt.Errorf("failed to update character: %v", err)
	} else {
		fmt.Println("UpdateCharacter result:", result)
	}
	return nil
}

func GetCharacterItems(ctx context.Context, id int) ([]constants.ItemWithSlot, error) {
	var charItems []constants.ItemWithSlot
	stmt := table.ItemInstances.
		SELECT(
			table.ItemInstances.ID.AS("ItemInstanceID"),
			table.ItemInstances.AllColumns,
			table.CharacterInventory.AllColumns,
		).
		FROM(table.ItemInstances.LEFT_JOIN(
			table.CharacterInventory,
			table.CharacterInventory.ItemInstanceID.
				EQ(table.ItemInstances.ID),
		)).
		WHERE(
			table.ItemInstances.OwnerID.EQ(mysql.Int(int64(id))),
		)

	if err := stmt.QueryContext(ctx, db.GlobalWorldDB.DB, &charItems); err != nil {
		return nil, fmt.Errorf("query character items: %w", err)
	}

	return charItems, nil
}

func InstantiateStartingItems(race, classID, deity, zone int32) ([]constants.ItemInstance, error) {
	// 1) load them all
	var raw []model.StartingItems
	if err := table.StartingItems.
		SELECT(table.StartingItems.AllColumns).
		FROM(table.StartingItems).
		Query(db.GlobalWorldDB.DB, &raw); err != nil {
		return nil, err
	}

	// 2) filter
	var out []constants.ItemInstance
	wildcard := "0"

	for _, e := range raw {
		// split only once
		cls := []string{wildcard}
		if e.ClassList != nil && *e.ClassList != "" {
			cls = strings.Split(*e.ClassList, "|")
		}
		dts := []string{wildcard}
		if e.DeityList != nil && *e.DeityList != "" {
			dts = strings.Split(*e.DeityList, "|")
		}
		rcs := []string{wildcard}
		if e.RaceList != nil && *e.RaceList != "" {
			rcs = strings.Split(*e.RaceList, "|")
		}
		zns := []string{wildcard}
		if e.ZoneIDList != nil && *e.ZoneIDList != "" {
			zns = strings.Split(*e.ZoneIDList, "|")
		}

		// if first element != "0", enforce membership
		if cls[0] != wildcard && !slices.Contains(cls, strconv.Itoa(int(classID))) {
			continue
		}
		if dts[0] != wildcard && !slices.Contains(dts, strconv.Itoa(int(deity))) {
			continue
		}
		if rcs[0] != wildcard && !slices.Contains(rcs, strconv.Itoa(int(race))) {
			continue
		}
		if zns[0] != wildcard && !slices.Contains(zns, strconv.Itoa(int(zone))) {
			continue
		}

		// pass → instantiate
		inst := items.CreateItemInstanceFromTemplateID(int32(e.ItemID))
		if inst == nil {
			return nil, fmt.Errorf("failed to create item instance for itemID %d", e.ItemID)
		}
		inst.Quantity = uint8(e.ItemCharges)

		out = append(out, *inst)
	}

	return out, nil
}

func PurgeCharacterEquipment(ctx context.Context, charID int32) error {

	// 1) delete only those item_instances that are in equipment slots for this character
	subQ := table.CharacterInventory.
		SELECT(table.CharacterInventory.ItemInstanceID).
		FROM(table.CharacterInventory).
		WHERE(
			table.CharacterInventory.CharacterID.EQ(mysql.Int32(charID)).
				AND(table.CharacterInventory.Bag.EQ(mysql.Int8(-1))),
		)

	if _, err := table.ItemInstances.
		DELETE().
		WHERE(table.ItemInstances.ID.IN(subQ)).
		ExecContext(ctx, db.GlobalWorldDB.DB); err != nil {
		return fmt.Errorf("delete equipped instances for char %d: %w", charID, err)
	}

	if _, err := table.CharacterInventory.
		DELETE().
		WHERE(
			table.CharacterInventory.CharacterID.EQ(mysql.Int32(charID)).
				AND(table.CharacterInventory.Bag.EQ(mysql.Int8(-1))),
		).
		ExecContext(ctx, db.GlobalWorldDB.DB); err != nil {
		return fmt.Errorf("delete character_inventory for char %d: %w", charID, err)
	}

	return nil
}

func PurgeCharacterItems(ctx context.Context, charID int32) error {
	// 1) delete all item_instances that are not equipped
	if _, err := table.ItemInstances.
		DELETE().
		WHERE(
			table.ItemInstances.OwnerID.EQ(mysql.Int32(charID)).
				AND(table.ItemInstances.OwnerType.EQ(mysql.Int8(int8(constants.OwnerTypeCharacter)))).
				AND(table.ItemInstances.ID.NOT_IN(
					table.CharacterInventory.SELECT(table.CharacterInventory.ItemInstanceID).
						FROM(table.CharacterInventory).
						WHERE(table.CharacterInventory.CharacterID.EQ(mysql.Int32(charID))),
				)),
		).
		ExecContext(ctx, db.GlobalWorldDB.DB); err != nil {
		return fmt.Errorf("delete non-equipped instances for char %d: %w", charID, err)
	}

	// 2) delete all character_inventory rows for this character
	if _, err := table.CharacterInventory.
		DELETE().
		WHERE(table.CharacterInventory.CharacterID.EQ(mysql.Int32(charID))).
		ExecContext(ctx, db.GlobalWorldDB.DB); err != nil {
		return fmt.Errorf("delete character_inventory for char %d: %w", charID, err)
	}

	return nil
}

func PurgeCharacterItem(ctx context.Context, charID int32, slot int8) error {
	bagNum := int8(slot + 1)

	// 1) select item_instance IDs for the item itself AND anything inside it (if it's a container)
	subQ := table.CharacterInventory.
		SELECT(table.CharacterInventory.ItemInstanceID).
		FROM(table.CharacterInventory).
		WHERE(
			table.CharacterInventory.CharacterID.EQ(mysql.Int32(charID)).
				AND(
					table.CharacterInventory.Bag.EQ(mysql.Int8(0)).AND(table.CharacterInventory.Slot.EQ(mysql.Int8(slot))).
						OR(table.CharacterInventory.Bag.EQ(mysql.Int8(bagNum))),
				),
		)

	if _, err := table.ItemInstances.
		DELETE().
		WHERE(table.ItemInstances.ID.IN(subQ)).
		ExecContext(ctx, db.GlobalWorldDB.DB); err != nil {
		return fmt.Errorf("delete instances for char %d at slot %d (and bag %d): %w", charID, slot, bagNum, err)
	}

	// 2) delete the inventory rows
	if _, err := table.CharacterInventory.
		DELETE().
		WHERE(
			table.CharacterInventory.CharacterID.EQ(mysql.Int32(charID)).
				AND(
					table.CharacterInventory.Bag.EQ(mysql.Int8(0)).AND(table.CharacterInventory.Slot.EQ(mysql.Int8(slot))).
						OR(table.CharacterInventory.Bag.EQ(mysql.Int8(bagNum))),
				),
		).
		ExecContext(ctx, db.GlobalWorldDB.DB); err != nil {
		return fmt.Errorf("delete character_inventory for char %d at slot %d (and bag %d): %w", charID, slot, bagNum, err)
	}

	return nil
}

func GearUp(c entity.Client) error {
	tx, err := db.GlobalWorldDB.DB.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		} else if err != nil {
			_ = tx.Rollback()
		} else {
			err = tx.Commit()
		}
	}()
	var raw []model.ToolGearupArmorSets
	if err := table.ToolGearupArmorSets.
		SELECT(table.ToolGearupArmorSets.AllColumns).
		FROM(table.ToolGearupArmorSets).
		WHERE(
			table.ToolGearupArmorSets.Class.EQ(mysql.Int32(int32(c.Class()))).AND(
				table.ToolGearupArmorSets.Level.EQ(mysql.Int32(int32(c.Level()))),
			),
		).
		Query(db.GlobalWorldDB.DB, &raw); err != nil {
		return err
	}
	slotsFilled := map[int8]bool{
		constants.SlotHead:      false,
		constants.SlotHands:     false,
		constants.SlotFeet:      false,
		constants.SlotChest:     false,
		constants.SlotArms:      false,
		constants.SlotLegs:      false,
		constants.SlotWrist1:    false,
		constants.SlotWrist2:    false,
		constants.SlotPrimary:   false,
		constants.SlotSecondary: false,
		constants.SlotCursor:    false,
		constants.SlotEar1:      false,
		constants.SlotEar2:      false,
		constants.SlotNeck:      false,
		constants.SlotShoulders: false,
		constants.SlotBack:      false,
		constants.SlotRange:     false,
		constants.SlotFinger1:   false,
		constants.SlotFinger2:   false,
		constants.SlotWaist:     false,
		constants.SlotAmmo:      false,
	}

	for _, e := range raw {

		if e.Slot == nil || e.ItemID == nil {
			continue
		}
		slot := *e.Slot
		if slot < 0 || slot > 23 {
			continue
		}
		if slot == constants.SlotWrist1 && slotsFilled[constants.SlotWrist1] {
			slot = constants.SlotWrist2
		}
		if slot == constants.SlotEar1 && slotsFilled[constants.SlotEar1] {
			slot = constants.SlotEar2
		}
		if slot == constants.SlotFinger1 && slotsFilled[constants.SlotFinger1] {
			slot = constants.SlotFinger2
		}

		if slotsFilled[slot] {
			continue
		}

		inst := items.CreateItemInstanceFromTemplateID(int32(*e.ItemID))
		if inst == nil {
			continue
		}
		itemInstanceId, err := items.CreateDBItemInstance(tx, *inst, int32(c.ID()))
		if err != nil {
			return fmt.Errorf("failed to insert item instance for itemID %d: %w", *e.ItemID, err)
		}
		slotsFilled[slot] = true
		key := constants.InventoryKey{
			Bag:  -1, // -1 means no bag, i.e. equipped
			Slot: slot,
		}
		c.Items()[key] = &constants.ItemWithInstance{
			Item:           inst.Item,
			Instance:       *inst,
			BagSlot:        -1,
			ItemInstanceID: itemInstanceId,
		}

		if _, err2 := table.CharacterInventory.
			INSERT(
				table.CharacterInventory.CharacterID,
				table.CharacterInventory.Slot,
				table.CharacterInventory.ItemInstanceID,
				table.CharacterInventory.Bag,
			).
			VALUES(
				mysql.Int32(int32(c.ID())),
				mysql.Int32(int32(slot)),
				mysql.Int32(itemInstanceId),
				mysql.Int8(-1),
			).
			ON_DUPLICATE_KEY_UPDATE(
				table.CharacterInventory.ItemInstanceID.SET(mysql.Int32(inst.ID)),
				table.CharacterInventory.Bag.SET(mysql.Int8(-1)),
			).
			Exec(tx); err2 != nil {
			return fmt.Errorf("upserting inventory for slot %d: %w", slot, err2)
		}
	}

	return nil
}

// UpdateCharacterItems writes every non-nil slot in c.Items() into
//  1. item_instances  (inserting if ID<=0, updating otherwise) and
//  2. character_inventory (delete all then re-insert to match in-memory state)
//
// All in one TX so the FK is never broken.
func UpdateCharacterItems(ctx context.Context, c entity.Client) (err error) {
	// 1) begin TX
	tx, err := db.GlobalWorldDB.DB.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			_ = tx.Rollback()
			panic(p)
		} else if err != nil {
			_ = tx.Rollback()
		} else {
			err = tx.Commit()
		}
	}()

	charID := int32(c.ID())

	// 2) Delete all existing inventory rows for this character
	// This ensures the DB matches the in-memory state exactly
	if _, err = tx.Exec("DELETE FROM character_inventory WHERE character_id = ?", charID); err != nil {
		return fmt.Errorf("clearing inventory: %w", err)
	}

	for itemSlot, wi := range c.Items() {
		if wi == nil {
			// slot empty: we skip (or you could DELETE the inventory row here if you like)
			continue
		}

		inst := &wi.Instance

		// 2a) if new instance, INSERT and grab its ID
		if wi.ItemInstanceID <= 0 {
			newID, err2 := items.CreateDBItemInstance(tx, *inst, charID)
			if err2 != nil {
				return fmt.Errorf("inserting new instance for slot %d: %w", itemSlot, err2)
			}
			wi.ItemInstanceID = newID
			inst.ID = newID
		} else {
			// 2b) existing instance → UPDATE mods/quantity/owner
			modsJSON, err2 := json.Marshal(inst.Mods)
			if err2 != nil {
				return fmt.Errorf("marshal mods for inst %d: %w", inst.ID, err2)
			}
			if _, err2 = table.ItemInstances.
				UPDATE(
					table.ItemInstances.Mods,
					table.ItemInstances.Charges,
					table.ItemInstances.Quantity,
					table.ItemInstances.OwnerID,
					table.ItemInstances.OwnerType,
				).
				SET(
					string(modsJSON),
					inst.Charges,
					inst.Quantity,
					mysql.Int32(charID),
					constants.OwnerTypeCharacter,
				).
				WHERE(table.ItemInstances.ID.EQ(mysql.Int32(inst.ID))).
				Exec(tx); err2 != nil {
				return fmt.Errorf("updating instance %d: %w", inst.ID, err2)
			}
		}

		// 3) Insert inventory row using the key's bag and slot values
		// Since we deleted all rows first, we just INSERT (no need for ON_DUPLICATE_KEY_UPDATE)
		if _, err2 := table.CharacterInventory.
			INSERT(
				table.CharacterInventory.CharacterID,
				table.CharacterInventory.Bag,
				table.CharacterInventory.Slot,
				table.CharacterInventory.ItemInstanceID,
			).
			VALUES(
				mysql.Int32(charID),
				mysql.Int8(itemSlot.Bag),
				mysql.Int8(itemSlot.Slot),
				mysql.Int32(inst.ID),
			).
			Exec(tx); err2 != nil {
			return fmt.Errorf("inserting inventory for bag=%d slot=%d: %w", itemSlot.Bag, itemSlot.Slot, err2)
		}
	}

	return nil
}

// GetCharacterBind retrieves the character's bind point (slot 0 is primary bind)
func GetCharacterBind(ctx context.Context, charID uint32) (*model.CharacterBind, error) {
	var bind model.CharacterBind
	err := table.CharacterBind.
		SELECT(table.CharacterBind.AllColumns).
		FROM(table.CharacterBind).
		WHERE(
			table.CharacterBind.ID.EQ(mysql.Uint32(charID)).
				AND(table.CharacterBind.Slot.EQ(mysql.Int32(0))),
		).
		QueryContext(ctx, db.GlobalWorldDB.DB, &bind)
	if err != nil {
		return nil, fmt.Errorf("query character bind: %w", err)
	}
	return &bind, nil
}

// UpdateCharacterBind updates the character's primary bind point (slot 0)
func UpdateCharacterBind(ctx context.Context, charID uint32, zoneID uint16, x, y, z, heading float64) error {
	// Try to update existing bind
	result, err := table.CharacterBind.
		UPDATE(
			table.CharacterBind.ZoneID,
			table.CharacterBind.X,
			table.CharacterBind.Y,
			table.CharacterBind.Z,
			table.CharacterBind.Heading,
		).
		SET(
			zoneID,
			x,
			y,
			z,
			heading,
		).
		WHERE(
			table.CharacterBind.ID.EQ(mysql.Uint32(charID)).
				AND(table.CharacterBind.Slot.EQ(mysql.Int32(0))),
		).
		ExecContext(ctx, db.GlobalWorldDB.DB)
	if err != nil {
		return fmt.Errorf("update character bind: %w", err)
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		// No existing bind, insert new one
		_, err = table.CharacterBind.
			INSERT(
				table.CharacterBind.ID,
				table.CharacterBind.Slot,
				table.CharacterBind.ZoneID,
				table.CharacterBind.X,
				table.CharacterBind.Y,
				table.CharacterBind.Z,
				table.CharacterBind.Heading,
			).
			VALUES(
				charID,
				0, // slot 0 is primary bind
				zoneID,
				x,
				y,
				z,
				heading,
			).
			ExecContext(ctx, db.GlobalWorldDB.DB)
		if err != nil {
			return fmt.Errorf("insert character bind: %w", err)
		}
	}
	return nil
}

// DeleteItemInstance deletes an item instance from the database
func DeleteItemInstance(ctx context.Context, itemInstanceID int32) error {
	// First delete from character_inventory
	_, err := table.CharacterInventory.
		DELETE().
		WHERE(table.CharacterInventory.ItemInstanceID.EQ(mysql.Int32(itemInstanceID))).
		ExecContext(ctx, db.GlobalWorldDB.DB)
	if err != nil {
		return fmt.Errorf("delete from character_inventory: %w", err)
	}

	// Then delete the item instance itself
	_, err = table.ItemInstances.
		DELETE().
		WHERE(table.ItemInstances.ID.EQ(mysql.Int32(itemInstanceID))).
		ExecContext(ctx, db.GlobalWorldDB.DB)
	if err != nil {
		return fmt.Errorf("delete from item_instances: %w", err)
	}

	return nil
}

// AddCurrency adds currency to a character's on-person currency (platinum, gold, silver, copper)
func AddCurrency(ctx context.Context, charID int32, platinum, gold, silver, copper int) error {
	// Use raw SQL for atomic update with addition
	query := `
		INSERT INTO character_currency (id, platinum, gold, silver, copper)
		VALUES (?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
			platinum = platinum + VALUES(platinum),
			gold = gold + VALUES(gold),
			silver = silver + VALUES(silver),
			copper = copper + VALUES(copper)
	`
	_, err := db.GlobalWorldDB.DB.ExecContext(ctx, query, charID, platinum, gold, silver, copper)
	if err != nil {
		return fmt.Errorf("add currency for char %d: %w", charID, err)
	}
	return nil
}

// GetCharacterCurrency retrieves the character's currency from character_currency table
func GetCharacterCurrency(ctx context.Context, charID uint32) (*model.CharacterCurrency, error) {
	var results []model.CharacterCurrency
	err := table.CharacterCurrency.
		SELECT(table.CharacterCurrency.AllColumns).
		WHERE(table.CharacterCurrency.ID.EQ(mysql.Uint32(charID))).
		QueryContext(ctx, db.GlobalWorldDB.DB, &results)

	if err != nil || len(results) == 0 {
		// If no row exists yet, return default empty currency
		return &model.CharacterCurrency{ID: charID}, nil
	}

	return &results[0], nil
}
