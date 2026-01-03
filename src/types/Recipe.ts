// Recipe types for tradeskill system

export interface Recipe {
    id: number;
    name: string;
    tradeskill: number;
    skillneeded: number;
    trivial: number;
}

export interface RecipeComponent {
    itemId: number;
    itemName: string;
    itemIcon: number;
    quantity: number;
}

export interface RecipeDetails {
    recipe: Recipe;
    components: RecipeComponent[];
    outputs: RecipeComponent[];
}

export interface CraftResult {
    success: boolean;
    error?: string;
    producedItems: RecipeComponent[];
}
