package client

import (
	"idlequest/internal/api/opcodes"
	"idlequest/internal/session"
	entity "idlequest/internal/zone/interface"
)

type DatagramHandler func(z entity.ZoneAccess, clientSession *session.Session, payload []byte)

type HandlerRegistry struct {
	handlers map[opcodes.OpCode]DatagramHandler
}

func (c *Client) NewClientRegistry() *HandlerRegistry {
	handlers := map[opcodes.OpCode]DatagramHandler{
		opcodes.MoveItem:   c.HandleMoveItem,
		opcodes.DeleteItem: c.HandleDeleteItem,
	}
	registry := &HandlerRegistry{
		handlers: handlers,
	}
	return registry
}

func (c *Client) HandleZonePacket(z entity.ZoneAccess, session *session.Session, op opcodes.OpCode, payload []byte) {
	if h, ok := c.packetHandlers.handlers[op]; ok {
		h(z, session, payload)
	}
}
