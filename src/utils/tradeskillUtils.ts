import { Skill } from "@entities/Skill";
import CharacterProfile from "@entities/CharacterProfile";

/**
 * Mapping of tradeskill IDs to their property names on CharacterProfile
 */
const TRADESKILL_PROPERTY_MAP: Record<Skill, keyof CharacterProfile | null> = {
    [Skill.Fishing]: "fishing",
    [Skill.MakePoison]: null, // Not on CharacterProfile
    [Skill.Tinkering]: "tinkering",
    [Skill.Research]: "research",
    [Skill.Alchemy]: "alchemy",
    [Skill.Baking]: "baking",
    [Skill.Tailoring]: "tailoring",
    [Skill.Blacksmithing]: "blacksmithing",
    [Skill.Fletching]: "fletching",
    [Skill.Brewing]: "brewing",
    [Skill.JewelryMaking]: "jewelry",
    [Skill.Pottery]: "pottery",
} as Record<Skill, keyof CharacterProfile | null>;

/**
 * Get the value of a tradeskill from the character profile
 * @param skillId - The Skill enum value
 * @param characterProfile - The character profile to read from
 * @returns The skill value, or 0 if not found
 */
export function getTradeskillValue(
    skillId: Skill,
    characterProfile: CharacterProfile | null | undefined
): number {
    if (!characterProfile) return 0;

    const propertyName = TRADESKILL_PROPERTY_MAP[skillId];
    if (!propertyName) return 0;

    const value = characterProfile[propertyName];
    return typeof value === "number" ? value : 0;
}

/**
 * List of all tradeskill IDs for iteration
 */
export const TRADESKILL_IDS: Skill[] = [
    Skill.Fishing,
    Skill.MakePoison,
    Skill.Tinkering,
    Skill.Research,
    Skill.Alchemy,
    Skill.Baking,
    Skill.Tailoring,
    Skill.Blacksmithing,
    Skill.Fletching,
    Skill.Brewing,
    Skill.JewelryMaking,
    Skill.Pottery,
];
