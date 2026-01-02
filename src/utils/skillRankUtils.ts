/**
 * Skill rank utility functions for displaying character abilities.
 *
 * EverQuest skill ranking system:
 * - 0-9: Awful
 * - 10-19: Feeble
 * - 20-29: Very Bad
 * - 30-39: Bad
 * - 40-49: Below Average
 * - 50-59: Average
 * - 60-69: Good
 * - 70-79: Very Good
 * - 80-89: Excellent
 * - 90-99: Master
 * - 100+: Master (with numeric value)
 */

/**
 * Convert a skill value to its rank string.
 * @param value - The numeric skill value (0-250)
 * @returns The rank string, e.g., "Awful", "Feeble", or "Master (102)"
 */
export function getSkillRank(value: number): string {
    if (value >= 100) return `Master (${value})`;
    if (value >= 90) return "Master";
    if (value >= 80) return "Excellent";
    if (value >= 70) return "Very Good";
    if (value >= 60) return "Good";
    if (value >= 50) return "Average";
    if (value >= 40) return "Below Average";
    if (value >= 30) return "Bad";
    if (value >= 20) return "Very Bad";
    if (value >= 10) return "Feeble";
    return "Awful";
}

/**
 * Get the tier index (0-10) for a skill value.
 * Useful for styling or sorting by rank.
 */
export function getSkillTier(value: number): number {
    if (value >= 100) return 10;
    return Math.floor(value / 10);
}
