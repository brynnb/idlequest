# IdleQuest

Idle / incremental game based on EverQuest circa 1999. Lots of features to be determined. Overall idea is to have data be as close as feasibly possible to classic EverQuest. As one example, all of the race/class/diety/starting zone/point allocations are from the actual EQEmu database, which presumably either matches classic or is pretty close and good enough. I also intend to have the same mobs in the same zones dropping the same loot and providing the same level of experience. 

This project accommodates numerous quirks from legacy Everquest code, including inconsistent data, poor data structuring, and various puzzling elements. I've chosen to maintain these oddities for two reasons: to avoid extensive data cleanup and to keep calculations closely aligned with EQ Emulator code. This approach allows me to continue using their open-source work for future progress while staying true to the classic experience.

## Dev

`pnp run dev`

`python ./data/add_table_to_db_from_csv.py` as needed, but also don't do this bc it makes all fields text values

## To-Do

* Double check ALL for races on items is working as intended, make sure race-specific item is also only showing that one race
* Make sure an item with stats is showing relevant stats
* Fix display of fire and magic and etc resists on items
* Calculate health, mana, stamina, and maybe armor and attack points on character creation/stat and level change
* Add item stack, fix quantities for starting item food/drink
* Make useRandomName a util and not a hook
* Need to engage with NPCs given their rarity of spawning, otherwise when in Karnor's we're killin Venril all the time and getting way too much good loot. Maybe need to incorporate spawn timers too. 
* Rings show "FINGER FINGER" for slots in item info
* No duplicate LORE items
* AC needs to display on own line for item info
* Score 2H weapons against both primary and secondary slot items
* Bards should keep best version of each instrument
* If old weapon and newly looted weapon both have zero stats, compare best ratio even for casters
* When automatically replacing equiped item with new one, make sure old one is actually going back to inventory
* Lots more

## Backlog

* The race/class/deity combinations pull in descriptions from eqstr_us.txt. Some of these are already organized into JSON but there are so many possible combinations and not all of them have organized. This is a low priority nice-to-have so putting it off for now.
* Sqlite database I'm importing data into it using TEXT type for every field, I should probably import the actual table structures, which might also require some code updates because there are places that accommdated stuff being string which I thought was an artifact of legacy code but it may have possibly just been my mistake. 

## Resources

* https://docs.eqemu.io/schema/characters/char_create_combinations/ (and other pages)
* https://github.com/EQEmu/Server
* UI examples for classic character creation: https://www.youtube.com/watch?v=EjWDRHu9mhU


## Notes

* Damage calculation in spellCalculations.ts is really messy due to legacy everquest stuff. For example, base damage values can be negative. But I think we want them negative since healing is positive? But we want to display them as positive values. After lots of messing with it, the values look sane and accurate to me. Maybe I will revisit this later.


## Ideas

* Item durabiity may be fun since using a variety of weapons and gear adds more to gameplay. Maybe magic items never break but need time to recharge periodically. Non-magic can be repaired a certain number of times, maybe with slightly diminished stats each time
* Item durability goes hand in hand with a concept I've always liked, which is that most NPCs would drop armor and weapons in a more realistic world, so stuff breaking constantly isn't a big deal because there's always fresh loot to replace it.
* A journal to show a to-do list for the character. For example if you turn level 8 and are missing spells because you can't afford them yet, getting those spells and scribing them may be on the list.
* Groups. Bots, maybe. Or multiplayer with other people. Since a lot of classes can't realistically solo. 

## Looting System Breakdown

 TLDR: NPCs have a loottable ID, loottables have lootdrops, lootdrops have items.

1. **NPCs**: Characters not controlled by players. Each has a `loottable_id` determining potential item drops.

2. **loottable**: Lists possible item sets an NPC can drop. Each row is a unique set identified by an id.

3. **loottable_entries**: Links loot tables to items. Each row represents a possible item drop, connecting `loottable_id` to `lootdrop_id`.

4. **lootdrop**: Represents collections of items that can be dropped together. Each row is a unique collection.

5. **lootdrop_entries**: Links loot drops to actual items. Each row represents an item in a loot drop, connecting `lootdrop_id` to `item_id`.

### Loot Determination Process:

1. Check NPC's `loottable_id`
2. Find matching rows in `loottable_entries`
3. For each row, check `lootdrop_id`
4. Find matching rows in `lootdrop_entries`
5. Use `item_id` to identify actual items

This structure allows for flexibility, enabling multiple NPCs to share loot tables and multiple loot tables to include the same loot drops.

Example SQL Query:
```
SELECT items.
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

### Automated Progression Steps

These are steps I would have the automated system prioritize:

* Equip all items, initiate combat (risk tolerance slider? when higher risk, will try harder mobs), collect loot, replace low value loot with high value when out of spots
* Save up for backpacks to carry more loot
* Buy missing and useful spells first, buy less useful ones secondary
* Train new skills as they become available (e.g. meditate at level 8)
* Maybe have a "grind versus adventure" slider - adventure makes the bot focus on quests to get better gear, grind means stick with what you got and upgrade when something drops
* Have have a "quest selector" for the user to say which quests to focus on for specific items of gear they want. 
* Have a travel risk meter - when having to go to new zones for quests, how slow you move versus how much risk you take. Higher risk, higher movement speed. 

### Boilerplate Notes

(from simple boilerplate this project started from)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

### Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from "eslint-plugin-react";

export default tseslint.config({
  // Set the react version
  settings: { react: { version: "18.3" } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs["jsx-runtime"].rules,
  },
});
```
