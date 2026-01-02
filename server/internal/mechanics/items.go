package mechanics

import (
	"idlequest/internal/db/jetgen/eqgo/model"
	"math"
)

var MeleeClasses = []int{1, 7, 9, 16}               // Warrior, Monk, Rogue, Berserker
var HybridClasses = []int{3, 4, 5, 8, 15}           // Paladin, Ranger, Shadow Knight, Bard, Beastlord
var CasterClasses = []int{2, 6, 10, 11, 12, 13, 14} // Cleric, Druid, Shaman, Necromancer, Wizard, Magician, Enchanter

type Weights struct {
	hp      float64
	mana    float64
	ac      float64
	str     float64
	sta     float64
	agi     float64
	dex     float64
	intelig float64
	wis     float64
	cha     float64
	resists float64
}

func getClassWeights(classID int) Weights {
	switch classID {
	case 1: // Warrior
		return Weights{hp: 1.0, mana: 0, ac: 1.0, str: 0.8, sta: 1.0, agi: 0.6, dex: 0.4, intelig: 0, wis: 0, cha: 0, resists: 0.2}
	case 2: // Cleric
		return Weights{hp: 0.6, mana: 1.0, ac: 0.4, str: 0, sta: 0.4, agi: 0, dex: 0, intelig: 0, wis: 5.0, cha: 0, resists: 0.3}
	case 3: // Paladin
		return Weights{hp: 0.8, mana: 0.6, ac: 0.8, str: 0.6, sta: 0.8, agi: 0, dex: 0, intelig: 0, wis: 0.8, cha: 0, resists: 0.2}
	case 4: // Ranger
		return Weights{hp: 0.6, mana: 0.4, ac: 0.4, str: 0.8, sta: 0.6, agi: 0.4, dex: 0.8, intelig: 0, wis: 0.4, cha: 0, resists: 0.2}
	case 5: // Shadow Knight
		return Weights{hp: 0.8, mana: 0.6, ac: 0.8, str: 0.8, sta: 0.8, agi: 0, dex: 0, intelig: 0.6, wis: 0, cha: 0, resists: 0.2}
	case 6: // Druid
		return Weights{hp: 0.4, mana: 1.0, ac: 0.2, str: 0, sta: 0.2, agi: 0, dex: 0, intelig: 0, wis: 5.0, cha: 0, resists: 0.4}
	case 7: // Monk
		return Weights{hp: 0.6, mana: 0, ac: 0.6, str: 0.8, sta: 0.8, agi: 1.0, dex: 0.4, intelig: 0, wis: 0, cha: 0, resists: 0.2}
	case 8: // Bard
		return Weights{hp: 0.4, mana: 0.4, ac: 0.4, str: 0.2, sta: 0.6, agi: 0.4, dex: 0.8, intelig: 0, wis: 0, cha: 1.0, resists: 0.3}
	case 9: // Rogue
		return Weights{hp: 0.4, mana: 0, ac: 0.4, str: 0.8, sta: 0.6, agi: 0.6, dex: 1.0, intelig: 0, wis: 0, cha: 0, resists: 0.2}
	case 10: // Shaman
		return Weights{hp: 0.4, mana: 1.0, ac: 0.2, str: 0, sta: 0.4, agi: 0, dex: 0, intelig: 0, wis: 5.0, cha: 0, resists: 0.4}
	case 11: // Necromancer
		return Weights{hp: 0.2, mana: 1.0, ac: 0.1, str: 0, sta: 0.2, agi: 0, dex: 0, intelig: 5.0, wis: 0, cha: 0, resists: 0.3}
	case 12: // Wizard
		return Weights{hp: 0.2, mana: 1.0, ac: 0.1, str: 0, sta: 0.1, agi: 0, dex: 0, intelig: 5.0, wis: 0, cha: 0, resists: 0.4}
	case 13: // Magician
		return Weights{hp: 0.2, mana: 1.0, ac: 0.1, str: 0, sta: 0.1, agi: 0, dex: 0, intelig: 5.0, wis: 0, cha: 0, resists: 0.3}
	case 14: // Enchanter
		return Weights{hp: 0.2, mana: 1.0, ac: 0.1, str: 0, sta: 0.1, agi: 0, dex: 0, intelig: 5.0, wis: 0, cha: 2.0, resists: 0.4}
	case 15: // Beastlord
		return Weights{hp: 0.6, mana: 0.6, ac: 0.4, str: 0.4, sta: 0.6, agi: 0.2, dex: 0.6, intelig: 0, wis: 0.8, cha: 0, resists: 0.3}
	case 16: // Berserker
		return Weights{hp: 0.8, mana: 0, ac: 0.6, str: 1.0, sta: 0.8, agi: 0.4, dex: 0.6, intelig: 0, wis: 0, cha: 0, resists: 0.2}
	default:
		return Weights{}
	}
}

func contains(slice []int, val int) bool {
	for _, item := range slice {
		if item == val {
			return true
		}
	}
	return false
}

// GetItemScore calculates a score for an item based on character class
// Ported from src/utils/getItemScore.ts
func GetItemScore(item *model.Items, classID int) int {
	if item == nil {
		return 0
	}

	ratioScore := 0.0
	attributeScore := 0.0

	isWeapon := item.Damage > 0 && item.Delay > 0

	// Calculate ratio score for weapons
	if isWeapon {
		damagePerSecond := float64(item.Damage) / (float64(item.Delay) / 100.0)
		ratioScore = damagePerSecond * 2.0
	}

	// Calculate attribute score
	weights := getClassWeights(classID)
	attributeScore += math.Max(0, float64(item.Hp)) * weights.hp
	attributeScore += math.Max(0, float64(item.Mana)) * weights.mana
	attributeScore += math.Max(0, float64(item.Ac)) * weights.ac
	attributeScore += float64(item.Astr) * weights.str
	attributeScore += float64(item.Asta) * weights.sta
	attributeScore += float64(item.Aagi) * weights.agi
	attributeScore += float64(item.Adex) * weights.dex
	attributeScore += float64(item.Aint) * weights.intelig
	attributeScore += float64(item.Awis) * weights.wis
	attributeScore += float64(item.Acha) * weights.cha

	// Special effects and procs
	if item.Proceffect != 0 {
		attributeScore += 10
	}
	if item.Clickeffect != 0 {
		attributeScore += 5
	}

	// Determine the ratio of ratio score to attribute score based on class type and item type
	ratioWeight := 0.0
	if isWeapon {
		if contains(MeleeClasses, classID) {
			ratioWeight = 0.9
		} else if contains(HybridClasses, classID) {
			ratioWeight = 0.75
		} else if contains(CasterClasses, classID) {
			ratioWeight = 0.05
		}
	}

	// Calculate final score
	var finalScore float64
	if isWeapon {
		finalScore = ratioScore*ratioWeight + attributeScore*(1.0-ratioWeight)
	} else {
		finalScore = attributeScore
	}

	// Adjust score based on required level
	if item.Reqlevel > 0 {
		finalScore *= 1.0 + float64(item.Reqlevel)/100.0
	}

	if finalScore < 0 {
		return 0
	}
	return int(math.Round(finalScore))
}
