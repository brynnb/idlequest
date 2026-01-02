package world

import (
	"testing"

	eq "idlequest/internal/api/capnp"

	"capnproto.org/go/capnp/v3"
)

func TestInitializeNewCharacterProfile_HPBug(t *testing.T) {
	// 1. Create a dummy CharCreate message
	_, seg, err := capnp.NewMessage(capnp.SingleSegment(nil))
	if err != nil {
		t.Fatalf("failed to create message: %v", err)
	}
	cc, err := eq.NewCharCreate(seg)
	if err != nil {
		t.Fatalf("failed to create CharCreate: %v", err)
	}

	cc.SetName("TestChar")
	cc.SetRace(1)      // Human
	cc.SetCharClass(1) // Warrior
	cc.SetSta(75)      // Base human sta

	// 2. Create a dummy PlayerProfile to populate
	_, ppSeg, err := capnp.NewMessage(capnp.SingleSegment(nil))
	if err != nil {
		t.Fatalf("failed to create pp message: %v", err)
	}
	pp, err := eq.NewPlayerProfile(ppSeg)
	if err != nil {
		t.Fatalf("failed to create PlayerProfile: %v", err)
	}

	// 3. Run initialization
	InitializeNewCharacterProfile(&pp, cc)

	// 4. Check HP
	curHp := pp.CurHp()

	// A level 1 human warrior with 75 STA should have around 30-40 HP.
	// Definitely not 1000.
	// This test asserts that HP should be within reasonable bounds.
	// It is expected to FAIL until the bug is fixed.
	t.Logf("Initialized Character HP: %d", curHp)

	if curHp > 200 {
		t.Errorf("Starting HP (%d) is suspiciously high. Likely exceeds MaxHP for level 1 character.", curHp)
	}
}
