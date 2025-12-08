/**
 * Types related to system variables
 * Based on the variables table in the database
 */

/**
 * Represents a system variable from the database
 */
export interface Variables {
  varname: string;
  value: string;
  information: string;
  ts: string;
}

/**
 * Represents a simplified view of a system variable
 */
export interface SimpleVariable {
  name: string;
  value: string;
  description: string;
  lastUpdated: Date;
}

/**
 * Converts a Variables object to a SimpleVariable object
 */
export function toSimpleVariable(variable: Variables): SimpleVariable {
  return {
    name: variable.varname,
    value: variable.value,
    description: variable.information,
    lastUpdated: new Date(variable.ts),
  };
}
