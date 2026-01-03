package staticdata

import (
	"context"
	"fmt"
	"os"
	"sync"

	"idlequest/internal/cache"
	"idlequest/internal/db"
	"idlequest/internal/db/charcreate"
	"idlequest/internal/db/jetgen/eqgo/model"
	"idlequest/internal/db/jetgen/eqgo/table"
	db_zone "idlequest/internal/db/zone"

	"github.com/go-jet/jet/v2/mysql"
)

// RaceInfo represents a playable race
type RaceInfo struct {
	ID         int32  `json:"id"`
	Name       string `json:"name"`
	NoCoin     int32  `json:"no_coin"`
	IsPlayable bool   `json:"is_playable"`
	ShortName  string `json:"short_name"`
	Bitmask    int32  `json:"bitmask"`
}

// ClassInfo represents a playable class
type ClassInfo struct {
	ID           int32  `json:"id"`
	Bitmask      int32  `json:"bitmask"`
	Name         string `json:"name"`
	ShortName    string `json:"short_name"`
	CreatePoints int32  `json:"create_points"`
}

// DeityInfo represents a deity
type DeityInfo struct {
	ID          int32  `json:"id"`
	Name        string `json:"name"`
	Bitmask     int32  `json:"bitmask"`
	Description string `json:"description"`
	AltName     string `json:"alt_name"`
}

// CombinationDescription represents a description for a specific race/class/deity combination
type CombinationDescription struct {
	RaceID      int32  `json:"race_id"`
	ClassID     int32  `json:"class_id"`
	DeityID     int32  `json:"deity_id"`
	Description string `json:"description"`
}

// ZoneDescriptionInfo represents a description and welcome message for a zone
type ZoneDescriptionInfo struct {
	ZoneID      int32  `json:"zone_id"`
	Description string `json:"description"`
	Welcome     string `json:"welcome"`
}

// StaticData holds all static game data
type StaticData struct {
	Races                      []RaceInfo
	Classes                    []ClassInfo
	Deities                    []DeityInfo
	CharCreateCombinations     []model.CharCreateCombinations
	CharCreatePointAllocations []model.CharCreatePointAllocations
	CombinationDescriptions    []CombinationDescription
	StartZones                 []model.StartZones
	ZoneDescriptions           []ZoneDescriptionInfo
}

var (
	staticData     *StaticData
	staticDataOnce sync.Once
	staticDataErr  error
)

// GetStaticData returns the cached static data, loading it if necessary
func GetStaticData(ctx context.Context) (*StaticData, error) {
	staticDataOnce.Do(func() {
		staticData, staticDataErr = loadStaticData(ctx)
	})
	return staticData, staticDataErr
}

func loadStaticData(ctx context.Context) (*StaticData, error) {
	cacheKey := "staticdata:all"
	if val, found, err := cache.GetCache().Get(cacheKey); err == nil && found {
		if data, ok := val.(*StaticData); ok {
			return data, nil
		}
	}

	data := &StaticData{}

	// Load races from DB
	races, err := loadRacesFromDB(ctx)
	if err != nil {
		return nil, fmt.Errorf("load races: %w", err)
	}
	data.Races = races

	// Load classes from DB
	classes, err := loadClassesFromDB(ctx)
	if err != nil {
		return nil, fmt.Errorf("load classes: %w", err)
	}
	data.Classes = classes

	// Load deities from database (char_create_data table)
	deities, err := loadDeitiesFromDB()
	if err != nil {
		return nil, fmt.Errorf("load deities: %w", err)
	}
	data.Deities = deities

	// Load char create combinations from database
	combinations, err := loadCharCreateCombinations(ctx)
	if err != nil {
		return nil, fmt.Errorf("load char create combinations: %w", err)
	}
	data.CharCreateCombinations = combinations

	// Load char create point allocations from database
	allocations, err := loadCharCreatePointAllocations(ctx)
	if err != nil {
		return nil, fmt.Errorf("load char create point allocations: %w", err)
	}
	data.CharCreatePointAllocations = allocations

	// Load combination descriptions from DB
	descriptions, err := loadCombinationDescriptionsFromDB(ctx)
	if err != nil {
		fmt.Printf("Warning: failed to load combination descriptions: %v\n", err)
	} else {
		data.CombinationDescriptions = descriptions
	}

	// Load zone descriptions from DB
	zoneDescs, err := loadZoneDescriptionsFromDB(ctx)
	if err != nil {
		fmt.Printf("Warning: failed to load zone descriptions: %v\n", err)
	} else {
		data.ZoneDescriptions = zoneDescs
	}

	// Load start zones from database
	startZones, err := loadStartZonesFromDB(ctx)
	if err != nil {
		return nil, fmt.Errorf("load start zones: %w", err)
	}
	data.StartZones = startZones

	cache.GetCache().Set(cacheKey, data)
	return data, nil
}

