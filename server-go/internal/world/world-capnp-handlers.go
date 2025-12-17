package world

import (
	"context"
	"fmt"
	"log"

	eq "idlequest/internal/api/capnp"
	"idlequest/internal/api/opcodes"
	db_character "idlequest/internal/db/character"
	"idlequest/internal/db/items"
	"idlequest/internal/db/jetgen/eqgo/model"
	"idlequest/internal/db/spells"
	db_zone "idlequest/internal/db/zone"
	"idlequest/internal/dialogue"
	"idlequest/internal/session"
	"idlequest/internal/staticdata"

	"capnproto.org/go/capnp/v3"
)

// HandleGetItemRequest handles GetItemRequest Cap'n Proto messages
func HandleGetItemRequest(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	req, err := session.Deserialize(ses, payload, eq.ReadRootGetItemRequest)
	if err != nil {
		log.Printf("Failed to read GetItemRequest: %v", err)
		return false
	}

	itemId := req.ItemId()

	// Get item from database
	item, itemErr := items.GetItemTemplateByID(int32(itemId))

	// Build and send response
	session.QueueMessage(ses, eq.NewRootGetItemResponse, opcodes.GetItemResponse, func(resp eq.GetItemResponse) error {
		if itemErr != nil {
			resp.SetSuccess(0)
			resp.SetError("Item not found")
		} else {
			resp.SetSuccess(1)
			resp.SetItemId(item.ID)
			resp.SetName(item.Name)
			resp.SetIcon(item.Icon)
			resp.SetItemclass(item.Itemclass)
			resp.SetWeight(item.Weight)
			resp.SetSlots(item.Slots)
			resp.SetPrice(item.Price)
			resp.SetAc(item.Ac)
			resp.SetDamage(item.Damage)
			resp.SetDelay(item.Delay)
			resp.SetHp(item.Hp)
			resp.SetMana(item.Mana)
			resp.SetClasses(item.Classes)
			resp.SetRaces(item.Races)
			resp.SetBagslots(item.Bagslots)
			resp.SetBagsize(item.Bagsize)
			resp.SetItemtype(item.Itemtype)
			resp.SetScrolleffect(item.Scrolleffect)
		}
		return nil
	})

	return false
}

// HandleGetZoneRequest handles GetZoneRequest Cap'n Proto messages
func HandleGetZoneRequest(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	req, err := session.Deserialize(ses, payload, eq.ReadRootGetZoneRequest)
	if err != nil {
		log.Printf("Failed to read GetZoneRequest: %v", err)
		return false
	}

	zoneId := req.ZoneId()
	zoneidnumber := req.Zoneidnumber()

	ctx := context.Background()
	var zoneErr error
	var zoneData *model.Zone

	if zoneidnumber != 0 {
		zoneData, zoneErr = db_zone.GetZoneById(ctx, int(zoneidnumber))
	} else if zoneId != 0 {
		zoneData, zoneErr = db_zone.GetZoneById(ctx, int(zoneId))
	} else {
		zoneErr = fmt.Errorf("missing zone identifier")
	}

	// Build and send response
	session.QueueMessage(ses, eq.NewRootGetZoneResponse, opcodes.GetZoneResponse, func(resp eq.GetZoneResponse) error {
		if zoneErr != nil || zoneData == nil {
			resp.SetSuccess(0)
			resp.SetError("Zone not found")
		} else {
			resp.SetSuccess(1)
			resp.SetId(int32(zoneData.ID))
			if zoneData.ShortName != nil {
				resp.SetShortName(*zoneData.ShortName)
			}
			resp.SetLongName(zoneData.LongName)
			resp.SetZoneidnumber(int32(zoneData.Zoneidnumber))
			resp.SetSafeX(float32(zoneData.SafeX))
			resp.SetSafeY(float32(zoneData.SafeY))
			resp.SetSafeZ(float32(zoneData.SafeZ))
			resp.SetMinLevel(int32(zoneData.MinLevel))
			resp.SetMaxLevel(0)
		}
		return nil
	})

	return false
}

