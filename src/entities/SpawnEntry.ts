export interface SpawnEntry {
  spawngroupID: number;
  npcID: number;
  chance: number;
  mintime: number;
  maxtime: number;
  min_expansion: number;
  max_expansion: number;
  content_flags: string;
  content_flags_disabled: string;
}

export class SpawnEntryEntity implements SpawnEntry {
  constructor(
    public spawngroupID: number,
    public npcID: number,
    public chance: number,
    public mintime: number,
    public maxtime: number,
    public min_expansion: number,
    public max_expansion: number,
    public content_flags: string,
    public content_flags_disabled: string
  ) {}

  static fromObject(obj: any): SpawnEntryEntity {
    return new SpawnEntryEntity(
      obj.spawngroupID,
      obj.npcID,
      obj.chance,
      obj.mintime,
      obj.maxtime,
      obj.min_expansion,
      obj.max_expansion,
      obj.content_flags,
      obj.content_flags_disabled
    );
  }
}
