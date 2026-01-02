package mechanics

// getHPLevelMultiplier returns the multiplier for HP calculation based on class and level
// Ported from src/utils/playerCharacterUtils.ts
func getHPLevelMultiplier(classID int, level int) int {
	switch classID {
	case 1: // Warrior
		if level <= 19 {
			return 22
		}
		if level <= 29 {
			return 23
		}
		if level <= 39 {
			return 25
		}
		if level <= 52 {
			return 27
		}
		if level <= 56 {
			return 28
		}
		if level <= 59 {
			return 29
		}
		return 30
	case 2, 6, 10: // Cleric, Druid, Shaman
		return 15
	case 3, 5, 16: // Paladin, Shadowknight, Berserker
		if level <= 34 {
			return 21
		}
		if level <= 44 {
			return 22
		}
		if level <= 50 {
			return 23
		}
		if level <= 55 {
			return 24
		}
		if level <= 59 {
			return 25
		}
		return 26
	case 4: // Ranger
		if level <= 57 {
			return 20
		}
		return 21
	case 7, 8, 9, 15: // Monk, Bard, Rogue, Beastlord
		if level <= 50 {
			return 18
		}
		if level <= 57 {
			return 19
		}
		return 20
	case 11, 12, 13, 14: // Magician, Necro, Enchanter, Wizard
		return 12
	default:
		return 15
	}
}

// CalculateMaxMana calculates max Mana based on level, INT/WIS, and class
// Ported from src/utils/playerCharacterUtils.ts
func CalculateMaxMana(level int, intel int, wis int, classID int) int {
	// Warriors, Monks, and Rogues have no mana
	if classID == 1 || classID == 7 || classID == 9 {
		return 0
	}

	// Determine which attribute to use based on class
	// Cleric(2), Paladin(3), Druid(6), Shaman(10), Ranger(4) use WIS
	manaAttribute := intel
	if classID == 2 || classID == 3 || classID == 6 || classID == 10 || classID == 4 {
		manaAttribute = wis
	}

	var manaGained float64
	if manaAttribute <= 200 {
		manaGained = (float64(80*level) / 425.0) * float64(manaAttribute)
	} else {
		manaGained = (float64(40*level) / 425.0) * float64(manaAttribute)
	}

	return int(manaGained)
}

// CalculateMaxHPFromStats calculates max HP based on level, STA, and class
// Matches client logic in src/utils/playerCharacterUtils.ts
func CalculateMaxHPFromStats(level int, sta int, classID int) int {
	levelMultiplier := getHPLevelMultiplier(classID, level)

	// const term1 = level * levelMultiplier;
	term1 := float64(level * levelMultiplier)

	// const term2 = ((level * levelMultiplier) / 300) * stamina + 5;
	term2 := (term1/300.0)*float64(sta) + 5.0

	return int(term1 + term2)
}

// RaceIksar is the race ID for Iksar (for AC bonus calculation)
const RaceIksar = 128

// calcBaseAC calculates base AC from level using the P99 formula
// Ported from src/utils/calculateSimpleArmorClass.ts
func calcBaseAC(level int) int {
	if level <= 19 {
		return level * 15
	} else if level <= 49 {
		return 285 + (level-19)*30
	}
	return 1185 + (level-49)*60
}

// getIksarACBonus returns the AC bonus for Iksar race
// Bonus is clamped between 10 and 35, scaling with level
func getIksarACBonus(raceID int, level int) int {
	if raceID == RaceIksar {
		bonus := level
		if bonus < 10 {
			bonus = 10
		}
		if bonus > 35 {
			bonus = 35
		}
		return bonus
	}
	return 0
}

// CalculatePlayerAC calculates AC from level, race, and equipped item AC
// Ported from src/utils/calculateSimpleArmorClass.ts
func CalculatePlayerAC(level int, raceID int, equippedAC int) int {
	baseAC := calcBaseAC(level)
	iksarBonus := getIksarACBonus(raceID, level)
	return baseAC + equippedAC + iksarBonus
}

// CalculatePlayerATK calculates ATK from stats
// Ported from world-handlers.go logic: level*2 + STR
func CalculatePlayerATK(str int, level int) int {
	return (level * 2) + str
}

