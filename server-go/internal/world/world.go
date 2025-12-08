package world

import (
	"context"
	"encoding/binary"
	"encoding/json"
	"log"
	"reflect"
	"strings"
	"sync"
	"unicode"

	"github.com/knervous/eqgo/internal/db"
	db_character "github.com/knervous/eqgo/internal/db/character"
	"github.com/knervous/eqgo/internal/db/items"
	db_zone "github.com/knervous/eqgo/internal/db/zone"
	"github.com/knervous/eqgo/internal/session"
	"github.com/knervous/eqgo/internal/zone"
)

// toLowerCamelCase converts a string from PascalCase to lowerCamelCase
// Handles special cases like "ID" -> "id", "URL" -> "url", "NPCType" -> "npcType"
func toLowerCamelCase(s string) string {
	if s == "" {
		return s
	}
	runes := []rune(s)

	// Find the end of the leading uppercase sequence
	upperEnd := 0
	for i, r := range runes {
		if unicode.IsLower(r) {
			break
		}
		upperEnd = i + 1
	}

	// If all uppercase (like "ID", "NPC", "URL"), lowercase the whole thing
	if upperEnd == len(runes) {
		return strings.ToLower(s)
	}

	// If multiple leading uppercase (like "NPCType"), lowercase all but the last
	if upperEnd > 1 {
		for i := 0; i < upperEnd-1; i++ {
			runes[i] = unicode.ToLower(runes[i])
		}
		return string(runes)
	}

	// Single leading uppercase, just lowercase the first character
	runes[0] = unicode.ToLower(runes[0])
	return string(runes)
}

// toLowerCamelJSON recursively converts a value to a map with lowerCamelCase keys
// This allows Jet-generated structs (with PascalCase fields) to serialize as lowerCamelCase JSON
func toLowerCamelJSON(v interface{}) interface{} {
	if v == nil {
		return nil
	}

	val := reflect.ValueOf(v)

	// Handle pointers
	if val.Kind() == reflect.Ptr {
		if val.IsNil() {
			return nil
		}
		return toLowerCamelJSON(val.Elem().Interface())
	}

	switch val.Kind() {
	case reflect.Struct:
		result := make(map[string]interface{})
		t := val.Type()
		for i := 0; i < val.NumField(); i++ {
			field := t.Field(i)
			if !field.IsExported() {
				continue
			}
			// Use json tag if present, otherwise convert field name
			jsonTag := field.Tag.Get("json")
			var key string
			if jsonTag != "" && jsonTag != "-" {
				// Extract just the name part (before any comma)
				for i, c := range jsonTag {
					if c == ',' {
						jsonTag = jsonTag[:i]
						break
					}
				}
				key = jsonTag
			} else {
				key = toLowerCamelCase(field.Name)
			}
			result[key] = toLowerCamelJSON(val.Field(i).Interface())
		}
		return result

	case reflect.Slice, reflect.Array:
		if val.IsNil() {
			return nil
		}
		result := make([]interface{}, val.Len())
		for i := 0; i < val.Len(); i++ {
			result[i] = toLowerCamelJSON(val.Index(i).Interface())
		}
		return result

	case reflect.Map:
		if val.IsNil() {
			return nil
		}
		result := make(map[string]interface{})
		for _, k := range val.MapKeys() {
			keyStr := k.String()
			result[keyStr] = toLowerCamelJSON(val.MapIndex(k).Interface())
		}
		return result

	default:
		return v
	}
}

// JSON Message structures for WebTransport API
type JSONMessage struct {
	Type string `json:"type"`
}

type ItemRequest struct {
	Type   string `json:"type"`
	ItemId int    `json:"itemId"`
}

type ItemsRequest struct {
	Type string `json:"type"`
}

type ItemResponse struct {
	Type    string      `json:"type"`
	Success bool        `json:"success"`
	Item    interface{} `json:"item,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type ItemsResponse struct {
	Type    string        `json:"type"`
	Success bool          `json:"success"`
	Items   []interface{} `json:"items,omitempty"`
	Error   string        `json:"error,omitempty"`
}

type ZoneRequest struct {
	Type         string `json:"type"`
	ZoneId       *int   `json:"zoneId,omitempty"`
	Zoneidnumber *int   `json:"zoneidnumber,omitempty"`
	ZoneName     string `json:"zoneName,omitempty"`
}

type ZoneResponse struct {
	Type    string      `json:"type"`
	Success bool        `json:"success"`
	Zone    interface{} `json:"zone,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type ZonesResponse struct {
	Type    string        `json:"type"`
	Success bool          `json:"success"`
	Zones   []interface{} `json:"zones,omitempty"`
	Error   string        `json:"error,omitempty"`
}

