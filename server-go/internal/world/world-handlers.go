package world

import (
	"context"
	"encoding/json"
	"log"

	eq "github.com/knervous/eqgo/internal/api/capnp"
	"github.com/knervous/eqgo/internal/api/opcodes"
	"github.com/knervous/eqgo/internal/config"
	db_character "github.com/knervous/eqgo/internal/db/character"
	"github.com/knervous/eqgo/internal/db/items"
	"github.com/knervous/eqgo/internal/discord"
	"github.com/knervous/eqgo/internal/session"
	"github.com/knervous/eqgo/internal/zone/client"
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

	charData, err := db_character.GetCharacterByName(ses.CharacterName)
	if err != nil {
		log.Printf("failed to get character %q for accountID %d: %v", ses.CharacterName, ses.AccountID, err)
		return false
	}
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
	// In this case we know we're forwarding the event so we can copy the payload
	// and deserialize it directly.
	payloadCopy := make([]byte, len(payload))
	copy(payloadCopy, payload)
	req, err := session.Deserialize(ses, payloadCopy, eq.ReadRootRequestClientZoneChange)
	if err != nil {
		log.Printf("failed to read JWTLogin struct: %v", err)
		return false
	}

	charData := ses.Client.CharData()
	if charData == nil {
		log.Printf("client session %d has no character data", ses.SessionID)
		return false
	}
	fromCharacterSelect := req.Type() == 0
	if fromCharacterSelect {
		req.SetX(float32(charData.X))
		req.SetY(float32(charData.Y))
		req.SetZ(float32(charData.Z))
		req.SetHeading(float32(charData.Heading))
		req.SetInstanceId(int32(charData.ZoneInstance))
		req.SetZoneId(int32(charData.ZoneID))
	} else {
		// We are zoning from another zone
		// Get validation logic later for this zone request, for now save off and bust cache

		// First remove client from previous zone
		if ses.ZoneID != -1 {
			zoneInstance, ok := wh.zoneManager.Get(ses.ZoneID, ses.InstanceID)
			if ok {
				zoneInstance.RemoveClient(ses.SessionID)
			}
		}
		charData.X = float64(req.X())
		charData.Y = float64(req.Y())
		charData.Z = float64(req.Z())
		charData.Heading = float64(req.Heading())
		charData.ZoneID = uint32(req.ZoneId())
		charData.ZoneInstance = uint32(req.InstanceId())
		db_character.UpdateCharacter(charData, ses.AccountID)
		ses.ZoneID = int(req.ZoneId())
		ses.InstanceID = int(req.InstanceId())
	}
	return true
}
