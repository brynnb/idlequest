
![logo](https://github.com/user-attachments/assets/57cf97fd-32a6-4385-a4d3-670d57439913)

IdleQuest is an [idle/incremental game](https://en.wikipedia.org/wiki/Incremental_game) based on EverQuest, the iconic MMO released in 1999. Designed to progress on its own, players interact by making strategic choices to determine how the game plays out in an automated way. The goal is to recreate as much of the original EverQuest experience as possible using a database dump from the EverQuest emulator (EQEmu) project, which itself is data from scraping the original game. This data, rooted in the original game, allows for a nostalgic and detailed exploration of EverQuest’s world in a more casual, low commitment way. 

The game content and mechanics are as true to the original experience as can be reaosnably done with a single developer - the interface, classes, races, zones, items, NPCs, loot drops, skills, spells, etc are all very close to original EverQuest content. 

Though there may be implementation of 3D graphics in the future, the current focus on this project is text-based adventuring with some visual aids. EverQuest was originally created from the era of MUDs (multi-user dungeons) which were basically EverQuest without graphics. It's fun to now return to the MUD heritage of the game, but with the addition of LLMs for dynamic quests, dialogue, and storytelling. 

I would like to give credit to Eric Fredricksen, the creator of [ProgressQuest](https://en.wikipedia.org/wiki/Progress_Quest) from 2002, which is also interestingly the example project used for the "idle games" article on Wikipedia. Though ProgressQuest is much simpler in nature and doesn't contain content from the real game, I want to recognize that this isn't a wholly original idea on my behalf, and I have fond memories of playing ProgressQuest 20+ years ago. 

Similar to ProgressQuest, this project falls under fair use because it transforms elements of the original EverQuest game for a different purpose—an idle game experience rather than an active MMORPG. It does not replicate the gameplay mechanics or experience in a 1:1 manner but instead serves as a commentary and nostalgic parody of EverQuest’s legacy, which fits within the definition of transformative use. Additionally, IdleQuest is non-commercial, and the use of EverQuest’s content is limited and for purposes that add new meaning, context, and value.

This project is very much in its early phase, and the casual nature of the README and documentation reflect this.

## Dev

`pnp run dev`

`python ./data/add_table_to_db_from_csv.py` as needed, but also don't do this bc it makes all fields text values


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