type ZoneNPCsResponse struct {
	Type    string        `json:"type"`
	Success bool          `json:"success"`
	NPCs    []interface{} `json:"npcs,omitempty"`
	Error   string        `json:"error,omitempty"`
}

type CharacterRequest struct {
	Type          string `json:"type"`
	CharacterName string `json:"characterName,omitempty"`
	CharacterId   *int   `json:"characterId,omitempty"`
	AccountId     *int   `json:"accountId,omitempty"`
}

type CharacterResponse struct {
	Type      string      `json:"type"`
	Success   bool        `json:"success"`
	Character interface{} `json:"character,omitempty"`
	Error     string      `json:"error,omitempty"`
}

type CharactersResponse struct {
	Type       string        `json:"type"`
	Success    bool          `json:"success"`
	Characters []interface{} `json:"characters,omitempty"`
	AccountId  *int          `json:"accountId,omitempty"`
	Error      string        `json:"error,omitempty"`
}

type ChatMessageRequest struct {
	Type        string `json:"type"`
	Text        string `json:"text"`
	MessageType string `json:"messageType"`
}

type ChatMessage struct {
	Type        string `json:"type"`
	Text        string `json:"text"`
	MessageType string `json:"messageType"`
	Timestamp   *int64 `json:"timestamp,omitempty"`
}

// WorldHandler manages global message routing and session-to-zone mapping.
type WorldHandler struct {
	zoneManager    *ZoneManager
	sessionManager *session.SessionManager // SessionManager for session context
	globalRegistry *HandlerRegistry
}

// NewWorldHandler creates a new WorldHandler.
func NewWorldHandler(zoneManager *ZoneManager, sessionManager *session.SessionManager) *WorldHandler {
	registry := NewWorldOpCodeRegistry() // Global registry
	wh := &WorldHandler{
		zoneManager:    zoneManager,
		sessionManager: sessionManager,
		globalRegistry: registry,
	}
	registry.WH = wh // Set the WorldHandler in the registry
	return wh
}

// HandlePacket processes incoming datagrams and routes them.
func (wh *WorldHandler) HandlePacket(session *session.Session, data []byte) {
	// Check if it's a JSON message (starts with '{')
	if len(data) > 0 && data[0] == '{' {
		wh.HandleJSONMessage(session, data)
		return
	}

	// Handle binary Cap'n Proto messages
	if len(data) < 2 {
		log.Printf("invalid packet length %d from session %d", len(data), session.SessionID)
		return
	}

	// Check if the message should be handled globally (e.g., login)
	if wh.globalRegistry.ShouldHandleGlobally(data) {
		if !wh.globalRegistry.HandleWorldPacket(session, data) {
			return
		}
	}

	if !session.Authenticated {
		op := binary.LittleEndian.Uint16(data[:2])
		log.Printf("unauthenticated opcode %d from session %d – dropping", op, session.SessionID)
		return
	}
	if session.ZoneID == -1 {
		log.Printf("session %d has no zone assigned, cannot handle packet", session.SessionID)
		return
	}

	// Route to the zone from the session and create if it doesn't exist
	zone, _ := wh.zoneManager.GetOrCreate(session.ZoneID, session.InstanceID)
	zone.HandleClientPacket(session, data)
}

// HandleJSONMessage processes JSON WebTransport messages
func (wh *WorldHandler) HandleJSONMessage(session *session.Session, data []byte) {
	log.Printf("Received JSON message from session %d: %s", session.SessionID, string(data))

	// Parse message type
	var baseMsg JSONMessage
	if err := json.Unmarshal(data, &baseMsg); err != nil {
		log.Printf("Failed to parse JSON message: %v", err)
		wh.SendJSONError(session, "PARSE_ERROR", "Invalid JSON format")
		return
	}

	// Route based on message type
	switch baseMsg.Type {
	case "GET_ITEM":
		wh.HandleGetItem(session, data)
	case "GET_ALL_ITEMS":
		wh.HandleGetAllItems(session, data)
	case "GET_ALL_ZONES":
		wh.HandleGetAllZones(session, data)
	case "GET_ZONE":
		wh.HandleGetZone(session, data)
	case "GET_ZONE_NPCS":
		wh.HandleGetZoneNPCs(session, data)
	case "GET_CHARACTER":
		wh.HandleGetCharacter(session, data)
	case "GET_CHARACTERS":
		wh.HandleGetCharacters(session, data)
	case "SEND_CHAT_MESSAGE":
		wh.HandleSendChatMessage(session, data)
	default:
		log.Printf("Unknown JSON message type: %s", baseMsg.Type)
		wh.SendJSONError(session, "UNKNOWN_TYPE", "Unknown message type: "+baseMsg.Type)
	}
}

