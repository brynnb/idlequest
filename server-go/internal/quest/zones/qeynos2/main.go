package qeynos2

import "idlequest/internal/quest"

func RegisterZone() *quest.ZoneQuestInterface {
	zq := &quest.ZoneQuestInterface{}
	registerNpcQuests(zq)
	registerZoneQuests(zq)
	return zq
}
