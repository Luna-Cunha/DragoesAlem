# Dragões Além — 5e Character Builder & Sheet Visualizer

A client-side D&D 5e (2014 & 2024 rules) Character Builder and Interactive Character Sheet modeled on D&D Beyond, built for static hosting on **GitHub Pages** with client-side routing (`HashRouter` + `404.html` fallback).

## Dynamic Data Architecture (Zero Bundled Data)

No game content JSON files are stored in this repository. On first launch, the app prompts for a compatible 5etools `data/` repository URL (for example, `https://github.com/5etools-mirror-3/5etools-src/tree/main/data`) or a local `data/` folder upload, parses and indexes everything needed for character creation and play (`books`, `classes`, `subclasses`, `classFeatures`, `subclassFeatures`, `races`/`subraces`, `backgrounds`, `feats`, `spells` + `spells/sources`, `items-base`/`items`/`magicvariants`, `optionalfeatures`, `skills`, `languages`, `senses`, `conditionsdiseases`, `actions`, `variantrules`), and caches the compiled compendium locally in IndexedDB.

## Features

- **Startup Data Importer (`/setup`)**: Supports GitHub tree/blob/repo links (auto-resolved to `raw.githubusercontent.com`), custom static CORS mirrors, and local folder uploads.
- **Character Vault (`/characters`)**: Create, search, duplicate, export, and import characters as JSON files.
- **Multi-Step Character Builder (`/characters/builder`)**:
  - **Home**: Edition selector (2024 Core / 2014 Classic / Mixed), sourcebook toggles, Milestone/XP, Fixed/Manual HP, Encumbrance, flexible origin ASIs.
  - **Class & Multiclassing**: Level 1–20 progression, subclasses, skills & expertise, Fighting Styles, Eldritch Invocations (including repeatable Origin Feats and cantrip choices), Metamagic, Maneuvers, ASIs/Epic Boons, and spell preparation.
  - **Background & Species**: 2024 weighted background ASIs, Origin Feats & proficiency overlap replacements, additional species languages, 2014 subraces merged with parent traits, and lineages.
  - **Abilities**: Standard Array, 27-point Point Buy, and Manual / `4d6dl1` rolling with live modifier breakdowns.
  - **Equipment & Appearance**: Starting equipment A/B selection, searchable item catalog, currency, dark/light mode, accent themes, backdrops, and portrait frames.
- **Interactive Character Sheet (`/characters/:id`)**:
  - Click-to-roll ability checks, saving throws, skills, initiative, weapon attacks, cantrips, and inline `@dice`/`@damage` tags with Advantage/Disadvantage support.
  - Automatic AC calculation, HP/Temp HP/Death Saves, Hit Dice Short Rest healing, Long Rest reset, spell slot tracking, active conditions, attunement slots, equipment drawer, encumbrance, slide-over reference drawer, and fillable 2024 PDF character sheet export.

## Development & GitHub Pages Deployment

```bash
npm install
npm run dev
npm test
npm run build
```

Push to `main` to deploy automatically via `.github/workflows/deploy.yml` using GitHub Pages Actions.