// SendJSONResponse sends a JSON response back to the client
// It automatically converts struct fields from PascalCase to lowerCamelCase for TypeScript compatibility
func (wh *WorldHandler) SendJSONResponse(session *session.Session, response interface{}) {
	// Convert to lowerCamelCase keys for TypeScript client compatibility
	normalizedResponse := toLowerCamelJSON(response)

	responseBytes, err := json.Marshal(normalizedResponse)
	if err != nil {
		log.Printf("Failed to marshal JSON response: %v", err)
		return
	}

	// Send with length prefix (matching React client expectation)
	lengthBytes := make([]byte, 4)
	binary.LittleEndian.PutUint32(lengthBytes, uint32(len(responseBytes)))

	fullResponse := append(lengthBytes, responseBytes...)
	if _, err := session.ControlStream.Write(fullResponse); err != nil {
		log.Printf("Failed to send JSON response: %v", err)
	}
}

// SendJSONError sends an error response
func (wh *WorldHandler) SendJSONError(session *session.Session, errorType, errorMsg string) {
	response := map[string]interface{}{
		"type":    errorType,
		"success": false,
		"error":   errorMsg,
	}
	wh.SendJSONResponse(session, response)
}

// HandleGetItem handles GET_ITEM requests
func (wh *WorldHandler) HandleGetItem(session *session.Session, data []byte) {
	var req ItemRequest
	if err := json.Unmarshal(data, &req); err != nil {
		wh.SendJSONError(session, "ITEM_RESPONSE", "Invalid GET_ITEM request")
		return
	}

	item, err := items.GetItemTemplateByID(int32(req.ItemId))
	if err != nil {
		wh.SendJSONError(session, "ITEM_RESPONSE", "Item not found")
		return
	}

	response := ItemResponse{
		Type:    "ITEM_RESPONSE",
		Success: true,
		Item:    item,
	}
	wh.SendJSONResponse(session, response)
}

// HandleGetAllItems handles GET_ALL_ITEMS requests
func (wh *WorldHandler) HandleGetAllItems(session *session.Session, data []byte) {
	// For now, return a simple message indicating this endpoint needs implementation
	// You can implement a proper GetAllItemTemplates function in the items package
	wh.SendJSONError(session, "ITEMS_RESPONSE", "GET_ALL_ITEMS not yet implemented")
}

