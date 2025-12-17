package world

import (
	"context"
	"log"
	"unicode"

	eq "idlequest/internal/api/capnp"
	"idlequest/internal/constants"
	"idlequest/internal/db/jetgen/eqgo/model"
	"idlequest/internal/session"
	"idlequest/internal/staticdata"

	_ "github.com/go-sql-driver/mysql"
)

// Constants for races and classes
const (
	RaceHuman     = 1
	RaceBarbarian = 2
	RaceErudite   = 3
	RaceWoodElf   = 4
	RaceHighElf   = 5
	RaceDarkElf   = 6
	RaceHalfElf   = 7
	RaceDwarf     = 8
	RaceTroll     = 9
	RaceOgre      = 10
	RaceHalfling  = 11
	RaceGnome     = 12
	RaceIksar     = 128
	RaceVahShir   = 130
	RaceFroglok   = 330
	RaceDrakkin   = 522

	ClassWarrior      = 1
	ClassCleric       = 2
	ClassPaladin      = 3
	ClassRanger       = 4
	ClassShadowKnight = 5
	ClassDruid        = 6
	ClassMonk         = 7
	ClassBard         = 8
	ClassRogue        = 9
	ClassShaman       = 10
	ClassNecromancer  = 11
	ClassWizard       = 12
	ClassMagician     = 13
	ClassEnchanter    = 14
	ClassBeastlord    = 15
	ClassBerserker    = 16
)

// BaseRaceStats defines base stats for each race
var BaseRaceStats = map[uint32][7]uint32{
	RaceHuman:     {75, 75, 75, 75, 75, 75, 75},
	RaceBarbarian: {103, 95, 82, 70, 70, 60, 55},
	RaceErudite:   {60, 70, 70, 70, 83, 107, 70},
	RaceWoodElf:   {65, 65, 95, 80, 80, 75, 75},
	RaceHighElf:   {55, 65, 85, 70, 95, 92, 80},
	RaceDarkElf:   {60, 65, 90, 75, 83, 99, 60},
	RaceHalfElf:   {70, 70, 90, 85, 60, 75, 75},
	RaceDwarf:     {90, 90, 70, 90, 83, 60, 45},
	RaceTroll:     {108, 109, 83, 75, 60, 52, 40},
	RaceOgre:      {130, 122, 70, 70, 67, 60, 37},
	RaceHalfling:  {70, 75, 95, 90, 80, 67, 50},
	RaceGnome:     {60, 70, 85, 85, 67, 98, 60},
	RaceIksar:     {70, 70, 90, 85, 80, 75, 55},
	RaceVahShir:   {90, 75, 90, 70, 70, 65, 65},
	RaceFroglok:   {70, 80, 100, 100, 75, 75, 50},
	RaceDrakkin:   {70, 80, 85, 75, 80, 85, 75},
}

// BaseClassStats defines base stats and additional points for each class
var BaseClassStats = map[uint32][8]uint32{
	ClassWarrior:      {10, 10, 5, 0, 0, 0, 0, 25},
	ClassCleric:       {5, 5, 0, 0, 10, 0, 0, 30},
	ClassPaladin:      {10, 5, 0, 0, 5, 0, 10, 20},
	ClassRanger:       {5, 10, 10, 0, 5, 0, 0, 20},
	ClassShadowKnight: {10, 5, 0, 0, 0, 10, 5, 20},
	ClassDruid:        {0, 10, 0, 0, 10, 0, 0, 30},
	ClassMonk:         {5, 5, 10, 10, 0, 0, 0, 20},
	ClassBard:         {5, 0, 0, 10, 0, 0, 10, 25},
	ClassRogue:        {0, 0, 10, 10, 0, 0, 0, 30},
	ClassShaman:       {0, 5, 0, 0, 10, 0, 5, 30},
	ClassNecromancer:  {0, 0, 0, 10, 0, 10, 0, 30},
	ClassWizard:       {0, 10, 0, 0, 0, 10, 0, 30},
	ClassMagician:     {0, 10, 0, 0, 0, 10, 0, 30},
	ClassEnchanter:    {0, 0, 0, 0, 0, 10, 10, 30},
	ClassBeastlord:    {0, 10, 5, 0, 10, 0, 5, 20},
	ClassBerserker:    {10, 5, 0, 10, 0, 0, 0, 25},
}

