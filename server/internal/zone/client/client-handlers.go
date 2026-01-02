package client

import (
	"context"
	"log"

	eq "idlequest/internal/api/capnp"
	"idlequest/internal/api/opcodes"
	"idlequest/internal/constants"
	db_character "idlequest/internal/db/character"
	"idlequest/internal/db/items"
	"idlequest/internal/session"
	entity "idlequest/internal/zone/interface"
)

func (c *Client) HandleMoveItem(z entity.ZoneAccess, ses *session.Session, payload []byte) {
	req, err := session.Deserialize(ses, payload, eq.ReadRootMoveItem)
	if err != nil {
		log.Printf("failed to read MoveItem request: %v", err)
		return
	}

	fromSlot := int8(req.FromSlot())
	toSlot := int8(req.ToSlot())
	fromBag := int8(req.FromBagSlot())
	toBag := int8(req.ToBagSlot())
	fromKey := constants.InventoryKey{
		Bag:  int8(fromBag),
		Slot: fromSlot,
	}
	toKey := constants.InventoryKey{
		Bag:  int8(toBag),
		Slot: toSlot,
	}

	fromItem := ses.Client.Items()[fromKey]
	toItem := ses.Client.Items()[toKey]

	if !fromItem.AllowedInSlot(toSlot) {
		log.Printf("from item not allowed in to slot %d", toSlot)
		return
	}
	if !toItem.AllowedInSlot(fromSlot) {
		log.Printf("to item not allowed in slot %d", fromSlot)
		return
	}
	if toBag > 0 && fromItem.IsContainer() {
		log.Printf("cannot move container item %d to bag %d", fromItem.Instance.ItemID, toBag)
		return
	}
	if fromBag > 0 && toItem.IsContainer() {
		log.Printf("cannot move container item %d to bag %d", toItem.Instance.ItemID, fromBag)
		return
	}
	if constants.IsEquipSlot(toSlot) && fromItem != nil && !c.CanEquipItem(fromItem) {
		log.Printf("client %d cannot equip item %d in slot %d", c.ID(), fromItem.Instance.ItemID, toSlot)
		return
	}
	if constants.IsEquipSlot(fromSlot) && toItem != nil && !c.CanEquipItem(toItem) {
		log.Printf("client %d cannot equip item %d in slot %d", c.ID(), toItem.Instance.ItemID, fromSlot)
		return
	}

	// 3) do the DB swap
	updates, err := items.SwapItemSlots(
		int32(c.CharData().ID),
		fromSlot, toSlot,
		toBag, fromBag,
		fromItem, toItem,
	)
	if err != nil {
		log.Printf("failed to swap item slots: %v", err)
		return
	}

	// 4) mutate our in‐memory map: for each moved row, delete old key and set new key
	charItems := c.Items()
	for _, u := range updates {
		oldKey := constants.InventoryKey{Bag: u.FromBag, Slot: u.FromSlot}
		newKey := constants.InventoryKey{Bag: u.ToBag, Slot: u.ToSlot}

		existingItem := charItems[oldKey]
		newItem := charItems[newKey]
		if existingItem != nil {
			// move it in the map
			charItems[newKey] = existingItem
			if newItem == nil {
				delete(charItems, oldKey)
			}
		}
		if newItem != nil {
			charItems[oldKey] = newItem
			if existingItem == nil {
				delete(charItems, newKey)

			}
		}
	}

	// 5) broadcast wear changes for any equip slots that changed
	for _, u := range updates {
		newKey := constants.InventoryKey{Bag: u.ToBag, Slot: u.ToSlot}
		itm := charItems[newKey]

		// if it landed in a visible/equip slot, broadcast it
		if itm != nil && constants.IsVisibleSlot(u.ToSlot) {
			z.BroadcastWearChange(c.ID(), u.ToSlot, itm)
		}
		// likewise, if you want to clear old equip positions:
		if constants.IsVisibleSlot(u.FromSlot) {
			z.BroadcastWearChange(c.ID(), u.FromSlot, nil)
		}
	}

	// Note: We intentionally do NOT echo MoveItem back to the client here.
	// The client already applied the move optimistically before sending the request.
	// Echoing would cause "Attempted to move item to occupied slot" warnings
	// because the client's inventory state is already updated.
	// MoveItem opcodes should only be sent for server-initiated changes (e.g., loot auto-equip).
}

