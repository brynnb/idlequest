package world

import (
	"context"
	"fmt"
	"log"

	eq "idlequest/internal/api/capnp"
	"idlequest/internal/api/opcodes"
	"idlequest/internal/db/items"
	"idlequest/internal/db/jetgen/eqgo/model"
	db_zone "idlequest/internal/db/zone"
	"idlequest/internal/dialogue"
	"idlequest/internal/session"

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