// ClassRaceLookupTable defines valid race/class combinations
var ClassRaceLookupTable = [16][16]bool{
	// Warrior
	{true, true, false, true, false, true, true, true, true, true, true, true, true, true, true, true},
	// Cleric
	{true, false, true, false, true, true, true, true, false, false, true, true, false, false, true, true},
	// Paladin
	{true, false, true, false, true, false, true, true, false, false, true, true, false, false, true, true},
	// Ranger
	{true, false, false, true, false, false, true, false, false, false, true, false, false, false, false, true},
	// ShadowKnight
	{true, false, true, false, false, true, false, false, true, true, false, true, true, false, true, true},
	// Druid
	{true, false, false, true, false, false, true, false, false, false, true, false, false, false, false, true},
	// Monk
	{true, false, false, false, false, false, false, false, false, false, false, false, true, false, false, true},
	// Bard
	{true, false, false, true, false, false, true, false, false, false, false, false, false, true, false, true},
	// Rogue
	{true, true, false, true, false, true, true, true, false, false, true, true, false, true, true, true},
	// Shaman
	{false, true, false, false, false, false, false, false, true, true, false, false, true, true, true, false},
	// Necromancer
	{true, false, true, false, false, true, false, false, false, false, false, true, true, false, true, true},
	// Wizard
	{true, false, true, false, true, true, false, false, false, false, false, true, false, false, true, true},
	// Magician
	{true, false, true, false, true, true, false, false, false, false, false, true, false, false, false, true},
	// Enchanter
	{true, false, true, false, true, true, false, false, false, false, false, true, false, false, false, true},
	// Beastlord
	{false, true, false, false, false, false, false, false, true, true, false, false, true, true, false, false},
	// Berserker
	{false, true, false, false, false, false, false, true, true, true, false, false, false, true, false, false},
}

// OPCharCreate creates the character in the database
func CharacterCreate(ses *session.Session, accountId int64, cc eq.CharCreate) bool {
	ctx := context.Background()
	if !CheckCharCreateInfo(cc) {
		log.Println("CheckCharCreateInfo failed")
		return false
	}
	pp, err := session.NewMessage(ses, eq.NewPlayerProfile)
	if err != nil {
		log.Printf("failed to create new PlayerProfile message: %v", err)
		return false
	}
	segment := pp.Segment()
	_, err = pp.NewSkills(78)
	if err != nil {
		log.Printf("failed to create new Skills list: %v", err)
		return false
	}
	// Allocate enough language slots to safely set class-specific languages
	// like Thieves' Cant at index 18 in SetClassLanguages.
	_, err = pp.NewLanguages(19)
	if err != nil {
		log.Printf("failed to create new Languages list: %v", err)
		return false
	}

	_, err = pp.NewBinds(5)
	if err != nil {
		log.Printf("failed to create new Binds list: %v", err)
		return false
	}

	if !eq.CopyErrorValue(cc.Name, pp.SetName) {
		return false
	}
	pp.SetRace(cc.Race())
	pp.SetCharClass(cc.CharClass())
	pp.SetGender(cc.Gender())
	pp.SetDeity(cc.Deity())
	pp.SetStr(cc.Str())
	pp.SetSta(cc.Sta())
	pp.SetAgi(cc.Agi())
	pp.SetDex(cc.Dex())
	pp.SetWis(cc.Wis())
	pp.SetIntel(cc.Intel())
	pp.SetCha(cc.Cha())
	pp.SetFace(cc.Face())
	pp.SetLevel(1)
	pp.SetPoints(5)
	pp.SetCurHp(1000)
	pp.SetHungerLevel(6000)
	pp.SetThirstLevel(6000)
	pp.SetHeading(0)
	pp.SetPvp(0)
	pp.SetZoneId(2) // Qeynos as default
	pp.SetX(-1)
	pp.SetY(-1)
	pp.SetZ(-1)
	skills, _ := pp.Skills()
	skills.Set(27, 50) // Swimming
	skills.Set(55, 50) // Sense Heading

	// Set racial and class skills and languages
	log.Printf("Setting racial languages for race %d", pp.Race())
	SetRacialLanguages(&pp)
	log.Printf("Setting race starting skills for race %d", pp.Race())
	SetRaceStartingSkills(&pp)
	log.Printf("Setting class starting skills for class %d", pp.CharClass())
	SetClassStartingSkills(&pp)
	log.Printf("Setting class languages for class %d", pp.CharClass())
	SetClassLanguages(&pp)

	log.Printf("Getting start zone for class %d, deity %d, race %d", pp.CharClass(), pp.Deity(), pp.Race())
	startZone, err := GetStartZone(ctx, uint8(pp.CharClass()), uint32(pp.Deity()), uint32(pp.Race()))
	if err == nil {
		pp.SetZoneId(int32(startZone.ZoneID))
		cc.SetStartZone(int32(pp.ZoneId()))
		pp.SetX(float32(startZone.X))
		pp.SetY(float32(startZone.Y))
		pp.SetZ(float32(startZone.Z))
	} else {
		zone, err := GetZone(ctx, pp.ZoneId())
		if err != nil {
			pp.SetX(float32(zone.SafeX))
			pp.SetY(float32(zone.SafeY))
			pp.SetZ(float32(zone.SafeZ))
		} else {
			pp.SetX(-1)
			pp.SetY(-1)
			pp.SetZ(-1)
		}
	}

	binds, _ := pp.Binds()

	// Set bind points
	log.Printf("Setting bind points")
	for i := range 5 {
		bind, _ := eq.NewBind(segment)
		bind.SetZoneId(pp.ZoneId())
		bind.SetX(pp.X())
		bind.SetY(pp.Y())
		bind.SetZ(pp.Z())
		bind.SetHeading(pp.Heading())
		binds.Set(i, bind)
	}

	// Store character
	log.Printf("Storing character to database")
	result := StoreCharacter(accountId, &pp)
	log.Printf("StoreCharacter returned: %v", result)
	return result
}