func (c *Client) HandleDeleteItem(z entity.ZoneAccess, ses *session.Session, payload []byte) {
	req, err := session.Deserialize(ses, payload, eq.ReadRootDeleteItem)
	if err != nil {
		log.Printf("failed to read DeleteItem request: %v", err)
		return
	}

	slot := req.Slot()
	if slot != int8(constants.SlotCursor) {
		log.Printf("invalid slot for DeleteItem: %d", slot)
		return
	}

	db_character.PurgeCharacterItem(context.Background(), int32(c.CharData().ID), slot)

	charItems := c.items
	delete(charItems, constants.InventoryKey{
		Bag:  0,
		Slot: slot,
	})

	// Also clear any items that were inside this slot if it was a container
	bagNum := int8(slot + 1)
	for k := range charItems {
		if k.Bag == bagNum {
			delete(charItems, k)
		}
	}

	ses.SendStream(req.Message(), opcodes.DeleteItem)
}

// HandleShopPlayerSell handles selling an item from the player's inventory
func (c *Client) HandleShopPlayerSell(z entity.ZoneAccess, ses *session.Session, payload []byte) {
	req, err := session.Deserialize(ses, payload, eq.ReadRootSellItem)
	if err != nil {
		log.Printf("failed to read SellItem request: %v", err)
		return
	}

	slot := req.Slot()
	bag := req.Bag()

	// Get the item from inventory
	key := constants.InventoryKey{Bag: bag, Slot: slot}
	item := c.Items()[key]
	if item == nil {
		log.Printf("SellItem: no item at bag=%d slot=%d", bag, slot)
		return
	}

	// Validate item can be sold:
	// - Not NO DROP (nodrop == 0 means it IS no drop)
	// - Not NO RENT (norent == 0 means it IS no rent)
	// - Not a container (itemclass != 1)
	if item.Item.Nodrop == 0 {
		log.Printf("SellItem: cannot sell NO DROP item %d", item.Instance.ItemID)
		return
	}
	if item.Item.Norent == 0 {
		log.Printf("SellItem: cannot sell NO RENT item %d", item.Instance.ItemID)
		return
	}
	if item.Item.Itemclass == 1 {
		log.Printf("SellItem: cannot sell container item %d", item.Instance.ItemID)
		return
	}

	// Get item price
	price := int(item.Item.Price)
	if price <= 0 {
		log.Printf("SellItem: item %d has no value", item.Instance.ItemID)
		return
	}

	// Calculate currency breakdown
	platinum := price / 1000
	gold := (price % 1000) / 100
	silver := (price % 100) / 10
	copper := price % 10

	// Update character currency in DB
	charData := c.CharData()
	ctx := context.Background()
	err = db_character.AddCurrency(ctx, int32(charData.ID), platinum, gold, silver, copper)
	if err != nil {
		log.Printf("SellItem: failed to add currency: %v", err)
		return
	}

	// Remove item from DB
	db_character.PurgeCharacterItem(ctx, int32(charData.ID), slot)

	// Remove from in-memory inventory
	delete(c.items, key)

	// Get item name for response
	itemName := item.Item.Name

	// Send response to client
	resp, err := session.NewMessage(ses, eq.NewRootSellItemResponse)
	if err != nil {
		log.Printf("SellItem: failed to create response: %v", err)
		return
	}
	resp.SetSuccess(true)
	resp.SetPlatinum(int32(platinum))
	resp.SetGold(int32(gold))
	resp.SetSilver(int32(silver))
	resp.SetCopper(int32(copper))
	resp.SetItemName(itemName)

	ses.SendStream(resp.Message(), opcodes.ShopPlayerSell)
	log.Printf("SellItem: sold %s for %dp %dg %ds %dc", itemName, platinum, gold, silver, copper)
}