// HandleGetAllZonesRequest handles GetAllZonesRequest Cap'n Proto messages
func HandleGetAllZonesRequest(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	// No need to deserialize - request is empty
	ctx := context.Background()

	zones, zonesErr := db_zone.GetAllZones(ctx)

	// Build and send response
	session.QueueMessage(ses, eq.NewRootGetAllZonesResponse, opcodes.GetAllZonesResponse, func(resp eq.GetAllZonesResponse) error {
		if zonesErr != nil {
			resp.SetSuccess(0)
			resp.SetError("Failed to fetch zones")
			return nil
		}

		resp.SetSuccess(1)

		zoneCount := int32(len(zones))
		if zoneCount == 0 {
			return nil
		}

		zoneList, err := eq.NewZoneData_List(resp.Segment(), zoneCount)
		if err != nil {
			log.Printf("Failed to create zone list: %v", err)
			return err
		}

		for i, zone := range zones {
			zoneData := zoneList.At(i)
			zoneData.SetId(int32(zone.ID))
			if zone.ShortName != nil {
				zoneData.SetShortName(*zone.ShortName)
			}
			zoneData.SetLongName(zone.LongName)
			zoneData.SetZoneidnumber(int32(zone.Zoneidnumber))
			zoneData.SetSafeX(float32(zone.SafeX))
			zoneData.SetSafeY(float32(zone.SafeY))
			zoneData.SetSafeZ(float32(zone.SafeZ))
			zoneData.SetMinLevel(int32(zone.MinLevel))
			zoneData.SetMaxLevel(0)
		}
		resp.SetZones(zoneList)
		return nil
	})

	return false
}

