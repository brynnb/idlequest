package world

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"

	eq "idlequest/internal/api/capnp"
	"idlequest/internal/api/opcodes"
	"idlequest/internal/combat"
	"idlequest/internal/config"
	"idlequest/internal/constants"
	db_character "idlequest/internal/db/character"
	db_combat "idlequest/internal/db/combat"
	"idlequest/internal/db/items"
	db_zone "idlequest/internal/db/zone"
	"idlequest/internal/discord"
	"idlequest/internal/mechanics"
	"idlequest/internal/session"
	"idlequest/internal/zone/client"

	capnp "capnproto.org/go/capnp/v3"
)

func sendCharInfo(ses *session.Session, accountId int64) {
	ctx := context.Background()
	charInfo, err := GetCharSelectInfo(ses, ctx, accountId)
	if err != nil {
		log.Printf("failed to get character select info for accountID %d: %v", accountId, err)
		return
	}
	ses.SendStream(charInfo.Message(), opcodes.SendCharInfo)
}

// sendCharacterStateFromDB loads character data fresh from the database, creates a new Client,
// and sends the CharacterState message. Use this ONLY for initial login / EnterWorld.
func sendCharacterStateFromDB(ses *session.Session, characterName string) {
	charData, err := db_character.GetCharacterByName(characterName)
	if err != nil {
		log.Printf("sendCharacterState: failed to get character %q: %v", characterName, err)
		return
	}

	// Create client for this character (loads inventory, etc.)
	log.Printf("sendCharacterState: Creating new client for character ID=%d, Name=%q", charData.ID, charData.Name)
	ses.Client, err = client.NewClient(charData)
	if err != nil {
		log.Printf("sendCharacterState: failed to create client for character %q: %v", characterName, err)
		return
	}

	buildAndSendCharacterState(ses)
}

// sendUpdatedCharacterState sends the CharacterState using the EXISTING session client.
// This preserves current HP/Mana values. Use for equipment changes, combat, stat updates.
func sendUpdatedCharacterState(ses *session.Session) {
	if !ses.HasValidClient() {
		log.Printf("sendUpdatedCharacterState: no client or charData")
		return
	}

	// Recalculate bonuses with current inventory (also heals when MaxHp increases)
	ses.Client.UpdateStats()

	buildAndSendCharacterState(ses)
}

// buildAndSendCharacterState is the core function that builds and sends the CharacterState message.
// It uses the existing session client - callers are responsible for setting up the client first.
func buildAndSendCharacterState(ses *session.Session) {
	if !ses.HasValidClient() {
		log.Printf("buildAndSendCharacterState: no client or charData")
		return
	}

	charData := ses.Client.CharData()
	mob := ses.Client.GetMob()

	// Build CharacterState message
	charState, err := session.NewMessage(ses, eq.NewRootCharacterState)
	if err != nil {
		log.Printf("buildAndSendCharacterState: failed to create CharacterState message: %v", err)
		return
	}

	// Identity
	charState.SetId(int32(charData.ID))
	charState.SetName(charData.Name)
	charState.SetLastName(charData.LastName)

	// Class/Race/Deity
	charState.SetCharClass(int32(charData.Class))
	charState.SetRace(int32(charData.Race))
	charState.SetDeity(int32(charData.Deity))
	charState.SetGender(int32(charData.Gender))
	charState.SetFace(int32(charData.Face))
	charState.SetLevel(int32(charData.Level))

	// Send percent (0-10000) instead of raw XP so client doesn't need table
	percent := mechanics.CalculateExpPercent(int(charData.Level), charData.Exp)
	charState.SetExp(percent)

	// Location
	charState.SetZoneId(int32(charData.ZoneID))
	charState.SetZoneInstance(int32(charData.ZoneInstance))
	charState.SetX(float32(charData.X))
	charState.SetY(float32(charData.Y))
	charState.SetZ(float32(charData.Z))
	charState.SetHeading(float32(charData.Heading))

	// HP/Mana - use the client's calculated MaxHp/MaxMana which include item bonuses
	maxHp := mob.MaxHp
	curHp := mob.CurrentHp
	if curHp > maxHp {
		curHp = maxHp
	}
	charState.SetCurHp(int32(curHp))
	charState.SetMaxHp(int32(maxHp))

	maxMana := mob.MaxMana
	curMana := mob.CurrentMana
	if curMana > maxMana {
		curMana = maxMana
	}
	charState.SetCurMana(int32(curMana))
	charState.SetMaxMana(int32(maxMana))

	// Endurance (not implemented yet, set to 0)
	charState.SetEndurance(0)
	charState.SetMaxEndurance(0)

	// Compute AC and ATK
	baseAC := mechanics.CalculatePlayerAC(int(charData.Level), int(charData.Race), 0)
	charState.SetAc(int32(baseAC))
	charState.SetAtk(int32(mechanics.CalculatePlayerATK(int(charData.Str), int(charData.Level))))

	// Base attributes
	charState.SetStr(int32(charData.Str))
	charState.SetSta(int32(charData.Sta))
	charState.SetCha(int32(charData.Cha))
	charState.SetDex(int32(charData.Dex))
	charState.SetIntel(int32(charData.Int))
	charState.SetAgi(int32(charData.Agi))
	charState.SetWis(int32(charData.Wis))

	// Currency (from character_currency table)
	currency, err := db_character.GetCharacterCurrency(context.Background(), charData.ID)
	if err != nil {
		log.Printf("buildAndSendCharacterState: failed to get currency for character %d: %v", charData.ID, err)
		charState.SetPlatinum(0)
		charState.SetGold(0)
		charState.SetSilver(0)
		charState.SetCopper(0)
	} else {
		charState.SetPlatinum(int32(currency.Platinum))
		charState.SetGold(int32(currency.Gold))
		charState.SetSilver(int32(currency.Silver))
		charState.SetCopper(int32(currency.Copper))
	}

	// Add skills
	skills, err := db_character.GetCharacterSkills(context.Background(), int64(charData.ID))
	if err != nil {
		log.Printf("buildAndSendCharacterState: failed to get skills for character %d: %v", charData.ID, err)
	} else {
		capSkills, err := charState.NewSkills(int32(constants.Skill_HIGHEST + 1))
		if err != nil {
			log.Printf("buildAndSendCharacterState: failed to create Skills array: %v", err)
		} else {
			// Initialize all to 0 first (default)
			for i := 0; i <= constants.Skill_HIGHEST; i++ {
				capSkills.Set(i, 0)
			}
			// Fill in values from DB
			for _, s := range skills {
				if int(s.SkillID) <= constants.Skill_HIGHEST {
					capSkills.Set(int(s.SkillID), int32(s.Value))
				}
			}
		}
	}

	// Add inventory items from client
	charItems := ses.Client.Items()
	charItemsLength := int32(len(charItems))

	if charItemsLength > 0 {
		capCharItems, err := charState.NewInventoryItems(charItemsLength)
		if err != nil {
			log.Printf("buildAndSendCharacterState: failed to create InventoryItems array: %v", err)
		} else {
			itemIdx := 0
			for slot, charItem := range charItems {
				if charItem == nil {
					continue
				}
				mods, err := json.Marshal(charItem.Instance.Mods)
				if err != nil {
					log.Printf("buildAndSendCharacterState: failed to marshal mods for itemID %d: %v", charItem.Instance.ItemID, err)
					continue
				}

				item := capCharItems.At(itemIdx)
				itemIdx++
				item.SetCharges(uint32(charItem.Instance.Charges))
				item.SetQuantity(uint32(charItem.Instance.Quantity))
				item.SetMods(string(mods))
				item.SetSlot(int32(slot.Slot))
				item.SetBagSlot(int32(slot.Bag))
				items.ConvertItemTemplateToCapnp(ses, &charItem.Item, &item)
			}
		}
	}

	log.Printf("sendUpdatedCharacterState: Sending for %s (level %d, HP %d/%d, Mana %d/%d, %d items, %d skills)",
		charData.Name, charData.Level, curHp, maxHp, curMana, maxMana, charItemsLength, len(skills))
	ses.SendStream(charState.Message(), opcodes.CharacterState)
}

