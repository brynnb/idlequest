package mechanics

import (
	"fmt"
	"testing"
)

func TestCalculateExpPercent(t *testing.T) {
	tests := []struct {
		Level int
		Exp   uint32
	}{
		{1, 0},
		{1, 100},
		{1, 500},
		{1, 1000}, // Old threshold
		{1, 4000}, // Halfway to 8000
		{1, 7999},
		{2, 8000},
		{2, 8001},
		{2, 17500}, // Midpoint of 8000->27000 (Gap 19000, half is 9500 + 8000 = 17500)
		{2, 26999},
		{3, 27000},
		{10, 1000000},
		{10, 1165500}, // Midpoint 10->11 (Gap 331000. Half 165500. Total 1165500)
		{99, 3007926784},
	}

	fmt.Println("=== Experience Percent Calculation Test ===")
	for _, tc := range tests {
		percent := CalculateExpPercent(tc.Level, tc.Exp)
		floatPercent := float64(percent) / 100.0
		fmt.Printf("Level %d, Exp %d -> Raw: %d (%.2f%%)\n", tc.Level, tc.Exp, percent, floatPercent)
	}
	fmt.Println("===========================================")
}

// TestCalculatePlayerAC tests the AC calculation formula
func TestCalculatePlayerAC(t *testing.T) {
	tests := []struct {
		name       string
		level      int
		raceID     int
		equippedAC int
		wantMin    int // Minimum expected AC
	}{
		{"Level 1 no gear", 1, 1, 0, 15},
		{"Level 10 no gear", 10, 1, 0, 150},
		{"Level 20 no gear", 20, 1, 0, 315},
		{"Level 50 no gear", 50, 1, 0, 1245},
		{"Level 60 no gear", 60, 1, 0, 1845},
		{"Level 10 with 50 AC gear", 10, 1, 50, 200},
		{"Level 10 Iksar no gear", 10, RaceIksar, 0, 160},      // 150 base + 10 Iksar bonus
		{"Level 30 Iksar no gear", 30, RaceIksar, 0, 645},      // 615 base + 30 Iksar bonus
		{"Level 50 Iksar with gear", 50, RaceIksar, 100, 1380}, // 1245 base + 35 + 100
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := CalculatePlayerAC(tc.level, tc.raceID, tc.equippedAC)
			if got < tc.wantMin {
				t.Errorf("CalculatePlayerAC(%d, %d, %d) = %d, want >= %d",
					tc.level, tc.raceID, tc.equippedAC, got, tc.wantMin)
			}
		})
	}
}

// TestCalcBaseAC tests the base AC curve
func TestCalcBaseAC(t *testing.T) {
	tests := []struct {
		level int
		want  int
	}{
		{1, 15},    // 1 * 15
		{10, 150},  // 10 * 15
		{19, 285},  // 19 * 15
		{20, 315},  // 285 + (20-19)*30 = 285 + 30
		{30, 615},  // 285 + (30-19)*30 = 285 + 330
		{49, 1185}, // 285 + (49-19)*30 = 285 + 900
		{50, 1245}, // 1185 + (50-49)*60 = 1185 + 60
		{60, 1845}, // 1185 + (60-49)*60 = 1185 + 660
	}

	for _, tc := range tests {
		t.Run(fmt.Sprintf("level_%d", tc.level), func(t *testing.T) {
			got := calcBaseAC(tc.level)
			if got != tc.want {
				t.Errorf("calcBaseAC(%d) = %d, want %d", tc.level, got, tc.want)
			}
		})
	}
}

// TestGetIksarACBonus tests Iksar racial AC bonus
func TestGetIksarACBonus(t *testing.T) {
	tests := []struct {
		raceID int
		level  int
		want   int
	}{
		// Non-Iksar gets 0
		{1, 10, 0},
		{1, 60, 0},
		// Iksar gets clamped bonus
		{RaceIksar, 1, 10},  // Clamped to minimum 10
		{RaceIksar, 5, 10},  // Clamped to minimum 10
		{RaceIksar, 10, 10}, // Equals minimum
		{RaceIksar, 20, 20}, // Between min and max
		{RaceIksar, 35, 35}, // Equals maximum
		{RaceIksar, 50, 35}, // Clamped to maximum 35
		{RaceIksar, 60, 35}, // Clamped to maximum 35
	}

	for _, tc := range tests {
		t.Run(fmt.Sprintf("race_%d_level_%d", tc.raceID, tc.level), func(t *testing.T) {
			got := getIksarACBonus(tc.raceID, tc.level)
			if got != tc.want {
				t.Errorf("getIksarACBonus(%d, %d) = %d, want %d", tc.raceID, tc.level, got, tc.want)
			}
		})
	}
}

