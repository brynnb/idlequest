# Game Systems

## Looting System Breakdown

TLDR: NPCs have a loottable ID, loottables have lootdrops, lootdrops have items.

1. **NPCs**: Characters not controlled by players. Each has a `loottable_id` determining potential item drops.

2. **loottable**: Lists possible item sets an NPC can drop. Each row is a unique set identified by an id.

3. **loottable_entries**: Links loot tables to items. Each row represents a possible item drop, connecting `loottable_id` to `lootdrop_id`.

4. **lootdrop**: Represents collections of items that can be dropped together. Each row is a unique collection.

5. **lootdrop_entries**: Links loot drops to actual items. Each row represents an item in a loot drop, connecting `lootdrop_id` to `item_id`.

### Loot Determination Process

1. Check NPC's `loottable_id`
2. Find matching rows in `loottable_entries`
3. For each row, check `lootdrop_id`
4. Find matching rows in `lootdrop_entries`
5. Use `item_id` to identify actual items

This structure allows for flexibility, enabling multiple NPCs to share loot tables and multiple loot tables to include the same loot drops.

### Example SQL Query

```sql
SELECT items.*
FROM items
INNER JOIN lootdrop_entries ON items.id = lootdrop_entries.item_id
INNER JOIN loottable_entries ON lootdrop_entries.lootdrop_id = loottable_entries.lootdrop_id
INNER JOIN npc_types ON loottable_entries.loottable_id = npc_types.loottable_id
WHERE npc_types.id = #;
```

## Spawn System Overview

The NPC spawn system is managed through three SQL tables originally named: `spawngroup`, `spawn2`, and `spawnentry`.

I've renamed "spawn2" to "spawnlocation" because the name makes much more sense.

### Spawn System Workflow

1. **Define a spawngroup** (spawngroup table)

   - Assign a unique ID
   - Give the spawngroup a name

2. **Add mobs to the spawngroup** (spawnentry table)

   - Specify the spawngroup ID
   - Add NPC IDs
   - Set spawn chances for each NPC

3. **Specify spawn locations** (spawnlocation table)
   - Link to the spawngroup ID
   - Set zone and coordinates
   - Configure respawn time and other parameters

### Example: Creating a Rat Spawn in Plane of Disease

1. **Create spawngroup**

   ```sql
   INSERT INTO spawngroup (id, name) VALUES (1, 'Plane of Disease Rats');
   ```

2. **Add mobs to spawngroup**

   ```sql
   INSERT INTO spawnentry (spawngroupID, npcID, chance) VALUES
   (1, 40010, 20), -- a_diseased_rat lvl 50
   (1, 40011, 20), -- a_diseased_rat lvl 51
   (1, 40012, 10), -- a_diseased_rat lvl 52
   (1, 40020, 25), -- a_swamp_rat lvl 52
   (1, 40021, 25); -- a_swamp_rat lvl 54
   ```

3. **Set spawn locations**
   ```sql
   INSERT INTO spawnlocation (id, spawngroupID, zone, x, y, z, heading, respawntime) VALUES
   (1, 1, 'podisease', 1000, 10, 100, 0, 120),
   (2, 1, 'podisease', 500, 500, 100, 0, 120);
   ```

### Notes

- `variance` in spawnlocation adds randomness to respawn time, useful for boss monsters.
- `pathgrid` in spawnlocation sets a movement path for spawned NPCs.
- `timeleft` in spawnlocation is used by the game to track respawn timers.