func HandleJWTLogin(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	ctx := context.Background()
	jwtLogin, err := session.Deserialize(ses, payload, eq.ReadRootJWTLogin)
	if err != nil {
		log.Printf("failed to read JWTLogin struct: %v", err)
		return false
	}

	token, err := jwtLogin.Token()
	if err != nil {
		log.Printf("failed to get token from JWTLogin struct: %v", err)
		return false
	}
	serverConfig, _ := config.Get()
	var accountID int64

	if serverConfig.Local {
		// Local development: bypass Discord/account lookup and use a fixed test account.
		// This avoids requiring a discord_id column in the account table.
		accountID = 1
	} else {
		var discordID string
		discordID, err = discord.ValidateJWT(token)
		if err != nil {
			log.Printf("failed to validate JWT token: %v", err)
			jwtResponse, err := session.NewMessage(ses, eq.NewRootJWTResponse)
			if err != nil {
				log.Printf("failed to create JWTResponse: %v", err)
				return false
			}
			jwtResponse.SetStatus(-100)
			err = ses.SendData(jwtResponse.Message(), opcodes.JWTResponse)
			return false
		}

		accountID, err = GetOrCreateAccount(ctx, discordID)
		if err != nil {
			log.Printf("failed to get or create account for discordID %q: %v", discordID, err)
			jwtResponse, err := session.NewMessage(ses, eq.NewRootJWTResponse)
			jwtResponse.SetStatus(0)
			ses.SendData(jwtResponse.Message(), opcodes.JWTResponse)

			if err != nil {
				log.Printf("failed to send JWTResponse: %v", err)
			}
			return false
		}
	}

	ses.AccountID = accountID
	ses.Authenticated = true
	jwtResponse, err := session.NewMessage(ses, eq.NewRootJWTResponse)
	if err != nil {
		log.Printf("failed to create JWTResponse: %v", err)
		return false
	}
	jwtResponse.SetStatus(int32(ses.SessionID))
	err = ses.SendData(jwtResponse.Message(), opcodes.JWTResponse)
	if err != nil {
		log.Printf("failed to send JWTResponse: %v", err)
	}

	if !serverConfig.Local {
		// Only record login IPs in non-local / real auth mode.
		LoginIP(ctx, accountID, ses.IP)
	}

	sendCharInfo(ses, accountID)
	return false
}