// HandleGetAllZones handles GET_ALL_ZONES requests
func (wh *WorldHandler) HandleGetAllZones(session *session.Session, data []byte) {
	// Query all zones from database
	ctx := context.Background()
	query := `
		SELECT id, short_name, long_name, zoneidnumber, safe_x, safe_y, safe_z, safe_heading,
		       graveyard_id, min_level, min_status, timezone, maxclients, ruleset,
		       note, underworld, minclip, maxclip, fog_minclip, fog_maxclip,
		       fog_blue, fog_red, fog_green, sky, ztype, zone_exp_multiplier,
		       gravity, time_type, fog_red1, fog_green1, fog_blue1, fog_minclip1,
		       fog_maxclip1, fog_density, flag_needed, canbind, cancombat,
		       canlevitate, castoutdoor, hotzone, peqzone, expansion, suspendbuffs,
		       rain_chance1, rain_duration1, snow_chance1, snow_duration1,
		       type, skylock, skip_los, music, random_loc, never_idle, castdungeon,
		       pull_limit, graveyard_time, max_z, min_expansion, max_expansion,
		       content_flags, content_flags_disabled, file_name, map_file_name
		FROM zone
		ORDER BY zoneidnumber
	`

	rows, err := db.GlobalWorldDB.DB.QueryContext(ctx, query)
	if err != nil {
		log.Printf("Failed to query all zones: %v", err)
		wh.SendJSONError(session, "ZONES_RESPONSE", "Failed to fetch zones")
		return
	}
	defer rows.Close()

	var zones []map[string]interface{}
	for rows.Next() {
		zone := make(map[string]interface{})
		var (
			id, zoneidnumber, graveyard_id, min_level, min_status, timezone, maxclients, ruleset             int
			underworld, minclip, maxclip, fog_minclip, fog_maxclip, fog_blue, fog_red, fog_green, sky, ztype int
			time_type, fog_red1, fog_green1, fog_blue1, fog_minclip1, fog_maxclip1                           int
			canbind, cancombat, canlevitate, castoutdoor, hotzone, peqzone, expansion, suspendbuffs          int
			rain_chance1, rain_duration1, snow_chance1, snow_duration1, type_field, skylock, skip_los, music int
			random_loc, never_idle, castdungeon, pull_limit, graveyard_time, min_expansion, max_expansion    int
			safe_x, safe_y, safe_z, safe_heading, zone_exp_multiplier, gravity, fog_density, max_z           float64
			short_name, long_name, note, flag_needed, content_flags, content_flags_disabled                  string
			file_name, map_file_name                                                                         *string
		)

		err := rows.Scan(
			&id, &short_name, &long_name, &zoneidnumber, &safe_x, &safe_y, &safe_z, &safe_heading,
			&graveyard_id, &min_level, &min_status, &timezone, &maxclients, &ruleset,
			&note, &underworld, &minclip, &maxclip, &fog_minclip, &fog_maxclip,
			&fog_blue, &fog_red, &fog_green, &sky, &ztype, &zone_exp_multiplier,
			&gravity, &time_type, &fog_red1, &fog_green1, &fog_blue1, &fog_minclip1,
			&fog_maxclip1, &fog_density, &flag_needed, &canbind, &cancombat,
			&canlevitate, &castoutdoor, &hotzone, &peqzone, &expansion, &suspendbuffs,
			&rain_chance1, &rain_duration1, &snow_chance1, &snow_duration1,
			&type_field, &skylock, &skip_los, &music, &random_loc, &never_idle, &castdungeon,
			&pull_limit, &graveyard_time, &max_z, &min_expansion, &max_expansion,
			&content_flags, &content_flags_disabled, &file_name, &map_file_name,
		)
		if err != nil {
			log.Printf("Error scanning zone row: %v", err)
			continue
		}

		// Build zone object matching React's Zone interface
		zone["id"] = id
		zone["short_name"] = short_name
		zone["long_name"] = long_name
		zone["zoneidnumber"] = zoneidnumber
		zone["safe_x"] = safe_x
		zone["safe_y"] = safe_y
		zone["safe_z"] = safe_z
		zone["safe_heading"] = safe_heading
		zone["graveyard_id"] = graveyard_id
		zone["min_level"] = min_level
		zone["min_status"] = min_status
		zone["timezone"] = timezone
		zone["maxclients"] = maxclients
		zone["ruleset"] = ruleset
		zone["note"] = note
		zone["underworld"] = underworld
		zone["minclip"] = minclip
		zone["maxclip"] = maxclip
		zone["fog_minclip"] = fog_minclip
		zone["fog_maxclip"] = fog_maxclip
		zone["fog_blue"] = fog_blue
		zone["fog_red"] = fog_red
		zone["fog_green"] = fog_green
		zone["sky"] = sky
		zone["ztype"] = ztype
		zone["zone_exp_multiplier"] = zone_exp_multiplier
		zone["gravity"] = gravity
		zone["time_type"] = time_type
		zone["fog_red1"] = fog_red1
		zone["fog_green1"] = fog_green1
		zone["fog_blue1"] = fog_blue1
		zone["fog_minclip1"] = fog_minclip1
		zone["fog_maxclip1"] = fog_maxclip1
		zone["fog_density"] = fog_density
		zone["flag_needed"] = flag_needed
		zone["canbind"] = canbind
		zone["cancombat"] = cancombat
		zone["canlevitate"] = canlevitate
		zone["castoutdoor"] = castoutdoor
		zone["hotzone"] = hotzone
		zone["peqzone"] = peqzone
		zone["expansion"] = expansion
		zone["suspendbuffs"] = suspendbuffs
		zone["rain_chance1"] = rain_chance1
		zone["rain_duration1"] = rain_duration1
		zone["snow_chance1"] = snow_chance1
		zone["snow_duration1"] = snow_duration1
		zone["type"] = type_field
		zone["skylock"] = skylock
		zone["skip_los"] = skip_los
		zone["music"] = music
		zone["random_loc"] = random_loc
		zone["never_idle"] = never_idle
		zone["castdungeon"] = castdungeon
		zone["pull_limit"] = pull_limit
		zone["graveyard_time"] = graveyard_time
		zone["max_z"] = max_z
		zone["min_expansion"] = min_expansion
		zone["max_expansion"] = max_expansion
		zone["content_flags"] = content_flags
		zone["content_flags_disabled"] = content_flags_disabled
		zone["file_name"] = file_name
		zone["map_file_name"] = map_file_name

		zones = append(zones, zone)
	}

	if err = rows.Err(); err != nil {
		log.Printf("Error iterating zone rows: %v", err)
		wh.SendJSONError(session, "ZONES_RESPONSE", "Failed to fetch zones")
		return
	}

	// Convert to []interface{} for JSON response
	zonesInterface := make([]interface{}, len(zones))
	for i, zone := range zones {
		zonesInterface[i] = zone
	}

	response := ZonesResponse{
		Type:    "ZONES_RESPONSE",
		Success: true,
		Zones:   zonesInterface,
	}
	wh.SendJSONResponse(session, response)
	log.Printf("Sent %d zones to session %d", len(zones), session.SessionID)
}

