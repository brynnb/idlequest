/**
 * Character Currency Types
 * Based on the character_currency table in the database
 */

/**
 * Represents a character's currency information from the database
 */
export interface DBCharacterCurrency {
  id: number;
  platinum: number;
  gold: number;
  silver: number;
  copper: number;
  platinum_bank: number;
  gold_bank: number;
  silver_bank: number;
  copper_bank: number;
  platinum_cursor: number;
  gold_cursor: number;
  silver_cursor: number;
  copper_cursor: number;
}

/**
 * Represents a simplified view of a character's currency
 */
export interface SimpleCurrency {
  platinum: number;
  gold: number;
  silver: number;
  copper: number;
}

/**
 * Represents all currency locations for a character
 */
export interface CurrencyLocations {
  inventory: SimpleCurrency;
  bank: SimpleCurrency;
  cursor: SimpleCurrency;
}

/**
 * Converts a DBCharacterCurrency object to a CurrencyLocations object
 */
export function toCurrencyLocations(
  currency: DBCharacterCurrency
): CurrencyLocations {
  return {
    inventory: {
      platinum: currency.platinum,
      gold: currency.gold,
      silver: currency.silver,
      copper: currency.copper,
    },
    bank: {
      platinum: currency.platinum_bank,
      gold: currency.gold_bank,
      silver: currency.silver_bank,
      copper: currency.copper_bank,
    },
    cursor: {
      platinum: currency.platinum_cursor,
      gold: currency.gold_cursor,
      silver: currency.silver_cursor,
      copper: currency.copper_cursor,
    },
  };
}
