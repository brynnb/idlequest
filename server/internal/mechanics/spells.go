package mechanics

//
// Spell effect value calculations
// Ported from src/utils/spellCalculations.ts
// Based on EQEmu: https://github.com/EQEmu/Server/blob/master/zone/spell_effects.cpp#L3500
//

import (
	"log"
	"math/rand"
)

// SpellEffectParams contains the parameters needed to calculate a spell effect value
// This allows for HP-based formulas (137, 138) to receive the required context
type SpellEffectParams struct {
	CurrentHP int // Current HP of the target (for formulas 137, 138)
	MaxHP     int // Max HP of the target (for formulas 137, 138)
}

// CalcBuffDuration calculates the duration of a buff in ticks
// durationFormula: the formula ID from the spell data
// baseDuration: the base duration value from the spell data
// casterLevel: the level of the caster
func CalcBuffDuration(casterLevel, durationFormula, baseDuration int) int {
	// Based on EQEmu buff duration formulas
	// https://github.com/EQEmu/Server/blob/master/zone/spell_effects.cpp
	switch durationFormula {
	case 0:
		return 0
	case 1:
		// Level / 2, min of baseDuration
		result := casterLevel / 2
		if result < baseDuration {
			result = baseDuration
		}
		return result
	case 2:
		// Level / 2 + 5, min of baseDuration
		result := (casterLevel / 2) + 5
		if result < baseDuration {
			result = baseDuration
		}
		return result
	case 3:
		// Level * 30
		return casterLevel * 30
	case 4:
		// Fixed 50
		return 50
	case 5:
		// Fixed 2
		return 2
	case 6:
		// Level / 2 + 2
		return (casterLevel / 2) + 2
	case 7:
		// Level
		return casterLevel
	case 8:
		// Level + 10
		return casterLevel + 10
	case 9:
		// Level * 2 + 10
		return casterLevel*2 + 10
	case 10:
		// Level * 3 + 10
		return casterLevel*3 + 10
	case 11:
		// (Level + 3) * 30
		return (casterLevel + 3) * 30
	case 12:
		// Level / 2
		result := casterLevel / 2
		if result < 1 {
			result = 1
		}
		return result
	case 50:
		// Permanent
		return 72000 // ~6 hours in ticks
	default:
		// Use baseDuration as fallback
		return baseDuration
	}
}

