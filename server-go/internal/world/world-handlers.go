package world

import (
	"context"
	"encoding/json"
	"log"

	eq "idlequest/internal/api/capnp"
	"idlequest/internal/api/opcodes"
	"idlequest/internal/combat"
	"idlequest/internal/config"
	"idlequest/internal/constants"
	db_character "idlequest/internal/db/character"
	db_combat "idlequest/internal/db/combat"
	"idlequest/internal/db/items"
	"idlequest/internal/db/jetgen/eqgo/model"
	db_zone "idlequest/internal/db/zone"
	"idlequest/internal/discord"
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
	log.Printf("Got EnterWorld request")

	name, err := req.Name()
	if err != nil {
		log.Printf("failed to get name from EnterWorld struct: %v", err)
		return false
	}
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

	// For IdleQuest, send PlayerProfile immediately (no zone server)
	sendPlayerProfile(ses, name)
	return false
}

// sendPlayerProfile sends the full PlayerProfile for the specified character
func sendPlayerProfile(ses *session.Session, characterName string) {
	charData, err := db_character.GetCharacterByName(characterName)
	if err != nil {
		log.Printf("failed to get character %q: %v", characterName, err)
		return
	}

	// Create client for this character (loads inventory, etc.)
	ses.Client, err = client.NewClient(charData)
	if err != nil {
		log.Printf("failed to create client for character %q: %v", characterName, err)
		return
	}

	// Build PlayerProfile message
	playerProfile, err := session.NewMessage(ses, eq.NewRootPlayerProfile)
	if err != nil {
		log.Printf("failed to create PlayerProfile message: %v", err)
		return
	}

	playerProfile.SetName(charData.Name)
	playerProfile.SetEntityid(int32(charData.ID)) // Character database ID for inventory sync
	playerProfile.SetLevel(int32(charData.Level))
	playerProfile.SetRace(int32(charData.Race))
	playerProfile.SetCharClass(int32(charData.Class))
	playerProfile.SetGender(int32(charData.Gender))
	playerProfile.SetDeity(int32(charData.Deity))
	playerProfile.SetExp(int32(charData.Exp))
	playerProfile.SetStr(int32(charData.Str))
	playerProfile.SetSta(int32(charData.Sta))
	playerProfile.SetDex(int32(charData.Dex))
	playerProfile.SetAgi(int32(charData.Agi))
	playerProfile.SetWis(int32(charData.Wis))
	playerProfile.SetIntel(int32(charData.Int))
	playerProfile.SetCha(int32(charData.Cha))
	playerProfile.SetZoneId(int32(charData.ZoneID))
	playerProfile.SetZoneInstance(int32(charData.ZoneInstance))
	playerProfile.SetX(float32(charData.X))
	playerProfile.SetY(float32(charData.Y))
	playerProfile.SetZ(float32(charData.Z))
	playerProfile.SetHeading(float32(charData.Heading))
	playerProfile.SetCurHp(int32(charData.CurHp))
	playerProfile.SetMana(int32(charData.Mana))

	// Add inventory items to PlayerProfile
	charItems := ses.Client.Items()
	charItemsLength := int32(len(charItems))

	if charItemsLength > 0 {
		capCharItems, err := playerProfile.NewInventoryItems(charItemsLength)
		if err != nil {
			log.Printf("failed to create InventoryItems array: %v", err)
		} else {
			itemIdx := 0
			for slot, charItem := range charItems {
				if charItem == nil {
					continue
				}
				mods, err := json.Marshal(charItem.Instance.Mods)
				if err != nil {
					log.Printf("failed to marshal mods for itemID %d: %v", charItem.Instance.ItemID, err)
					continue
				}

				item := capCharItems.At(itemIdx)
				itemIdx++
				item.SetCharges(uint32(charItem.Instance.Charges))
				item.SetQuantity(uint32(charItem.Instance.Quantity))
				item.SetMods(string(mods))
				// Send server-native addressing (bagSlot + slot) with no flat-slot conversion.
				item.SetSlot(int32(slot.Slot))
				item.SetBagSlot(int32(slot.Bag))
				items.ConvertItemTemplateToCapnp(ses, &charItem.Item, &item)
			}
		}
	}

	log.Printf("Sending PlayerProfile for %s (level %d, %d items)", charData.Name, charData.Level, charItemsLength)
	ses.SendStream(playerProfile.Message(), opcodes.PlayerProfile)
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

	// Clamp current HP to max HP if over (e.g., new characters with 10k HP)
	maxHP := calculateMaxHPForChar(charData)
	log.Printf("[CharData] Calculated maxHP=%d (Level=%d, STA=%d)", maxHP, charData.Level, charData.Sta)
	if charData.CurHp > uint32(maxHP) {
		log.Printf("[CharData] Clamping CurHp from %d to %d", charData.CurHp, maxHP)
		charData.CurHp = uint32(maxHP)
	}

	// Ensure combat is stopped on login
	combat.GetManager().StopCombat(int64(charData.ID))

	ses.Client, err = client.NewClient(charData)
	if err != nil {
		log.Printf("failed to create client for character %q: %v", ses.CharacterName, err)
		return false
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

// calculateMaxHPForChar calculates max HP using EQ formula
// Formula: level * levelMultiplier + ((level * levelMultiplier) / 300) * stamina + 5
func calculateMaxHPForChar(charData *model.CharacterData) int {
	level := int(charData.Level)
	stamina := int(charData.Sta)
	classId := int(charData.Class)

	levelMultiplier := getHpLevelMultiplier(classId, level)

	term1 := level * levelMultiplier
	term2 := ((level * levelMultiplier) * stamina / 300) + 5

	return term1 + term2
}

// getHpLevelMultiplier returns the HP multiplier based on class and level
func getHpLevelMultiplier(classId, level int) int {
	switch classId {
	case 1: // Warrior
		if level <= 19 {
			return 22
		}
		if level <= 29 {
			return 23
		}
		if level <= 39 {
			return 25
		}
		if level <= 52 {
			return 27
		}
		if level <= 56 {
			return 28
		}
		if level <= 59 {
			return 29
		}
		return 30
	case 2, 6, 10: // Cleric, Druid, Shaman
		return 15
	case 3, 5, 16: // Paladin, Shadowknight, Berserker
		if level <= 34 {
			return 21
		}
		if level <= 44 {
			return 22
		}
		if level <= 50 {
			return 23
		}
		if level <= 55 {
			return 24
		}
		if level <= 59 {
			return 25
		}
		return 26
	case 4: // Ranger
		if level <= 57 {
			return 20
		}
		return 21
	case 7, 8, 9, 15: // Monk, Bard, Rogue, Beastlord
		if level <= 50 {
			return 18
		}
		if level <= 57 {
			return 19
		}
		return 20
	case 11, 12, 13, 14: // Magician, Necromancer, Enchanter, Wizard
		return 12
	default:
		return 15 // Default multiplier
	}
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

	// Send response for each move
	for _, u := range updates {
		pkt, err := session.NewMessage(ses, eq.NewRootMoveItem)
		if err != nil {
			log.Printf("failed to create MoveItem message: %v", err)
			continue
		}
		pkt.SetFromSlot(u.FromSlot)
		pkt.SetToSlot(u.ToSlot)
		pkt.SetFromBagSlot(u.FromBag)
		pkt.SetToBagSlot(u.ToBag)
		pkt.SetNumberInStack(1)
		ses.SendStream(pkt.Message(), opcodes.MoveItem)
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

	db_character.PurgeCharacterItem(context.Background(), int32(ses.Client.CharData().ID), slot)

	delete(ses.Client.Items(), constants.InventoryKey{
		Bag:  0,
		Slot: slot,
	})

	ses.SendStream(req.Message(), opcodes.DeleteItem)
	return false
}

// HandleCamp saves player data and sends updated character info
func HandleCamp(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	if ses.Client == nil || ses.Client.CharData() == nil {
		return false
	}

	charData := ses.Client.CharData()

	// Stop combat when camping
	combat.GetManager().StopCombat(int64(charData.ID))

	// Clamp HP to max before saving
	maxHP := calculateMaxHPForChar(charData)
	if charData.CurHp > uint32(maxHP) {
		charData.CurHp = uint32(maxHP)
	}

	if err := db_character.UpdateCharacter(charData, ses.AccountID); err != nil {
		log.Printf("failed to save player data on camp: %v", err)
	}
	// Send updated character info so character select shows current zone
	sendCharInfo(ses, ses.AccountID)
	return false
}

// HandleChannelMessage is a no-op for single-player idle game
func HandleChannelMessage(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	// No-op: Single-player idle game doesn't need chat broadcasting
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
	// GM commands can be implemented here if needed
	// For now, just log and ignore
	log.Printf("GM command received from session %d", ses.SessionID)
	return false
}

// HandleStartCombat starts server-side combat for the player
func HandleStartCombat(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	if ses.Client == nil || ses.Client.CharData() == nil {
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
		sendCombatEnded(ses, result)
	}

	onLoot := func(loot []db_combat.LootDropItem, money combat.MoneyDrop) {
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
	if ses.Client == nil || ses.Client.CharData() == nil {
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

func sendLootGenerated(ses *session.Session, loot []db_combat.LootDropItem, money combat.MoneyDrop) {
	if ses == nil || ses.Client == nil {
		return
	}
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

	// TODO: Add items to player inventory and set in message
	// For now, just send the money
	items, err := msg.NewItems(int32(len(loot)))
	if err != nil {
		log.Printf("Failed to create loot items list: %v", err)
	} else {
		for i, item := range loot {
			lootItem := items.At(i)
			lootItem.SetItemId(item.ItemID)
			lootItem.SetName(item.Name)
			lootItem.SetCharges(item.ItemCharges)
			lootItem.SetIcon(item.Icon)
			// TODO: Set actual slot after adding to inventory
			lootItem.SetSlot(int32(23 + i)) // General inventory starts at 23
			lootItem.SetBagSlot(0)
		}
	}

	ses.SendStream(msg.Message(), opcodes.LootGenerated)
}

// HandleUpdateBind updates the character's bind point to their current zone
func HandleUpdateBind(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	if ses.Client == nil || ses.Client.CharData() == nil {
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
