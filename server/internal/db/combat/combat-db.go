package combat

import (
	"context"
	"fmt"
	"math/rand"

	"idlequest/internal/db"
	"idlequest/internal/db/jetgen/eqgo/model"
	"idlequest/internal/db/jetgen/eqgo/table"

	"github.com/go-jet/jet/v2/mysql"
)

// MoneyDrop represents money dropped by an NPC
type MoneyDrop struct {
	Platinum int
	Gold     int
	Silver   int
	Copper   int
}

// NPCForCombat contains the NPC data needed for combat
type NPCForCombat struct {
	ID          int32
	Name        string
	Level       uint8
	HP          int64
	AC          int16
	MinDmg      uint32
	MaxDmg      uint32
	AttackDelay uint8
	LoottableID uint32
}

// LootDropItem represents an item that can drop from an NPC
type LootDropItem struct {
	ItemID      int32
	Name        string
	Chance      float64
	ItemCharges int32
	Icon        int32
}

// LoottableCurrency contains the currency drop info from a loottable
type LoottableCurrency struct {
	Mincash uint32
	Maxcash uint32
	Avgcoin uint32
}

// GetRandomNPCForZone selects a random NPC from the zone appropriate for the player's level
func GetRandomNPCForZone(ctx context.Context, zoneShortName string, playerLevel int, levelRange int) (*NPCForCombat, error) {
	minLevel := playerLevel - levelRange
	if minLevel < 1 {
		minLevel = 1
	}
	maxLevel := playerLevel + levelRange

	// Query NPCs that spawn in this zone within level range
	// Join spawn2 (spawnlocation) -> spawnentry -> npc_types
	var npcs []model.NpcTypes

	stmt := table.NpcTypes.
		SELECT(
			table.NpcTypes.ID,
			table.NpcTypes.Name,
			table.NpcTypes.Level,
			table.NpcTypes.Hp,
			table.NpcTypes.Ac,
			table.NpcTypes.Mindmg,
			table.NpcTypes.Maxdmg,
			table.NpcTypes.AttackDelay,
			table.NpcTypes.LoottableID,
		).
		FROM(
			table.NpcTypes.
				INNER_JOIN(table.Spawnentry, table.Spawnentry.NpcID.EQ(table.NpcTypes.ID)).
				INNER_JOIN(table.Spawngroup, table.Spawngroup.ID.EQ(table.Spawnentry.SpawngroupID)).
				INNER_JOIN(table.Spawn2, table.Spawn2.SpawngroupID.EQ(table.Spawngroup.ID)),
		).
		WHERE(
			table.Spawn2.Zone.EQ(mysql.String(zoneShortName)).
				AND(table.NpcTypes.Level.GT_EQ(mysql.Int32(int32(minLevel)))).
				AND(table.NpcTypes.Level.LT_EQ(mysql.Int32(int32(maxLevel)))).
				AND(table.NpcTypes.Hp.GT(mysql.Int64(0))), // Must have HP
		).
		DISTINCT()

	if err := stmt.Query(db.GlobalWorldDB.DB, &npcs); err != nil {
		return nil, fmt.Errorf("failed to query NPCs for zone %s: %w", zoneShortName, err)
	}

	if len(npcs) == 0 {
		return nil, fmt.Errorf("no NPCs found in zone %s for level range %d-%d", zoneShortName, minLevel, maxLevel)
	}

	// Pick a random NPC
	selected := npcs[rand.Intn(len(npcs))]

	return &NPCForCombat{
		ID:          selected.ID,
		Name:        selected.Name,
		Level:       selected.Level,
		HP:          selected.Hp,
		AC:          selected.Ac,
		MinDmg:      selected.Mindmg,
		MaxDmg:      selected.Maxdmg,
		AttackDelay: selected.AttackDelay,
		LoottableID: selected.LoottableID,
	}, nil
}