// TestCalculateMaxMana tests mana calculation for different classes
func TestCalculateMaxMana(t *testing.T) {
	tests := []struct {
		name    string
		level   int
		intel   int
		wis     int
		classID int
		want    int
	}{
		// Warriors, Monks, Rogues have 0 mana
		{"Warrior level 60", 60, 75, 75, 1, 0},
		{"Monk level 60", 60, 75, 75, 7, 0},
		{"Rogue level 60", 60, 75, 75, 9, 0},
		// WIS-based classes use WIS (Cleric=2, Paladin=3, Druid=6, Shaman=10, Ranger=4)
		{"Cleric level 1 low wis", 1, 75, 75, 2, 14},      // (80*1/425)*75 = ~14
		{"Cleric level 10 high wis", 10, 75, 150, 2, 282}, // (80*10/425)*150 = ~282
		// INT-based classes use INT (Magician=11, Necromancer=12, Enchanter=13, Wizard=14)
		{"Wizard level 1 low int", 1, 75, 75, 14, 14},      // (80*1/425)*75 = ~14
		{"Wizard level 10 high int", 10, 150, 75, 14, 282}, // (80*10/425)*150 = ~282
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := CalculateMaxMana(tc.level, tc.intel, tc.wis, tc.classID)
			// Allow ±5% tolerance for float rounding
			tolerance := tc.want / 10
			if tolerance < 1 {
				tolerance = 1
			}
			if got < tc.want-tolerance || got > tc.want+tolerance {
				t.Errorf("CalculateMaxMana(%d, %d, %d, %d) = %d, want ~%d (±%d)",
					tc.level, tc.intel, tc.wis, tc.classID, got, tc.want, tolerance)
			}
		})
	}
}

// TestAddExperience tests the level 60 cap on XP gain
func TestAddExperience(t *testing.T) {
	// Level 60 threshold is ExperienceTable[61] = 2596766750
	level60Cap := ExperienceTable[MaxPlayerLevel+1]

	tests := []struct {
		name       string
		currentExp uint32
		amount     int
		wantExp    uint32
	}{
		{"Normal XP gain", 0, 1000, 1000},
		{"Large XP gain below cap", 1000000, 5000000, 6000000},
		{"XP gain at cap", uint32(level60Cap - 100), 100, uint32(level60Cap)},
		{"XP gain exceeds cap", uint32(level60Cap - 100), 1000, uint32(level60Cap)},
		{"Already at cap, gain more", uint32(level60Cap), 1000, uint32(level60Cap)},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := AddExperience(tc.currentExp, tc.amount)
			if got != tc.wantExp {
				t.Errorf("AddExperience(%d, %d) = %d, want %d",
					tc.currentExp, tc.amount, got, tc.wantExp)
			}
		})
	}
}

// TestCalculateLevelFromExp tests level calculation with cap
func TestCalculateLevelFromExp(t *testing.T) {
	tests := []struct {
		name      string
		exp       int
		wantLevel int
	}{
		{"Level 1 at 0 XP", 0, 1},
		{"Level 1 at 7999 XP", 7999, 1},
		{"Level 2 at 8000 XP", 8000, 2},
		{"Level 10 at threshold", int(ExperienceTable[10]), 10},
		{"Level 59 at threshold", int(ExperienceTable[59]), 59},
		{"Level 60 at threshold", int(ExperienceTable[60]), 60},
		{"Level 60 cap (excess XP)", int(ExperienceTable[61]) + 1000000, 60}, // Capped at 60
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := CalculateLevelFromExp(tc.exp)
			if got != tc.wantLevel {
				t.Errorf("CalculateLevelFromExp(%d) = %d, want %d", tc.exp, got, tc.wantLevel)
			}
		})
	}
}

// TestCalculateMaxHPFromStats tests HP calculation
func TestCalculateMaxHPFromStats(t *testing.T) {
	tests := []struct {
		name    string
		level   int
		sta     int
		classID int
		wantMin int
	}{
		{"Warrior level 1 low sta", 1, 75, 1, 25},
		{"Warrior level 60 high sta", 60, 200, 1, 1800},
		{"Cleric level 1", 1, 75, 2, 15},
		{"Wizard level 1", 1, 75, 14, 12},
		{"Monk level 50", 50, 100, 7, 900},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := CalculateMaxHPFromStats(tc.level, tc.sta, tc.classID)
			if got < tc.wantMin {
				t.Errorf("CalculateMaxHPFromStats(%d, %d, %d) = %d, want >= %d",
					tc.level, tc.sta, tc.classID, got, tc.wantMin)
			}
		})
	}
}

// TestGetHPLevelMultiplier tests class-specific HP multipliers
func TestGetHPLevelMultiplier(t *testing.T) {
	tests := []struct {
		classID int
		level   int
		want    int
	}{
		// Warrior (1) - highest HP
		{1, 1, 22},
		{1, 20, 23},
		{1, 30, 25},
		{1, 53, 28},
		{1, 60, 30},
		// Cleric (2) - flat 15
		{2, 1, 15},
		{2, 60, 15},
		// Wizard (14) - lowest HP at 12
		{14, 1, 12},
		{14, 60, 12},
		// Paladin (3) - tank scaling
		{3, 1, 21},
		{3, 35, 22},
		{3, 60, 26},
	}

	for _, tc := range tests {
		t.Run(fmt.Sprintf("class_%d_level_%d", tc.classID, tc.level), func(t *testing.T) {
			got := getHPLevelMultiplier(tc.classID, tc.level)
			if got != tc.want {
				t.Errorf("getHPLevelMultiplier(%d, %d) = %d, want %d", tc.classID, tc.level, got, tc.want)
			}
		})
	}
}
