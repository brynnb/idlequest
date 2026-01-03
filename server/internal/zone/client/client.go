package client

import (
	"context"
	"encoding/json"
	"log"
	"sync"

	"idlequest/internal/constants"
	db_character "idlequest/internal/db/character"
	"idlequest/internal/db/items"
	"idlequest/internal/db/jetgen/eqgo/model"
	entity "idlequest/internal/zone/interface"
)

var _ entity.Client = (*Client)(nil)

type Client struct {
	mob            entity.Mob
	items          map[constants.InventoryKey]*constants.ItemWithInstance
	itemsMu        sync.RWMutex
	packetHandlers *HandlerRegistry
	charData       *model.CharacterData
	ConnectionID   string
}

func (c *Client) Items() map[constants.InventoryKey]*constants.ItemWithInstance {
	return c.items
}

// GetEquippedAC returns the cached AC value from equipped items
func (c *Client) GetEquippedAC() int {
	return c.mob.AC
}

// calculateEquippedAC sums the AC values from all equipped items
func (c *Client) calculateEquippedAC() int {
	c.itemsMu.RLock()
	defer c.itemsMu.RUnlock()

	totalAC := 0
	// Equipment slots are 0-21 (SlotCharm through SlotAmmo)
	for key, item := range c.items {
		// Only count items in equipment slots (bag == -1 or bag == 0 with slot < 22)
		if key.Bag == -1 || (key.Bag == 0 && key.Slot >= 0 && key.Slot <= 21) {
			if item != nil {
				totalAC += int(item.Item.Ac)
			}
		}
	}
	return totalAC
}

func (c *Client) WithItems(caller func(map[constants.InventoryKey]*constants.ItemWithInstance)) {
	c.itemsMu.RLock()
	defer c.itemsMu.RUnlock()
	caller(c.items)
}

func NewClient(charData *model.CharacterData) (entity.Client, error) {
	client := &Client{
		charData: charData,
		items:    make(map[constants.InventoryKey]*constants.ItemWithInstance),
		itemsMu:  sync.RWMutex{},
	}
	client.packetHandlers = client.NewClientRegistry()
	client.mob.CurrentHp = int(charData.CurHp)
	client.mob.DataSource = client

	// In values for ctor
	client.mob.CurrentHp = int(charData.CurHp)
	client.mob.CurrentMana = int(charData.Mana)

	// Inventory
	log.Printf("=== NewClient: Loading inventory for character ID=%d, Name=%s ===", charData.ID, charData.Name)
	charItems, err := db_character.GetCharacterItems(context.Background(), int(charData.ID))
	if err != nil {
		log.Printf("failed to get character items for character %d: %v", charData.ID, err)
		return nil, err

	}
	log.Printf("=== NewClient: Found %d items for character ID=%d ===", len(charItems), charData.ID)
	for _, item := range charItems {
		itemTemplate, err := items.GetItemTemplateByID(item.ItemID)
		if err != nil {
			log.Printf("failed to get item template for itemID %d: %v", item.ItemID, err)
			continue
		}
		itemInstance := items.CreateItemInstanceFromTemplateID(item.ItemID)
		itemInstance.Quantity = item.Quantity
		itemInstance.Charges = item.Charges
		itemInstance.ItemID = item.ItemID
		itemInstance.ID = item.ItemInstanceID
		json.Unmarshal([]byte(*item.Mods), &itemInstance.Mods)
		itemWithTemplate := &constants.ItemWithInstance{
			Item:           itemTemplate,
			Instance:       *itemInstance,
			BagSlot:        item.Bag,
			ItemInstanceID: item.ItemInstanceID,
		}
		key := constants.InventoryKey{
			Bag:  item.Bag,
			Slot: item.Slot,
		}
		client.items[key] = itemWithTemplate
	}

	client.CalcBonuses()

	return client, nil
}

func (c *Client) CanEquipItem(item *constants.ItemWithInstance) bool {
	if item == nil {
		return false
	}
	if item.Item.Slots == 0 {
		return false
	}
	if item.Instance.OwnerType != constants.OwnerTypeCharacter {
		return false
	}

	return item.IsEquippable(constants.RaceID(c.Race()), c.Class())
}

func (c *Client) Race() uint8 {
	return uint8(c.charData.Race)
}

