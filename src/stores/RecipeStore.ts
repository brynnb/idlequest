import { create } from 'zustand';
import type { Recipe, RecipeDetails, RecipeComponent } from '@/types/Recipe';
import {
    WorldSocket,
    OpCodes,
    GetRecipesRequest,
    GetRecipesResponse,
    GetRecipeDetailsRequest,
    GetRecipeDetailsResponse,
} from '@/net';

// Tradeskill IDs from EverQuest
export const TRADESKILL_IDS = {
    Fishing: 55,
    MakePoison: 56,
    Tinkering: 57,
    Research: 58,
    Alchemy: 59,
    Baking: 60,
    Tailoring: 61,
    Blacksmithing: 63,
    Fletching: 64,
    Brewing: 65,
    JewelryMaking: 68,
    Pottery: 69,
} as const;

interface RecipeState {
    // Current tradeskill being viewed
    selectedTradeskill: number;
    setSelectedTradeskill: (tradeskillId: number) => void;

    // Recipes for the current tradeskill
    recipes: Recipe[];
    loadingRecipes: boolean;
    loadedTradeskill: number | null; // Track which tradeskill we've loaded
    loadRecipes: (tradeskillId: number) => Promise<void>;

    // Selected recipe and its details
    selectedRecipe: Recipe | null;
    selectedRecipeDetails: RecipeDetails | null;
    loadingDetails: boolean;
    recipeDetailsCache: Map<number, RecipeDetails>; // Cache recipe details by ID
    selectRecipe: (recipe: Recipe | null) => void;
    loadRecipeDetails: (recipeId: number) => Promise<void>;

    // Check if player has required components
    checkCanCraft: (components: RecipeComponent[], playerInventory: Map<number, number>) => boolean;
}

const useRecipeStore = create<RecipeState>((set, get) => ({
    selectedTradeskill: TRADESKILL_IDS.Blacksmithing,
    setSelectedTradeskill: (tradeskillId: number) => {
        const current = get().loadedTradeskill;
        if (current !== tradeskillId) {
            set({
                selectedTradeskill: tradeskillId,
                selectedRecipe: null,
                selectedRecipeDetails: null,
                recipes: [],
                loadedTradeskill: null,
            });
            get().loadRecipes(tradeskillId);
        }
    },

    recipes: [],
    loadingRecipes: false,
    loadedTradeskill: null,
    loadRecipes: async (tradeskillId: number) => {
        // Prevent duplicate calls - if already loading or already loaded this tradeskill
        const state = get();
        if (state.loadingRecipes || state.loadedTradeskill === tradeskillId) {
            return;
        }

        set({ loadingRecipes: true });

        try {
            if (!WorldSocket.isConnected) {
                console.warn("WorldSocket not connected for loadRecipes");
                set({ loadingRecipes: false });
                return;
            }

            const response = await WorldSocket.sendRequest(
                OpCodes.GetRecipesRequest,
                OpCodes.GetRecipesResponse,
                GetRecipesRequest,
                GetRecipesResponse,
                { tradeskillId }
            );

            if (!response.success) {
                console.error("GetRecipes failed:", response.error);
                set({ recipes: [], loadingRecipes: false });
                return;
            }

            const recipes: Recipe[] = [];
            for (let i = 0; i < response.recipes.length; i++) {
                const r = response.recipes.get(i);
                recipes.push({
                    id: r.id,
                    name: r.name,
                    tradeskill: r.tradeskill,
                    skillneeded: r.skillneeded,
                    trivial: r.trivial,
                });
            }

            // Sort by trivial level
            recipes.sort((a, b) => a.trivial - b.trivial);

            set({ recipes, loadingRecipes: false, loadedTradeskill: tradeskillId });
            console.log(`Loaded ${recipes.length} recipes for tradeskill ${tradeskillId}`);
        } catch (error) {
            console.error("Error fetching recipes:", error);
            set({ recipes: [], loadingRecipes: false });
        }
    },

    selectedRecipe: null,
    selectedRecipeDetails: null,
    loadingDetails: false,
    recipeDetailsCache: new Map<number, RecipeDetails>(),
    selectRecipe: (recipe: Recipe | null) => {
        set({ selectedRecipe: recipe, selectedRecipeDetails: null });
        if (recipe) {
            get().loadRecipeDetails(recipe.id);
        }
    },
    loadRecipeDetails: async (recipeId: number) => {
        // Check cache first
        const cached = get().recipeDetailsCache.get(recipeId);
        if (cached) {
            set({ selectedRecipeDetails: cached, loadingDetails: false });
            return;
        }

        set({ loadingDetails: true });

        try {
            if (!WorldSocket.isConnected) {
                console.warn("WorldSocket not connected for loadRecipeDetails");
                set({ loadingDetails: false });
                return;
            }

            const response = await WorldSocket.sendRequest(
                OpCodes.GetRecipeDetailsRequest,
                OpCodes.GetRecipeDetailsResponse,
                GetRecipeDetailsRequest,
                GetRecipeDetailsResponse,
                { recipeId }
            );

            if (!response.success) {
                console.error("GetRecipeDetails failed:", response.error);
                set({ loadingDetails: false });
                return;
            }

            const components: RecipeComponent[] = [];
            for (let i = 0; i < response.components.length; i++) {
                const c = response.components.get(i);
                components.push({
                    itemId: c.itemId,
                    itemName: c.itemName,
                    itemIcon: c.itemIcon,
                    quantity: c.quantity,
                });
            }

            const outputs: RecipeComponent[] = [];
            for (let i = 0; i < response.outputs.length; i++) {
                const o = response.outputs.get(i);
                outputs.push({
                    itemId: o.itemId,
                    itemName: o.itemName,
                    itemIcon: o.itemIcon,
                    quantity: o.quantity,
                });
            }

            const details: RecipeDetails = {
                recipe: {
                    id: response.recipe.id,
                    name: response.recipe.name,
                    tradeskill: response.recipe.tradeskill,
                    skillneeded: response.recipe.skillneeded,
                    trivial: response.recipe.trivial,
                },
                components,
                outputs,
            };

            // Add to cache
            const cache = get().recipeDetailsCache;
            cache.set(recipeId, details);

            set({ selectedRecipeDetails: details, loadingDetails: false, recipeDetailsCache: cache });
            console.log(`Loaded and cached details for recipe ${recipeId}: ${components.length} components, ${outputs.length} outputs`);
        } catch (error) {
            console.error("Error fetching recipe details:", error);
            set({ loadingDetails: false });
        }
    },

    checkCanCraft: (components: RecipeComponent[], playerInventory: Map<number, number>) => {
        for (const comp of components) {
            const owned = playerInventory.get(comp.itemId) || 0;
            if (owned < comp.quantity) {
                return false;
            }
        }
        return true;
    },
}));

export default useRecipeStore;
