package staticdata

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"idlequest/internal/cache"
	"idlequest/internal/db"
	"idlequest/internal/db/charcreate"
	"idlequest/internal/db/jetgen/eqgo/model"
	"idlequest/internal/db/jetgen/eqgo/table"
	db_zone "idlequest/internal/db/zone"
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

// StaticData holds all static game data
type StaticData struct {
	Races                      []RaceInfo
	Classes                    []ClassInfo
	Deities                    []DeityInfo
	CharCreateCombinations     []model.CharCreateCombinations
	CharCreatePointAllocations []model.CharCreatePointAllocations
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

	// Load races from JSON file
	races, err := loadRacesFromJSON()
	if err != nil {
		return nil, fmt.Errorf("load races: %w", err)
	}
	data.Races = races

	// Load classes from JSON file
	classes, err := loadClassesFromJSON()
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

func loadRacesFromJSON() ([]RaceInfo, error) {
	path := filepath.Join(getDataPath(), "races.json")
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read races.json: %w", err)
	}

	var races []RaceInfo
	if err := json.Unmarshal(data, &races); err != nil {
		return nil, fmt.Errorf("parse races.json: %w", err)
	}
	return races, nil
}

func loadClassesFromJSON() ([]ClassInfo, error) {
	path := filepath.Join(getDataPath(), "classes.json")
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("read classes.json: %w", err)
	}

	var classes []ClassInfo
	if err := json.Unmarshal(data, &classes); err != nil {
		return nil, fmt.Errorf("parse classes.json: %w", err)
	}
	return classes, nil
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
