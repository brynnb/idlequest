package db_zone

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"idlequest/internal/cache"
	"idlequest/internal/db"
	"idlequest/internal/db/jetgen/eqgo/model"
	"idlequest/internal/db/jetgen/eqgo/table"

	"github.com/go-jet/jet/v2/mysql"
	_ "github.com/go-sql-driver/mysql"
)

type GridEntries struct {
	Zoneid      int32
	Gridid      int64
	Number      int32
	X           float64
	Y           float64
	Z           float64
	Heading     float64
	Pause       int32
	Centerpoint int32
}

// GetZoneGridEntries loads every Grid and its pruned GridEntries for a zone using jet-go against grid_paths.
// Returns a map: gridID → slice of entries (ordered by original sequence).
// If the grid_paths table doesn't exist, returns an empty map.
func GetZoneGridEntries(zoneID int32) (map[int64][]GridEntries, error) {
	cacheKey := fmt.Sprintf("zone:grid_paths:%d", zoneID)
	if val, found, err := cache.GetCache().Get(cacheKey); err == nil && found {
		if m, ok := val.(map[int64][]GridEntries); ok {
			return m, nil
		}
	}

	ctx := context.Background()

	// Query gridid and JSON points via jet-go
	var paths []model.GridPaths

	err := table.GridPaths.
		SELECT(
			table.GridPaths.AllColumns,
		).
		FROM(table.GridPaths).
		WHERE(table.GridPaths.Zoneid.EQ(mysql.Int32(zoneID))).
		ORDER_BY(table.GridPaths.Gridid).
		QueryContext(ctx, db.GlobalWorldDB.DB, &paths)

	// If the table doesn't exist, return an empty map instead of failing
	if err != nil && strings.Contains(err.Error(), "Table 'eqgo.grid_paths' doesn't exist") {
		// Cache the empty result
		cache.GetCache().Set(cacheKey, make(map[int64][]GridEntries))
		return make(map[int64][]GridEntries), nil
	}
	if err != nil {
		return nil, fmt.Errorf("query grid_paths: %w", err)
	}

	// Prepare result map
	gridMap := make(map[int64][]GridEntries, len(paths))

	for _, p := range paths {
		// Unmarshal JSON array of [x,y,z,heading,pause]
		var pts [][]float64
		if err := json.Unmarshal([]byte(p.Points), &pts); err != nil {
			return nil, fmt.Errorf("unmarshal points for grid %d: %w", p.Gridid, err)
		}

		entries := make([]GridEntries, len(pts))
		for i, arr := range pts {
			entries[i] = GridEntries{
				Zoneid:      zoneID,
				Gridid:      int64(p.Gridid),
				Number:      int32(i),
				X:           arr[0],
				Y:           arr[1],
				Z:           arr[2],
				Heading:     arr[3],
				Pause:       int32(arr[4]),
				Centerpoint: 0,
			}
		}
		gridMap[int64(p.Gridid)] = entries
	}

	// Cache and return
	if ok, err := cache.GetCache().Set(cacheKey, gridMap); err != nil || !ok {
		return nil, fmt.Errorf("cache set error: %w", err)
	}
	return gridMap, nil
}
