import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url));
const australianCataloguePath = resolve(repositoryRoot, 'src/data/australian-mosques.json');
const databasePath = resolve(
  process.env.SALAHOS_DIRECTORY_DB_PATH ??
    resolve(repositoryRoot, '.local/shared-mosque-directory.json'),
);
const moderatorToken = process.env.SALAHOS_DIRECTORY_MODERATOR_TOKEN ?? '';
const port = Number(process.env.PORT ?? 8788);
const host = process.env.HOST ?? '127.0.0.1';
const MAX_BODY_BYTES = 32 * 1024;

const stateTimeZones = Object.freeze({
  ACT: 'Australia/Sydney',
  NSW: 'Australia/Sydney',
  NT: 'Australia/Darwin',
  QLD: 'Australia/Brisbane',
  SA: 'Australia/Adelaide',
  TAS: 'Australia/Hobart',
  VIC: 'Australia/Melbourne',
  WA: 'Australia/Perth',
});

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .replace(/\s+/gu, ' ')
    .toLocaleLowerCase('en-AU');
}

function coordinatesValid(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function distanceKm(left, right) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(right.latitude - left.latitude);
  const longitudeDelta = radians(right.longitude - left.longitude);
  const leftLatitude = radians(left.latitude);
  const rightLatitude = radians(right.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(leftLatitude) * Math.cos(rightLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function json(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Length': Buffer.byteLength(payload),
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(payload);
}

async function readJsonBody(request) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) throw new Error('Request body exceeds 32 KiB');
    chunks.push(chunk);
  }
  if (bytes === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function createContribution(kind, mosqueId, payload) {
  return {
    id: `contribution-${randomUUID()}`,
    kind,
    mosqueId,
    state: 'pending',
    submittedAt: new Date().toISOString(),
    payload,
  };
}

function validateSubmission(body) {
  const name = String(body.name ?? '')
    .trim()
    .replace(/\s+/gu, ' ');
  const address = String(body.address ?? '')
    .trim()
    .replace(/\s+/gu, ' ');
  const countryCode = String(body.countryCode ?? '')
    .trim()
    .toUpperCase();
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const timeZone = String(body.timeZone ?? '').trim();
  if (name.length < 2 || name.length > 160) throw new Error('Mosque name is invalid');
  if (address.length < 3 || address.length > 500) throw new Error('Mosque address is invalid');
  if (!/^[A-Z]{2}$/u.test(countryCode)) throw new Error('Country code is invalid');
  if (!coordinatesValid(latitude, longitude)) throw new Error('Coordinates are invalid');
  try {
    new Intl.DateTimeFormat('en-AU', { timeZone }).format(new Date(0));
  } catch {
    throw new Error('Timezone is invalid');
  }
  const website =
    body.website == null || String(body.website).trim() === '' ? null : String(body.website).trim();
  if (website !== null) {
    const parsed = new URL(website);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
      throw new Error('Website is invalid');
    }
  }
  const phone =
    body.phone == null || String(body.phone).trim() === '' ? null : String(body.phone).trim();
  return { name, address, countryCode, latitude, longitude, timeZone, website, phone };
}

function findDuplicate(records, submission) {
  const name = normalize(submission.name);
  const address = normalize(submission.address);
  return (
    records.find((record) => {
      const distance = distanceKm(submission, record);
      return (
        (normalize(record.name) === name && distance <= 1) ||
        (normalize(record.address) === address && distance <= 0.25) ||
        distance <= 0.08
      );
    }) ?? null
  );
}

async function seedDatabase() {
  const catalogue = JSON.parse(await readFile(australianCataloguePath, 'utf8'));
  const updatedAt = catalogue.source?.osmBaseTimestamp ?? new Date().toISOString();
  const records = catalogue.records.map((record) => ({
    id: record.id,
    name: record.name,
    nameAr: record.nameAr ?? null,
    address: record.address,
    countryCode: 'AU',
    latitude: record.latitude,
    longitude: record.longitude,
    timeZone: stateTimeZones[record.state] ?? 'Australia/Sydney',
    website: record.website ?? null,
    phone: record.phone ?? null,
    source: 'openstreetmap',
    verification: { state: 'unverified', verifiedAt: null, claimedAt: null },
    revision: 1,
    updatedAt,
  }));
  return { schemaVersion: 1, records, contributions: [] };
}

async function loadDatabase() {
  try {
    const database = JSON.parse(await readFile(databasePath, 'utf8'));
    if (
      database.schemaVersion !== 1 ||
      !Array.isArray(database.records) ||
      !Array.isArray(database.contributions)
    ) {
      throw new Error('Directory database schema is invalid');
    }
    return database;
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    const database = await seedDatabase();
    await persistDatabase(database);
    return database;
  }
}

async function persistDatabase(database) {
  await mkdir(dirname(databasePath), { recursive: true });
  const temporary = `${databasePath}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(database, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, databasePath);
}

function searchRecords(records, url) {
  const query = normalize(url.searchParams.get('q') ?? '');
  const latitudeValue = url.searchParams.get('lat');
  const longitudeValue = url.searchParams.get('lon');
  const hasCoordinates = latitudeValue !== null && longitudeValue !== null;
  const coordinates = hasCoordinates
    ? { latitude: Number(latitudeValue), longitude: Number(longitudeValue) }
    : null;
  if (coordinates !== null && !coordinatesValid(coordinates.latitude, coordinates.longitude)) {
    throw new Error('Search coordinates are invalid');
  }
  const radiusKm = coordinates === null ? null : Number(url.searchParams.get('radiusKm') ?? 100);
  if (radiusKm !== null && (!Number.isFinite(radiusKm) || radiusKm <= 0 || radiusKm > 500)) {
    throw new Error('Search radius is invalid');
  }
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 50), 1), 200);
  return records
    .filter((record) => {
      if (query === '') return true;
      return normalize([record.name, record.nameAr ?? '', record.address].join(' ')).includes(
        query,
      );
    })
    .map((record) => ({
      record,
      distance: coordinates === null ? null : distanceKm(coordinates, record),
    }))
    .filter((result) => radiusKm === null || result.distance <= radiusKm)
    .sort((left, right) => {
      if (
        left.distance !== null &&
        right.distance !== null &&
        Math.abs(left.distance - right.distance) > 0.001
      ) {
        return left.distance - right.distance;
      }
      return left.record.name.localeCompare(right.record.name, 'en-AU');
    })
    .slice(0, limit)
    .map((result) => result.record);
}

function contributionPublicView(contribution) {
  return {
    id: contribution.id,
    kind: contribution.kind,
    mosqueId: contribution.mosqueId,
    state: contribution.state,
    submittedAt: contribution.submittedAt,
    payload: contribution.payload,
  };
}

async function moderate(database, contribution, decision) {
  contribution.state = decision;
  contribution.moderatedAt = new Date().toISOString();
  if (decision !== 'approved') return;

  if (contribution.kind === 'submission') {
    const payload = validateSubmission(contribution.payload);
    const hash = createHash('sha256')
      .update(
        `${normalize(payload.name)}|${payload.latitude.toFixed(5)}|${payload.longitude.toFixed(5)}`,
      )
      .digest('hex')
      .slice(0, 16);
    const now = new Date().toISOString();
    database.records.push({
      id: `community-${hash}`,
      ...payload,
      nameAr: null,
      source: 'community',
      verification: { state: 'unverified', verifiedAt: null, claimedAt: null },
      revision: 1,
      updatedAt: now,
    });
    return;
  }

  const mosque = database.records.find((record) => record.id === contribution.mosqueId);
  if (!mosque) return;
  if (contribution.kind === 'edit-suggestion') {
    for (const field of ['name', 'address', 'website', 'phone']) {
      if (typeof contribution.payload[field] === 'string')
        mosque[field] = contribution.payload[field].trim();
    }
    mosque.revision += 1;
    mosque.updatedAt = new Date().toISOString();
    return;
  }
  if (contribution.kind === 'claim') {
    const now = new Date().toISOString();
    mosque.verification = {
      state: 'claimed',
      verifiedAt: mosque.verification.verifiedAt ?? now,
      claimedAt: now,
    };
    mosque.revision += 1;
    mosque.updatedAt = now;
  }
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    if (request.method === 'GET' && url.pathname === '/health') {
      json(response, 200, { ok: true });
      return;
    }
    if (request.method === 'GET' && url.pathname === '/api/v1/shared-mosques') {
      const database = await loadDatabase();
      json(response, 200, searchRecords(database.records, url));
      return;
    }
    if (request.method === 'POST' && url.pathname === '/api/v1/shared-mosques/submissions') {
      const database = await loadDatabase();
      const submission = validateSubmission(await readJsonBody(request));
      const duplicate = findDuplicate(database.records, submission);
      if (duplicate !== null) {
        json(response, 409, { error: 'Potential duplicate mosque', duplicateId: duplicate.id });
        return;
      }
      const contribution = createContribution('submission', null, submission);
      database.contributions.push(contribution);
      await persistDatabase(database);
      json(response, 202, contributionPublicView(contribution));
      return;
    }

    const suggestionMatch = url.pathname.match(
      /^\/api\/v1\/shared-mosques\/([^/]+)\/suggestions$/u,
    );
    const claimMatch = url.pathname.match(/^\/api\/v1\/shared-mosques\/([^/]+)\/claims$/u);
    if (request.method === 'POST' && (suggestionMatch || claimMatch)) {
      const database = await loadDatabase();
      const mosqueId = decodeURIComponent((suggestionMatch ?? claimMatch)[1]);
      if (!database.records.some((record) => record.id === mosqueId)) {
        json(response, 404, { error: 'Mosque not found' });
        return;
      }
      const body = await readJsonBody(request);
      const kind = suggestionMatch ? 'edit-suggestion' : 'claim';
      const payload = suggestionMatch
        ? Object.fromEntries(
            ['name', 'address', 'website', 'phone']
              .filter((key) => typeof body[key] === 'string' && body[key].trim() !== '')
              .map((key) => [key, body[key].trim()]),
          )
        : { contact: String(body.contact ?? '').trim() };
      if (Object.keys(payload).length === 0 || (kind === 'claim' && payload.contact.length < 3)) {
        json(response, 400, { error: 'Contribution payload is empty or invalid' });
        return;
      }
      const contribution = createContribution(kind, mosqueId, payload);
      database.contributions.push(contribution);
      await persistDatabase(database);
      json(response, 202, contributionPublicView(contribution));
      return;
    }

    const moderationMatch = url.pathname.match(/^\/api\/v1\/shared-mosques\/moderation\/([^/]+)$/u);
    if (request.method === 'POST' && moderationMatch) {
      if (
        moderatorToken === '' ||
        request.headers['x-salahos-moderator-token'] !== moderatorToken
      ) {
        json(response, 403, { error: 'Moderator authorization required' });
        return;
      }
      const database = await loadDatabase();
      const contribution = database.contributions.find(
        (candidate) => candidate.id === decodeURIComponent(moderationMatch[1]),
      );
      if (!contribution) {
        json(response, 404, { error: 'Contribution not found' });
        return;
      }
      if (contribution.state !== 'pending') {
        json(response, 409, { error: 'Contribution has already been moderated' });
        return;
      }
      const body = await readJsonBody(request);
      const decision = body.decision;
      if (!['approved', 'rejected'].includes(decision)) {
        json(response, 400, { error: 'Moderation decision must be approved or rejected' });
        return;
      }
      await moderate(database, contribution, decision);
      await persistDatabase(database);
      json(response, 200, contributionPublicView(contribution));
      return;
    }

    json(response, 404, { error: 'Not found' });
  } catch (error) {
    json(response, 400, { error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

server.listen(port, host, () => {
  console.log(`SalahOS shared mosque directory listening on http://${host}:${String(port)}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