func CheckCharCreateInfo(cc eq.CharCreate) bool {
	ctx := context.Background()
	race := cc.Race()
	class := cc.CharClass()
	deity := cc.Deity()

	// Get static data from database
	data, err := staticdata.GetStaticData(ctx)
	if err != nil {
		log.Printf("CheckCharCreateInfo: failed to get static data: %v", err)
		return false
	}

	// Find the allocation for this race/class/deity combination
	var allocationID uint32
	found := false
	for _, combo := range data.CharCreateCombinations {
		if combo.Race == uint32(race) && combo.Class == uint32(class) && combo.Deity == uint32(deity) {
			allocationID = combo.AllocationID
			found = true
			break
		}
	}

	if !found {
		log.Printf("CheckCharCreateInfo: no valid combination found for race=%d, class=%d, deity=%d", race, class, deity)
		return false
	}

	// Find the allocation data
	var alloc *model.CharCreatePointAllocations
	for i := range data.CharCreatePointAllocations {
		if data.CharCreatePointAllocations[i].ID == allocationID {
			alloc = &data.CharCreatePointAllocations[i]
			break
		}
	}

	if alloc == nil {
		log.Printf("CheckCharCreateInfo: allocation ID %d not found", allocationID)
		return false
	}

	// Get class create points
	var createPoints uint32
	for _, cls := range data.Classes {
		if cls.ID == int32(class) {
			createPoints = uint32(cls.CreatePoints)
			break
		}
	}

	// Calculate expected totals from allocation data
	bTotal := alloc.BaseStr + alloc.BaseSta + alloc.BaseAgi + alloc.BaseDex + alloc.BaseWis + alloc.BaseInt + alloc.BaseCha
	allocTotal := alloc.AllocStr + alloc.AllocSta + alloc.AllocAgi + alloc.AllocDex + alloc.AllocWis + alloc.AllocInt + alloc.AllocCha
	expectedTotal := bTotal + allocTotal + createPoints

	cTotal := uint32(cc.Str() + cc.Sta() + cc.Agi() + cc.Dex() + cc.Wis() + cc.Intel() + cc.Cha())

	errors := 0
	if expectedTotal != cTotal {
		log.Printf("Stat points total doesn't match: expected %d, got %d", expectedTotal, cTotal)
		errors++
	}

	// Check each stat is within valid range (base to base+alloc+createPoints)
	maxStat := func(base, allocd uint32) uint32 {
		return base + allocd + createPoints
	}

	if uint32(cc.Str()) > maxStat(alloc.BaseStr, alloc.AllocStr) || uint32(cc.Str()) < alloc.BaseStr {
		log.Println("Str out of range")
		errors++
	}
	if uint32(cc.Sta()) > maxStat(alloc.BaseSta, alloc.AllocSta) || uint32(cc.Sta()) < alloc.BaseSta {
		log.Println("Sta out of range")
		errors++
	}
	if uint32(cc.Agi()) > maxStat(alloc.BaseAgi, alloc.AllocAgi) || uint32(cc.Agi()) < alloc.BaseAgi {
		log.Println("Agi out of range")
		errors++
	}
	if uint32(cc.Dex()) > maxStat(alloc.BaseDex, alloc.AllocDex) || uint32(cc.Dex()) < alloc.BaseDex {
		log.Println("Dex out of range")
		errors++
	}
	if uint32(cc.Wis()) > maxStat(alloc.BaseWis, alloc.AllocWis) || uint32(cc.Wis()) < alloc.BaseWis {
		log.Println("Wis out of range")
		errors++
	}
	if uint32(cc.Intel()) > maxStat(alloc.BaseInt, alloc.AllocInt) || uint32(cc.Intel()) < alloc.BaseInt {
		log.Println("Intel out of range")
		errors++
	}
	if uint32(cc.Cha()) > maxStat(alloc.BaseCha, alloc.AllocCha) || uint32(cc.Cha()) < alloc.BaseCha {
		log.Println("Cha out of range")
		errors++
	}

	if errors > 0 {
		log.Printf("Found %d errors in character creation request", errors)
	}
	return errors == 0
}

