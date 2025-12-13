package combat

import (
	"context"
	"log"
	"math/rand"
	"sync"
	"time"

	db_character "idlequest/internal/db/character"
	db_combat "idlequest/internal/db/combat"
	"idlequest/internal/db/jetgen/eqgo/model"
	"idlequest/internal/session"
)

// CombatState represents the current state of combat for a player
type CombatState struct {
	Active       bool
	NPC          *db_combat.NPCForCombat
	NPCCurrentHP int64
	RoundNumber  int
	LastAttack   time.Time
}

// CombatManager manages all active combat sessions
type CombatManager struct {
	mu       sync.RWMutex
	sessions map[int64]*CombatSession // keyed by character ID
	ticker   *time.Ticker
	done     chan struct{}
}

// CombatSession represents a single player's combat session
type CombatSession struct {
	mu      sync.Mutex
	Session *session.Session
	State   CombatState
	onRound func(result *RoundResult)
	onEnd   func(result *EndResult)
	onLoot  func(loot []db_combat.LootDropItem, money MoneyDrop)
}

// RoundResult contains the result of a combat round
type RoundResult struct {
	PlayerHit      bool
	PlayerDamage   int
	PlayerCritical bool
	NPCHit         bool
	NPCDamage      int
	PlayerHP       int
	PlayerMaxHP    int
	NPCHP          int
	NPCMaxHP       int
	RoundNumber    int
}

// EndResult contains the result of combat ending
type EndResult struct {
	Victory     bool
	NPCName     string
	ExpGained   int
	PlayerHP    int
	PlayerMaxHP int
	BindZoneID  uint16 // Only set on death - zone to respawn in
	BindX       float64
	BindY       float64
	BindZ       float64
	BindHeading float64
}

// MoneyDrop represents money dropped by an NPC
type MoneyDrop struct {
	Platinum int
	Gold     int
	Silver   int
	Copper   int
}

var globalManager *CombatManager
var managerOnce sync.Once

// GetManager returns the global combat manager singleton
func GetManager() *CombatManager {
	managerOnce.Do(func() {
		globalManager = &CombatManager{
			sessions: make(map[int64]*CombatSession),
			done:     make(chan struct{}),
		}
		globalManager.Start()
	})
	return globalManager
}

// Start begins the combat tick loop
func (m *CombatManager) Start() {
	m.ticker = time.NewTicker(1 * time.Second)
	go m.tickLoop()
	log.Println("Combat manager started")
}

// Stop stops the combat manager
func (m *CombatManager) Stop() {
	close(m.done)
	if m.ticker != nil {
		m.ticker.Stop()
	}
	log.Println("Combat manager stopped")
}

func (m *CombatManager) tickLoop() {
	for {
		select {
		case <-m.done:
			return
		case <-m.ticker.C:
			m.processTick()
		}
	}
}

func (m *CombatManager) processTick() {
	m.mu.RLock()
	sessions := make([]*CombatSession, 0, len(m.sessions))
	for _, s := range m.sessions {
		sessions = append(sessions, s)
	}
	m.mu.RUnlock()

	for _, cs := range sessions {
		cs.processCombatRound()
	}
}

// StartCombat begins combat for a player session
func (m *CombatManager) StartCombat(
	ses *session.Session,
	zoneShortName string,
	playerLevel int,
	onRound func(*RoundResult),
	onEnd func(*EndResult),
	onLoot func([]db_combat.LootDropItem, MoneyDrop),
) (*db_combat.NPCForCombat, error) {
	charID := int64(ses.Client.CharData().ID)

	// Check if already in combat
	m.mu.Lock()
	if existing, ok := m.sessions[charID]; ok && existing.State.Active {
		m.mu.Unlock()
		return existing.State.NPC, nil
	}
	m.mu.Unlock()

	// Select a random NPC for combat
	npc, err := db_combat.GetRandomNPCForZone(context.Background(), zoneShortName, playerLevel, 5)
	if err != nil {
		return nil, err
	}

	cs := &CombatSession{
		Session: ses,
		State: CombatState{
			Active:       true,
			NPC:          npc,
			NPCCurrentHP: npc.HP,
			RoundNumber:  0,
			LastAttack:   time.Now(),
		},
		onRound: onRound,
		onEnd:   onEnd,
		onLoot:  onLoot,
	}

	m.mu.Lock()
	m.sessions[charID] = cs
	m.mu.Unlock()

	log.Printf("Combat started for character %d vs %s (level %d, HP %d)", charID, npc.Name, npc.Level, npc.HP)
	return npc, nil
}