func getDataPath() string {
	// Try relative path from server directory
	paths := []string{
		"../data/json",
		"data/json",
		"../../data/json",
	}
	for _, p := range paths {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return "../data/json" // default
}

func loadRacesFromDB(ctx context.Context) ([]RaceInfo, error) {
	var dbRaces []model.Races
	err := table.Races.
		SELECT(table.Races.AllColumns).
		FROM(table.Races).
		WHERE(table.Races.IsPlayable.EQ(mysql.Int8(1))).
		ORDER_BY(table.Races.ID.ASC()).
		QueryContext(ctx, db.GlobalWorldDB.DB, &dbRaces)
	if err != nil {
		return nil, err
	}

	var races []RaceInfo
	for _, r := range dbRaces {
		info := RaceInfo{
			ID:   r.ID,
			Name: r.Name,
		}
		if r.NoCoin != nil {
			info.NoCoin = int32(*r.NoCoin)
		}
		if r.IsPlayable != nil {
			info.IsPlayable = *r.IsPlayable == 1
		}
		if r.ShortName != nil {
			info.ShortName = *r.ShortName
		}
		if r.Bitmask != nil {
			info.Bitmask = *r.Bitmask
		}
		races = append(races, info)
	}
	return races, nil
}

func loadClassesFromDB(ctx context.Context) ([]ClassInfo, error) {
	var dbClasses []model.Classes
	err := table.Classes.
		SELECT(table.Classes.AllColumns).
		FROM(table.Classes).
		WHERE(table.Classes.Bitmask.IS_NOT_NULL()).
		ORDER_BY(table.Classes.ID.ASC()).
		QueryContext(ctx, db.GlobalWorldDB.DB, &dbClasses)
	if err != nil {
		return nil, err
	}

	var classes []ClassInfo
	for _, c := range dbClasses {
		classes = append(classes, ClassInfo{
			ID:           c.ID,
			Bitmask:      *c.Bitmask,
			Name:         c.Name,
			ShortName:    *c.ShortName,
			CreatePoints: *c.CreatePoints,
		})
	}
	return classes, nil
}

func loadCombinationDescriptionsFromDB(ctx context.Context) ([]CombinationDescription, error) {
	var dbDescs []model.CombinationDescriptions
	err := table.CombinationDescriptions.
		SELECT(table.CombinationDescriptions.AllColumns).
		FROM(table.CombinationDescriptions).
		QueryContext(ctx, db.GlobalWorldDB.DB, &dbDescs)
	if err != nil {
		return nil, err
	}

	var descriptions []CombinationDescription
	for _, d := range dbDescs {
		descriptions = append(descriptions, CombinationDescription{
			RaceID:      d.RaceID,
			ClassID:     d.ClassID,
			DeityID:     d.DeityID,
			Description: *d.Description,
		})
	}
	return descriptions, nil
}

func loadZoneDescriptionsFromDB(ctx context.Context) ([]ZoneDescriptionInfo, error) {
	var dbDescs []model.ZoneDescriptions
	err := table.ZoneDescriptions.
		SELECT(table.ZoneDescriptions.AllColumns).
		FROM(table.ZoneDescriptions).
		QueryContext(ctx, db.GlobalWorldDB.DB, &dbDescs)
	if err != nil {
		return nil, err
	}

	var descriptions []ZoneDescriptionInfo
	for _, d := range dbDescs {
		descriptions = append(descriptions, ZoneDescriptionInfo{
			ZoneID:      d.ZoneID,
			Description: *d.Description,
			Welcome:     *d.Welcome,
		})
	}
	return descriptions, nil
}

func loadDeitiesFromDB() ([]DeityInfo, error) {
	dbDeities, err := charcreate.GetDeities()
	if err != nil {
		return nil, fmt.Errorf("get deities from db: %w", err)
	}

	var deities []DeityInfo
	for _, d := range dbDeities {
		deity := DeityInfo{
			ID:   *d.GameID,
			Name: d.Name,
		}
		if d.Description != nil {
			deity.Description = *d.Description
		}
		if d.AltName != nil {
			deity.AltName = *d.AltName
		}
		// Calculate bitmask from position (1, 2, 4, 8, etc.)
		// For now, use a simple lookup based on deity ID
		deity.Bitmask = getBitmaskForDeity(deity.ID)
		deities = append(deities, deity)
	}
	return deities, nil
}

func getBitmaskForDeity(deityID int32) int32 {
	// Bitmask values from the original deities.json
	bitmasks := map[int32]int32{
		140: 1,     // Agnostic
		201: 2,     // Bertoxxulous
		202: 4,     // Brell Serilis
		203: 8,     // Cazic Thule
		204: 16,    // Erollisi Marr
		205: 32,    // Bristlebane
		206: 64,    // Innoruuk
		207: 128,   // Karana
		208: 256,   // Mithaniel Marr
		209: 512,   // Prexus
		210: 1024,  // Quellious
		211: 2048,  // Rallos Zek
		212: 4096,  // Rodcet Nife
		213: 8192,  // Solusek Ro
		214: 16384, // The Tribunal
		215: 32768, // Tunare
		216: 65536, // Veeshan
	}
	if bitmask, ok := bitmasks[deityID]; ok {
		return bitmask
	}
	return 0
}

func loadCharCreateCombinations(ctx context.Context) ([]model.CharCreateCombinations, error) {
	var combinations []model.CharCreateCombinations
	err := table.CharCreateCombinations.
		SELECT(table.CharCreateCombinations.AllColumns).
		FROM(table.CharCreateCombinations).
		QueryContext(ctx, db.GlobalWorldDB.DB, &combinations)
	if err != nil {
		return nil, fmt.Errorf("query char_create_combinations: %w", err)
	}
	return combinations, nil
}

func loadCharCreatePointAllocations(ctx context.Context) ([]model.CharCreatePointAllocations, error) {
	var allocations []model.CharCreatePointAllocations
	err := table.CharCreatePointAllocations.
		SELECT(table.CharCreatePointAllocations.AllColumns).
		FROM(table.CharCreatePointAllocations).
		QueryContext(ctx, db.GlobalWorldDB.DB, &allocations)
	if err != nil {
		return nil, fmt.Errorf("query char_create_point_allocations: %w", err)
	}
	return allocations, nil
}

// GetAllZones returns all zones from the database
func GetAllZones(ctx context.Context) ([]model.Zone, error) {
	return db_zone.GetAllZones(ctx)
}

func loadStartZonesFromDB(ctx context.Context) ([]model.StartZones, error) {
	var startZones []model.StartZones
	err := table.StartZones.
		SELECT(table.StartZones.AllColumns).
		FROM(table.StartZones).
		QueryContext(ctx, db.GlobalWorldDB.DB, &startZones)
	if err != nil {
		return nil, fmt.Errorf("query start_zones: %w", err)
	}
	return startZones, nil
}