// CalcSpellEffectValue calculates the actual value of a spell effect based on its formula
// formula: the formula ID (0-2650+)
// baseValue: the base effect value from the spell
// maxValue: the maximum value cap
// casterLevel: the level of the caster
// buffDurationFormula: from spell.Buffdurationformula
// buffDuration: from spell.Buffduration
// ticsRemaining: remaining duration in ticks (for DoT/HoT scaling)
// params: optional parameters for HP-based formulas
func CalcSpellEffectValue(
	formula int,
	baseValue int,
	maxValue int,
	casterLevel int,
	buffDurationFormula int,
	buffDuration int,
	ticsRemaining int,
	params *SpellEffectParams,
) int {
	result := 0
	updownsign := 1
	ubase := abs(baseValue)

	// Determine if this is an up or down scaling effect
	if maxValue < baseValue && maxValue != 0 {
		updownsign = -1
	}

	switch formula {
	case 60, 70:
		result = ubase / 100

	case 0, 100:
		result = ubase

	case 101:
		result = updownsign * (ubase + casterLevel/2)

	case 102:
		result = updownsign * (ubase + casterLevel)

	case 103:
		result = updownsign * (ubase + casterLevel*2)

	case 104:
		result = updownsign * (ubase + casterLevel*3)

	case 105:
		result = updownsign * (ubase + casterLevel*4)

	case 107, 108, 120, 122:
		// Time-decaying effects
		ticdif := CalcBuffDuration(casterLevel, buffDurationFormula, buffDuration) - max(ticsRemaining-1, 0)
		multiplier := 1
		switch formula {
		case 108:
			multiplier = 2
		case 120:
			multiplier = 5
		case 122:
			multiplier = 12
		}
		result = updownsign * (ubase - multiplier*max(ticdif, 0))

	case 109:
		result = updownsign * (ubase + casterLevel/4)

	case 110:
		result = ubase + casterLevel/6

	case 111:
		result = updownsign * (ubase + 6*max(casterLevel-16, 0))

	case 112:
		result = updownsign * (ubase + 8*max(casterLevel-24, 0))

	case 113:
		result = updownsign * (ubase + 10*max(casterLevel-34, 0))

	case 114:
		result = updownsign * (ubase + 15*max(casterLevel-44, 0))

	case 115:
		result = ubase
		if casterLevel > 15 {
			result += 7 * (casterLevel - 15)
		}

	case 116:
		result = ubase
		if casterLevel > 24 {
			result += 10 * (casterLevel - 24)
		}

	case 117:
		result = ubase
		if casterLevel > 34 {
			result += 13 * (casterLevel - 34)
		}

	case 118:
		result = ubase
		if casterLevel > 44 {
			result += 20 * (casterLevel - 44)
		}

	case 119:
		result = ubase + casterLevel/8

	case 121:
		result = ubase + casterLevel/3

	case 123:
		// Random value between ubase and abs(maxValue)
		maxAbs := abs(maxValue)
		if maxAbs > ubase {
			result = rand.Intn(maxAbs-ubase+1) + ubase
		} else {
			result = ubase
		}

	case 124, 125, 126, 127, 128, 129, 130, 131, 132:
		// Level 50+ scaling effects
		result = ubase
		if casterLevel > 50 {
			multipliers := []int{1, 2, 3, 4, 5, 10, 15, 20, 25}
			idx := formula - 124
			if idx >= 0 && idx < len(multipliers) {
				result += updownsign * multipliers[idx] * (casterLevel - 50)
			}
		}

	case 137:
		// HP ratio-based effect
		if params != nil && params.MaxHP > 0 {
			hpRatio := float64(params.CurrentHP) / float64(params.MaxHP) * 100
			result = ubase - int(float64(ubase)*(hpRatio/100))
		} else {
			// Default to 50% HP if not provided
			result = ubase - ubase/2
		}

	case 138:
		// HP-based scaling effect
		if params != nil && params.MaxHP > 0 {
			maxhps := params.MaxHP / 2
			if params.CurrentHP <= maxhps {
				result = -(ubase * params.CurrentHP / maxhps)
			} else {
				result = -ubase
			}
		} else {
			// Default behavior
			result = -ubase
		}

	case 139:
		result = ubase
		if casterLevel > 30 {
			result += (casterLevel - 30) / 2
		}

	case 140:
		result = ubase
		if casterLevel > 30 {
			result += casterLevel - 30
		}

	case 141:
		result = ubase
		if casterLevel > 30 {
			result += (3*casterLevel - 90) / 2
		}

	case 142:
		result = ubase
		if casterLevel > 30 {
			result += 2*casterLevel - 60
		}

	case 143:
		result = ubase + (3*casterLevel)/4

	case 144:
		result = ubase + casterLevel*10 + max(casterLevel-40, 0)*20

	case 201, 203:
		result = maxValue

	default:
		// Handle formula ranges
		if formula < 100 {
			// Simple level multiplier
			result = ubase + casterLevel*formula
		} else if formula > 1000 && formula < 1999 {
			// Time-decaying with custom multiplier
			ticdif := CalcBuffDuration(casterLevel, buffDurationFormula, buffDuration) - max(ticsRemaining-1, 0)
			result = updownsign * (ubase - (formula-1000)*max(ticdif, 0))
		} else if formula >= 2000 && formula <= 2650 {
			// Level-based scaling
			result = ubase * (casterLevel*(formula-2000) + 1)
		} else {
			log.Printf("Unknown spell effect value formula [%d]", formula)
			result = ubase
		}
	}

	// Apply max value cap only if maxValue is not 0
	if maxValue != 0 {
		if updownsign == 1 {
			if result > maxValue {
				result = maxValue
			}
		} else {
			if result < -abs(maxValue) {
				result = -abs(maxValue)
			}
		}
	}

	// Preserve the sign of the base value
	if baseValue < 0 {
		result = -abs(result)
	}

	return result
}

// CalcSpellEffectValueSimple is a convenience wrapper for CalcSpellEffectValue
// that doesn't require HP parameters (uses defaults)
func CalcSpellEffectValueSimple(
	formula int,
	baseValue int,
	maxValue int,
	casterLevel int,
	buffDurationFormula int,
	buffDuration int,
	ticsRemaining int,
) int {
	return CalcSpellEffectValue(
		formula, baseValue, maxValue, casterLevel,
		buffDurationFormula, buffDuration, ticsRemaining, nil,
	)
}

// Helper functions
func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