// StopCombat ends combat for a player
func (m *CombatManager) StopCombat(charID int64) {
	m.mu.Lock()
	delete(m.sessions, charID)
	m.mu.Unlock()
	log.Printf("Combat stopped for character %d", charID)
}

// IsInCombat checks if a player is currently in combat
func (m *CombatManager) IsInCombat(charID int64) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()
	cs, ok := m.sessions[charID]
	return ok && cs.State.Active
}

func (cs *CombatSession) processCombatRound() {
	cs.mu.Lock()
	defer cs.mu.Unlock()

	if !cs.State.Active || cs.State.NPC == nil {
		return
	}

	// Check if session is still valid before processing
	if cs.Session == nil || cs.Session.Client == nil {
		cs.State.Active = false
		return
	}

	charData := cs.Session.Client.CharData()
	if charData == nil {
		cs.State.Active = false
		return
	}

	cs.State.RoundNumber++

	// Calculate max HP based on level and STA (simplified formula)
	maxHP := calculateMaxHP(charData)

	// Calculate player attack
	playerHit, playerDamage, playerCrit := cs.calculatePlayerAttack()

	// Apply player damage to NPC
	if playerHit {
		cs.State.NPCCurrentHP -= int64(playerDamage)
		if cs.State.NPCCurrentHP < 0 {
			cs.State.NPCCurrentHP = 0
		}
	}

	// Check if NPC is dead
	if cs.State.NPCCurrentHP <= 0 {
		cs.handleNPCDeath()
		return
	}

	// Calculate NPC attack
	npcHit, npcDamage := cs.calculateNPCAttack()

	// Apply NPC damage to player
	if npcHit {
		if uint32(npcDamage) >= charData.CurHp {
			charData.CurHp = 0
		} else {
			charData.CurHp -= uint32(npcDamage)
		}
	}

	// Check if player is dead
	if charData.CurHp == 0 {
		cs.handlePlayerDeath()
		return
	}

	// Send round update
	if cs.onRound != nil {
		cs.onRound(&RoundResult{
			PlayerHit:      playerHit,
			PlayerDamage:   playerDamage,
			PlayerCritical: playerCrit,
			NPCHit:         npcHit,
			NPCDamage:      npcDamage,
			PlayerHP:       int(charData.CurHp),
			PlayerMaxHP:    maxHP,
			NPCHP:          int(cs.State.NPCCurrentHP),
			NPCMaxHP:       int(cs.State.NPC.HP),
			RoundNumber:    cs.State.RoundNumber,
		})
	}
}

// calculateMaxHP calculates max HP based on level and STA
func calculateMaxHP(charData *model.CharacterData) int {
	// Simple formula: base HP + (level * 10) + (STA * 2)
	baseHP := 20
	levelBonus := int(charData.Level) * 10
	staBonus := int(charData.Sta) * 2
	return baseHP + levelBonus + staBonus
}

// calculatePlayerAC calculates AC from equipment and stats
func calculatePlayerAC(charData *model.CharacterData) int {
	// Simple formula: AGI / 10 + level
	return int(charData.Agi)/10 + int(charData.Level)
}

// calculatePlayerATK calculates ATK from stats
func calculatePlayerATK(charData *model.CharacterData) int {
	// Simple formula: STR + level
	return int(charData.Str) + int(charData.Level)
}

func (cs *CombatSession) calculatePlayerAttack() (hit bool, damage int, critical bool) {
	charData := cs.Session.Client.CharData()
	npc := cs.State.NPC

	// Simple hit calculation: 80% base hit chance, modified by level difference
	levelDiff := int(charData.Level) - int(npc.Level)
	hitChance := 80 + (levelDiff * 2)
	if hitChance > 95 {
		hitChance = 95
	}
	if hitChance < 20 {
		hitChance = 20
	}

	if rand.Intn(100) >= hitChance {
		return false, 0, false
	}

	// Calculate damage based on player stats
	// Base damage from calculated ATK, modified by STR
	playerATK := calculatePlayerATK(charData)
	baseDamage := playerATK / 10
	if baseDamage < 1 {
		baseDamage = 1
	}

	// Add STR bonus
	strBonus := int(charData.Str) / 10
	damage = baseDamage + strBonus + rand.Intn(baseDamage+1)

	// Apply NPC AC mitigation
	acMitigation := float64(npc.AC) / 400.0
	if acMitigation > 0.5 {
		acMitigation = 0.5
	}
	damage = int(float64(damage) * (1.0 - acMitigation))

	if damage < 1 {
		damage = 1
	}

	// Critical hit chance (5%)
	if rand.Intn(100) < 5 {
		damage *= 2
		critical = true
	}

	return true, damage, critical
}