func HandleEnterWorld(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	req, err := session.Deserialize(ses, payload, eq.ReadRootEnterWorld)
	if err != nil {
		log.Printf("failed to read EnterWorld struct: %v", err)
		return false
	}
	log.Printf("=== ENTERWORLD REQUEST RECEIVED ===")

	name, err := req.Name()
	if err != nil {
		log.Printf("failed to get name from EnterWorld struct: %v", err)
		return false
	}
	log.Printf("=== ENTERWORLD: Character name requested: %q ===", name)
	if accountMatch, err := AccountHasCharacterName(context.Background(), ses.AccountID, name); err != nil || !accountMatch {
		log.Printf("Tried to log in unsuccessfully from account %d with character %v", ses.AccountID, err)
		return false
	}
	ses.CharacterName = name

	// Send PostEnterWorld success
	enterWorld, err := session.NewMessage(ses, eq.NewRootInt)
	if err != nil {
		log.Printf("failed to create PostEnterWorld message: %v", err)
		return false
	}
	enterWorld.SetValue(1)
	ses.SendData(enterWorld.Message(), opcodes.PostEnterWorld)

	// For IdleQuest, send CharacterState immediately (no zone server)
	// This is the initial load, so we create a fresh client from the database
	sendCharacterStateFromDB(ses, name)
	return false
}

func HandleZoneSession(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	req, err := session.Deserialize(ses, payload, eq.ReadRootZoneSession)
	if err != nil {
		log.Printf("failed to read JWTLogin struct: %v", err)
		return false
	}

	log.Printf("[CharData] Loading character %q for accountID %d", ses.CharacterName, ses.AccountID)

	charData, err := db_character.GetCharacterByName(ses.CharacterName)
	if err != nil {
		log.Printf("failed to get character %q for accountID %d: %v", ses.CharacterName, ses.AccountID, err)
		return false
	}

	log.Printf("[CharData] Loaded from DB: ID=%d, Name=%s, Level=%d, CurHp=%d, Exp=%d, Zone=%d",
		charData.ID, charData.Name, charData.Level, charData.CurHp, charData.Exp, charData.ZoneID)

	// Ensure combat is stopped on login
	combat.GetManager().StopCombat(int64(charData.ID))

	ses.Client, err = client.NewClient(charData)
	if err != nil {
		log.Printf("failed to create client for character %q: %v", ses.CharacterName, err)
		return false
	}

	// Clamp current HP to max HP if over using synchronized methods
	maxHP := ses.Client.GetMaxHp()
	log.Printf("[CharData] Calculated maxHP=%d (Level=%d, STA=%d, with item bonuses)", maxHP, charData.Level, charData.Sta)
	if ses.Client.GetCurrentHp() > maxHP {
		log.Printf("[CharData] Clamping CurHp from %d to %d", ses.Client.GetCurrentHp(), maxHP)
		ses.Client.SetCurrentHp(maxHP)
	}

	ses.ZoneID = int(req.ZoneId())
	ses.InstanceID = int(req.InstanceId())

	enterWorld, err := session.NewMessage(ses, eq.NewRootInt)
	if err != nil {
		log.Printf("failed to create EnterWorld message: %v", err)
		return false
	}
	enterWorld.SetValue(1)
	ses.SendData(enterWorld.Message(), opcodes.ZoneSessionValid)
	return false
}

func HandleCharacterCreate(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	req, err := session.Deserialize(ses, payload, eq.ReadRootCharCreate)
	if err != nil {
		log.Printf("failed to read JWTLogin struct: %v", err)
		return false
	}

	name, err := req.Name()
	if err != nil {
		log.Printf("failed to get name from CharCreate struct: %v", err)
		return false
	}
	if !ValidateName(name) {
		enterWorld, _ := session.NewMessage(ses, eq.NewRootInt)
		enterWorld.SetValue(0)
		ses.SendData(enterWorld.Message(), opcodes.ApproveName_Server)
		return false
	}

	serverConfig, _ := config.Get()
	if !CharacterCreate(ses, ses.AccountID, req) {
		if !serverConfig.Local {
			// In non-local / production mode, preserve strict behavior: treat any
			// CharacterCreate failure as a name-creation failure.
			enterWorld, _ := session.NewMessage(ses, eq.NewRootInt)
			enterWorld.SetValue(0)
			ses.SendData(enterWorld.Message(), opcodes.ApproveName_Server)
			return false
		}
		// Local development: CharacterCreate can fail due to missing PEQ tables
		// like item_instances/character_inventory. For local dev we still want to
		// allow character names that pass validation, so log and continue.
		log.Printf("CharacterCreate failed in local mode, continuing anyway")
	}
	enterWorld, _ := session.NewMessage(ses, eq.NewRootInt)
	enterWorld.SetValue(1)
	ses.SendData(enterWorld.Message(), opcodes.ApproveName_Server)

	sendCharInfo(ses, ses.AccountID)
	return false
}

func HandleCharacterDelete(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	log.Printf("HandleCharacterDelete called for session %d, payload len=%d", ses.SessionID, len(payload))
	req, err := session.Deserialize(ses, payload, eq.ReadRootString)
	if err != nil {
		log.Printf("failed to read String struct for delete: %v", err)
		return false
	}

	ctx := context.Background()
	name, err := req.Value()
	if err != nil {
		log.Printf("failed to get name from String struct: %v", err)
		return false
	}
	log.Printf("Deleting character: %s for account %d", name, ses.AccountID)
	if err := DeleteCharacter(ctx, ses.AccountID, name); err != nil {
		log.Printf("DeleteCharacter failed: %v", err)
		return false
	}

	log.Printf("Character %s deleted successfully, sending updated char info", name)
	sendCharInfo(ses, ses.AccountID)
	return false
}

