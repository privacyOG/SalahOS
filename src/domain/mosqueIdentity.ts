export type MosqueId = string & { readonly __mosqueId: unique symbol };
export type MosqueOrganizationId = string & { readonly __mosqueOrganizationId: unique symbol };

const STABLE_ID_PATTERN = /^[a-z0-9](?:[a-z0-9._:-]{0,126}[a-z0-9])?$/;

function createStableId(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 2 || normalized.length > 128 || !STABLE_ID_PATTERN.test(normalized)) {
    throw new TypeError(
      `${label} must be 2-128 lowercase-safe characters using letters, numbers, dot, underscore, colon, or hyphen`,
    );
  }
  return normalized;
}

export function createMosqueId(value: string): MosqueId {
  return createStableId(value, 'Mosque ID') as MosqueId;
}

export function createMosqueOrganizationId(value: string): MosqueOrganizationId {
  return createStableId(value, 'Mosque organization ID') as MosqueOrganizationId;
}
