package combat

import (
	"context"
	"testing"
	"time"

	"idlequest/internal/constants"
	db_combat "idlequest/internal/db/combat"
	"idlequest/internal/db/jetgen/eqgo/model"
	"idlequest/internal/session"
	entity "idlequest/internal/zone/interface"
)

// MockClient implements entity.Client interface for testing
type MockClient struct {
	charData *model.CharacterData
	mob      *entity.Mob
}

func (m *MockClient) Level() uint8                 { return uint8(m.charData.Level) }
func (m *MockClient) Class() uint8                 { return uint8(m.charData.Class) }
func (m *MockClient) Race() uint8                  { return uint8(m.charData.Race) }
func (m *MockClient) Position() entity.MobPosition { return entity.MobPosition{X: 0, Y: 0, Z: 0} }
func (m *MockClient) Items() map[constants.InventoryKey]*constants.ItemWithInstance {
	return make(map[constants.InventoryKey]*constants.ItemWithInstance)
}
func (m *MockClient) WithItems(caller func(map[constants.InventoryKey]*constants.ItemWithInstance)) {}
func (m *MockClient) SetPosition(entity.MobPosition)                                                {}
func (m *MockClient) SetVelocity(entity.Velocity)                                                   {}
func (m *MockClient) CanEquipItem(item *constants.ItemWithInstance) bool                            { return true }
func (m *MockClient) UpdateStats()                                                                  {}
func (m *MockClient) CharData() *model.CharacterData                                                { return m.charData }
func (m *MockClient) Mob() *entity.Mob                                                              { return m.mob }
func (m *MockClient) GetMob() *entity.Mob                                                           { return m.mob }
func (m *MockClient) ID() int                                                                       { return int(m.charData.ID) }
func (m *MockClient) Name() string                                                                  { return m.charData.Name }
func (m *MockClient) Say(msg string)                                                                {}
func (m *MockClient) Type() int32                                                                   { return 1 } // Player
func (m *MockClient) MoveItem(fromKey, toKey constants.InventoryKey) error                          { return nil }
func (m *MockClient) SwapItems(fromKey, toKey constants.InventoryKey) error                         { return nil }
func (m *MockClient) DeleteItem(key constants.InventoryKey) *constants.ItemWithInstance             { return nil }
func (m *MockClient) GetItem(key constants.InventoryKey) *constants.ItemWithInstance                { return nil }
func (m *MockClient) SetItem(key constants.InventoryKey, item *constants.ItemWithInstance)          {}
func (m *MockClient) GetEquippedAC() int                                                            { return 0 }

// HP/Mana management methods
func (m *MockClient) SetCurrentHp(hp int) {
	if hp < 0 {
		hp = 0
	}
	if hp > m.mob.MaxHp {
		hp = m.mob.MaxHp
	}
	m.charData.CurHp = uint32(hp)
	m.mob.CurrentHp = hp
}
func (m *MockClient) SetCurrentMana(mana int) {
	if mana < 0 {
		mana = 0
	}
	m.charData.Mana = uint32(mana)
	m.mob.CurrentMana = mana
}
func (m *MockClient) GetCurrentHp() int   { return m.mob.CurrentHp }
func (m *MockClient) GetCurrentMana() int { return m.mob.CurrentMana }
func (m *MockClient) GetMaxHp() int       { return m.mob.MaxHp }
func (m *MockClient) GetMaxMana() int     { return m.mob.MaxMana }
func (m *MockClient) TakeDamage(damage int) (newHp int, alive bool) {
	newHp = m.mob.CurrentHp - damage
	if newHp < 0 {
		newHp = 0
	}
	m.SetCurrentHp(newHp)
	return newHp, newHp > 0
}
func (m *MockClient) HealDamage(amount int) int {
	newHp := m.mob.CurrentHp + amount
	if newHp > m.mob.MaxHp {
		newHp = m.mob.MaxHp
	}
	m.SetCurrentHp(newHp)
	return newHp
}
func (m *MockClient) RestoreToFull() {
	m.SetCurrentHp(m.mob.MaxHp)
	m.SetCurrentMana(m.mob.MaxMana)
}

