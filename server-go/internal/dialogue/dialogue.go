package dialogue

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/go-jet/jet/v2/mysql"
	"github.com/knervous/eqgo/internal/db"
	"github.com/knervous/eqgo/internal/db/jetgen/eqgo/model"
	"github.com/knervous/eqgo/internal/db/jetgen/eqgo/table"
)

// DialogueEntry represents a single exchange in dialogue history
type DialogueEntry struct {
	NPCDialogue    string `json:"npcDialogue"`
	PlayerQuestion string `json:"playerQuestion,omitempty"`
}

// DialogueResponse represents the LLM response for NPC dialogue
type DialogueResponse struct {
	Dialogue  string   `json:"dialogue"`
	Responses []string `json:"responses,omitempty"`
}

// Service handles NPC dialogue generation using LLM
type Service struct {
	apiKey     string
	apiBaseURL string
	model      string
}

// NewService creates a new dialogue service
func NewService() *Service {
	apiKey := os.Getenv("OPENAI_API_KEY")
	if apiKey == "" {
		log.Println("Warning: OPENAI_API_KEY not set, dialogue generation will return placeholders")
	}

	return &Service{
		apiKey:     apiKey,
		apiBaseURL: "https://api.openai.com/v1/chat/completions",
		model:      "gpt-4o-mini",
	}
}

// GetNPCDialogue generates dialogue for an NPC using LLM
func (s *Service) GetNPCDialogue(ctx context.Context, npcName string, dialogueHistory []DialogueEntry) (*DialogueResponse, error) {
	log.Printf("Getting dialogue for NPC: %s", npcName)

	// Get LUA script from database
	luaScript, err := s.getLuaScript(ctx, npcName)
	if err != nil {
		log.Printf("Error getting LUA script for %s: %v", npcName, err)
		// Continue without script - we'll generate generic dialogue
	}

	// If no API key, return placeholder
	if s.apiKey == "" {
		return &DialogueResponse{
			Dialogue:  "The NPC looks at you curiously.",
			Responses: []string{},
		}, nil
	}

	// Build messages for LLM
	messages := s.buildMessages(npcName, luaScript, dialogueHistory)

	// Call LLM API
	response, err := s.callLLM(ctx, messages)
	if err != nil {
		log.Printf("Error calling LLM for %s: %v", npcName, err)
		return &DialogueResponse{
			Dialogue:  "The NPC looks at you curiously.",
			Responses: []string{},
		}, nil
	}

	log.Printf("Dialogue response received for %s", npcName)
	return response, nil
}

// getLuaScript retrieves the LUA script for an NPC from the database
func (s *Service) getLuaScript(ctx context.Context, npcName string) (string, error) {
	if db.GlobalWorldDB == nil {
		return "", fmt.Errorf("database not initialized")
	}

	var quest model.Quests
	err := table.Quests.
		SELECT(table.Quests.LuaContent).
		FROM(table.Quests).
		WHERE(table.Quests.Name.EQ(mysql.String(npcName))).
		LIMIT(1).
		QueryContext(ctx, db.GlobalWorldDB.DB, &quest)

	if err != nil {
		return "", err
	}

	if quest.LuaContent == nil {
		return "", nil
	}

	return *quest.LuaContent, nil
}

// buildMessages constructs the chat messages for the LLM
func (s *Service) buildMessages(npcName, luaScript string, dialogueHistory []DialogueEntry) []map[string]string {
	nonDialogueInstruction := "You are an AI assistant creating dialogue for NPCs in a fantasy MMORPG setting, EverQuest. " +
		"Generate a brief, context-appropriate response for an NPC when approached by a player. " +
		"The player is interacting with this NPC despite the NPC not having any dialogue for the player, often because it's a non-speaking creature like an animal. Simply describe what the NPC is doing in response to being talked at, but do not give it any speaking lines. For example, the NPC might look at the player and walk away. Or ignore them entirely." +
		"Format your response as a JSON object with 'dialogue' property. "

	sharedInstruction := "Do not make up details about an NPC's species if you do not know. Do not make up details about an NPC's species if you do not know (e.g. don't make the NPC a unicorn unless it's obvious from the name). Do not make inanimate objects act like they're alive (they don't look at things). Things like boats may have dialogue associated in the LUA script but still do not treat them like they can speak. SirensBane and Stormbreaker are ships, do not make them talk or look at things. Do not refer to 'the player' and instead say 'you' "

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
				"content": fmt.Sprintf("NPC named %s and LUA script:\n\n%s", npcName, luaScript),
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
				"content": fmt.Sprintf("Create a description of the actions of an NPC named %s when approached by a player. "+
					"No specific script is available, so use your knowledge of EverQuest to create an appropriate response. ", npcName),
			},
		}
	}

	// Add dialogue history if present
	if len(dialogueHistory) > 0 {
		historyContent := ""
		for _, entry := range dialogueHistory {
			historyContent += entry.NPCDialogue
			if entry.PlayerQuestion != "" {
				historyContent += "\nPlayer: " + entry.PlayerQuestion
			}
			historyContent += "\n"
		}
		messages = append(messages, map[string]string{
			"role":    "user",
			"content": fmt.Sprintf("Previous dialogue:\n%s\n\nContinue the conversation based on this context.", historyContent),
		})
	}

	return messages
}

// callLLM makes the API call to OpenAI
func (s *Service) callLLM(ctx context.Context, messages []map[string]string) (*DialogueResponse, error) {
	requestBody := map[string]interface{}{
		"model":           s.model,
		"messages":        messages,
		"response_format": map[string]string{"type": "json_object"},
	}

	jsonBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", s.apiBaseURL, bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("API returned status %d: %s", resp.StatusCode, string(body))
	}

	var apiResponse struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if len(apiResponse.Choices) == 0 {
		return nil, fmt.Errorf("no choices in API response")
	}

	var dialogueResp DialogueResponse
	if err := json.Unmarshal([]byte(apiResponse.Choices[0].Message.Content), &dialogueResp); err != nil {
		return nil, fmt.Errorf("failed to parse dialogue response: %w", err)
	}

	return &dialogueResp, nil
}
