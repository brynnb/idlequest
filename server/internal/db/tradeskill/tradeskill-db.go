package tradeskill

import (
	"fmt"
	"log"

	"idlequest/internal/db"
	"idlequest/internal/db/jetgen/eqgo/model"
	"idlequest/internal/db/jetgen/eqgo/table"

	"github.com/go-jet/jet/v2/mysql"
)

// Recipe represents a tradeskill recipe with basic info
type Recipe struct {
	ID          int32
	Name        string
	Tradeskill  int16
	Skillneeded int16
	Trivial     int16
	Nofail      bool
}

// RecipeComponent represents an item component or output for a recipe
type RecipeComponent struct {
	ItemID   int32
	ItemName string
	ItemIcon int32
	Quantity int8
	IsOutput bool // true if this is produced, false if consumed
}

// RecipeDetails contains a recipe with its components and outputs
type RecipeDetails struct {
	Recipe     Recipe
	Components []RecipeComponent // Items consumed (componentcount > 0)
	Outputs    []RecipeComponent // Items produced (successcount > 0)
}

// CraftResult contains the result of a crafting attempt
type CraftResult struct {
	Success       bool
	Error         string
	ProducedItems []RecipeComponent
}

// GetRecipesByTradeskill returns all enabled recipes for a given tradeskill ID
// For Blacksmithing, tradeskillId = 63
// Only returns recipes where ALL components/outputs exist in the items table
func GetRecipesByTradeskill(tradeskillId int16) ([]Recipe, error) {
	// Use raw SQL to filter out recipes with missing item references
	query := `
		SELECT tr.id, tr.name, tr.tradeskill, tr.skillneeded, tr.trivial, tr.nofail
		FROM tradeskill_recipe tr
		WHERE tr.tradeskill = ?
		  AND tr.enabled = 1
		  AND tr.trivial > 0
		  AND tr.must_learn = 0
		  AND tr.quest = 0
		  AND tr.content_flags IS NULL
		  AND NOT EXISTS (
			  SELECT 1 FROM tradeskill_recipe_entries tre
			  WHERE tre.recipe_id = tr.id
			    AND tre.iscontainer = 0
			    AND tre.item_id NOT IN (SELECT id FROM items)
		  )
		ORDER BY tr.trivial ASC, tr.name ASC
	`

	rows, err := db.GlobalWorldDB.DB.Query(query, tradeskillId)
	if err != nil {
		return nil, fmt.Errorf("failed to query recipes for tradeskill %d: %v", tradeskillId, err)
	}
	defer rows.Close()

	var result []Recipe
	for rows.Next() {
		var r Recipe
		if err := rows.Scan(&r.ID, &r.Name, &r.Tradeskill, &r.Skillneeded, &r.Trivial, &r.Nofail); err != nil {
			log.Printf("Error scanning recipe row: %v", err)
			continue
		}
		result = append(result, r)
	}

	log.Printf("Found %d recipes for tradeskill %d", len(result), tradeskillId)
	return result, nil
}

// GetRecipeById returns a single recipe by ID
func GetRecipeById(recipeId int32) (*Recipe, error) {
	var recipes []model.TradeskillRecipe

	stmt := table.TradeskillRecipe.
		SELECT(
			table.TradeskillRecipe.ID,
			table.TradeskillRecipe.Name,
			table.TradeskillRecipe.Tradeskill,
			table.TradeskillRecipe.Skillneeded,
			table.TradeskillRecipe.Trivial,
			table.TradeskillRecipe.Nofail,
		).
		WHERE(table.TradeskillRecipe.ID.EQ(mysql.Int32(recipeId)))

	err := stmt.Query(db.GlobalWorldDB.DB, &recipes)
	if err != nil || len(recipes) == 0 {
		return nil, fmt.Errorf("recipe not found: %d", recipeId)
	}

	r := recipes[0]
	return &Recipe{
		ID:          r.ID,
		Name:        r.Name,
		Tradeskill:  r.Tradeskill,
		Skillneeded: r.Skillneeded,
		Trivial:     r.Trivial,
		Nofail:      r.Nofail,
	}, nil
}

// GetRecipeDetails returns a recipe with its components and outputs
func GetRecipeDetails(recipeId int32) (*RecipeDetails, error) {
	// Get the recipe first
	recipe, err := GetRecipeById(recipeId)
	if err != nil {
		return nil, err
	}

	// Get all entries for this recipe
	var entries []model.TradeskillRecipeEntries

	stmt := table.TradeskillRecipeEntries.
		SELECT(table.TradeskillRecipeEntries.AllColumns).
		WHERE(table.TradeskillRecipeEntries.RecipeID.EQ(mysql.Int32(recipeId)))

	err = stmt.Query(db.GlobalWorldDB.DB, &entries)
	if err != nil {
		return nil, fmt.Errorf("failed to query recipe entries: %v", err)
	}

	components := []RecipeComponent{}
	outputs := []RecipeComponent{}

	for _, entry := range entries {
		// Skip container entries
		if entry.Iscontainer {
			continue
		}

		// Get item details for name and icon
		var items []model.Items
		itemStmt := table.Items.
			SELECT(table.Items.ID, table.Items.Name, table.Items.Icon).
			WHERE(table.Items.ID.EQ(mysql.Int32(entry.ItemID)))

		if err := itemStmt.Query(db.GlobalWorldDB.DB, &items); err != nil || len(items) == 0 {
			log.Printf("Warning: could not find item %d for recipe %d", entry.ItemID, recipeId)
			continue
		}

		item := items[0]

		// Component if componentcount > 0
		if entry.Componentcount > 0 {
			components = append(components, RecipeComponent{
				ItemID:   entry.ItemID,
				ItemName: item.Name,
				ItemIcon: item.Icon,
				Quantity: entry.Componentcount,
				IsOutput: false,
			})
		}

		// Output if successcount > 0
		if entry.Successcount > 0 {
			outputs = append(outputs, RecipeComponent{
				ItemID:   entry.ItemID,
				ItemName: item.Name,
				ItemIcon: item.Icon,
				Quantity: entry.Successcount,
				IsOutput: true,
			})
		}
	}

	return &RecipeDetails{
		Recipe:     *recipe,
		Components: components,
		Outputs:    outputs,
	}, nil
}