// TestCombatFlow tests the core combat ticks and logic without a real DB or network
func TestCombatFlow(t *testing.T) {
	// 1. Setup Mock Client & Session
	charData := &model.CharacterData{
		ID:    12345,
		Name:  "TestHero",
		Level: 10,
		CurHp: 100, // Current HP
		Str:   50,
		Agi:   50,
		Dex:   50,
		Sta:   50,
		Class: 1, // Warrior
		Race:  1, // Human
	}

	mockClient := &MockClient{
		charData: charData,
		mob: &entity.Mob{
			MaxHp:     1000, // Set a reasonable max HP for testing
			CurrentHp: 100,  // Match charData.CurHp
		},
	}

	testSession := &session.Session{
		SessionID: 1,
		Client:    mockClient,
	}

	// 2. Initialize Manager manually (don't rely on global singletons if possible, or reset it)
	manager := &CombatManager{
		sessions: make(map[int64]*CombatSession),
		// We won't start the ticker goroutine loop, we will manually tick
	}

	// 3. Manually create a CombatSession
	// Usually StartCombat does this, but it requires DB access to get an NPC.
	// We'll bypass StartCombat and verify the *tick logic* directly.

	testNPC := &db_combat.NPCForCombat{
		ID:          999,
		Name:        "TargetDummy",
		Level:       10,
		HP:          50,
		AC:          10,
		MinDmg:      1,
		MaxDmg:      5,
		AttackDelay: 10,
	}

	var lastEndResult *EndResult

	cs := &CombatSession{
		Session: testSession,
		State: CombatState{
			Active:       true,
			NPC:          testNPC,
			NPCCurrentHP: testNPC.HP,
			RoundNumber:  0,
			LastAttack:   time.Now(),
		},
		// Hook into callbacks to verify logic
		onRound: func(res *RoundResult) {
			t.Logf("Round %d: PlayerHP=%d NPCHP=%d (PlayerDmg: %d, NPCDmg: %d)",
				res.RoundNumber, res.PlayerHP, res.NPCHP, res.PlayerDamage, res.NPCDamage)
		},
		onEnd: func(res *EndResult) {
			t.Logf("Combat Ended. Victory: %v", res.Victory)
			lastEndResult = res
		},
	}

	// Inject into manager
	manager.sessions[12345] = cs

	// Override DB calls for testing
	originalGetBind := getCharacterBind
	getCharacterBind = func(ctx context.Context, charID uint32) (*model.CharacterBind, error) {
		return &model.CharacterBind{
			ZoneID: 1,
			X:      0, Y: 0, Z: 0,
		}, nil
	}
	// Restore after test
	defer func() { getCharacterBind = originalGetBind }()

	t.Run("Combat Ticks Reduce HP", func(t *testing.T) {
		initialPlayerHP := charData.CurHp
		initialNPCHP := cs.State.NPCCurrentHP

		// Manually trigger a round
		cs.processCombatRound()

		// Verify something happened
		if cs.State.RoundNumber != 1 {
			t.Errorf("Expected round 1, got %d", cs.State.RoundNumber)
		}

		// Note: At level 10 with 50 stats, misses are possible.
		// If both missed, HP might not change.
		// But let's check strict "not increased" logic first.
		if charData.CurHp > initialPlayerHP {
			t.Errorf("Player HP increased during combat? %d -> %d", initialPlayerHP, charData.CurHp)
		}
		if cs.State.NPCCurrentHP > initialNPCHP {
			t.Errorf("NPC HP increased during combat? %d -> %d", initialNPCHP, cs.State.NPCCurrentHP)
		}
	})

	t.Run("Player Death Logic", func(t *testing.T) {
		// Reset result
		lastEndResult = nil

		// Reset combat state and set player to 1 HP using synchronized method
		cs.State.Active = true
		cs.State.NPCCurrentHP = 1000 // High NPC HP so player dies first
		mockClient.SetCurrentHp(1)

		// Keep processing until combat ends
		dead := false
		for i := 0; i < 100; i++ {
			cs.processCombatRound()
			if !cs.State.Active {
				dead = true
				break
			}
		}

		if !dead {
			t.Error("Player survived 100 rounds at 1 HP? Check mechanics.")
		} else {
			if lastEndResult == nil {
				t.Error("Combat ended but no EndResult received via callback")
			} else {
				if lastEndResult.Victory {
					t.Error("Expected defeat, got victory")
				}
				if lastEndResult.PlayerHP != 0 {
					t.Errorf("Expected EndResult to show 0 HP, got %d", lastEndResult.PlayerHP)
				}
				// Verify player was healed AFTER combat (implementation detail)
				if int(charData.CurHp) != mockClient.GetMaxHp() {
					t.Logf("Player post-death HP: %d (expected %d)", charData.CurHp, mockClient.GetMaxHp())
				}
			}
		}
	})

	t.Run("NPC Death Logic (Victory)", func(t *testing.T) {
		// Reset result
		lastEndResult = nil

		// Reset state using synchronized method
		cs.State.Active = true
		mockClient.SetCurrentHp(220)
		initialExp := charData.Exp

		// Set NPC to 0 HP manually to force an immediate victory on the next round process
		cs.State.NPCCurrentHP = 0

		cs.processCombatRound()

		if cs.State.Active {
			t.Error("Combat should be inactive after NPC death")
		}

		if lastEndResult == nil {
			t.Error("No end result for victory")
		} else {
			if !lastEndResult.Victory {
				t.Error("Expected Victory=true")
			}
			if lastEndResult.ExpGained <= 0 {
				t.Errorf("Expected XP gain, got %d", lastEndResult.ExpGained)
			}
		}

		if charData.Exp <= initialExp {
			t.Errorf("Character XP did not increase: %d -> %d", initialExp, charData.Exp)
		}
	})
}
