import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const temporaryDirectory = await mkdtemp(join(tmpdir(), 'salahos-directory-'));
const databasePath = join(temporaryDirectory, 'directory.json');
const port = 48788;
const baseUrl = `http://127.0.0.1:${String(port)}`;
const moderatorToken = 'stage48-test-moderator';
const combinedCatalogue = JSON.parse(
  await readFile(join(process.cwd(), 'src/data/australian-mosques-combined.json'), 'utf8'),
);
assert.equal(combinedCatalogue.schemaVersion, 2);
assert.ok(Array.isArray(combinedCatalogue.records));
assert.equal(combinedCatalogue.source?.recordCount, combinedCatalogue.records.length);
const expectedSeedCount = combinedCatalogue.records.length;
const child = spawn(process.execPath, ['directory-service/server.mjs'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(port),
    HOST: '127.0.0.1',
    SALAHOS_DIRECTORY_DB_PATH: databasePath,
    SALAHOS_DIRECTORY_MODERATOR_TOKEN: moderatorToken,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
child.stdout.on('data', (chunk) => {
  output += chunk.toString();
});
child.stderr.on('data', (chunk) => {
  output += chunk.toString();
});

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = await response.json();
  return { response, body };
}

async function waitUntilReady() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // Service is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Directory service did not become ready.\n${output}`);
}

try {
  await waitUntilReady();

  const initialSearch = await request('/api/v1/shared-mosques?q=Adelaide&limit=10');
  assert.equal(initialSearch.response.status, 200);
  assert.ok(Array.isArray(initialSearch.body));
  const seededRecord = initialSearch.body.find((record) => record.id === 'osm-node-1614034144');
  assert.ok(seededRecord, 'Expected audited Adelaide Mosque seed record');

  const seededDatabase = JSON.parse(await readFile(databasePath, 'utf8'));
  assert.equal(seededDatabase.records.length, expectedSeedCount);
  assert.equal(seededDatabase.contributions.length, 0);
  const duplicate = await request('/api/v1/shared-mosques/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: seededRecord.name,
      address: seededRecord.address,
      countryCode: seededRecord.countryCode,
      latitude: seededRecord.latitude,
      longitude: seededRecord.longitude,
      timeZone: seededRecord.timeZone,
    }),
  });
  assert.equal(duplicate.response.status, 409);
  assert.equal(duplicate.body.duplicateId, seededRecord.id);

  const submission = await request('/api/v1/shared-mosques/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Stage 48 Community Masjid',
      address: '88 Test Avenue, Broken Hill NSW 2880',
      countryCode: 'AU',
      latitude: -31.95,
      longitude: 141.45,
      timeZone: 'Australia/Broken_Hill',
      website: 'https://example.invalid/community-masjid',
      phone: '+61 8 8000 0000',
    }),
  });
  assert.equal(submission.response.status, 202);
  assert.equal(submission.body.state, 'pending');
  assert.equal(submission.body.kind, 'submission');

  const approval = await request(
    `/api/v1/shared-mosques/moderation/${encodeURIComponent(submission.body.id)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SalahOS-Moderator-Token': moderatorToken,
      },
      body: JSON.stringify({ decision: 'approved' }),
    },
  );
  assert.equal(approval.response.status, 200);
  assert.equal(approval.body.state, 'approved');

  const createdSearch = await request('/api/v1/shared-mosques?q=Stage%2048&limit=10');
  assert.equal(createdSearch.response.status, 200);
  assert.equal(createdSearch.body.length, 1);
  const createdRecord = createdSearch.body[0];
  assert.equal(createdRecord.verification.state, 'unverified');

  const suggestion = await request(
    `/api/v1/shared-mosques/${encodeURIComponent(createdRecord.id)}/suggestions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Stage 48 Community Mosque' }),
    },
  );
  assert.equal(suggestion.response.status, 202);
  assert.equal(suggestion.body.kind, 'edit-suggestion');
  await request(`/api/v1/shared-mosques/moderation/${encodeURIComponent(suggestion.body.id)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SalahOS-Moderator-Token': moderatorToken,
    },
    body: JSON.stringify({ decision: 'approved' }),
  });

  const claim = await request(
    `/api/v1/shared-mosques/${encodeURIComponent(createdRecord.id)}/claims`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact: 'admin@example.invalid' }),
    },
  );
  assert.equal(claim.response.status, 202);
  assert.equal(claim.body.kind, 'claim');
  await request(`/api/v1/shared-mosques/moderation/${encodeURIComponent(claim.body.id)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SalahOS-Moderator-Token': moderatorToken,
    },
    body: JSON.stringify({ decision: 'approved' }),
  });

  const finalSearch = await request('/api/v1/shared-mosques?q=Stage%2048&limit=10');
  assert.equal(finalSearch.body[0].name, 'Stage 48 Community Mosque');
  assert.equal(finalSearch.body[0].verification.state, 'claimed');
  assert.ok(finalSearch.body[0].revision >= 3);

  const database = JSON.parse(await readFile(databasePath, 'utf8'));
  assert.equal(database.records.length, expectedSeedCount + 1);
  assert.equal(database.contributions.length, 3);

  console.log('Stage 48 shared mosque directory service acceptance passed.');
} finally {
  child.kill('SIGTERM');
  await new Promise((resolve) => {
    child.once('exit', resolve);
    setTimeout(resolve, 1_000);
  });
  await rm(temporaryDirectory, { recursive: true, force: true });
}