// HandleGetZone handles GET_ZONE requests
func (wh *WorldHandler) HandleGetZone(session *session.Session, data []byte) {
	var req ZoneRequest
	if err := json.Unmarshal(data, &req); err != nil {
		wh.SendJSONError(session, "ZONE_RESPONSE", "Invalid GET_ZONE request")
		return
	}

	var zone interface{}
	var err error
	ctx := context.Background()

	if req.Zoneidnumber != nil {
		zone, err = db_zone.GetZoneById(ctx, *req.Zoneidnumber)
	} else {
		wh.SendJSONError(session, "ZONE_RESPONSE", "Missing zoneidnumber")
		return
	}

	if err != nil {
		wh.SendJSONError(session, "ZONE_RESPONSE", "Zone not found")
		return
	}

	response := ZoneResponse{
		Type:    "ZONE_RESPONSE",
		Success: true,
		Zone:    zone,
	}
	wh.SendJSONResponse(session, response)
}

// HandleGetZoneNPCs handles GET_ZONE_NPCS requests
func (wh *WorldHandler) HandleGetZoneNPCs(session *session.Session, data []byte) {
	var req ZoneRequest
	if err := json.Unmarshal(data, &req); err != nil {
		wh.SendJSONError(session, "ZONE_NPCS_RESPONSE", "Invalid GET_ZONE_NPCS request")
		return
	}

	// Get zone name from request
	zoneName := req.ZoneName
	if zoneName == "" {
		wh.SendJSONError(session, "ZONE_NPCS_RESPONSE", "Missing zoneName in request")
		return
	}

	// Query NPCs from the zone spawn pool
	spawnPool, err := db_zone.GetZoneSpawnPool(zoneName)
	if err != nil {
		log.Printf("Failed to get zone spawn pool for %s: %v", zoneName, err)
		wh.SendJSONError(session, "ZONE_NPCS_RESPONSE", "Failed to fetch zone NPCs")
		return
	}

	// Extract unique NPCs from spawn pool
	npcMap := make(map[int32]interface{})
	for _, entry := range spawnPool {
		for _, spawnEntry := range entry.SpawnEntries {
			if spawnEntry.NPCType != nil {
				npcMap[spawnEntry.NPCType.ID] = spawnEntry.NPCType
			}
		}
	}

	// Convert map to slice
	npcs := make([]interface{}, 0, len(npcMap))
	for _, npc := range npcMap {
		npcs = append(npcs, npc)
	}

	response := ZoneNPCsResponse{
		Type:    "ZONE_NPCS_RESPONSE",
		Success: true,
		NPCs:    npcs,
	}
	wh.SendJSONResponse(session, response)
	log.Printf("Sent %d NPCs for zone %s to session %d", len(npcs), zoneName, session.SessionID)
}