// HandleStaticDataRequest handles StaticDataRequest Cap'n Proto messages
func HandleStaticDataRequest(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	ctx := context.Background()

	// Get all static data
	data, dataErr := staticdata.GetStaticData(ctx)
	zones, zonesErr := staticdata.GetAllZones(ctx)

	// Build and send response
	session.QueueMessage(ses, eq.NewRootStaticDataResponse, opcodes.StaticDataResponse, func(resp eq.StaticDataResponse) error {
		if dataErr != nil || zonesErr != nil {
			resp.SetSuccess(0)
			errMsg := "Failed to fetch static data"
			if dataErr != nil {
				errMsg = dataErr.Error()
			} else if zonesErr != nil {
				errMsg = zonesErr.Error()
			}
			resp.SetError(errMsg)
			return nil
		}

		resp.SetSuccess(1)

		// Set zones
		if len(zones) > 0 {
			zoneList, err := eq.NewZoneData_List(resp.Segment(), int32(len(zones)))
			if err == nil {
				for i, zone := range zones {
					zd := zoneList.At(i)
					zd.SetId(int32(zone.ID))
					if zone.ShortName != nil {
						zd.SetShortName(*zone.ShortName)
					}
					zd.SetLongName(zone.LongName)
					zd.SetZoneidnumber(int32(zone.Zoneidnumber))
					zd.SetSafeX(float32(zone.SafeX))
					zd.SetSafeY(float32(zone.SafeY))
					zd.SetSafeZ(float32(zone.SafeZ))
					zd.SetMinLevel(int32(zone.MinLevel))
					zd.SetMaxLevel(0)
				}
				resp.SetZones(zoneList)
			}
		}

		// Set races
		if len(data.Races) > 0 {
			raceList, err := eq.NewRaceInfo_List(resp.Segment(), int32(len(data.Races)))
			if err == nil {
				for i, race := range data.Races {
					r := raceList.At(i)
					r.SetId(race.ID)
					r.SetName(race.Name)
					r.SetNoCoin(race.NoCoin)
					if race.IsPlayable {
						r.SetIsPlayable(1)
					} else {
						r.SetIsPlayable(0)
					}
					r.SetShortName(race.ShortName)
					r.SetBitmask(race.Bitmask)
				}
				resp.SetRaces(raceList)
			}
		}

		// Set classes
		if len(data.Classes) > 0 {
			classList, err := eq.NewClassInfo_List(resp.Segment(), int32(len(data.Classes)))
			if err == nil {
				for i, class := range data.Classes {
					c := classList.At(i)
					c.SetId(class.ID)
					c.SetBitmask(class.Bitmask)
					c.SetName(class.Name)
					c.SetShortName(class.ShortName)
					c.SetCreatePoints(class.CreatePoints)
				}
				resp.SetClasses(classList)
			}
		}

		// Set deities
		if len(data.Deities) > 0 {
			deityList, err := eq.NewDeityInfo_List(resp.Segment(), int32(len(data.Deities)))
			if err == nil {
				for i, deity := range data.Deities {
					d := deityList.At(i)
					d.SetId(deity.ID)
					d.SetName(deity.Name)
					d.SetBitmask(deity.Bitmask)
					d.SetDescription(deity.Description)
					d.SetAltName(deity.AltName)
				}
				resp.SetDeities(deityList)
			}
		}

		// Set char create combinations
		if len(data.CharCreateCombinations) > 0 {
			combList, err := eq.NewCharCreateCombination_List(resp.Segment(), int32(len(data.CharCreateCombinations)))
			if err == nil {
				for i, comb := range data.CharCreateCombinations {
					c := combList.At(i)
					c.SetAllocationId(int32(comb.AllocationID))
					c.SetRace(int32(comb.Race))
					c.SetClass(int32(comb.Class))
					c.SetDeity(int32(comb.Deity))
					c.SetStartZone(int32(comb.StartZone))
					c.SetExpansionsReq(int32(comb.ExpansionsReq))
				}
				resp.SetCharCreateCombinations(combList)
			}
		}

		// Set char create point allocations
		if len(data.CharCreatePointAllocations) > 0 {
			allocList, err := eq.NewCharCreatePointAllocation_List(resp.Segment(), int32(len(data.CharCreatePointAllocations)))
			if err == nil {
				for i, alloc := range data.CharCreatePointAllocations {
					a := allocList.At(i)
					a.SetId(int32(alloc.ID))
					a.SetBaseStr(int32(alloc.BaseStr))
					a.SetBaseSta(int32(alloc.BaseSta))
					a.SetBaseDex(int32(alloc.BaseDex))
					a.SetBaseAgi(int32(alloc.BaseAgi))
					a.SetBaseInt(int32(alloc.BaseInt))
					a.SetBaseWis(int32(alloc.BaseWis))
					a.SetBaseCha(int32(alloc.BaseCha))
					a.SetAllocStr(int32(alloc.AllocStr))
					a.SetAllocSta(int32(alloc.AllocSta))
					a.SetAllocDex(int32(alloc.AllocDex))
					a.SetAllocAgi(int32(alloc.AllocAgi))
					a.SetAllocInt(int32(alloc.AllocInt))
					a.SetAllocWis(int32(alloc.AllocWis))
					a.SetAllocCha(int32(alloc.AllocCha))
				}
				resp.SetCharCreatePointAllocations(allocList)
			}
		}

		return nil
	})

	return false
}

// HandleGetZoneNPCsRequest handles GetZoneNPCsRequest Cap'n Proto messages
func HandleGetZoneNPCsRequest(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	req, err := session.Deserialize(ses, payload, eq.ReadRootGetZoneNPCsRequest)
	if err != nil {
		log.Printf("Failed to read GetZoneNPCsRequest: %v", err)
		return false
	}

	zoneName, _ := req.ZoneName()
	log.Printf("GetZoneNPCsRequest for zone: %s", zoneName)

	// Get zone spawn pool
	spawnPool, spawnErr := db_zone.GetZoneSpawnPool(zoneName)
	if spawnErr != nil {
		log.Printf("GetZoneSpawnPool error for %s: %v", zoneName, spawnErr)
	}

	// Build and send response
	err = session.QueueMessage(ses, eq.NewRootGetZoneNPCsResponse, opcodes.GetZoneNPCsResponse, func(resp eq.GetZoneNPCsResponse) error {
		if spawnErr != nil {
			resp.SetSuccess(0)
			resp.SetError("Failed to fetch zone NPCs")
			return nil
		}

		resp.SetSuccess(1)

		// Extract unique NPCs from spawn pool
		npcMap := make(map[int32]*model.NpcTypes)
		for _, entry := range spawnPool {
			for _, spawnEntry := range entry.SpawnEntries {
				if spawnEntry.NPCType != nil {
					npcMap[spawnEntry.NPCType.ID] = spawnEntry.NPCType
				}
			}
		}

		// Create NPC list
		npcCount := int32(len(npcMap))
		if npcCount == 0 {
			return nil
		}
		npcList, err := eq.NewNPCData_List(resp.Segment(), npcCount)
		if err != nil {
			log.Printf("Failed to create NPC list: %v", err)
			return err
		}
		i := 0
		for _, npc := range npcMap {
			if i >= int(npcCount) {
				break
			}
			npcData := npcList.At(i)
			npcData.SetId(npc.ID)
			npcData.SetName(npc.Name)
			npcData.SetLevel(int32(npc.Level))
			npcData.SetRace(int32(npc.Race))
			npcData.SetClass(int32(npc.Class))
			npcData.SetHp(int32(npc.Hp))
			npcData.SetGender(int32(npc.Gender))
			i++
		}
		resp.SetNpcs(npcList)
		return nil
	})
	if err != nil {
		log.Printf("GetZoneNPCsRequest QueueMessage error: %v", err)
	}

	return false
}

