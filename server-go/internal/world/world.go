package world

import (
	"bytes"
	"context"
	"encoding/binary"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"reflect"
	"strings"
	"sync"
	"time"
	"unicode"

	"github.com/knervous/eqgo/internal/db"
	db_character "github.com/knervous/eqgo/internal/db/character"
	"github.com/knervous/eqgo/internal/db/items"
	db_zone "github.com/knervous/eqgo/internal/db/zone"
	"github.com/knervous/eqgo/internal/session"
	"github.com/knervous/eqgo/internal/zone"
	"github.com/knervous/eqgo/internal/zone/client"
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

// Dialogue request/response types
type DialogueEntry struct {
	NpcDialogue    string  `json:"npcDialogue"`
	PlayerQuestion *string `json:"playerQuestion,omitempty"`
	IsPlayer       *bool   `json:"isPlayer,omitempty"`
}

type DialogueRequest struct {
	Type            string          `json:"type"`
	NpcName         string          `json:"npcName"`
	DialogueHistory []DialogueEntry `json:"dialogueHistory,omitempty"`
}

type DialogueResponse struct {
	Type      string   `json:"type"`
	Success   bool     `json:"success"`
	Dialogue  string   `json:"dialogue,omitempty"`
	Responses []string `json:"responses,omitempty"`
	NpcName   string   `json:"npcName,omitempty"`
	Error     string   `json:"error,omitempty"`
}

// HandleGetNPCDialogue handles dialogue requests by calling OpenRouter API
func (wh *WorldHandler) HandleGetNPCDialogue(session *session.Session, data []byte) {
	var req DialogueRequest
	if err := json.Unmarshal(data, &req); err != nil {
		wh.SendJSONError(session, "DIALOGUE_RESPONSE", "Invalid GET_NPC_DIALOGUE request")
		return
	}

	if strings.TrimSpace(req.NpcName) == "" {
		wh.SendJSONError(session, "DIALOGUE_RESPONSE", "Missing npcName in request")
		return
	}

	// Get OpenRouter API key from environment
	apiKey := os.Getenv("OPENROUTER_API_KEY")
	if apiKey == "" {
		// Fall back to OpenAI key if OpenRouter not set
		apiKey = os.Getenv("OPENAI_API_KEY")
	}
	if apiKey == "" {
		wh.SendJSONError(session, "DIALOGUE_RESPONSE", "API key not configured")
		return
	}

	// TODO: Add SQLite support to look up NPC's quest script from eq_database.db
	// For now, we generate dialogue without the Lua script context
	luaScript := ""

	// Build the prompt
	nonDialogueInstruction := "You are an AI assistant creating dialogue for NPCs in a fantasy MMORPG setting, EverQuest. " +
		"Generate a brief, context-appropriate response for an NPC when approached by a player. " +
		"The player is interacting with this NPC despite the NPC not having any dialogue for the player, often because it's a non-speaking creature like an animal. Simply describe what the NPC is doing in response to being talked at, but do not give it any speaking lines. For example, the NPC might look at the player and walk away. Or ignore them entirely. " +
		"Format your response as a JSON object with 'dialogue' property. "

	sharedInstruction := "Do not make up details about an NPC's species if you do not know. Do not make up details about an NPC's species if you do not know (e.g. don't make the NPC a unicorn unless it's obvious from the name). Do not make inanimate objects act like they're alive (they don't look at things). Things like boats may have dialogue associated in the LUA script but still do not treat them like they can speak. SirensBane and Stormbreaker are ships, do not make them talk or look at things. Do not refer to 'the player' and instead say 'you'. "

	var messages []map[string]string

	if luaScript != "" {
		messages = []map[string]string{
			{
				"role": "system",
				"content": "You are an AI assistant that analyzes Lua scripts for NPCs from the 1999 MMORPG EverQuest. " +
					"Extract the dialogue from the NPC script and provide one to three responses for the user to choose from " +
					"to further progress the dialogue. Only provide multiple responses if there are multiple areas for the " +
					"conversation to progress to. Only present the opening dialogue from the script. Format your response as " +
					"a JSON object with 'dialogue' and 'responses' fields. If the LUA script has no dialogue and is only event scripting, then " +
					nonDialogueInstruction + sharedInstruction,
			},
			{
				"role":    "user",
				"content": "NPC named " + req.NpcName + " and LUA script:\n\n" + luaScript,
			},
		}
	} else {
		messages = []map[string]string{
			{
				"role":    "system",
				"content": nonDialogueInstruction + sharedInstruction,
			},
			{
				"role": "user",
				"content": "Create a description of the actions of an NPC named " + req.NpcName + " when approached by a player. " +
					"No specific script is available, so use your knowledge of EverQuest to create an appropriate response. ",
			},
		}
	}

	// Add dialogue history if present
	if len(req.DialogueHistory) > 0 {
		var historyContent strings.Builder
		for _, entry := range req.DialogueHistory {
			historyContent.WriteString(entry.NpcDialogue)
			if entry.PlayerQuestion != nil && *entry.PlayerQuestion != "" {
				historyContent.WriteString("\nPlayer: ")
				historyContent.WriteString(*entry.PlayerQuestion)
			}
			historyContent.WriteString("\n")
		}
		messages = append(messages, map[string]string{
			"role":    "user",
			"content": "Previous dialogue:\n" + historyContent.String() + "\n\nContinue the conversation based on this context.",
		})
	}

	// Determine API URL - use OpenRouter by default, fall back to OpenAI
	apiURL := os.Getenv("LLM_API_URL")
	if apiURL == "" {
		apiURL = "https://openrouter.ai/api/v1/chat/completions"
	}

	// Get model from env or use default
	model := os.Getenv("LLM_MODEL")
	if model == "" {
		model = "openai/gpt-4o-mini"
	}

	payload, err := json.Marshal(map[string]interface{}{
		"model":    model,
		"messages": messages,
		"response_format": map[string]string{
			"type": "json_object",
		},
	})
	if err != nil {
		wh.SendJSONError(session, "DIALOGUE_RESPONSE", "Failed to marshal API request")
		return
	}

	httpClient := &http.Client{Timeout: 30 * time.Second}
	httpReq, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(payload))
	if err != nil {
		wh.SendJSONError(session, "DIALOGUE_RESPONSE", "Failed to create API request")
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)
	// OpenRouter-specific headers
	httpReq.Header.Set("HTTP-Referer", "https://idlequest.app")
	httpReq.Header.Set("X-Title", "IdleQuest")

	resp, err := httpClient.Do(httpReq)
	if err != nil {
		log.Printf("LLM API error: %v", err)
		wh.SendJSONError(session, "DIALOGUE_RESPONSE", "LLM service unavailable")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		log.Printf("LLM API returned status %d", resp.StatusCode)
		wh.SendJSONError(session, "DIALOGUE_RESPONSE", "LLM service error")
		return
	}

	var apiResponse struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		wh.SendJSONError(session, "DIALOGUE_RESPONSE", "Failed to parse API response")
		return
	}

	if len(apiResponse.Choices) == 0 {
		wh.SendJSONError(session, "DIALOGUE_RESPONSE", "No response from LLM")
		return
	}

	// Parse the JSON content from the LLM response
	var dialogueContent struct {
		Dialogue  string   `json:"dialogue"`
		Responses []string `json:"responses"`
	}
	if err := json.Unmarshal([]byte(apiResponse.Choices[0].Message.Content), &dialogueContent); err != nil {
		log.Printf("Failed to parse dialogue JSON: %v, content: %s", err, apiResponse.Choices[0].Message.Content)
		// If parsing fails, use the raw content as dialogue
		dialogueContent.Dialogue = apiResponse.Choices[0].Message.Content
	}

	response := DialogueResponse{
		Type:      "DIALOGUE_RESPONSE",
		Success:   true,
		Dialogue:  dialogueContent.Dialogue,
		Responses: dialogueContent.Responses,
		NpcName:   req.NpcName,
	}

	wh.SendJSONResponse(session, response)
	log.Printf("Sent dialogue for NPC %s to session %d", req.NpcName, session.SessionID)
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
	case "GET_ADJACENT_ZONES":
		wh.HandleGetAdjacentZones(session, data)
	case "GET_NPC_DIALOGUE":
		wh.HandleGetNPCDialogue(session, data)
	case "GET_CHARACTER":
		wh.HandleGetCharacter(session, data)
	case "GET_CHARACTERS":
		wh.HandleGetCharacters(session, data)
	case "SEND_CHAT_MESSAGE":
		wh.HandleSendChatMessage(session, data)
	case "CREATE_CHARACTER":
		wh.HandleCreateCharacter(session, data)
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
	// Query all zones from database - use minimal essential columns only
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
		       type, skylock
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
			rain_chance1, rain_duration1, snow_chance1, snow_duration1, type_field, skylock                  int
			safe_x, safe_y, safe_z, safe_heading, zone_exp_multiplier, gravity, fog_density                  float64
			short_name, long_name, note, flag_needed                                                         string
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
			&type_field, &skylock,
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
		// Set missing columns to defaults
		zone["skip_los"] = 0
		zone["music"] = 0
		zone["random_loc"] = 0
		zone["never_idle"] = 0
		zone["castdungeon"] = 0
		zone["pull_limit"] = 0
		zone["graveyard_time"] = 0
		zone["max_z"] = 0.0
		zone["min_expansion"] = 0
		zone["max_expansion"] = 0
		zone["content_flags"] = ""
		zone["content_flags_disabled"] = ""
		zone["file_name"] = nil
		zone["map_file_name"] = nil

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