// HandleGetCharacter handles GET_CHARACTER requests
func (wh *WorldHandler) HandleGetCharacter(session *session.Session, data []byte) {
	var req CharacterRequest
	if err := json.Unmarshal(data, &req); err != nil {
		wh.SendJSONError(session, "CHARACTER_RESPONSE", "Invalid GET_CHARACTER request")
		return
	}

	var character interface{}
	var err error

	if req.CharacterName != "" {
		character, err = db_character.GetCharacterByName(req.CharacterName)
	} else if req.CharacterId != nil {
		// GetCharacterByID not implemented yet
		wh.SendJSONError(session, "CHARACTER_RESPONSE", "GetCharacterByID not yet implemented")
		return
	} else {
		wh.SendJSONError(session, "CHARACTER_RESPONSE", "Missing characterName or characterId")
		return
	}

	if err != nil {
		wh.SendJSONError(session, "CHARACTER_RESPONSE", "Character not found")
		return
	}

	response := CharacterResponse{
		Type:      "CHARACTER_RESPONSE",
		Success:   true,
		Character: character,
	}
	wh.SendJSONResponse(session, response)
}

// HandleGetCharacters handles GET_CHARACTERS requests
func (wh *WorldHandler) HandleGetCharacters(session *session.Session, data []byte) {
	var req CharacterRequest
	if err := json.Unmarshal(data, &req); err != nil {
		wh.SendJSONError(session, "CHARACTERS_RESPONSE", "Invalid GET_CHARACTERS request")
		return
	}

	if req.AccountId == nil {
		wh.SendJSONError(session, "CHARACTERS_RESPONSE", "Missing accountId")
		return
	}

	// For now, return a simple message indicating this endpoint needs implementation
	wh.SendJSONError(session, "CHARACTERS_RESPONSE", "GET_CHARACTERS not yet implemented")
}

// HandleSendChatMessage handles SEND_CHAT_MESSAGE requests
func (wh *WorldHandler) HandleSendChatMessage(session *session.Session, data []byte) {
	var req ChatMessageRequest
	if err := json.Unmarshal(data, &req); err != nil {
		log.Printf("Failed to parse chat message: %v", err)
		return
	}

	// Broadcast chat message to all connected clients
	// For now, just echo back to the sender - you can extend this to broadcast
	timestamp := int64(0) // You might want to use time.Now().Unix()
	response := ChatMessage{
		Type:        "CHAT_MESSAGE",
		Text:        req.Text,
		MessageType: req.MessageType,
		Timestamp:   &timestamp,
	}

	wh.SendJSONResponse(session, response)
	log.Printf("Chat message from session %d: [%s] %s", session.SessionID, req.MessageType, req.Text)
}

// RemoveSession cleans up session data.
func (wh *WorldHandler) RemoveSession(sessionID int) {
	ses, ok := wh.sessionManager.GetSession(sessionID)
	if ok && ses != nil && ses.ZoneID != -1 {
		zoneInstance, ok := wh.zoneManager.Get(ses.ZoneID, ses.InstanceID)
		if ok {
			zoneInstance.RemoveClient(sessionID)
		}
	}
	wh.sessionManager.RemoveSession(sessionID)

}

type zoneKey struct {
	ZoneID     int
	InstanceID int
}

// ZoneManager tracks all instances.
type ZoneManager struct {
	mu    sync.Mutex
	zones map[zoneKey]*zone.ZoneInstance
}

func NewZoneManager() *ZoneManager {
	return &ZoneManager{
		zones: make(map[zoneKey]*zone.ZoneInstance),
	}
}

func (m *ZoneManager) Get(zoneID, instanceID int) (*zone.ZoneInstance, bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	key := zoneKey{ZoneID: zoneID, InstanceID: instanceID}
	inst, ok := m.zones[key]
	return inst, ok
}

// GetOrCreate retrieves or creates a zone instance.
func (m *ZoneManager) GetOrCreate(zoneID, instanceID int) (*zone.ZoneInstance, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	key := zoneKey{ZoneID: zoneID, InstanceID: instanceID}
	if inst, ok := m.zones[key]; ok {
		return inst, nil
	}
	inst := zone.NewZoneInstance(zoneID, instanceID)
	m.zones[key] = inst
	return inst, nil
}

func (m *ZoneManager) Shutdown() {
	m.mu.Lock()
	defer m.mu.Unlock()
	for _, inst := range m.zones {
		inst.Stop()
	}
}