// HandleGetAdjacentZonesRequest handles GetAdjacentZonesRequest Cap'n Proto messages
func HandleGetAdjacentZonesRequest(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	req, err := session.Deserialize(ses, payload, eq.ReadRootGetAdjacentZonesRequest)
	if err != nil {
		log.Printf("Failed to read GetAdjacentZonesRequest: %v", err)
		return false
	}

	zoneId := int(req.ZoneId())

	ctx := context.Background()

	// Get the current zone to find its short name
	currentZone, err := db_zone.GetZoneById(ctx, zoneId)
	if err != nil || currentZone == nil || currentZone.ShortName == nil {
		session.QueueMessage(ses, eq.NewRootGetAdjacentZonesResponse, opcodes.GetAdjacentZonesResponse, func(resp eq.GetAdjacentZonesResponse) error {
			resp.SetSuccess(0)
			resp.SetError("Current zone not found")
			return nil
		})
		return false
	}

	// Get zone points (connections) from this zone
	zonePoints, err := db_zone.GetZonePointsByZoneName(*currentZone.ShortName)
	if err != nil {
		session.QueueMessage(ses, eq.NewRootGetAdjacentZonesResponse, opcodes.GetAdjacentZonesResponse, func(resp eq.GetAdjacentZonesResponse) error {
			resp.SetSuccess(0)
			resp.SetError("Failed to fetch zone connections")
			return nil
		})
		return false
	}

	// Get unique target zone IDs
	targetZoneIds := make(map[uint32]bool)
	for _, zp := range zonePoints {
		targetZoneIds[zp.TargetZoneID] = true
	}

	// Fetch zone details, filtering duplicates by short_name (more reliable than long_name)
	// Also skip zones with zoneidnumber > 400 as these are typically duplicates/instances
	type zoneInfo struct {
		zone   *model.Zone
		zoneId uint32
	}
	zonesByShortName := make(map[string]zoneInfo)

	for targetZoneId := range targetZoneIds {
		if int(targetZoneId) == zoneId {
			continue
		}
		zone, err := db_zone.GetZoneById(ctx, int(targetZoneId))
		if err != nil || zone == nil || zone.ShortName == nil {
			continue
		}
		// Skip high-numbered zones (typically duplicates, instances, or special zones)
		if zone.Zoneidnumber > 400 {
			continue
		}
		shortName := *zone.ShortName
		if existing, exists := zonesByShortName[shortName]; exists {
			// Keep the lower zone ID (original zone)
			if targetZoneId < existing.zoneId {
				zonesByShortName[shortName] = zoneInfo{zone: zone, zoneId: targetZoneId}
			}
		} else {
			zonesByShortName[shortName] = zoneInfo{zone: zone, zoneId: targetZoneId}
		}
	}

	// Build and send response
	session.QueueMessage(ses, eq.NewRootGetAdjacentZonesResponse, opcodes.GetAdjacentZonesResponse, func(resp eq.GetAdjacentZonesResponse) error {
		resp.SetSuccess(1)
		zoneList, _ := eq.NewAdjacentZone_List(resp.Segment(), int32(len(zonesByShortName)))
		i := 0
		for _, info := range zonesByShortName {
			zone := info.zone
			zoneData := zoneList.At(i)
			zoneData.SetId(int32(zone.ID))
			if zone.ShortName != nil {
				zoneData.SetShortName(*zone.ShortName)
			}
			zoneData.SetLongName(zone.LongName)
			zoneData.SetZoneidnumber(int32(zone.Zoneidnumber))
			i++
		}
		resp.SetZones(zoneList)
		return nil
	})

	return false
}

