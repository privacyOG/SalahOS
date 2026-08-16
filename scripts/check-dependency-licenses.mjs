import { readFile } from 'node:fs/promises';

const lockfile = JSON.parse(await readFile(new URL('../package-lock.json', import.meta.url), 'utf8'));

if (lockfile.lockfileVersion !== 3 || typeof lockfile.packages !== 'object' || lockfile.packages === null) {
  throw new Error('Dependency-license policy requires an npm lockfileVersion 3 packages map.');
}

const permissiveLicenses = new Set([
  '0BSD',
  'Apache-2.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'BlueOak-1.0.0',
  'CC0-1.0',
  'ISC',
  'MIT',
  'Python-2.0',
  'Unlicense',
]);

const developmentOnlyLicenses = new Set([...permissiveLicenses, 'MPL-2.0']);
const operators = new Set(['AND', 'OR']);

function expressionTokens(expression) {
  return expression
    .replace(/[()]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function validateLicenseExpression(expression, packageClass) {
  if (typeof expression !== 'string' || expression.trim() === '') {
    return { valid: false, reason: 'missing license metadata' };
  }

  const tokens = expressionTokens(expression);
  if (tokens.length === 0) {
    return { valid: false, reason: 'empty license expression' };
  }

  const allowedLicenses = packageClass === 'development-only' ? developmentOnlyLicenses : permissiveLicenses;
  let licenseCount = 0;

  for (const token of tokens) {
    if (operators.has(token)) {
      continue;
    }
    if (token === 'WITH') {
      return { valid: false, reason: `unsupported SPDX exception expression: ${expression}` };
    }

    licenseCount += 1;
    if (!allowedLicenses.has(token)) {
      const scope = packageClass === 'development-only' ? 'approved development-tool' : 'permissive production';
      return { valid: false, reason: `license is not on the ${scope} allowlist: ${token}` };
    }
  }

  if (licenseCount === 0) {
    return { valid: false, reason: `invalid SPDX expression: ${expression}` };
  }

  return { valid: true };
}

const findings = [];
const counts = new Map();
let productionPackages = 0;
let developmentOnlyPackages = 0;

for (const [packagePath, metadata] of Object.entries(lockfile.packages)) {
  if (packagePath === '') {
    continue;
  }

  const packageClass = metadata.dev === true ? 'development-only' : 'production';
  const license = metadata.license;
  const validation = validateLicenseExpression(license, packageClass);

  if (packageClass === 'development-only') {
    developmentOnlyPackages += 1;
  } else {
    productionPackages += 1;
  }

  if (!validation.valid) {
    findings.push({ packagePath, license, packageClass, reason: validation.reason });
    continue;
  }

  const countKey = `${packageClass}:${license}`;
  counts.set(countKey, (counts.get(countKey) ?? 0) + 1);
}

if (findings.length > 0) {
  console.error('Dependency-license policy failed. Review these lockfile packages before release:');
  for (const finding of findings) {
    console.error(
      `- ${finding.packagePath} [${finding.packageClass}] license=${JSON.stringify(finding.license)}: ${finding.reason}`,
    );
  }
  process.exitCode = 1;
} else {
  console.log(
    `Dependency-license policy passed for ${productionPackages} production and ${developmentOnlyPackages} development-only lockfile packages.`,
  );
  console.log('Observed approved license expressions by dependency class:');
  for (const [key, count] of [...counts.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    console.log(`- ${key}: ${count}`);
  }
}