func HandleRequestClientZoneChange(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	// Use fresh message to avoid buffer reuse issues with the session's shared buffer
	msg, err := capnp.Unmarshal(payload)
	if err != nil {
		log.Printf("failed to unmarshal RequestClientZoneChange: %v", err)
		return false
	}
	req, err := eq.ReadRootRequestClientZoneChange(msg)
	if err != nil {
		log.Printf("failed to read RequestClientZoneChange struct: %v", err)
		return false
	}

	if ses.Client == nil {
		log.Printf("client session %d has no client attached", ses.SessionID)
		return false
	}

	charData := ses.Client.CharData()
	if charData == nil {
		log.Printf("client session %d has no character data", ses.SessionID)
		return false
	}

	// Stop combat when zoning
	combat.GetManager().StopCombat(int64(charData.ID))

	// Get zone info from request - read all values upfront before any other operations
	zoneId := req.ZoneId()
	instanceId := req.InstanceId()
	reqType := req.Type()
	reqX := req.X()
	reqY := req.Y()
	reqZ := req.Z()
	reqHeading := req.Heading()

	log.Printf("RequestClientZoneChange: session %d, type=%d, zoneId=%d, instanceId=%d",
		ses.SessionID, reqType, zoneId, instanceId)

	fromCharacterSelect := reqType == 0
	if fromCharacterSelect {
		// Coming from character select - use character's saved position
		ses.ZoneID = int(charData.ZoneID)
		ses.InstanceID = int(charData.ZoneInstance)
	} else {
		// Zoning from another zone - just update session and DB
		// No ZoneInstance cleanup needed for idle game

		// Update character data with new zone
		charData.ZoneID = uint32(zoneId)
		charData.ZoneInstance = uint32(instanceId)
		charData.X = float64(reqX)
		charData.Y = float64(reqY)
		charData.Z = float64(reqZ)
		charData.Heading = float64(reqHeading)
		db_character.UpdateCharacter(charData, ses.AccountID)

		ses.ZoneID = int(zoneId)
		ses.InstanceID = int(instanceId)
	}

	return true
}