// SetRacialLanguages sets language skills based on race
func SetRacialLanguages(pp *eq.PlayerProfile) {
	const (
		LanguageCommonTongue  = 0
		LanguageBarbarian     = 1
		LanguageErudian       = 2
		LanguageElvish        = 3
		LanguageDarkElvish    = 4
		LanguageDwarvish      = 5
		LanguageTroll         = 6
		LanguageOgre          = 7
		LanguageGnomish       = 8
		LanguageHalfling      = 9
		LanguageLizardman     = 10
		LanguageVahShir       = 11
		LanguageFroglok       = 12
		LanguageDarkSpeech    = 13
		LanguageElderElvish   = 14
		LanguageCombineTongue = 15
		LanguageElderDragon   = 16
		LanguageDragon        = 17
	)

	maxValue := int32(100) // Language::MaxValue equivalent
	languages, err := pp.Languages()
	if err != nil {
		log.Printf("failed to get languages: %v", err)
		return
	}
	switch pp.Race() {
	case RaceHuman:
		languages.Set(LanguageCommonTongue, maxValue)
	case RaceBarbarian:
		languages.Set(LanguageCommonTongue, maxValue)
		languages.Set(LanguageBarbarian, maxValue)
	case RaceErudite:
		languages.Set(LanguageCommonTongue, maxValue)
		languages.Set(LanguageErudian, maxValue)
	case RaceWoodElf:
		languages.Set(LanguageCommonTongue, maxValue)
		languages.Set(LanguageElvish, maxValue)
	case RaceHighElf:
		languages.Set(LanguageCommonTongue, maxValue)
		languages.Set(LanguageElvish, maxValue)
		languages.Set(LanguageDarkElvish, maxValue)
		languages.Set(LanguageElderElvish, maxValue)
	case RaceDarkElf:
		languages.Set(LanguageCommonTongue, maxValue)
		languages.Set(LanguageDarkElvish, maxValue)
		languages.Set(LanguageDarkSpeech, maxValue)
		languages.Set(LanguageElderElvish, maxValue)
		languages.Set(LanguageElvish, 25)
	case RaceHalfElf:
		languages.Set(LanguageCommonTongue, maxValue)
		languages.Set(LanguageDarkElvish, maxValue)
	case RaceDwarf:
		languages.Set(LanguageCommonTongue, maxValue)
		languages.Set(LanguageDwarvish, maxValue)
		languages.Set(LanguageDarkElvish, 25)
	case RaceTroll:
		languages.Set(LanguageCommonTongue, 25) // RuleI(Character, TrollCommonTongue)
		languages.Set(LanguageDarkSpeech, maxValue)
		languages.Set(LanguageTroll, maxValue)
	case RaceOgre:
		languages.Set(LanguageCommonTongue, 25) // RuleI(Character, OgreCommonTongue)
		languages.Set(LanguageDarkSpeech, maxValue)
		languages.Set(LanguageOgre, maxValue)
	case RaceHalfling:
		languages.Set(LanguageCommonTongue, maxValue)
		languages.Set(LanguageHalfling, maxValue)
	case RaceGnome:
		languages.Set(LanguageCommonTongue, maxValue)
		languages.Set(LanguageGnomish, maxValue)
		languages.Set(LanguageDwarvish, 25)
	case RaceIksar:
		languages.Set(LanguageCommonTongue, 25)
		languages.Set(LanguageLizardman, maxValue)
		languages.Set(LanguageDarkSpeech, maxValue)

	case RaceVahShir:
		languages.Set(LanguageCommonTongue, maxValue)
		languages.Set(LanguageCombineTongue, maxValue)
		languages.Set(LanguageVahShir, maxValue)
		languages.Set(LanguageErudian, 25)
	case RaceFroglok:
		languages.Set(LanguageCommonTongue, maxValue)
		languages.Set(LanguageFroglok, maxValue)
		languages.Set(LanguageTroll, 25)
	case RaceDrakkin:
		languages.Set(LanguageCommonTongue, maxValue)
		languages.Set(LanguageElderDragon, maxValue)
		languages.Set(LanguageDragon, maxValue)
	}
}

