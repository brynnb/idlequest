package client

import (
	"fmt"

	"github.com/knervous/eqgo/internal/constants"
)

// MoveItem moves an item from one slot to another in the client's inventory.
// It handles bag contents updates when moving bags between general slots or cursor.
// Returns an error if the source slot is empty.
func (c *Client) MoveItem(fromKey, toKey constants.InventoryKey) error {
	c.itemsMu.Lock()
	defer c.itemsMu.Unlock()

	// Get the item from the source slot
	item, exists := c.items[fromKey]
	if !exists || item == nil {
		return fmt.Errorf("no item in source slot (bag=%d, slot=%d)", fromKey.Bag, fromKey.Slot)
	}

	// Check if moving a bag - need to update contents
	oldBagNum := getBagNumForSlot(fromKey)
	newBagNum := getBagNumForSlot(toKey)

	// Move the item
	delete(c.items, fromKey)
	c.items[toKey] = item

	// Update the item's BagSlot to reflect new location
	item.BagSlot = toKey.Bag

	// If moving a bag (container), update all items inside it
	if oldBagNum > 0 && newBagNum > 0 && oldBagNum != newBagNum {
		c.updateBagContents(oldBagNum, newBagNum)
	}

	return nil
}

// SwapItems swaps items between two slots in the client's inventory.
// Handles bag contents updates when swapping bags.
func (c *Client) SwapItems(fromKey, toKey constants.InventoryKey) error {
	c.itemsMu.Lock()
	defer c.itemsMu.Unlock()

	fromItem := c.items[fromKey]
	toItem := c.items[toKey]

	// Swap the items
	if fromItem != nil {
		c.items[toKey] = fromItem
		fromItem.BagSlot = toKey.Bag
	} else {
		delete(c.items, toKey)
	}

	if toItem != nil {
		c.items[fromKey] = toItem
		toItem.BagSlot = fromKey.Bag
	} else {
		delete(c.items, fromKey)
	}

	// Handle bag contents swap
	oldFromBagNum := getBagNumForSlot(fromKey)
	oldToBagNum := getBagNumForSlot(toKey)

	if oldFromBagNum > 0 && oldToBagNum > 0 && oldFromBagNum != oldToBagNum {
		// Swap bag contents using a temp bag number
		c.swapBagContents(oldFromBagNum, oldToBagNum)
	}

	return nil
}

// DeleteItem removes an item from the specified slot.
// Returns the deleted item or nil if slot was empty.
func (c *Client) DeleteItem(key constants.InventoryKey) *constants.ItemWithInstance {
	c.itemsMu.Lock()
	defer c.itemsMu.Unlock()

	item := c.items[key]
	delete(c.items, key)
	return item
}

// GetItem returns the item at the specified slot, or nil if empty.
func (c *Client) GetItem(key constants.InventoryKey) *constants.ItemWithInstance {
	c.itemsMu.RLock()
	defer c.itemsMu.RUnlock()
	return c.items[key]
}

// SetItem sets an item at the specified slot.
func (c *Client) SetItem(key constants.InventoryKey, item *constants.ItemWithInstance) {
	c.itemsMu.Lock()
	defer c.itemsMu.Unlock()
	if item != nil {
		item.BagSlot = key.Bag
		c.items[key] = item
	} else {
		delete(c.items, key)
	}
}

// getBagNumForSlot returns the bag number for items stored inside a container at the given slot.
// Returns -1 if the slot cannot contain a bag (equipment slots, bag content slots).
// General slots 0-7 (bag=0) -> bag numbers 1-8
// Cursor slot 30 (bag=0) -> bag number 9
func getBagNumForSlot(key constants.InventoryKey) int8 {
	if key.Bag == 0 {
		if key.Slot >= 0 && key.Slot <= 7 {
			return key.Slot + 1 // General slots -> bag 1-8
		} else if key.Slot == 30 {
			return 9 // Cursor -> bag 9
		}
	}
	return -1 // Equipment or bag content slots don't contain bags
}

// updateBagContents moves all items from oldBagNum to newBagNum.
// Must be called with itemsMu held.
func (c *Client) updateBagContents(oldBagNum, newBagNum int8) {
	// Collect items to move (can't modify map while iterating)
	var toMove []struct {
		oldKey constants.InventoryKey
		newKey constants.InventoryKey
		item   *constants.ItemWithInstance
	}

	for key, item := range c.items {
		if key.Bag == oldBagNum {
			toMove = append(toMove, struct {
				oldKey constants.InventoryKey
				newKey constants.InventoryKey
				item   *constants.ItemWithInstance
			}{
				oldKey: key,
				newKey: constants.InventoryKey{Bag: newBagNum, Slot: key.Slot},
				item:   item,
			})
		}
	}

	// Apply the moves
	for _, m := range toMove {
		delete(c.items, m.oldKey)
		m.item.BagSlot = newBagNum
		c.items[m.newKey] = m.item
	}
}

// swapBagContents swaps all items between two bag numbers.
// Must be called with itemsMu held.
func (c *Client) swapBagContents(bagNum1, bagNum2 int8) {
	// Collect items from both bags
	var fromBag1, fromBag2 []struct {
		key  constants.InventoryKey
		item *constants.ItemWithInstance
	}

	for key, item := range c.items {
		if key.Bag == bagNum1 {
			fromBag1 = append(fromBag1, struct {
				key  constants.InventoryKey
				item *constants.ItemWithInstance
			}{key, item})
		} else if key.Bag == bagNum2 {
			fromBag2 = append(fromBag2, struct {
				key  constants.InventoryKey
				item *constants.ItemWithInstance
			}{key, item})
		}
	}

	// Remove all items from both bags
	for _, m := range fromBag1 {
		delete(c.items, m.key)
	}
	for _, m := range fromBag2 {
		delete(c.items, m.key)
	}

	// Re-add with swapped bag numbers
	for _, m := range fromBag1 {
		newKey := constants.InventoryKey{Bag: bagNum2, Slot: m.key.Slot}
		m.item.BagSlot = bagNum2
		c.items[newKey] = m.item
	}
	for _, m := range fromBag2 {
		newKey := constants.InventoryKey{Bag: bagNum1, Slot: m.key.Slot}
		m.item.BagSlot = bagNum1
		c.items[newKey] = m.item
	}
}
