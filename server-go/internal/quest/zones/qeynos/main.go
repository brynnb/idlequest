package qeynos

import "idlequest/internal/quest"

func RegisterZone() *quest.ZoneQuestInterface {
	zq := &quest.ZoneQuestInterface{}
	registerNpcQuests(zq)
	return zq
}
