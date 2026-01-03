package db_zone

import (
	"context"
	"fmt"

	"idlequest/internal/cache"
	"idlequest/internal/db"
	"idlequest/internal/db/jetgen/eqgo/model"
	"idlequest/internal/db/jetgen/eqgo/table"

	"github.com/go-jet/jet/v2/mysql"
	_ "github.com/go-sql-driver/mysql"
)

func GetZoneById(ctx context.Context, zoneID int) (*model.Zone, error) {
	cacheKey := fmt.Sprintf("zone:id:%d", zoneID)
	if val, found, err := cache.GetCache().Get(cacheKey); err == nil && found {
		if zone, ok := val.(*model.Zone); ok {
			return zone, nil
		}
	}

	var zone model.Zone
	err := table.Zone.
		SELECT(table.Zone.AllColumns).
		FROM(table.Zone).
		WHERE(
			table.Zone.Zoneidnumber.EQ(mysql.Int(int64(zoneID))),
		).
		QueryContext(ctx, db.GlobalWorldDB.DB, &zone)
	if err != nil {
		return nil, fmt.Errorf("query zone_data: %w", err)
	}

	cache.GetCache().Set(cacheKey, &zone)
	return &zone, nil
}

func GetAllZones(ctx context.Context) ([]model.Zone, error) {
	cacheKey := "zones:all"
	if val, found, err := cache.GetCache().Get(cacheKey); err == nil && found {
		if zones, ok := val.([]model.Zone); ok {
			return zones, nil
		}
	}

	var zones []model.Zone
	err := table.Zone.
		SELECT(table.Zone.AllColumns).
		FROM(table.Zone).
		WHERE(table.Zone.Version.EQ(mysql.Uint8(0))).
		QueryContext(ctx, db.GlobalWorldDB.DB, &zones)
	if err != nil {
		return nil, fmt.Errorf("query all zones: %w", err)
	}

	cache.GetCache().Set(cacheKey, zones)
	return zones, nil
}