// HandleSendChatMessage handles SendChatMessage Cap'n Proto messages
func HandleSendChatMessage(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	req, err := session.Deserialize(ses, payload, eq.ReadRootSendChatMessageRequest)
	if err != nil {
		log.Printf("Failed to read SendChatMessageRequest: %v", err)
		return false
	}

	text, _ := req.Text()
	messageType, _ := req.MessageType()
	_ = text
	_ = messageType

	// TODO: Broadcast to other clients via ChatMessageBroadcast
	return false
}

// HandleGetNPCDialogueRequest handles GetNPCDialogueRequest Cap'n Proto messages
func HandleGetNPCDialogueRequest(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	req, err := session.Deserialize(ses, payload, eq.ReadRootGetNPCDialogueRequest)
	if err != nil {
		log.Printf("Failed to read GetNPCDialogueRequest: %v", err)
		return false
	}

	npcName, _ := req.NpcName()

	// Parse dialogue history from request
	var dialogueHistory []dialogue.DialogueEntry
	historyList, _ := req.DialogueHistory()
	for i := 0; i < historyList.Len(); i++ {
		entry := historyList.At(i)
		npcDialogue, _ := entry.NpcDialogue()
		playerQuestion, _ := entry.PlayerQuestion()
		dialogueHistory = append(dialogueHistory, dialogue.DialogueEntry{
			NPCDialogue:    npcDialogue,
			PlayerQuestion: playerQuestion,
		})
	}

	// Call dialogue service asynchronously to avoid blocking
	go func() {
		ctx := context.Background()
		dialogueSvc := dialogue.NewService()
		result, err := dialogueSvc.GetNPCDialogue(ctx, npcName, dialogueHistory)

		session.QueueMessage(ses, eq.NewRootGetNPCDialogueResponse, opcodes.GetNPCDialogueResponse, func(resp eq.GetNPCDialogueResponse) error {
			if err != nil {
				resp.SetSuccess(0)
				resp.SetError(err.Error())
				return nil
			}

			resp.SetSuccess(1)
			resp.SetNpcName(npcName)
			resp.SetDialogue(result.Dialogue)

			// Build responses list
			responsesList, _ := capnp.NewTextList(resp.Segment(), int32(len(result.Responses)))
			for i, r := range result.Responses {
				responsesList.Set(i, r)
			}
			resp.SetResponses(responsesList)
			return nil
		})
	}()

	return false
}