// HandleMoveItemWorld handles MoveItem at the world level
func HandleMoveItemWorld(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	if ses.Client == nil {
		log.Printf("No client attached to session for MoveItem")
		return false
	}

	req, err := session.Deserialize(ses, payload, eq.ReadRootMoveItem)
	if err != nil {
		log.Printf("failed to read MoveItem struct: %v", err)
		return false
	}

	fromSlot := int8(req.FromSlot())
	toSlot := int8(req.ToSlot())
	fromBag := int8(req.FromBagSlot())
	toBag := int8(req.ToBagSlot())

	fromKey := constants.InventoryKey{Bag: fromBag, Slot: fromSlot}
	toKey := constants.InventoryKey{Bag: toBag, Slot: toSlot}

	fromItem := ses.Client.Items()[fromKey]
	toItem := ses.Client.Items()[toKey]

	// Check 2H weapon constraints for manual equip actions
	if toBag == 0 { // Only check equipment slots (bag 0)
		primaryItem := ses.Client.Items()[constants.InventoryKey{Bag: 0, Slot: int8(constants.SlotPrimary)}]

		// Case 1: Trying to equip to secondary slot when primary has 2H weapon
		if toSlot == int8(constants.SlotSecondary) && primaryItem != nil && primaryItem.IsType2H() {
			SendSystemMessage(ses, "You cannot equip an off-hand item while wielding a two-handed weapon.")
			return false
		}

		// Case 2: Trying to equip a 2H weapon to primary when secondary has an item
		if toSlot == int8(constants.SlotPrimary) && fromItem != nil && fromItem.IsType2H() {
			secondaryItem := ses.Client.Items()[constants.InventoryKey{Bag: 0, Slot: int8(constants.SlotSecondary)}]
			if secondaryItem != nil {
				SendSystemMessage(ses, "You cannot equip a two-handed weapon while holding an item in your off-hand.")
				return false
			}
		}
	}

	// Do the DB swap
	updates, err := items.SwapItemSlots(
		int32(ses.Client.CharData().ID),
		fromSlot, toSlot,
		toBag, fromBag,
		fromItem, toItem,
	)
	if err != nil {
		log.Printf("failed to swap item slots: %v", err)
		return false
	}

	// Update in-memory map
	charItems := ses.Client.Items()
	for _, u := range updates {
		oldKey := constants.InventoryKey{Bag: u.FromBag, Slot: u.FromSlot}
		newKey := constants.InventoryKey{Bag: u.ToBag, Slot: u.ToSlot}

		existingItem := charItems[oldKey]
		newItem := charItems[newKey]
		if existingItem != nil {
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

	// Note: We intentionally do NOT echo MoveItem back to the client here.
	// The client already applied the move optimistically before sending the request.
	// Echoing would cause "Attempted to move item to occupied slot" warnings
	// because the client's inventory state is already updated.
	// MoveItem opcodes should only be sent for server-initiated changes (e.g., loot auto-equip).

	// If either slot is an equipment slot, recalculate stats and send updated character state
	// This ensures HP/Mana bonuses from equipment are reflected in the UI
	// Use sendUpdatedCharacterState to preserve current HP/Mana values
	fromIsEquipSlot := fromBag == 0 && constants.IsEquipSlot(fromSlot)
	toIsEquipSlot := toBag == 0 && constants.IsEquipSlot(toSlot)
	if fromIsEquipSlot || toIsEquipSlot {
		sendUpdatedCharacterState(ses)
	}

	return false
}

// HandleDeleteItemWorld handles DeleteItem at the world level
// Returns true to forward to zone if zone is assigned
func HandleDeleteItemWorld(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	// If zone is assigned, forward to zone handler
	if ses.ZoneID != -1 {
		return true
	}

	// Handle at world level (no zone assigned yet)
	if ses.Client == nil {
		log.Printf("No client attached to session for DeleteItem")
		return false
	}

	req, err := session.Deserialize(ses, payload, eq.ReadRootDeleteItem)
	if err != nil {
		log.Printf("failed to read DeleteItem struct: %v", err)
		return false
	}

	slot := req.Slot()
	if slot != int8(constants.SlotCursor) {
		log.Printf("invalid slot for DeleteItem: %d", slot)
		return false
	}

	log.Printf("DeleteItem (world) for session %d: slot %d", ses.SessionID, slot)

	if err := db_character.PurgeCharacterItem(context.Background(), int32(ses.Client.CharData().ID), slot); err != nil {
		log.Printf("Failed to purge item from database: %v", err)
		return false
	}

	charItems := ses.Client.Items()
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
	return false
}

// HandleCamp saves player data and sends updated character info
func HandleCamp(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	if !ses.HasValidClient() {
		return false
	}

	charData := ses.Client.CharData()

	// Stop combat when camping
	combat.GetManager().StopCombat(int64(charData.ID))

	// Clamp HP to max before saving using synchronized methods
	maxHP := ses.Client.GetMaxHp()
	if ses.Client.GetCurrentHp() > maxHP {
		ses.Client.SetCurrentHp(maxHP)
	}

	if err := db_character.UpdateCharacter(charData, ses.AccountID); err != nil {
		log.Printf("failed to save player data on camp: %v", err)
	}
	// Send updated character info so character select shows current zone
	sendCharInfo(ses, ses.AccountID)
	return false
}

// HandleChannelMessage handles legacy EQ channel messages.
// Note: IdleQuest uses HandleSendChatMessage for chat broadcasting instead.
func HandleChannelMessage(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	// Legacy opcode - chat is handled by HandleSendChatMessage
	return false
}

// HandleClientUpdate is a no-op for idle game - no real-time position tracking
func HandleClientUpdate(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	return false
}

// HandleClientAnimation is a no-op for idle game - no animation broadcasting
func HandleClientAnimation(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	return false
}

// HandleGMCommand handles GM commands
func HandleGMCommand(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	if !ses.HasValidClient() {
		return false
	}
	charData := ses.Client.CharData()

	serverConfig, _ := config.Get()
	isDefaultLocalGM := serverConfig.Local && ses.AccountID == 1

	if charData.Gm == 0 && os.Getenv("IDLEQUEST_TEST_MODE") != "true" && !isDefaultLocalGM {
		log.Printf("GM command rejected (not GM, not in test mode, and not default local account) from session %d (char: %s)", ses.SessionID, charData.Name)
		return false
	}

	req, err := session.Deserialize(ses, payload, eq.ReadRootCommandMessage)
	if err != nil {
		log.Printf("failed to read CommandMessage: %v", err)
		return false
	}

	commandName, _ := req.Command()
	args, _ := req.Args()
	log.Printf("GM command received: %s with %d args", commandName, args.Len())

	switch strings.ToLower(commandName) {
	case "heal":
		// Use synchronized RestoreToFull method
		ses.Client.RestoreToFull()
		log.Printf("[GM] Healed %s to %d HP", charData.Name, ses.Client.GetMaxHp())
		sendUpdatedCharacterState(ses)

	case "suicide":
		// Use synchronized SetCurrentHp method
		ses.Client.SetCurrentHp(1)
		log.Printf("[GM] Player %s set to 1 HP (Near Death)", charData.Name)
		sendUpdatedCharacterState(ses)

	case "kill", "win":
		// If in combat, set NPC HP to 1
		cms := combat.GetManager()
		if cms.IsInCombat(int64(charData.ID)) {
			cms.DebugSetNPCLowHP(int64(charData.ID))
			log.Printf("[GM] Weakened %s's target to 1 HP", charData.Name)
		} else {
			log.Printf("[GM] 'win' command ignored - %s is not in combat", charData.Name)
		}

	case "exp":
		if args.Len() > 0 {
			amountStr, _ := args.At(0)
			var amount int
			fmt.Sscanf(amountStr, "%d", &amount)
			if amount > 0 {
				charData.Exp += uint32(amount)
				charData.Level = uint32(mechanics.CalculateLevelFromExp(int(charData.Exp)))
				log.Printf("[GM] Added %d exp to %s, now level %d", amount, charData.Name, charData.Level)
				sendUpdatedCharacterState(ses)
			}
		}

	case "item":
		if args.Len() > 0 {
			itemIDStr, _ := args.At(0)
			var itemID int
			fmt.Sscanf(itemIDStr, "%d", &itemID)
			if itemID > 0 {
				itemTemplate, err := items.GetItemTemplateByID(int32(itemID))
				if err != nil {
					log.Printf("[GM] Item %d not found: %v", itemID, err)
					return false
				}

				log.Printf("[GM] Adding item %d (%s) to %s", itemID, itemTemplate.Name, charData.Name)

				// Get current inventory from session client
				currentItems := ses.Client.Items()

				// Use ProcessAutoLoot to find a slot and save to DB
				_, _, err = items.ProcessAutoLoot(
					int32(charData.ID),
					int(charData.Class),
					int(charData.Race),
					currentItems,
					itemTemplate,
					1, // charges
				)
				if err != nil {
					log.Printf("[GM] Failed to add item %d to %s: %v", itemID, charData.Name, err)
					return false
				}

				// Log HP values for debugging
				log.Printf("[GM] Before UpdateStats: CurrentHp=%d, MaxHp=%d",
					ses.Client.GetCurrentHp(), ses.Client.GetMaxHp())

				// Sync with client (preserves current HP/Mana)
				sendUpdatedCharacterState(ses)

				log.Printf("[GM] After UpdateStats: CurrentHp=%d, MaxHp=%d",
					ses.Client.GetCurrentHp(), ses.Client.GetMaxHp())
			}
		}

	default:
		log.Printf("Unknown GM command: %s", commandName)
	}

	return false
}

// HandleStartCombat starts server-side combat for the player
func HandleStartCombat(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	if !ses.HasValidClient() {
		log.Printf("No client or character data for StartCombat")
		return false
	}

	charData := ses.Client.CharData()
	zone, err := db_zone.GetZoneById(context.Background(), int(charData.ZoneID))
	if err != nil || zone == nil || zone.ShortName == nil {
		log.Printf("Could not get zone name for zone ID %d: %v", charData.ZoneID, err)
		sendCombatStartedError(ses, "Unknown zone")
		return false
	}
	zoneShortName := *zone.ShortName

	// Define callbacks for combat events
	onRound := func(result *combat.RoundResult) {
		sendCombatRound(ses, result)
	}

	onEnd := func(result *combat.EndResult) {
		// Include bind info in combat ended message for client-side teleport
		sendCombatEnded(ses, result)

		// If player died, move them to their bind point
		if !result.Victory {
			charData.ZoneID = uint32(result.BindZoneID)
			charData.X = result.BindX
			charData.Y = result.BindY
			charData.Z = result.BindZ
			charData.Heading = result.BindHeading
			// Update session zone ID to match new zone
			ses.ZoneID = int(result.BindZoneID)
			log.Printf("Character %s died and is respawning at bind point in zone %d", charData.Name, charData.ZoneID)
		}

		// Save changes (Exp gained, HP update, new Zone/Pos) to DB
		// Note: HP/Mana are already synchronized via combat's use of Client methods
		if err := db_character.UpdateCharacter(charData, int64(charData.AccountID)); err != nil {
			log.Printf("Failed to save character state after combat: %v", err)
		}

		// Sync client with full state using existing client (preserves correct HP/Mana)
		sendUpdatedCharacterState(ses)
	}

	onLoot := func(loot []db_combat.LootDropItem, money db_combat.MoneyDrop) {
		sendLootGenerated(ses, loot, money)
	}

	// Start combat
	npc, err := combat.GetManager().StartCombat(
		ses,
		zoneShortName,
		int(charData.Level),
		onRound,
		onEnd,
		onLoot,
	)

	if err != nil {
		log.Printf("Failed to start combat: %v", err)
		sendCombatStartedError(ses, err.Error())
		return false
	}

	// Send combat started response
	sendCombatStarted(ses, npc)
	return false
}

// HandleStopCombat stops server-side combat for the player
func HandleStopCombat(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	if !ses.HasValidClient() {
		return false
	}

	charID := int64(ses.Client.CharData().ID)
	combat.GetManager().StopCombat(charID)
	return false
}

func sendCombatStarted(ses *session.Session, npc *db_combat.NPCForCombat) {
	msg, err := session.NewMessage(ses, eq.NewRootCombatStartedResponse)
	if err != nil {
		log.Printf("Failed to create CombatStartedResponse: %v", err)
		return
	}

	msg.SetSuccess(1)
	msg.SetError("")

	npcMsg, err := msg.NewNpc()
	if err != nil {
		log.Printf("Failed to create CombatNPC: %v", err)
		return
	}

	npcMsg.SetId(npc.ID)
	npcMsg.SetName(npc.Name)
	npcMsg.SetLevel(int32(npc.Level))
	npcMsg.SetHp(int32(npc.HP))
	npcMsg.SetMaxHp(int32(npc.HP))
	npcMsg.SetAc(int32(npc.AC))
	npcMsg.SetMinDmg(int32(npc.MinDmg))
	npcMsg.SetMaxDmg(int32(npc.MaxDmg))
	npcMsg.SetAttackDelay(int32(npc.AttackDelay))

	ses.SendStream(msg.Message(), opcodes.CombatStarted)
}

func sendCombatStartedError(ses *session.Session, errMsg string) {
	msg, err := session.NewMessage(ses, eq.NewRootCombatStartedResponse)
	if err != nil {
		log.Printf("Failed to create CombatStartedResponse: %v", err)
		return
	}

	msg.SetSuccess(0)
	msg.SetError(errMsg)

	ses.SendStream(msg.Message(), opcodes.CombatStarted)
}

func sendCombatRound(ses *session.Session, result *combat.RoundResult) {
	if ses == nil || ses.Client == nil {
		return
	}
	msg, err := session.NewMessage(ses, eq.NewRootCombatRoundUpdate)
	if err != nil {
		log.Printf("Failed to create CombatRoundUpdate: %v", err)
		return
	}

	msg.SetPlayerHit(boolToInt32(result.PlayerHit))
	msg.SetPlayerDamage(int32(result.PlayerDamage))
	msg.SetPlayerCritical(boolToInt32(result.PlayerCritical))
	msg.SetNpcHit(boolToInt32(result.NPCHit))
	msg.SetNpcDamage(int32(result.NPCDamage))
	msg.SetPlayerHp(int32(result.PlayerHP))
	msg.SetPlayerMaxHp(int32(result.PlayerMaxHP))
	msg.SetNpcHp(int32(result.NPCHP))
	msg.SetNpcMaxHp(int32(result.NPCMaxHP))
	msg.SetRoundNumber(int32(result.RoundNumber))

	ses.SendStream(msg.Message(), opcodes.CombatRound)
}

func sendCombatEnded(ses *session.Session, result *combat.EndResult) {
	if ses == nil || ses.Client == nil {
		return
	}
	msg, err := session.NewMessage(ses, eq.NewRootCombatEndedResponse)
	if err != nil {
		log.Printf("Failed to create CombatEndedResponse: %v", err)
		return
	}

	msg.SetVictory(boolToInt32(result.Victory))
	msg.SetNpcName(result.NPCName)
	msg.SetExpGained(int32(result.ExpGained))
	msg.SetPlayerHp(int32(result.PlayerHP))
	msg.SetPlayerMaxHp(int32(result.PlayerMaxHP))

	// Include bind zone info for death respawn
	if !result.Victory {
		msg.SetBindZoneId(int32(result.BindZoneID))
		msg.SetBindX(float32(result.BindX))
		msg.SetBindY(float32(result.BindY))
		msg.SetBindZ(float32(result.BindZ))
		msg.SetBindHeading(float32(result.BindHeading))
	}

	ses.SendStream(msg.Message(), opcodes.CombatEnded)
}

func boolToInt32(b bool) int32 {
	if b {
		return 1
	}
	return 0
}

func sendLootGenerated(ses *session.Session, loot []db_combat.LootDropItem, money db_combat.MoneyDrop) {
	if ses == nil || ses.Client == nil {
		return
	}
	charData := ses.Client.CharData()
	if charData == nil {
		return
	}

	ctx := context.Background()

	// Add currency to character if any money dropped
	if money.Platinum > 0 || money.Gold > 0 || money.Silver > 0 || money.Copper > 0 {
		if err := db_character.AddCurrency(ctx, int32(charData.ID), money.Platinum, money.Gold, money.Silver, money.Copper); err != nil {
			log.Printf("Failed to add currency to character %d: %v", charData.ID, err)
		}
	}

	// Add each item to inventory and track assigned slots
	type lootedItem struct {
		ItemID     int32
		Name       string
		Charges    int32
		Icon       int32
		Slot       int8
		Bag        int8
		InstanceID int32
	}
	var lootedItems []lootedItem

	for _, item := range loot {
		// Fetch full item details for scoring/ProcessAutoLoot
		itemTemplate, err := items.GetItemTemplateByID(item.ItemID)
		if err != nil {
			log.Printf("Failed to get item template for ID %d: %v", item.ItemID, err)
			continue
		}

		// Use ProcessAutoLoot to handle equip/upgrade/inventory logic
		updates, instanceID, err := items.ProcessAutoLoot(
			int32(charData.ID),
			int(charData.Class),
			int(charData.Race),
			ses.Client.Items(),
			itemTemplate,
			uint8(item.ItemCharges),
		)
		if err != nil {
			if err.Error() == "inventory is full" {
				SendSystemMessage(ses, fmt.Sprintf("Your inventory is full, you could not loot %s.", item.Name))
			} else {
				log.Printf("Failed to process auto-loot for item %s: %v", item.Name, err)
			}
			continue
		}

		for _, u := range updates {
			if u.FromSlot != -1 {
				// This was an old item being moved to make room for an upgrade
				pkt, err := session.NewMessage(ses, eq.NewRootMoveItem)
				if err != nil {
					log.Printf("Failed to create MoveItem message: %v", err)
					continue
				}
				pkt.SetFromSlot(u.FromSlot)
				pkt.SetToSlot(u.ToSlot)
				pkt.SetFromBagSlot(u.FromBag)
				pkt.SetToBagSlot(u.ToBag)
				pkt.SetNumberInStack(1)
				ses.SendStream(pkt.Message(), opcodes.MoveItem)
				log.Printf("Auto-upgraded: Moved instance %d from %d to %d (bag %d)", u.ItemInstanceID, u.FromSlot, u.ToSlot, u.ToBag)
			} else {
				// This is the new item
				lootedItems = append(lootedItems, lootedItem{
					ItemID:     item.ItemID,
					Name:       item.Name,
					Charges:    item.ItemCharges,
					Icon:       item.Icon,
					Slot:       u.ToSlot,
					Bag:        u.ToBag,
					InstanceID: instanceID,
				})
			}
		}
	}

	// Create response message
	msg, err := session.NewMessage(ses, eq.NewRootLootGeneratedResponse)
	if err != nil {
		log.Printf("Failed to create LootGeneratedResponse: %v", err)
		return
	}

	// Set money
	msg.SetPlatinum(int32(money.Platinum))
	msg.SetGold(int32(money.Gold))
	msg.SetSilver(int32(money.Silver))
	msg.SetCopper(int32(money.Copper))

	// Set items with actual inventory slots
	itemsList, err := msg.NewItems(int32(len(lootedItems)))
	if err != nil {
		log.Printf("Failed to create loot items list: %v", err)
	} else {
		for i, item := range lootedItems {
			lootItem := itemsList.At(i)
			lootItem.SetItemId(item.ItemID)
			lootItem.SetName(item.Name)
			lootItem.SetCharges(item.Charges)
			lootItem.SetIcon(item.Icon)
			lootItem.SetSlot(int32(item.Slot))
			lootItem.SetBagSlot(int32(item.Bag))
		}
	}

	ses.SendStream(msg.Message(), opcodes.LootGenerated)
}

func SendSystemMessage(ses *session.Session, text string) {
	session.QueueMessage(ses, eq.NewRootChatMessageCapnp, opcodes.ChatMessageBroadcast, func(resp eq.ChatMessageCapnp) error {
		resp.SetText(text)
		resp.SetMessageType("system")
		return nil
	})
}

// HandleUpdateBind updates the character's bind point to their current zone
func HandleUpdateBind(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	if !ses.HasValidClient() {
		return false
	}

	charData := ses.Client.CharData()
	ctx := context.Background()

	// Update bind to current zone and position
	err := db_character.UpdateCharacterBind(
		ctx,
		charData.ID,
		uint16(charData.ZoneID),
		charData.X,
		charData.Y,
		charData.Z,
		charData.Heading,
	)
	if err != nil {
		log.Printf("Failed to update bind for character %d: %v", charData.ID, err)
		return false
	}

	// Get zone name for message
	zone, err := db_zone.GetZoneById(ctx, int(charData.ZoneID))
	zoneName := "this location"
	if err == nil && zone != nil {
		zoneName = zone.LongName
	}

	log.Printf("Character %s bound to zone %d (%s)", charData.Name, charData.ZoneID, zoneName)

	// Send confirmation - just use a simple Int message with zone ID
	msg, err := session.NewMessage(ses, eq.NewRootInt)
	if err != nil {
		log.Printf("Failed to create bind confirmation: %v", err)
		return false
	}
	msg.SetValue(int32(charData.ZoneID))
	ses.SendStream(msg.Message(), opcodes.BindUpdated)

	return false
}

// HandleAutoPlaceCursorItem handles the auto-place cursor item request (PersonaView click)
// Uses the same logic as auto-loot: try to equip, then find inventory/bag slot
func HandleAutoPlaceCursorItem(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	if !ses.HasValidClient() {
		return false
	}

	charData := ses.Client.CharData()
	currentItems := ses.Client.Items()

	// Get cursor item
	cursorKey := constants.InventoryKey{Bag: 0, Slot: int8(constants.SlotCursor)}
	cursorItem := currentItems[cursorKey]
	if cursorItem == nil {
		return false // No item on cursor
	}

	targetBag := int8(0)
	targetSlot := int8(-1)

	// Wrap cursor item for helper methods
	itemWithInstance := cursorItem

	// Step 1: Check if equippable in an empty slot
	if itemWithInstance.IsEquippable(constants.RaceID(charData.Race), uint8(charData.Class)) {
		// Check if primary slot has a 2H weapon (blocks secondary slot)
		primaryItem := currentItems[constants.InventoryKey{Bag: 0, Slot: int8(constants.SlotPrimary)}]
		primaryHas2H := primaryItem != nil && primaryItem.IsType2H()

		for s := int8(0); s <= 21; s++ { // Equipment slots only
			if itemWithInstance.AllowedInSlot(s) && constants.IsEquipSlot(s) {
				// Skip secondary slot if primary has a 2H weapon
				if s == int8(constants.SlotSecondary) && primaryHas2H {
					continue
				}
				// Skip primary slot if item is 2H and secondary has an item
				if s == int8(constants.SlotPrimary) && itemWithInstance.IsType2H() {
					secondaryItem := currentItems[constants.InventoryKey{Bag: 0, Slot: int8(constants.SlotSecondary)}]
					if secondaryItem != nil {
						continue
					}
				}
				// Check if slot is empty
				if currentItems[constants.InventoryKey{Bag: 0, Slot: s}] == nil {
					targetSlot = s
					break
				}
			}
		}
	}

	// Step 2: If not equipped, find free inventory/bag slot
	if targetSlot == -1 {
		targetBag, targetSlot = items.FindFirstAvailableSlot(currentItems, cursorItem.IsContainer())
	}

	// No slot found
	if targetSlot == -1 {
		SendSystemMessage(ses, "Your inventory is full.")
		return false
	}

	// Step 3: Execute the move via SwapItemSlots
	_, err := items.SwapItemSlots(
		int32(charData.ID),
		int8(constants.SlotCursor), targetSlot,
		targetBag, 0,
		cursorItem, nil,
	)
	if err != nil {
		log.Printf("HandleAutoPlaceCursorItem: failed to move item: %v", err)
		return false
	}

	// Update in-memory inventory
	targetKey := constants.InventoryKey{Bag: targetBag, Slot: targetSlot}
	currentItems[targetKey] = cursorItem
	delete(currentItems, cursorKey)

	// Send updated character state to client (preserves current HP/Mana)
	sendUpdatedCharacterState(ses)

	return false
}