// SetRaceStartingSkills sets race-specific starting skills
func SetRaceStartingSkills(pp *eq.PlayerProfile) {

	skills, err := pp.Skills()
	if err != nil {
		log.Printf("failed to get skills: %v", err)
		return
	}
	switch pp.Race() {
	case RaceDarkElf:
		skills.Set(constants.Skill_Hide, 50)
	case RaceFroglok:
		skills.Set(constants.Skill_Swimming, 100)
	case RaceGnome:
		skills.Set(constants.Skill_Tinkering, 50)
	case RaceHalfling:
		skills.Set(constants.Skill_Hide, 50)
		skills.Set(constants.Skill_Sneak, 50)
	case RaceIksar:
		skills.Set(constants.Skill_Forage, 50)
		skills.Set(constants.Skill_Swimming, 50)
	case RaceWoodElf:
		skills.Set(constants.Skill_Forage, 50)
		skills.Set(constants.Skill_Hide, 50)
	case RaceVahShir:
		skills.Set(constants.Skill_SafeFall, 50)
		skills.Set(constants.Skill_Sneak, 50)
	}
}

// SetClassStartingSkills sets class-specific starting skills
func SetClassStartingSkills(pp *eq.PlayerProfile) {
	// Simplified: Set non-zero skills to their cap at level 1
	// You may need a skill_caps table or function to get accurate caps
	skills, err := pp.Skills()
	if err != nil {
		log.Printf("failed to get skills: %v", err)
		return
	}
	for i := 0; i <= 77; i++ {
		if skills.At(i) == 0 {

			if constants.IsSpecializedSkill(i) || (constants.IsTradeskill(i) && i != constants.Skill_Fishing) ||
				i == constants.Skill_AlcoholTolerance || i == constants.Skill_BindWound {
				continue
			}

			charClass := int32(pp.CharClass())
			cap, err := GetSkillCap(int(charClass), i, 1)
			if err != nil {
				log.Printf("failed to get skill cap for class %d, skill %d: %v", charClass, i, err)
				skills.Set(i, 0)
				continue
			}
			skills.Set(i, int32(cap))
		}
	}
}

// SetClassLanguages sets class-specific languages
func SetClassLanguages(pp *eq.PlayerProfile) {
	const (
		LanguageThievesCant = 18
	)
	maxValue := uint32(100)
	languages, err := pp.Languages()
	if err != nil {
		log.Printf("failed to get languages: %v", err)
		return
	}
	if pp.CharClass() == ClassRogue {
		languages.Set(LanguageThievesCant, int32(maxValue))
	}
}

// StoreCharacter saves the character to the database
func StoreCharacter(accountID int64, pp *eq.PlayerProfile) bool {
	// Get character ID
	ctx := context.Background()
	return SaveCharacterCreate(ctx, accountID, pp)
}

func ValidateName(name string) bool {
	ctx := context.Background()
	isValid := true
	if len(name) < 4 || len(name) > 15 {
		isValid = false
	} else if !unicode.IsUpper(rune(name[0])) {
		isValid = false
	} else if !CheckNameFilter(ctx, name) {
		isValid = false
	} else {
		for idx, char := range name {
			if idx > 0 && (!unicode.IsLetter(char) || unicode.IsUpper(char)) {
				isValid = false
				break
			}
		}
	}
	return isValid
}
