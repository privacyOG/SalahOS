# Mosque directory

The congregation mosque directory is designed so ordinary discovery does not require a map provider or precise device coordinates.

## Search modes

### Broad-area search

Broad-area search accepts a name or text query plus an optional broad area such as suburb, city, region or postcode. It must not include precise device coordinates.

### Nearby search

Nearby search is an explicit user action. Precise coordinates are included only when the caller selects nearby search and supplies coordinates for that request.

## Results

Directory results expose:

- stable mosque identity;
- English and/or Arabic mosque name;
- broad area and published address labels;
- prayer/Iqamah source provenance;
- last synchronization timestamp where available; and
- follow state so congregation users can follow directly from results.

The default result presentation is a responsive list and does not depend on a map provider.

## Boundaries

This slice defines the privacy-preserving directory query contract and congregation result presentation. It does not introduce a hosted search service, geocoding provider, map provider, remote persistence or administrator-side mosque publishing transport. Those integrations must preserve the explicit nearby-search boundary and must not silently upload precise device coordinates.
