package dialogue

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/go-jet/jet/v2/mysql"
	"idlequest/internal/db"
	"idlequest/internal/db/jetgen/eqgo/model"
	"idlequest/internal/db/jetgen/eqgo/table"
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
	provider Provider
}

// NewService creates a new dialogue service with the configured provider
func NewService() *Service {
	provider := selectProvider()
	if provider == nil || !provider.IsConfigured() {
		log.Println("Warning: No LLM provider configured, dialogue generation will return placeholders")
	} else {
		log.Printf("Using LLM provider: %s", provider.Name())
	}

	return &Service{
		provider: provider,
	}
}

// selectProvider chooses the appropriate provider based on environment config
func selectProvider() Provider {
	// Check LLM_PROVIDER env var first (explicit selection)
	providerName := strings.ToLower(os.Getenv("LLM_PROVIDER"))

	switch providerName {
	case "openai":
		return NewOpenAIProvider()
	case "openrouter":
		return NewOpenRouterProvider()
	default:
		// Auto-detect based on which API key is set
		if os.Getenv("OPENROUTER_API_KEY") != "" {
			return NewOpenRouterProvider()
		}
		if os.Getenv("OPENAI_API_KEY") != "" {
			return NewOpenAIProvider()
		}
		// Default to OpenRouter (but unconfigured)
		return NewOpenRouterProvider()
	}
}

// GetNPCDialogue generates dialogue for an NPC using LLM
func (s *Service) GetNPCDialogue(ctx context.Context, npcName string, dialogueHistory []DialogueEntry) (*DialogueResponse, error) {
	// Get LUA script from database
	luaScript, err := s.getLuaScript(ctx, npcName)
	if err != nil {
		log.Printf("Error getting LUA script for %s: %v", npcName, err)
		// Continue without script - we'll generate generic dialogue
	}

	// If no provider configured, return placeholder
	if s.provider == nil || !s.provider.IsConfigured() {
		return &DialogueResponse{
			Dialogue:  "The NPC looks at you curiously.",
			Responses: []string{},
		}, nil
	}

	// Build messages for LLM
	messages := s.buildMessages(npcName, luaScript, dialogueHistory)

	// Call LLM via provider
	response, err := s.provider.Complete(ctx, messages)
	if err != nil {
		log.Printf("Error calling LLM for %s: %v", npcName, err)
		return &DialogueResponse{
			Dialogue:  "The NPC looks at you curiously.",
			Responses: []string{},
		}, nil
	}

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
func (s *Service) buildMessages(npcName, luaScript string, dialogueHistory []DialogueEntry) []ChatMessage {
	nonDialogueInstruction := "You are an AI assistant creating dialogue for NPCs in a fantasy MMORPG setting, EverQuest. " +
		"Generate a brief, context-appropriate response for an NPC when approached by a player. " +
		"The player is interacting with this NPC despite the NPC not having any dialogue for the player, often because it's a non-speaking creature like an animal. Simply describe what the NPC is doing in response to being talked at, but do not give it any speaking lines. For example, the NPC might look at the player and walk away. Or ignore them entirely." +
		"Format your response as a JSON object with 'dialogue' property. "

	sharedInstruction := "Do not make up details about an NPC's species if you do not know. Do not make up details about an NPC's species if you do not know (e.g. don't make the NPC a unicorn unless it's obvious from the name). Do not make inanimate objects act like they're alive (they don't look at things). Things like boats may have dialogue associated in the LUA script but still do not treat them like they can speak. SirensBane and Stormbreaker are ships, do not make them talk or look at things. Do not refer to 'the player' and instead say 'you' "

	var messages []ChatMessage

	if luaScript != "" {
		messages = []ChatMessage{
			{
				Role: "system",
				Content: "You are an AI assistant that analyzes Lua scripts for NPCs from the 1999 MMORPG EverQuest. " +
					"Extract the dialogue from the NPC script and provide one to three responses for the user to choose from " +
					"to further progress the dialogue. Only provide multiple responses if there are multiple areas for the " +
					"conversation to progress to. Only present the opening dialogue from the script. Format your response as " +
					"a JSON object with 'dialogue' and 'responses' fields. If the LUA script has no dialogue and is only event scripting, then " +
					nonDialogueInstruction + sharedInstruction,
			},
			{
				Role:    "user",
				Content: fmt.Sprintf("NPC named %s and LUA script:\n\n%s", npcName, luaScript),
			},
		}
	} else {
		messages = []ChatMessage{
			{
				Role:    "system",
				Content: nonDialogueInstruction + sharedInstruction,
			},
			{
				Role: "user",
				Content: fmt.Sprintf("Create a description of the actions of an NPC named %s when approached by a player. "+
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
		messages = append(messages, ChatMessage{
			Role:    "user",
			Content: fmt.Sprintf("Previous dialogue:\n%s\n\nContinue the conversation based on this context.", historyContent),
		})
	}

	return messages
}