// HandleGetSpellRequest handles GetSpellRequest Cap'n Proto messages
func HandleGetSpellRequest(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	req, err := session.Deserialize(ses, payload, eq.ReadRootGetSpellRequest)
	if err != nil {
		log.Printf("Failed to read GetSpellRequest: %v", err)
		return false
	}

	spellId := req.SpellId()

	// Get spell from database
	spell, spellErr := spells.GetSpellByID(spellId)

	// Build and send response
	session.QueueMessage(ses, eq.NewRootGetSpellResponse, opcodes.GetSpellResponse, func(resp eq.GetSpellResponse) error {
		if spellErr != nil || spell == nil {
			resp.SetSuccess(0)
			resp.SetError("Spell not found")
		} else {
			resp.SetSuccess(1)
			resp.SetId(spell.ID)
			if spell.Name != nil {
				resp.SetName(*spell.Name)
			}
			resp.SetCastTime(spell.CastTime)
			resp.SetRecoveryTime(spell.RecoveryTime)
			resp.SetRecastTime(spell.RecastTime)
			resp.SetBuffduration(spell.Buffduration)
			resp.SetMana(spell.Mana)
			resp.SetIcon(spell.Icon)
			resp.SetDescnum(spell.Descnum)
			resp.SetEffectBaseValue1(spell.EffectBaseValue1)
			resp.SetEffectBaseValue2(spell.EffectBaseValue2)
			resp.SetEffectBaseValue3(spell.EffectBaseValue3)
			resp.SetEffectLimitValue1(spell.EffectLimitValue1)
			resp.SetEffectLimitValue2(spell.EffectLimitValue2)
			resp.SetEffectLimitValue3(spell.EffectLimitValue3)
			resp.SetMax1(spell.Max1)
			resp.SetMax2(spell.Max2)
			resp.SetMax3(spell.Max3)
			resp.SetFormula1(spell.Formula1)
			resp.SetFormula2(spell.Formula2)
			resp.SetFormula3(spell.Formula3)
			resp.SetClasses1(spell.Classes1)
			resp.SetClasses2(spell.Classes2)
			resp.SetClasses3(spell.Classes3)
			resp.SetClasses4(spell.Classes4)
			resp.SetClasses5(spell.Classes5)
			resp.SetClasses6(spell.Classes6)
			resp.SetClasses7(spell.Classes7)
			resp.SetClasses8(spell.Classes8)
			resp.SetClasses9(spell.Classes9)
			resp.SetClasses10(spell.Classes10)
			resp.SetClasses11(spell.Classes11)
			resp.SetClasses12(spell.Classes12)
			resp.SetClasses13(spell.Classes13)
			resp.SetClasses14(spell.Classes14)
		}
		return nil
	})

	return false
}

// HandleGetEqstrRequest handles GetEqstrRequest Cap'n Proto messages
func HandleGetEqstrRequest(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	req, err := session.Deserialize(ses, payload, eq.ReadRootGetEqstrRequest)
	if err != nil {
		log.Printf("Failed to read GetEqstrRequest: %v", err)
		return false
	}

	stringId := req.StringId()

	// Get string from database
	eqstr, eqstrErr := spells.GetEqstrByID(stringId)

	// Build and send response
	session.QueueMessage(ses, eq.NewRootGetEqstrResponse, opcodes.GetEqstrResponse, func(resp eq.GetEqstrResponse) error {
		if eqstrErr != nil || eqstr == nil {
			resp.SetSuccess(0)
			resp.SetError("String not found")
		} else {
			resp.SetSuccess(1)
			resp.SetId(eqstr.ID)
			if eqstr.Text != nil {
				resp.SetText(*eqstr.Text)
			}
		}
		return nil
	})

	return false
}

func HandleValidateNameRequest(ses *session.Session, payload []byte, wh *WorldHandler) bool {
	msg, err := capnp.Unmarshal(payload)
	if err != nil {
		log.Printf("failed to unmarshal ValidateNameRequest: %v", err)
		return false
	}

	req, err := eq.ReadRootValidateNameRequest(msg)
	if err != nil {
		log.Printf("failed to read ValidateNameRequest: %v", err)
		return false
	}

	name, _ := req.Name()

	// Check format validity using existing ValidateName function
	isValid := ValidateName(name)

	// Check availability - see if name already exists
	isAvailable := true
	errorMessage := ""

	if !isValid {
		if len(name) < 4 {
			errorMessage = "Name must be at least 4 characters"
		} else if len(name) > 15 {
			errorMessage = "Name must be 15 characters or less"
		} else {
			errorMessage = "Name contains invalid characters or format"
		}
	} else {
		// Check if name is already taken
		existingChar, _ := db_character.GetCharacterByName(name)
		if existingChar != nil && existingChar.ID > 0 {
			isAvailable = false
			errorMessage = "Name is already taken"
		}
	}

	// Convert bools to int32 (1=true, 0=false)
	var validInt, availableInt int32
	if isValid {
		validInt = 1
	}
	if isAvailable {
		availableInt = 1
	}

	// Build and send response
	session.QueueMessage(ses, eq.NewRootValidateNameResponse, opcodes.ValidateNameResponse, func(resp eq.ValidateNameResponse) error {
		resp.SetValid(validInt)
		resp.SetAvailable(availableInt)
		resp.SetErrorMessage(errorMessage)
		return nil
	})

	return false
}
