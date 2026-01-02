package mechanics

import (
	"testing"
)

func TestCalcSpellEffectValue_Formula100(t *testing.T) {
	// Formula 100: just return base value
	result := CalcSpellEffectValueSimple(100, 50, 0, 30, 0, 0, 0)
	if result != 50 {
		t.Errorf("Formula 100: expected 50, got %d", result)
	}
}

func TestCalcSpellEffectValue_Formula102(t *testing.T) {
	// Formula 102: base + level
	result := CalcSpellEffectValueSimple(102, 10, 0, 30, 0, 0, 0)
	expected := 10 + 30 // base + level
	if result != expected {
		t.Errorf("Formula 102: expected %d, got %d", expected, result)
	}
}

func TestCalcSpellEffectValue_Formula103(t *testing.T) {
	// Formula 103: base + level * 2
	result := CalcSpellEffectValueSimple(103, 10, 0, 30, 0, 0, 0)
	expected := 10 + 30*2 // base + level*2
	if result != expected {
		t.Errorf("Formula 103: expected %d, got %d", expected, result)
	}
}

func TestCalcSpellEffectValue_Formula111(t *testing.T) {
	// Formula 111: base + 6 * max(level - 16, 0)
	result := CalcSpellEffectValueSimple(111, 100, 0, 50, 0, 0, 0)
	expected := 100 + 6*(50-16) // base + 6 * (level - 16)
	if result != expected {
		t.Errorf("Formula 111: expected %d, got %d", expected, result)
	}
}

func TestCalcSpellEffectValue_WithMaxCap(t *testing.T) {
	// Test that max cap is applied
	result := CalcSpellEffectValueSimple(102, 100, 120, 50, 0, 0, 0)
	// 100 + 50 = 150, but max is 120
	if result != 120 {
		t.Errorf("Max cap: expected 120, got %d", result)
	}
}

func TestCalcSpellEffectValue_NegativeBase(t *testing.T) {
	// Test that negative base values preserve sign
	result := CalcSpellEffectValueSimple(100, -50, 0, 30, 0, 0, 0)
	if result != -50 {
		t.Errorf("Negative base: expected -50, got %d", result)
	}
}

func TestCalcSpellEffectValue_Formula124_BelowLevel50(t *testing.T) {
	// Formula 124-132: Only scale above level 50
	result := CalcSpellEffectValueSimple(124, 100, 0, 45, 0, 0, 0)
	// Below level 50, should just return base
	if result != 100 {
		t.Errorf("Formula 124 below 50: expected 100, got %d", result)
	}
}

func TestCalcSpellEffectValue_Formula124_AboveLevel50(t *testing.T) {
	// Formula 124: base + 1 * (level - 50)
	result := CalcSpellEffectValueSimple(124, 100, 0, 55, 0, 0, 0)
	expected := 100 + 1*(55-50)
	if result != expected {
		t.Errorf("Formula 124 above 50: expected %d, got %d", expected, result)
	}
}

func TestCalcSpellEffectValue_Formula2000Range(t *testing.T) {
	// Formula 2000-2650: base * (level * (formula - 2000) + 1)
	result := CalcSpellEffectValueSimple(2001, 10, 0, 30, 0, 0, 0)
	expected := 10 * (30*1 + 1) // formula - 2000 = 1
	if result != expected {
		t.Errorf("Formula 2001: expected %d, got %d", expected, result)
	}
}

func TestCalcSpellEffectValue_SimpleLevelMultiplier(t *testing.T) {
	// Formula < 100: base + level * formula
	result := CalcSpellEffectValueSimple(5, 10, 0, 30, 0, 0, 0)
	expected := 10 + 30*5
	if result != expected {
		t.Errorf("Formula 5: expected %d, got %d", expected, result)
	}
}

func TestCalcSpellEffectValue_HPRatio137(t *testing.T) {
	// Formula 137: HP ratio based
	params := &SpellEffectParams{CurrentHP: 500, MaxHP: 1000}
	result := CalcSpellEffectValue(137, 100, 0, 30, 0, 0, 0, params)
	// At 50% HP: 100 - 100 * 0.5 = 50
	if result != 50 {
		t.Errorf("Formula 137: expected 50, got %d", result)
	}
}

func TestCalcBuffDuration_Formula0(t *testing.T) {
	result := CalcBuffDuration(30, 0, 10)
	if result != 0 {
		t.Errorf("Buff duration formula 0: expected 0, got %d", result)
	}
}

func TestCalcBuffDuration_Formula7(t *testing.T) {
	// Formula 7: just level
	result := CalcBuffDuration(30, 7, 10)
	if result != 30 {
		t.Errorf("Buff duration formula 7: expected 30, got %d", result)
	}
}

func TestCalcBuffDuration_Formula50_Permanent(t *testing.T) {
	result := CalcBuffDuration(30, 50, 10)
	if result != 72000 {
		t.Errorf("Buff duration formula 50: expected 72000, got %d", result)
	}
}
