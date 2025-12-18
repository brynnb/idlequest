package charcreate

import (
	"database/sql"
	"sync"

	"github.com/go-jet/jet/v2/mysql"

	"idlequest/internal/db"
	"idlequest/internal/db/jetgen/eqgo/model"
	"idlequest/internal/db/jetgen/eqgo/table"
)

var (
	deitiesCache []model.CharCreateData
	citiesCache  []model.CharCreateData
	racesCache   []model.CharCreateData
	classesCache []model.CharCreateData
	statsCache   []model.CharCreateData
	cacheMu      sync.RWMutex
	cacheLoaded  bool
)

func loadCache() error {
	cacheMu.Lock()
	defer cacheMu.Unlock()

	if cacheLoaded {
		return nil
	}

	conn := db.GlobalWorldDB.DB

	// Load deities (combined name, alt_name, and description)
	err := table.CharCreateData.
		SELECT(table.CharCreateData.AllColumns).
		WHERE(table.CharCreateData.Category.EQ(mysql.String("deity"))).
		ORDER_BY(table.CharCreateData.GameID.ASC()).
		Query(conn, &deitiesCache)
	if err != nil {
		return err
	}

	// Load cities
	err = table.CharCreateData.
		SELECT(table.CharCreateData.AllColumns).
		WHERE(table.CharCreateData.Category.EQ(mysql.String("city"))).
		ORDER_BY(table.CharCreateData.EqstrIDStart.ASC()).
		Query(conn, &citiesCache)
	if err != nil {
		return err
	}

	// Load races
	err = table.CharCreateData.
		SELECT(table.CharCreateData.AllColumns).
		WHERE(table.CharCreateData.Category.EQ(mysql.String("race"))).
		ORDER_BY(table.CharCreateData.GameID.ASC()).
		Query(conn, &racesCache)
	if err != nil {
		return err
	}

	// Load classes
	err = table.CharCreateData.
		SELECT(table.CharCreateData.AllColumns).
		WHERE(table.CharCreateData.Category.EQ(mysql.String("class"))).
		ORDER_BY(table.CharCreateData.GameID.ASC()).
		Query(conn, &classesCache)
	if err != nil {
		return err
	}

	// Load stats
	err = table.CharCreateData.
		SELECT(table.CharCreateData.AllColumns).
		WHERE(table.CharCreateData.Category.EQ(mysql.String("stat"))).
		ORDER_BY(table.CharCreateData.EqstrIDStart.ASC()).
		Query(conn, &statsCache)
	if err != nil {
		return err
	}

	cacheLoaded = true
	return nil
}

// GetDeities returns all deity entries (name, alt_name, description combined)
func GetDeities() ([]model.CharCreateData, error) {
	if err := loadCache(); err != nil {
		return nil, err
	}
	cacheMu.RLock()
	defer cacheMu.RUnlock()
	return deitiesCache, nil
}

// GetDeityByGameID returns a deity by its game ID
func GetDeityByGameID(gameID int32) (*model.CharCreateData, error) {
	if err := loadCache(); err != nil {
		return nil, err
	}
	cacheMu.RLock()
	defer cacheMu.RUnlock()

	for _, d := range deitiesCache {
		if d.GameID != nil && *d.GameID == gameID {
			return &d, nil
		}
	}
	return nil, sql.ErrNoRows
}

// GetCities returns all city entries
func GetCities() ([]model.CharCreateData, error) {
	if err := loadCache(); err != nil {
		return nil, err
	}
	cacheMu.RLock()
	defer cacheMu.RUnlock()
	return citiesCache, nil
}

// GetRaces returns all race description entries
func GetRaces() ([]model.CharCreateData, error) {
	if err := loadCache(); err != nil {
		return nil, err
	}
	cacheMu.RLock()
	defer cacheMu.RUnlock()
	return racesCache, nil
}

// GetRaceByGameID returns a race by its game ID
func GetRaceByGameID(gameID int32) (*model.CharCreateData, error) {
	if err := loadCache(); err != nil {
		return nil, err
	}
	cacheMu.RLock()
	defer cacheMu.RUnlock()

	for _, r := range racesCache {
		if r.GameID != nil && *r.GameID == gameID {
			return &r, nil
		}
	}
	return nil, sql.ErrNoRows
}

// GetClasses returns all class description entries
func GetClasses() ([]model.CharCreateData, error) {
	if err := loadCache(); err != nil {
		return nil, err
	}
	cacheMu.RLock()
	defer cacheMu.RUnlock()
	return classesCache, nil
}

// GetClassByGameID returns a class by its game ID
func GetClassByGameID(gameID int32) (*model.CharCreateData, error) {
	if err := loadCache(); err != nil {
		return nil, err
	}
	cacheMu.RLock()
	defer cacheMu.RUnlock()

	for _, c := range classesCache {
		if c.GameID != nil && *c.GameID == gameID {
			return &c, nil
		}
	}
	return nil, sql.ErrNoRows
}

// GetStats returns all stat description entries
func GetStats() ([]model.CharCreateData, error) {
	if err := loadCache(); err != nil {
		return nil, err
	}
	cacheMu.RLock()
	defer cacheMu.RUnlock()
	return statsCache, nil
}

// GetCharCreateDataByCategory returns all entries for a given category
func GetCharCreateDataByCategory(category string) ([]model.CharCreateData, error) {
	conn := db.GlobalWorldDB.DB

	var results []model.CharCreateData
	err := table.CharCreateData.
		SELECT(table.CharCreateData.AllColumns).
		WHERE(table.CharCreateData.Category.EQ(mysql.String(category))).
		ORDER_BY(table.CharCreateData.ID.ASC()).
		Query(conn, &results)
	if err != nil {
		return nil, err
	}

	return results, nil
}
