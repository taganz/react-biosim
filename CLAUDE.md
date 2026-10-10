# react-biosim

Browser evolution simulator (Next.js 16, React 19, TypeScript, Jotai, Tailwind 4). Fork of carlo697/react-biosim, based on David R. Miller's biosim4.

## Commands

- `npm run dev`: dev server on http://localhost:3000
- `npm test`: Jest. `EventLogger.test.ts` has 16 known failures, and every other suite must pass.
- `npx tsc --noEmit`: type check. `npm run lint` is broken, because `next lint` was removed in Next 16.

## Layout

- `simulation/` is the engine: plain TypeScript with no React, testable in Node. `WorldController` owns the loop.
- `components/simulation/` is the UI. The store is in `components/simulation/store/`.
- `docs/` is the documentation. Start at `docs/README.md`. The architecture is in `docs/development/architecture.md`.

## Things that are easy to get wrong

- Genes address sensors and actions by their **position in the enabled list**, which follows the order of the `data` table in `CreatureSensors` / `CreatureActions`.
  - Add new sensors and actions at the end of that table.
  - `calculateOutputs()` must push one value per enabled sensor, in table order. `executeActions()` must advance the index for every enabled action.
- `simulationDataAtom` is the Settings **draft**. The running configuration is `worldController.simData`.
- Read engine values in components with `useWorldValue(getter, default)`. The getter must return a primitive or a stable reference.
- Population strategies, selection methods and map objects are saved by class `name`. Register new ones in `populationMap`, `selectionMap` and `objectFormatters` respectively.
- Known bugs are listed in `docs/known-issues.md`. Check it before assuming something works.

## Documentation

The docs are in English, while the user writes in Spanish. When a change affects behaviour that is documented, update the docs in the same change. The table in `docs/development/README.md` ("Keeping the docs up to date") says which page covers what. In short:
- settings and defaults go in `docs/reference/parameters.md`;
- sensors and actions go in `docs/reference/sensors-and-actions.md`;
- strategies and selection methods go in `docs/reference/population-and-selection.md`;
- UI changes go in `docs/user/`;
- fixed or new bugs go in `docs/known-issues.md`.

Commit messages follow the existing style: short imperative subject in English.
