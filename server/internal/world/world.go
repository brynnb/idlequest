package world

import (
	"encoding/binary"
	"log"

	"idlequest/internal/session"
)

// WorldHandler manages global message routing.
// Simplified for idle game - no ZoneManager or ZoneInstance needed.
type WorldHandler struct {
	sessionManager *session.SessionManager
	globalRegistry *HandlerRegistry
}

// NewWorldHandler creates a new WorldHandler.
func NewWorldHandler(sessionManager *session.SessionManager) *WorldHandler {
	registry := NewWorldOpCodeRegistry()
	wh := &WorldHandler{
		sessionManager: sessionManager,
		globalRegistry: registry,
	}
	registry.WH = wh
	return wh
}

// HandlePacket processes incoming datagrams.
// All handlers are now at the world level - no zone routing needed.
func (wh *WorldHandler) HandlePacket(ses *session.Session, data []byte) {
	if len(data) < 2 {
		return
	}

	// All opcodes are handled globally now
	if wh.globalRegistry.ShouldHandleGlobally(data) {
		wh.globalRegistry.HandleWorldPacket(ses, data)
		return
	}

	// Unknown opcode
	if !ses.Authenticated {
		op := binary.LittleEndian.Uint16(data[:2])
		log.Printf("unauthenticated opcode %d from session %d – dropping", op, ses.SessionID)
		return
	}

	op := binary.LittleEndian.Uint16(data[:2])
	log.Printf("unhandled opcode %d from session %d", op, ses.SessionID)
}

// RemoveSession cleans up session data.
func (wh *WorldHandler) RemoveSession(sessionID int) {
	wh.sessionManager.RemoveSession(sessionID)
}

// Shutdown is a no-op now - no zone instances to stop.
func (wh *WorldHandler) Shutdown() {
	// No-op: No zone instances to shut down
}
