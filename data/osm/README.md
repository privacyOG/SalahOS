# OpenStreetMap-derived Australian mosque data

`australian-muslim-places-of-worship.overpass.json` is a source snapshot derived from OpenStreetMap data © OpenStreetMap contributors and is subject to the Open Database License (ODbL) 1.0.

- Attribution and copyright: <https://www.openstreetmap.org/copyright>
- ODbL 1.0: <https://opendatacommons.org/licenses/odbl/1-0/>

The snapshot is retained so `scripts/generate-australian-mosque-directory.mjs` can deterministically reproduce `src/data/australian-mosques.json` without network access. See `docs/AUSTRALIAN_MOSQUE_DIRECTORY.md` for the query, refresh procedure, normalisation, duplicate handling and application behaviour.
