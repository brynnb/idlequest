export interface SpawnLocation {
  id: number;
  spawngroupID: number;
  zone: string;
  x: number;
  y: number;
  z: number;
  heading: number;
  respawntime: number;
  variance: number;
  pathgrid: number;
  _condition: number;
  cond_value: number;
  enabled: number;
  animation: number;
  boot_respawntime: number;
  clear_timer_onboot: number;
  boot_variance: number;
  force_z: number;
  min_expansion: number;
  max_expansion: number;
  content_flags: string;
  content_flags_disabled: string;
}

export class SpawnLocationEntity implements SpawnLocation {
  constructor(
    public id: number,
    public spawngroupID: number,
    public zone: string,
    public x: number,
    public y: number,
    public z: number,
    public heading: number,
    public respawntime: number,
    public variance: number,
    public pathgrid: number,
    public _condition: number,
    public cond_value: number,
    public enabled: number,
    public animation: number,
    public boot_respawntime: number,
    public clear_timer_onboot: number,
    public boot_variance: number,
    public force_z: number,
    public min_expansion: number,
    public max_expansion: number,
    public content_flags: string,
    public content_flags_disabled: string
  ) {}

  static fromObject(obj: any): SpawnLocationEntity {
    return new SpawnLocationEntity(
      obj.id,
      obj.spawngroupID,
      obj.zone,
      obj.x,
      obj.y,
      obj.z,
      obj.heading,
      obj.respawntime,
      obj.variance,
      obj.pathgrid,
      obj._condition,
      obj.cond_value,
      obj.enabled,
      obj.animation,
      obj.boot_respawntime,
      obj.clear_timer_onboot,
      obj.boot_variance,
      obj.force_z,
      obj.min_expansion,
      obj.max_expansion,
      obj.content_flags,
      obj.content_flags_disabled
    );
  }
}