func (cs *CombatSession) calculateNPCAttack() (hit bool, damage int) {
	charData := cs.Session.Client.CharData()
	npc := cs.State.NPC

	// Simple hit calculation for NPC
	levelDiff := int(npc.Level) - int(charData.Level)
	hitChance := 70 + (levelDiff * 2)
	if hitChance > 90 {
		hitChance = 90
	}
	if hitChance < 20 {
		hitChance = 20
	}

	if rand.Intn(100) >= hitChance {
		return false, 0
	}

	// Calculate damage between min and max
	minDmg := int(npc.MinDmg)
	maxDmg := int(npc.MaxDmg)
	if minDmg < 1 {
		minDmg = 1
	}
	if maxDmg < minDmg {
		maxDmg = minDmg
	}

	damage = minDmg + rand.Intn(maxDmg-minDmg+1)

	// Apply player AC mitigation
	playerAC := calculatePlayerAC(charData)
	acMitigation := float64(playerAC) / 400.0
	if acMitigation > 0.5 {
		acMitigation = 0.5
	}
	damage = int(float64(damage) * (1.0 - acMitigation))

	if damage < 1 {
		damage = 1
	}

	return true, damage
}

func (cs *CombatSession) handleNPCDeath() {
	charData := cs.Session.Client.CharData()
	npc := cs.State.NPC

	// Calculate experience
	expGained := db_combat.CalculateExperience(int(npc.Level))

	// Add experience to character
	charData.Exp += uint32(expGained)

	// Mark combat as ended
	cs.State.Active = false

	// Send end result
	maxHP := calculateMaxHP(charData)
	if cs.onEnd != nil {
		cs.onEnd(&EndResult{
			Victory:     true,
			NPCName:     npc.Name,
			ExpGained:   expGained,
			PlayerHP:    int(charData.CurHp),
			PlayerMaxHP: maxHP,
		})
	}

	// Generate and send loot
	cs.generateLoot()

	// Remove from manager
	GetManager().StopCombat(int64(charData.ID))
}

func (cs *CombatSession) handlePlayerDeath() {
	charData := cs.Session.Client.CharData()
	npc := cs.State.NPC

	// Mark combat as ended
	cs.State.Active = false

	// Get bind point for respawn
	bind, err := db_character.GetCharacterBind(context.Background(), charData.ID)
	if err != nil {
		log.Printf("Failed to get bind point for character %d: %v", charData.ID, err)
		// Default to current zone if bind not found
		bind = &model.CharacterBind{
			ZoneID:  uint16(charData.ZoneID),
			X:       charData.X,
			Y:       charData.Y,
			Z:       charData.Z,
			Heading: charData.Heading,
		}
	}

	// Send end result with 0 HP (death state) and bind zone info
	maxHP := calculateMaxHP(charData)
	if cs.onEnd != nil {
		cs.onEnd(&EndResult{
			Victory:     false,
			NPCName:     npc.Name,
			ExpGained:   0,
			PlayerHP:    0, // Show 0 HP on death
			PlayerMaxHP: maxHP,
			BindZoneID:  bind.ZoneID,
			BindX:       bind.X,
			BindY:       bind.Y,
			BindZ:       bind.Z,
			BindHeading: bind.Heading,
		})
	}

	// Restore player to 1 HP after sending death message
	charData.CurHp = 1

	// Remove from manager
	GetManager().StopCombat(int64(charData.ID))
}

func (cs *CombatSession) generateLoot() {
	npc := cs.State.NPC

	// Get potential loot
	potentialLoot, err := db_combat.GetNPCLoot(context.Background(), npc.LoottableID)
	if err != nil {
		log.Printf("Failed to get loot for NPC %s: %v", npc.Name, err)
		return
	}

	// Roll for loot
	droppedLoot := db_combat.RollLoot(potentialLoot)

	// Generate money drop based on NPC level
	money := MoneyDrop{
		Copper: rand.Intn(int(npc.Level) * 10),
		Silver: rand.Intn(int(npc.Level) * 2),
	}
	if npc.Level > 10 {
		money.Gold = rand.Intn(int(npc.Level))
	}
	if npc.Level > 30 {
		money.Platinum = rand.Intn(int(npc.Level) / 10)
	}

	// Send loot to callback
	if cs.onLoot != nil && (len(droppedLoot) > 0 || money.Copper > 0 || money.Silver > 0 || money.Gold > 0 || money.Platinum > 0) {
		cs.onLoot(droppedLoot, money)
	}
}
