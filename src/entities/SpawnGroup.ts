export interface SpawnGroup {
    id: number;
    name: string;
    spawn_limit: number;
    max_x: number;
    min_x: number;
    max_y: number;
    min_y: number;
    delay: number;
    mindelay: number;
    despawn: number;
    despawn_timer: number;
    rand_spawns: number;
    rand_respawntime: number;
    rand_variance: number;
    rand_condition: number;
    wp_spawns: number;
  }
  
  export class SpawnGroupEntity implements SpawnGroup {
    constructor(
      public id: number,
      public name: string,
      public spawn_limit: number,
      public max_x: number,
      public min_x: number,
      public max_y: number,
      public min_y: number,
      public delay: number,
      public mindelay: number,
      public despawn: number,
      public despawn_timer: number,
      public rand_spawns: number,
      public rand_respawntime: number,
      public rand_variance: number,
      public rand_condition: number,
      public wp_spawns: number
    ) {}
  
    static fromObject(obj: any): SpawnGroupEntity {
      return new SpawnGroupEntity(
        obj.id,
        obj.name,
        obj.spawn_limit,
        obj.max_x,
        obj.min_x,
        obj.max_y,
        obj.min_y,
        obj.delay,
        obj.mindelay,
        obj.despawn,
        obj.despawn_timer,
        obj.rand_spawns,
        obj.rand_respawntime,
        obj.rand_variance,
        obj.rand_condition,
        obj.wp_spawns
      );
    }
  }