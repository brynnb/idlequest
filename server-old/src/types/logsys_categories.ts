/**
 * Types related to log system categories
 * Based on the logsys_categories table in the database
 */

/**
 * Represents a log system category from the database
 */
export interface LogsysCategories {
  log_category_id: number;
  log_category_description: string | null;
  log_to_console: number;
  log_to_file: number;
  log_to_gmsay: number;
}

/**
 * Represents a simplified view of a log system category
 */
export interface SimpleLogCategory {
  id: number;
  description: string;
  logToConsole: boolean;
  logToFile: boolean;
  logToGmsay: boolean;
}

/**
 * Converts a LogsysCategories object to a SimpleLogCategory object
 */
export function toSimpleLogCategory(
  category: LogsysCategories
): SimpleLogCategory {
  return {
    id: category.log_category_id,
    description: category.log_category_description || "",
    logToConsole: category.log_to_console === 1,
    logToFile: category.log_to_file === 1,
    logToGmsay: category.log_to_gmsay === 1,
  };
}
