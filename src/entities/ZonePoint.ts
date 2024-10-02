export interface ZonePoint {
  id: number;
  zone: string | null;
  number: number;
  y: number;
  x: number;
  z: number;
  heading: number;
  target_y: number;
  target_x: number;
  target_z: number;
  target_heading: number;
  target_zone_id: number;
  client_version_mask: number;
  min_expansion: number;
  max_expansion: number;
  content_flags: string | null;
  content_flags_disabled: string | null;
  is_virtual: number;
  height: number;
  width: number;
}

export default ZonePoint;
