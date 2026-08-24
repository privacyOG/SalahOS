# Australian mosque directory

SalahOS includes a compact Australian mosque and musalla directory so mosque discovery continues to work without a network connection. The application does not contact OpenStreetMap, Overpass, Google, or another directory service when browsing, searching, sorting, or selecting the bundled records.

## Source and licence

The bundled directory is derived from **OpenStreetMap contributors** and is distributed as an OpenStreetMap-derived database under the **Open Database License (ODbL) 1.0**. The in-app directory displays the required OpenStreetMap contributor attribution and links to the ODbL licence. The SalahOS source-code licence does not replace or relicense the bundled OpenStreetMap-derived data.

Source references:

- OpenStreetMap copyright and attribution: <https://www.openstreetmap.org/copyright>
- Open Database License 1.0: <https://opendatacommons.org/licenses/odbl/1-0/>

The committed source snapshot is `data/osm/australian-muslim-places-of-worship.overpass.json`. The generated application catalogue is `src/data/australian-mosques.json`.

## Inclusion query

The refresh pipeline queries each Australian state or territory separately using its `ISO3166-2` administrative area. It includes OpenStreetMap elements that satisfy either of these tag combinations:

- `amenity=place_of_worship` and `religion=muslim`; or
- `amenity=place_of_worship` and `building=mosque`.

The eight queried regions are ACT, NSW, NT, QLD, SA, TAS, VIC and WA. Splitting the acquisition by region keeps public Overpass requests bounded and allows endpoint failover. Records without a usable name or coordinates are excluded.

## Reproducible generation

Refresh the source snapshot and regenerate the directory with:

```sh
npm run mosques:australia:refresh
```

Regenerate only from the already committed source snapshot with:

```sh
npm run mosques:australia:generate
```

Verify that the committed catalogue is an exact deterministic product of the committed snapshot with:

```sh
npm run mosques:australia:check
```

`mosques:australia:check` is part of the repository quality gate. Normal builds and app runtime never perform the network refresh.

## Normalisation and duplicate handling

The generator preserves the originating OpenStreetMap element type and numeric ID in each generated record. It normalises display names, addresses, optional public website/contact fields and coordinates into a compact application schema.

OpenStreetMap may represent the same mosque as both a node and a building/relation. The generator therefore canonicalises mosque/masjid/musalla naming variants and treats records with the same canonical name within 250 metres as duplicate candidates. It keeps the richer representation, preferring relations over ways over nodes and favouring records containing address or public contact information. Distinct same-named mosques farther apart remain separate.

## Offline search, nearby ordering and selection

Search is entirely on-device and matches the mosque name, Arabic name when present, address, state and Australian region code. Nearby ordering uses the location already saved in SalahOS and a local Haversine distance calculation; it does not request a new GPS fix or transmit the saved location.

When a directory mosque is selected, SalahOS converts that record into the existing validated `MosqueProfile` model, resolves its IANA timezone locally from coordinates, upserts it into the followed-mosque library and makes it the selected mosque. This keeps prayer context, Today integration and local persistence on the same mosque-domain path used by manually configured profiles.

## Snapshot currently bundled

The Stage 47 source snapshot contains 122 qualifying OpenStreetMap elements and deterministically generates 106 deduplicated records. Its generated metadata records the earliest OSM base timestamp represented by the state/territory queries so the age of the shipped catalogue is visible in-app and auditable in the repository.