// AdjacentZonesRequest represents a request for adjacent zones
type AdjacentZonesRequest struct {
	Type   string `json:"type"`
	ZoneId int    `json:"zoneId"`
}

// AdjacentZonesResponse represents the response with adjacent zones
type AdjacentZonesResponse struct {
	Type    string        `json:"type"`
	Success bool          `json:"success"`
	Zones   []interface{} `json:"zones,omitempty"`
	Error   string        `json:"error,omitempty"`
}

// HandleGetAdjacentZones handles GET_ADJACENT_ZONES requests
func (wh *WorldHandler) HandleGetAdjacentZones(session *session.Session, data []byte) {
	var req AdjacentZonesRequest
	if err := json.Unmarshal(data, &req); err != nil {
		wh.SendJSONError(session, "ADJACENT_ZONES_RESPONSE", "Invalid GET_ADJACENT_ZONES request")
		return
	}

	if req.ZoneId == 0 {
		wh.SendJSONError(session, "ADJACENT_ZONES_RESPONSE", "Missing zoneId in request")
		return
	}

	// Get the current zone to find its short name
	currentZone, err := db_zone.GetZoneById(context.Background(), req.ZoneId)
	if err != nil || currentZone == nil {
		wh.SendJSONError(session, "ADJACENT_ZONES_RESPONSE", "Current zone not found")
		return
	}

	// Get zone points (connections) from this zone
	zonePoints, err := db_zone.GetZonePointsByZoneName(*currentZone.ShortName)
	if err != nil {
		log.Printf("Failed to get zone points for zone %s: %v", *currentZone.ShortName, err)
		wh.SendJSONError(session, "ADJACENT_ZONES_RESPONSE", "Failed to fetch zone connections")
		return
	}

	// Get unique target zone IDs
	targetZoneIds := make(map[uint32]bool)
	for _, zp := range zonePoints {
		targetZoneIds[zp.TargetZoneID] = true
	}

	// Fetch zone details for each target zone
	// Track zones by long_name to filter out duplicate high-ID versions (instanced zones)
	// Use long_name because instanced zones often have the same display name but different short_name
	zonesByLongName := make(map[string]interface{})
	zoneIdByLongName := make(map[string]uint32)

	for targetZoneId := range targetZoneIds {
		// Skip the current zone - no need to show it as an adjacent option
		if int(targetZoneId) == req.ZoneId {
			continue
		}

		zone, err := db_zone.GetZoneById(context.Background(), int(targetZoneId))
		if err != nil || zone == nil {
			continue
		}

		longName := zone.LongName

		// If we already have this zone by long_name, keep the one with the lower ID
		// Higher IDs are typically instanced/special versions
		if existingId, exists := zoneIdByLongName[longName]; exists {
			if targetZoneId < existingId {
				zonesByLongName[longName] = zone
				zoneIdByLongName[longName] = targetZoneId
			}
		} else {
			zonesByLongName[longName] = zone
			zoneIdByLongName[longName] = targetZoneId
		}
	}

	// Convert map to slice
	zones := make([]interface{}, 0, len(zonesByLongName))
	for _, zone := range zonesByLongName {
		zones = append(zones, zone)
	}

	response := AdjacentZonesResponse{
		Type:    "ADJACENT_ZONES_RESPONSE",
		Success: true,
		Zones:   zones,
	}
	wh.SendJSONResponse(session, response)
	log.Printf("Sent %d adjacent zones for zone %d to session %d", len(zones), req.ZoneId, session.SessionID)
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

// CreateCharacterRequest represents a request to create a new character
type CreateCharacterRequest struct {
	Type   string `json:"type"`
	Name   string `json:"name"`
	Race   uint16 `json:"race"`
	Class  uint8  `json:"class"`
	Deity  uint32 `json:"deity"`
	ZoneID uint32 `json:"zoneId"`
	Gender uint8  `json:"gender"`
	Face   uint32 `json:"face"`
	Str    uint32 `json:"str"`
	Sta    uint32 `json:"sta"`
	Cha    uint32 `json:"cha"`
	Dex    uint32 `json:"dex"`
	Int    uint32 `json:"int"`
	Agi    uint32 `json:"agi"`
	Wis    uint32 `json:"wis"`
}

// InventoryItemResponse represents an inventory item in the response
type InventoryItemResponse struct {
	SlotID  uint32 `json:"slotId"`
	ItemID  uint32 `json:"itemId"`
	Charges uint16 `json:"charges"`
}

// CreateCharacterResponse represents the ack response after creating a character
type CreateCharacterResponse struct {
	Type          string `json:"type"`
	Success       bool   `json:"success"`
	CharacterID   uint32 `json:"characterId,omitempty"`
	CharacterName string `json:"characterName,omitempty"` // Echoed back for request matching
	Error         string `json:"error,omitempty"`
}

// CharacterStateMessage is pushed to client with full character state (source of truth)
type CharacterStateMessage struct {
	Type      string                  `json:"type"`
	Character interface{}             `json:"character"`
	Inventory []InventoryItemResponse `json:"inventory"`
}

// HandleCreateCharacter handles CREATE_CHARACTER requests
func (wh *WorldHandler) HandleCreateCharacter(session *session.Session, data []byte) {
	var req CreateCharacterRequest
	if err := json.Unmarshal(data, &req); err != nil {
		wh.SendJSONError(session, "CHARACTER_CREATED_RESPONSE", "Invalid CREATE_CHARACTER request")
		return
	}

	log.Printf("Creating character: %s (race=%d, class=%d, deity=%d, zone=%d)",
		req.Name, req.Race, req.Class, req.Deity, req.ZoneID)

	ctx := context.Background()

	// 1. Insert new character into character_data table with placeholder HP
	// We'll update it after creating a Client which calculates proper stats
	timestamp := uint32(time.Now().Unix())
	// Use a normal double-quoted string so we can include the `int` column name safely
	insertQuery := "INSERT INTO character_data (" +
		"account_id, name, last_name, title, suffix, " +
		"zone_id, zone_instance, x, y, z, heading, " +
		"gender, race, class, level, deity, " +
		"birthday, last_login, time_played, anon, gm, face, " +
		"exp, exp_enabled, cur_hp, mana, endurance, intoxication, " +
		"str, sta, cha, dex, `int`, agi, wis, " +
		"hunger_level, thirst_level" +
		") VALUES (" +
		"?, ?, '', '', '', " +
		"?, 0, 0, 0, 0, 0, " +
		"?, ?, ?, 1, ?, " +
		"?, ?, 0, 0, 0, ?, " +
		"0, 1, 1, 0, 0, 0, " + // cur_hp=1 placeholder, will be updated
		"?, ?, ?, ?, ?, ?, ?, " +
		"6000, 6000" +
		")"

	// Use account_id = 1 for now (single-player mode)
	accountID := int32(1)

	result, err := db.GlobalWorldDB.DB.ExecContext(ctx, insertQuery,
		accountID, req.Name,
		req.ZoneID,
		req.Gender, req.Race, req.Class, req.Deity,
		timestamp, timestamp, req.Face,
		req.Str, req.Sta, req.Cha, req.Dex, req.Int, req.Agi, req.Wis,
	)
	if err != nil {
		log.Printf("Failed to insert character: %v", err)
		// Send error response with character name for request matching
		errorResponse := CreateCharacterResponse{
			Type:          "CHARACTER_CREATED_RESPONSE",
			Success:       false,
			CharacterName: req.Name,
			Error:         "Failed to create character: " + err.Error(),
		}
		wh.SendJSONResponse(session, errorResponse)
		return
	}

	characterID, err := result.LastInsertId()
	if err != nil {
		log.Printf("Failed to get character ID: %v", err)
		errorResponse := CreateCharacterResponse{
			Type:          "CHARACTER_CREATED_RESPONSE",
			Success:       false,
			CharacterName: req.Name,
			Error:         "Failed to get character ID",
		}
		wh.SendJSONResponse(session, errorResponse)
		return
	}

	log.Printf("Created character with ID: %d", characterID)

	// 2. Query starting_items for matching race/class/deity/zone
	// The starting_items table uses comma-separated lists for race_list, class_list, deity_list, zone_id_list
	// A value of NULL or empty string means "any"
	startingItemsQuery := `
		SELECT item_id, item_charges, inventory_slot
		FROM starting_items
		WHERE (class_list IS NULL OR class_list = '' OR FIND_IN_SET(?, class_list) > 0)
		  AND (race_list IS NULL OR race_list = '' OR FIND_IN_SET(?, race_list) > 0)
		  AND (deity_list IS NULL OR deity_list = '' OR FIND_IN_SET(?, deity_list) > 0)
		  AND (zone_id_list IS NULL OR zone_id_list = '' OR FIND_IN_SET(?, zone_id_list) > 0)
	`

	rows, err := db.GlobalWorldDB.DB.QueryContext(ctx, startingItemsQuery,
		req.Class, req.Race, req.Deity, req.ZoneID)
	if err != nil {
		log.Printf("Failed to query starting items: %v", err)
		// Continue anyway - character is created, just no starting items
	}

	var inventoryItems []InventoryItemResponse
	if rows != nil {
		defer rows.Close()

		// 3. Insert starting items into inventory table
		slotCounter := uint32(22) // Start at general inventory slot 22 (first general slot)
		for rows.Next() {
			var itemID uint32
			var itemCharges uint8
			var inventorySlot int32

			if err := rows.Scan(&itemID, &itemCharges, &inventorySlot); err != nil {
				log.Printf("Error scanning starting item: %v", err)
				continue
			}

			// Use the specified slot if valid, otherwise auto-assign
			var slotID uint32
			if inventorySlot >= 0 {
				slotID = uint32(inventorySlot)
			} else {
				slotID = slotCounter
				slotCounter++
			}

			// Insert into inventory table
			insertInvQuery := `
				INSERT INTO inventory (charid, slotid, itemid, charges)
				VALUES (?, ?, ?, ?)
			`
			_, err := db.GlobalWorldDB.DB.ExecContext(ctx, insertInvQuery,
				characterID, slotID, itemID, itemCharges)
			if err != nil {
				log.Printf("Failed to insert inventory item %d: %v", itemID, err)
				continue
			}

			inventoryItems = append(inventoryItems, InventoryItemResponse{
				SlotID:  slotID,
				ItemID:  itemID,
				Charges: uint16(itemCharges),
			})

			log.Printf("Added starting item %d to slot %d for character %d", itemID, slotID, characterID)
		}
	}

	// 4. Fetch the created character
	character, err := db_character.GetCharacterByName(req.Name)
	if err != nil {
		log.Printf("Failed to fetch created character: %v", err)
		errorResponse := CreateCharacterResponse{
			Type:          "CHARACTER_CREATED_RESPONSE",
			Success:       false,
			CharacterName: req.Name,
			Error:         "Failed to fetch created character",
		}
		wh.SendJSONResponse(session, errorResponse)
		return
	}

	// 5. Create a Client to calculate proper stats using existing zone/client logic
	// This calls CalcBonuses() which runs CalcMaxHP(), CalcMaxMana(), etc.
	playerClient, err := client.NewClient(character)
	if err != nil {
		log.Printf("Failed to create client for stat calculation: %v", err)
		// Continue with raw character data if client creation fails
	} else {
		// Get the calculated HP/mana from the Client's mob
		mob := playerClient.Mob()
		calculatedHP := mob.MaxHp
		calculatedMana := mob.MaxMana

		// Update the character in DB with calculated values
		updateQuery := "UPDATE character_data SET cur_hp = ?, mana = ? WHERE id = ?"
		_, err = db.GlobalWorldDB.DB.ExecContext(ctx, updateQuery, calculatedHP, calculatedMana, characterID)
		if err != nil {
			log.Printf("Failed to update character HP/mana: %v", err)
		} else {
			// Update the character struct with calculated values for the response
			character.CurHp = uint32(calculatedHP)
			character.Mana = uint32(calculatedMana)
			log.Printf("Updated character %s with calculated HP=%d, Mana=%d", req.Name, calculatedHP, calculatedMana)
		}
	}

	// Send ack response first (for request/response matching)
	ackResponse := CreateCharacterResponse{
		Type:          "CHARACTER_CREATED_RESPONSE",
		Success:       true,
		CharacterID:   uint32(characterID),
		CharacterName: req.Name,
	}
	wh.SendJSONResponse(session, ackResponse)

	// Then push the full character state (source of truth for client)
	stateMessage := CharacterStateMessage{
		Type:      "CHARACTER_STATE",
		Character: character,
		Inventory: inventoryItems,
	}
	wh.SendJSONResponse(session, stateMessage)

	log.Printf("Character %s created successfully with %d starting items", req.Name, len(inventoryItems))
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