// GetNPCLoot retrieves potential loot items for an NPC based on their loottable_id
// Returns items with their drop chances - caller should roll for each
func GetNPCLoot(ctx context.Context, loottableID uint32) ([]LootDropItem, error) {
	if loottableID == 0 {
		return nil, nil // No loot table
	}

	// Query the loot chain: loottable_entries -> lootdrop_entries -> items
	type lootResult struct {
		ItemID      int32   `alias:"items.id"`
		Name        string  `alias:"items.name"`
		Chance      float64 `alias:"lootdrop_entries.chance"`
		Probability float64 `alias:"loottable_entries.probability"`
		ItemCharges int32   `alias:"lootdrop_entries.item_charges"`
		Icon        int32   `alias:"items.icon"`
	}

	var results []lootResult

	stmt := mysql.SELECT(
		table.Items.ID.AS("items.id"),
		table.Items.Name.AS("items.name"),
		table.LootdropEntries.Chance.AS("lootdrop_entries.chance"),
		table.LoottableEntries.Probability.AS("loottable_entries.probability"),
		table.LootdropEntries.ItemCharges.AS("lootdrop_entries.item_charges"),
		table.Items.Icon.AS("items.icon"),
	).FROM(
		table.LoottableEntries.
			INNER_JOIN(table.LootdropEntries, table.LootdropEntries.LootdropID.EQ(table.LoottableEntries.LootdropID)).
			INNER_JOIN(table.Items, table.Items.ID.EQ(table.LootdropEntries.ItemID)),
	).WHERE(
		table.LoottableEntries.LoottableID.EQ(mysql.Int32(int32(loottableID))),
	)

	if err := stmt.Query(db.GlobalWorldDB.DB, &results); err != nil {
		return nil, fmt.Errorf("failed to query loot for loottable %d: %w", loottableID, err)
	}

	items := make([]LootDropItem, len(results))
	for i, r := range results {
		// Combined chance = (lootdrop chance / 100) * loottable probability
		// EQ logic: loottable_entries.probability is chance of the whole lootdrop group.
		// lootdrop_entries.chance is the chance of that specific item within the group.
		combinedChance := r.Chance
		if r.Probability > 0 && r.Probability < 100 {
			combinedChance = (r.Chance * r.Probability) / 100.0
		}

		items[i] = LootDropItem{
			ItemID:      r.ItemID,
			Name:        r.Name,
			Chance:      combinedChance,
			ItemCharges: r.ItemCharges,
			Icon:        r.Icon,
		}
	}

	return items, nil
}

// RollLoot takes potential loot items and rolls for each, returning items that dropped
func RollLoot(potentialLoot []LootDropItem) []LootDropItem {
	var dropped []LootDropItem

	for _, item := range potentialLoot {
		// Roll 0-100, if less than chance, item drops
		roll := rand.Float64() * 100
		if roll < item.Chance {
			dropped = append(dropped, item)
		}
	}

	return dropped
}

// CalculateExperience calculates XP gained from killing an NPC
// Based on EQEmu formula: (level * level * 75 * 35) / 10
func CalculateExperience(npcLevel int) int {
	return (npcLevel * npcLevel * 75 * 35) / 10
}

// GetLoottableCurrency retrieves the currency drop info for a loottable
func GetLoottableCurrency(ctx context.Context, loottableID uint32) (*LoottableCurrency, error) {
	if loottableID == 0 {
		return nil, nil
	}

	var loottables []model.Loottable
	stmt := table.Loottable.SELECT(
		table.Loottable.Mincash,
		table.Loottable.Maxcash,
		table.Loottable.Avgcoin,
	).WHERE(
		table.Loottable.ID.EQ(mysql.Uint32(loottableID)),
	)

	if err := stmt.Query(db.GlobalWorldDB.DB, &loottables); err != nil {
		return nil, fmt.Errorf("failed to query loottable currency for %d: %w", loottableID, err)
	}

	if len(loottables) == 0 {
		return nil, nil
	}

	lt := loottables[0]
	return &LoottableCurrency{
		Mincash: lt.Mincash,
		Maxcash: lt.Maxcash,
		Avgcoin: lt.Avgcoin,
	}, nil
}

// GenerateCurrencyDrop generates a random currency drop between mincash and maxcash
// Returns platinum, gold, silver, copper
func GenerateCurrencyDrop(currency *LoottableCurrency) (platinum, gold, silver, copper int) {
	if currency == nil || currency.Maxcash == 0 {
		return 0, 0, 0, 0
	}

	// Generate random amount between mincash and maxcash (in copper)
	var totalCopper int
	if currency.Maxcash > currency.Mincash {
		totalCopper = int(currency.Mincash) + rand.Intn(int(currency.Maxcash-currency.Mincash)+1)
	} else {
		totalCopper = int(currency.Mincash)
	}

	// Convert copper to platinum/gold/silver/copper
	platinum = totalCopper / 1000
	totalCopper %= 1000
	gold = totalCopper / 100
	totalCopper %= 100
	silver = totalCopper / 10
	copper = totalCopper % 10

	return platinum, gold, silver, copper
}
