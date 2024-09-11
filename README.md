# IdleQuest

Idle / incremental game based on Everquest circa 1999. 


## Dev

`pnp run dev`

## To-Do

1. Character creation: class, race, starting city (simplified logic for now?), point allocation, name
2. Create player class: health, mana, stamina
3. Display all of the above on webpage part of app (not console)
4. Add incremental/idle combat against a bat or rat

Entities:
* Player
* NPC
* Classes
* Races
* Cities
* Zones
* Stats

### Thoughts

* Don't use external API for large data - lots of extra work. KISS
* Convert MariaDB to SQLite so I can use it with React without having to run a database process/server
* Long term move to external API... but also an EQ API sounds fun.. hmm..
* Start with just hardcoding to get actual features in with limited data then move on to harder challenge. Get something fun to show first. Fun proof of concept first. 


# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
