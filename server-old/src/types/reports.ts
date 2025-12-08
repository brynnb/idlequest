/**
 * Types related to player reports
 * Based on the reports table in the database
 */

/**
 * Represents a player report from the database
 */
export interface Reports {
  id: number;
  name: string | null;
  reported: string | null;
  reported_text: string | null;
}

/**
 * Represents a simplified view of a player report
 */
export interface SimpleReport {
  id: number;
  reporterName: string | null;
  reportedName: string | null;
  description: string | null;
}

/**
 * Converts a Reports object to a SimpleReport object
 */
export function toSimpleReport(report: Reports): SimpleReport {
  return {
    id: report.id,
    reporterName: report.name,
    reportedName: report.reported,
    description: report.reported_text,
  };
}