// ExperienceTable holds experience thresholds for each level (level -> total exp needed)
// Values derived from data/json/experience.json
var ExperienceTable = []int{
	0,          // Level 0
	1000,       // Level 1
	8000,       // Level 2
	27000,      // Level 3
	64000,      // Level 4
	125000,     // Level 5
	216000,     // Level 6
	343000,     // Level 7
	512000,     // Level 8
	729000,     // Level 9
	1000000,    // Level 10
	1331000,    // Level 11
	1728000,    // Level 12
	2197000,    // Level 13
	2744000,    // Level 14
	3375000,    // Level 15
	4096000,    // Level 16
	4913000,    // Level 17
	5832000,    // Level 18
	6859000,    // Level 19
	8000000,    // Level 20
	9261000,    // Level 21
	10648000,   // Level 22
	12167000,   // Level 23
	13824000,   // Level 24
	15625000,   // Level 25
	17576000,   // Level 26
	19683000,   // Level 27
	21952000,   // Level 28
	24389000,   // Level 29
	29700000,   // Level 30
	32770100,   // Level 31
	36044800,   // Level 32
	39530700,   // Level 33
	43234400,   // Level 34
	51450000,   // Level 35
	55987200,   // Level 36
	60783600,   // Level 37
	65846400,   // Level 38
	71182800,   // Level 39
	83200000,   // Level 40
	89597296,   // Level 41
	96314400,   // Level 42
	103359104,  // Level 43
	110739200,  // Level 44
	127575000,  // Level 45
	136270400,  // Level 46
	145352192,  // Level 47
	154828800,  // Level 48
	164708608,  // Level 49
	175000000,  // Level 50
	198976496,  // Level 51
	224972800,  // Level 52
	253090896,  // Level 53
	299181600,  // Level 54
	349387488,  // Level 55
	403916800,  // Level 56
	462982496,  // Level 57
	526802400,  // Level 58
	616137024,  // Level 59
	669600000,  // Level 60
	703641088,  // Level 61
	738816768,  // Level 62
	775145728,  // Level 63
	812646400,  // Level 64
	851337472,  // Level 65
	891237632,  // Level 66
	932365312,  // Level 67
	974739200,  // Level 68
	1018377920, // Level 69
	1063299968, // Level 70
	1109524096, // Level 71
	1157068800, // Level 72
	1205952640, // Level 73
	1256194432, // Level 74
	1307812480, // Level 75
	1360825600, // Level 76
	1415252352, // Level 77
	1471111168, // Level 78
	1528420864, // Level 79
	1587200000, // Level 80
	1647467136, // Level 81
	1709240832, // Level 82
	1772539648, // Level 83
	1837382400, // Level 84
	1903787520, // Level 85
	1971773568, // Level 86
	2041359360, // Level 87
	2112563200, // Level 88
	2185403904, // Level 89
	2259899904, // Level 90
	2336070144, // Level 91
	2413932800, // Level 92
	2493506816, // Level 93
	2574810368, // Level 94
	2657862400, // Level 95
	2742681600, // Level 96
	2829286400, // Level 97
	2917695232, // Level 98
	3007926784, // Level 99
	3100000000, // Level 100
}

// CalculateExpPercent calculates the percentage of experience into the current level (0-10000)
func CalculateExpPercent(level int, currentExp uint32) int32 {
	if level >= len(ExperienceTable)-1 {
		return 10000 // Max level or above
	}
	if level < 0 {
		return 0
	}

	// Table is 1-based for levels usually, index matches level
	// Level 1 range: [Table[1], Table[2]) -> [1000, 8000)
	startExp := uint32(ExperienceTable[level])
	nextExp := uint32(ExperienceTable[level+1])

	if currentExp < startExp {
		return 0 // Should not happen if level is correct
	}
	if currentExp >= nextExp {
		return 10000 // Should have leveled up
	}

	expInLevel := currentExp - startExp
	expNeeded := nextExp - startExp

	if expNeeded == 0 {
		return 10000
	}

	// Calculate percent scaled to 10000 (100.00%)
	return int32((uint64(expInLevel) * 10000) / uint64(expNeeded))
}

const MaxPlayerLevel = 60

// AddExperience adds experience to the current total, respecting the hard cap
// The cap is set to the threshold of (MaxPlayerLevel + 1), which represents a fully filled bar at MaxPlayerLevel
func AddExperience(currentExp uint32, amount int) uint32 {
	maxExp := uint32(ExperienceTable[MaxPlayerLevel+1])
	newExp := uint64(currentExp) + uint64(amount)

	if newExp >= uint64(maxExp) {
		return maxExp
	}
	return uint32(newExp)
}

// CalculateLevelFromExp returns the level for a given experience total
func CalculateLevelFromExp(exp int) int {
	// Hard cap at MaxPlayerLevel
	// If exp is >= threshold for MaxPlayerLevel+1, return MaxPlayerLevel
	if exp >= ExperienceTable[MaxPlayerLevel+1] {
		return MaxPlayerLevel
	}

	for level := len(ExperienceTable) - 1; level >= 1; level-- {
		if exp >= ExperienceTable[level] {
			return level
		}
	}
	return 1
}

// CalculateHitChance calculates the percentage chance to hit (0-100)
// baseChance is the chance at equal levels (e.g., 80 for players, 70 for NPCs)
// minChance and maxChance are the hard caps
func CalculateHitChance(attackerLevel, defenderLevel int, baseChance, minChance, maxChance int) int {
	levelDiff := attackerLevel - defenderLevel
	hitChance := baseChance + (levelDiff * 2)
	if hitChance > maxChance {
		return maxChance
	}
	if hitChance < minChance {
		return minChance
	}
	return hitChance
}

// CalculateMitigation calculates the damage reduction percentage from AC (0.0 - 1.0)
func CalculateMitigation(ac int) float64 {
	acMitigation := float64(ac) / 400.0
	if acMitigation > 0.5 {
		return 0.5
	}
	return acMitigation
}
