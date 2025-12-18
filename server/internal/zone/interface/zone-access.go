package entity

import (
	"idlequest/internal/constants"
	"idlequest/internal/db/jetgen/eqgo/model"
)

// ZoneAccess provides read-only, thread-safe access to zone state.
// Simplified for idle game - no live NPC tracking.
type ZoneAccess interface {
	// Basic zone info
	GetZone() *model.Zone
	GetZoneID() int
	GetInstanceID() int

	// Clients
	Clients() []Client
	ClientBySession(sessionID int) (Client, bool)
	ClientByEntity(entityID int) (Client, bool)

	// NPCs - stub methods, NPCs not tracked live in idle game
	NPCs() []NPC
	NPCByID(npcID int) (NPC, bool)
	NPCByName(name string) (NPC, bool)

	// Entities (players only in idle game)
	ZoneEntities() []Entity
	EntityByID(id int) (Entity, bool)

	// Messaging
	BroadcastChannel(sender string, channelID int, msg string)
	BroadcastServer(msg string)
	BroadcastWearChange(sender int, slot int8, item *constants.ItemWithInstance)
}
