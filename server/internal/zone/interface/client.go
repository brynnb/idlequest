package entity

import (
	"idlequest/internal/constants"
	"idlequest/internal/db/jetgen/eqgo/model"
)

// Client defines the minimal methods Session needs.
type Client interface {
	Level() uint8
	Class() uint8
	Race() uint8
	Position() MobPosition
	Items() map[constants.InventoryKey]*constants.ItemWithInstance
	WithItems(caller func(map[constants.InventoryKey]*constants.ItemWithInstance))
	SetPosition(MobPosition)
	SetVelocity(Velocity)
	CanEquipItem(item *constants.ItemWithInstance) bool
	UpdateStats()
	CharData() *model.CharacterData
	Mob() *Mob
	GetMob() *Mob
	ID() int
	Name() string
	Say(msg string)
	Type() int32 // EntityTypePlayer, EntityTypeNPC, etc.
	GetEquippedAC() int

	// Inventory manipulation methods
	MoveItem(fromKey, toKey constants.InventoryKey) error
	SwapItems(fromKey, toKey constants.InventoryKey) error
	DeleteItem(key constants.InventoryKey) *constants.ItemWithInstance
	GetItem(key constants.InventoryKey) *constants.ItemWithInstance
	SetItem(key constants.InventoryKey, item *constants.ItemWithInstance)

	// HP/Mana management - these sync both charData and mob atomically
	SetCurrentHp(hp int)
	SetCurrentMana(mana int)
	GetCurrentHp() int
	GetCurrentMana() int
	GetMaxHp() int
	GetMaxMana() int
	TakeDamage(damage int) (newHp int, alive bool)
	HealDamage(amount int) int
	RestoreToFull()

	// Auto-sell state
	AutoSellEnabled() bool
	SetAutoSellEnabled(enabled bool)
}
