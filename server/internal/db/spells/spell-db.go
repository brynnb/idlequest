package spells

import (
	"fmt"
	"log"

	"idlequest/internal/cache"
	"idlequest/internal/db"
	"idlequest/internal/db/jetgen/eqgo/model"
	"idlequest/internal/db/jetgen/eqgo/table"

	"github.com/go-jet/jet/v2/mysql"
)

// GetSpellByID retrieves a spell by its ID with caching
func GetSpellByID(id int32) (*model.SpellsNew, error) {
	cacheKey := fmt.Sprintf("spell:id:%d", id)
	if val, found, err := cache.GetCache().Get(cacheKey); err == nil && found {
		if spell, ok := val.(*model.SpellsNew); ok {
			return spell, nil
		}
	}

	var spell model.SpellsNew
	err := table.SpellsNew.
		SELECT(table.SpellsNew.AllColumns).
		WHERE(table.SpellsNew.ID.EQ(mysql.Int32(id))).
		Query(db.GlobalWorldDB.DB, &spell)

	if err != nil {
		return nil, fmt.Errorf("failed to query spell: %v", err)
	}

	// Cache the result
	cache.GetCache().Set(cacheKey, &spell)

	return &spell, nil
}

// GetEqstrByID retrieves a localized string by its ID with caching
func GetEqstrByID(id int32) (*model.EqstrUs, error) {
	cacheKey := fmt.Sprintf("eqstr:id:%d", id)
	if val, found, err := cache.GetCache().Get(cacheKey); err == nil && found {
		if eqstr, ok := val.(*model.EqstrUs); ok {
			return eqstr, nil
		}
	}

	var eqstr model.EqstrUs
	err := table.EqstrUs.
		SELECT(table.EqstrUs.AllColumns).
		WHERE(table.EqstrUs.ID.EQ(mysql.Int32(id))).
		Query(db.GlobalWorldDB.DB, &eqstr)

	if err != nil {
		log.Printf("Failed to query eqstr_us id %d: %v", id, err)
		return nil, fmt.Errorf("failed to query eqstr: %v", err)
	}

	// Cache the result
	cache.GetCache().Set(cacheKey, &eqstr)

	return &eqstr, nil
}