func (c *Client) UpdateStats() {
	// Remember old max HP to detect increases
	oldMaxHp := c.mob.MaxHp

	// Recalculate all bonuses (this updates MaxHp, MaxMana, etc.)
	c.CalcBonuses()

	// If MaxHp increased (e.g. from equipping HP-boosting gear),
	// heal the player by the difference. This is more intuitive for an idle game.
	if c.mob.MaxHp > oldMaxHp && oldMaxHp > 0 {
		hpIncrease := c.mob.MaxHp - oldMaxHp
		c.mob.CurrentHp += hpIncrease
		c.charData.CurHp = uint32(c.mob.CurrentHp)
	}

	// Clamp current HP/Mana to max
	if c.mob.CurrentHp > c.mob.MaxHp {
		c.mob.CurrentHp = c.mob.MaxHp
		c.charData.CurHp = uint32(c.mob.MaxHp)
	}
	if c.mob.CurrentMana > c.mob.MaxMana {
		c.mob.CurrentMana = c.mob.MaxMana
		c.charData.Mana = uint32(c.mob.MaxMana)
	}
}

func (c *Client) CharData() *model.CharacterData {
	return c.charData
}

func (c *Client) Name() string {
	if c.charData == nil {
		return ""
	}
	return c.charData.Name
}

func (c *Client) Say(msg string) {

}

func (c *Client) Type() int32 {
	return entity.EntityTypePlayer
}

func (c *Client) ID() int {
	if c.charData == nil {
		return 0
	}
	return int(c.charData.ID)
}

func (c *Client) Mob() *entity.Mob {
	return &c.mob
}

func (c *Client) GetMob() *entity.Mob {
	return &c.mob
}

func (c *Client) Level() uint8 {
	return uint8(c.CharData().Level)
}

func (c *Client) Class() uint8 {
	return uint8(c.CharData().Class)
}

func (c *Client) Position() entity.MobPosition {
	return entity.MobPosition{
		X:       c.charData.X,
		Y:       c.charData.Y,
		Z:       c.charData.Z,
		Heading: c.charData.Heading,
	}
}

func (c *Client) SetPosition(pos entity.MobPosition) {
	c.charData.X = pos.X
	c.charData.Y = pos.Y
	c.charData.Z = pos.Z
	c.charData.Heading = pos.Heading
}

func (c *Client) SetVelocity(vel entity.Velocity) {
	c.mob.SetVelocity(vel)
}

// SetCurrentHp sets the current HP in both charData and mob atomically.
// This is the preferred way to modify HP to prevent state desync.
func (c *Client) SetCurrentHp(hp int) {
	if hp < 0 {
		hp = 0
	}
	if hp > c.mob.MaxHp {
		hp = c.mob.MaxHp
	}
	c.charData.CurHp = uint32(hp)
	c.mob.CurrentHp = hp
}

// SetCurrentMana sets the current Mana in both charData and mob atomically.
// This is the preferred way to modify Mana to prevent state desync.
func (c *Client) SetCurrentMana(mana int) {
	if mana < 0 {
		mana = 0
	}
	if mana > c.mob.MaxMana {
		mana = c.mob.MaxMana
	}
	c.charData.Mana = uint32(mana)
	c.mob.CurrentMana = mana
}

// GetCurrentHp returns the current HP (from mob, which should be in sync with charData).
func (c *Client) GetCurrentHp() int {
	return c.mob.CurrentHp
}

// GetCurrentMana returns the current Mana (from mob, which should be in sync with charData).
func (c *Client) GetCurrentMana() int {
	return c.mob.CurrentMana
}

// GetMaxHp returns the calculated max HP including all bonuses.
func (c *Client) GetMaxHp() int {
	return c.mob.MaxHp
}

// GetMaxMana returns the calculated max Mana including all bonuses.
func (c *Client) GetMaxMana() int {
	return c.mob.MaxMana
}

// TakeDamage reduces HP by the given amount and returns the new HP.
// Returns true if the character is still alive.
func (c *Client) TakeDamage(damage int) (newHp int, alive bool) {
	newHp = c.mob.CurrentHp - damage
	if newHp < 0 {
		newHp = 0
	}
	c.SetCurrentHp(newHp)
	return newHp, newHp > 0
}

// HealDamage increases HP by the given amount, capped at max HP.
func (c *Client) HealDamage(amount int) int {
	newHp := c.mob.CurrentHp + amount
	if newHp > c.mob.MaxHp {
		newHp = c.mob.MaxHp
	}
	c.SetCurrentHp(newHp)
	return newHp
}

// RestoreToFull sets HP and Mana to their maximum values.
func (c *Client) RestoreToFull() {
	c.SetCurrentHp(c.mob.MaxHp)
	c.SetCurrentMana(c.mob.MaxMana)
}
