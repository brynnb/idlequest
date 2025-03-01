/**
 * Launcher Types
 * Based on the launcher and launcher_zones tables in the database
 */

import { ZoneID } from "./index.js";

/**
 * Represents a launcher entry
 */
export interface Launcher {
  name: string;
  dynamics: number;
}

/**
 * Represents a launcher zone entry
 */
export interface LauncherZone {
  launcher: string;
  zone: string;
  port: number;
  enabled: boolean;
  expansion: string | null;
}

/**
 * Enum for expansion types
 */
export enum ExpansionType {
  CLASSIC = "classic",
  KUNARK = "kunark",
  VELIOUS = "velious",
  LUCLIN = "luclin",
  POP = "pop",
}

/**
 * Represents a zone server instance
 */
export interface ZoneServer {
  id: string;
  zone_name: string;
  port: number;
  enabled: boolean;
  expansion: ExpansionType | null;
  dynamic: boolean;
  dynamic_count: number;
}

/**
 * Converts a LauncherZone to a ZoneServer
 */
export function toZoneServer(
  launcher: Launcher,
  launcherZone: LauncherZone
): ZoneServer {
  return {
    id: `${launcher.name}_${launcherZone.zone}`,
    zone_name: launcherZone.zone,
    port: launcherZone.port,
    enabled: launcherZone.enabled,
    expansion: launcherZone.expansion as ExpansionType | null,
    dynamic: launcher.dynamics > 0,
    dynamic_count: launcher.dynamics,
  };
}
