package entity

import (
	"idlequest/internal/db/jetgen/eqgo/model"
)

// NPC interface - simplified for idle game.
// NPCs are not tracked live; combat NPCs are selected from DB when combat starts.
// This interface is kept minimal for potential future use.
type NPC interface {
	Mob() *Mob
	GetMob() *Mob
	NpcData() *model.NpcTypes // returns the NPC data from the database
	Level() uint8
	Class() uint8
	ID() int
	Name() string
	Say(msg string)
	Type() int32 // EntityTypePlayer, EntityTypeNPC, etc.
}
