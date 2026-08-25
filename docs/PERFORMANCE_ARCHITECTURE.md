# Performance architecture

Stage 51 makes SalahOS load by product surface and route instead of shipping the whole application in one JavaScript entry chunk.

## Timetable import boundary

`SettingsMigrationPanels` already loads `domain/timetableImport` dynamically when a user starts timetable import/export work. Previously `platform/mosqueLibrary` also imported that module statically, so Vite could not create a lazy chunk and reported `INEFFECTIVE_DYNAMIC_IMPORT` during every production build.

Persistent mosque-library hydration now uses the lightweight `domain/mosqueTimetablePayload` validator/parser. CSV/JSON import/export utilities remain in `domain/timetableImport` and are therefore free to stay behind their dynamic UI edge.

## Product and route splitting

The normal Today route remains in the startup entry path. The following surfaces are deferred with `React.lazy` and `Suspense`:

- administration workspace (`AdministrationApplication`);
- smart-display runtime (`SmartDisplayRoot`);
- Mosques route;
- Qiblah route;
- Knowledge route;
- Community route;
- Settings route.

Smart-display route detection is isolated in `smartDisplayRouting.ts` so deciding whether the display runtime is needed does not itself import the full `SmartDisplay.tsx` graph.

## Bundle budget

After `npm run build`, run:

```sh
npm run bundle:size
```

The check requires:

- at least five JavaScript chunks, proving that code splitting has not collapsed back into one entry bundle;
- no individual JavaScript chunk above 550,000 bytes;
- no more than 1,250,000 bytes of JavaScript across all production chunks;
- dynamic Admin and smart-display imports to remain present in `main.tsx`;
- no static `timetableImport` dependency in `platform/mosqueLibrary.ts`.

The permanent Quality Gate executes this budget immediately after the production build.

These are upper bounds, not targets. Future work should reduce them when sustainable rather than increasing them to accommodate regressions.
