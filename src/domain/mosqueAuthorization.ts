import {
  createMosqueId,
  createMosqueOrganizationId,
  type MosqueId,
  type MosqueOrganizationId,
} from './mosqueIdentity';

export type MosqueAdminRole =
  | 'organization-owner'
  | 'mosque-administrator'
  | 'prayer-time-manager'
  | 'content-editor'
  | 'signage-operator'
  | 'read-only-auditor';

export type MosquePermission =
  | 'organization.manage'
  | 'members.manage'
  | 'prayer.read'
  | 'prayer.publish'
  | 'content.read'
  | 'content.publish'
  | 'signage.read'
  | 'signage.manage'
  | 'audit.read';

export type MembershipStatus = 'active' | 'revoked';
export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export interface MosqueRoleScope {
  readonly organizationId: MosqueOrganizationId;
  readonly mosqueIds: readonly MosqueId[];
}

export interface MosqueMembership {
  readonly memberId: string;
  readonly role: MosqueAdminRole;
  readonly scope: MosqueRoleScope;
  readonly status: MembershipStatus;
}

export interface MosqueInvitation {
  readonly invitationId: string;
  readonly invitee: string;
  readonly role: MosqueAdminRole;
  readonly scope: MosqueRoleScope;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly status: InvitationStatus;
}

export interface ManagedSession {
  readonly sessionId: string;
  readonly memberId: string;
  readonly deviceLabel: string;
  readonly createdAt: string;
  readonly revokedAt: string | null;
}

function freezePermissions(...permissions: MosquePermission[]): readonly MosquePermission[] {
  return Object.freeze(permissions);
}

const ROLE_PERMISSIONS: Readonly<Record<MosqueAdminRole, readonly MosquePermission[]>> =
  Object.freeze({
    'organization-owner': freezePermissions(
      'organization.manage',
      'members.manage',
      'prayer.read',
      'prayer.publish',
      'content.read',
      'content.publish',
      'signage.read',
      'signage.manage',
      'audit.read',
    ),
    'mosque-administrator': freezePermissions(
      'members.manage',
      'prayer.read',
      'prayer.publish',
      'content.read',
      'content.publish',
      'signage.read',
      'signage.manage',
      'audit.read',
    ),
    'prayer-time-manager': freezePermissions('prayer.read', 'prayer.publish', 'audit.read'),
    'content-editor': freezePermissions('content.read', 'content.publish'),
    'signage-operator': freezePermissions('signage.read', 'signage.manage'),
    'read-only-auditor': freezePermissions(
      'prayer.read',
      'content.read',
      'signage.read',
      'audit.read',
    ),
  });

function assertBoundedIdentifier(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  if (
    normalized.length < 2 ||
    normalized.length > 160 ||
    !/^[a-z0-9][a-z0-9._:@+-]*[a-z0-9]$/u.test(normalized)
  ) {
    throw new RangeError(`${label} must be a stable lowercase-safe identifier`);
  }
  return normalized;
}

function assertIsoTimestamp(value: string, label: string): string {
  const normalized = value.trim();
  const parsed = new Date(normalized);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== normalized) {
    throw new RangeError(`${label} must be an ISO-8601 UTC timestamp`);
  }
  return normalized;
}

function normalizeScope(scope: MosqueRoleScope): MosqueRoleScope {
  const organizationId = createMosqueOrganizationId(scope.organizationId);
  const seen = new Set<string>();
  const mosqueIds: MosqueId[] = [];
  for (const mosqueId of scope.mosqueIds) {
    const normalized = createMosqueId(mosqueId);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    mosqueIds.push(normalized);
  }
  return Object.freeze({ organizationId, mosqueIds: Object.freeze(mosqueIds) });
}

export function permissionsForRole(role: MosqueAdminRole): readonly MosquePermission[] {
  return ROLE_PERMISSIONS[role];
}

export function createMosqueMembership(input: MosqueMembership): MosqueMembership {
  return Object.freeze({
    memberId: assertBoundedIdentifier(input.memberId, 'Member ID'),
    role: input.role,
    scope: normalizeScope(input.scope),
    status: input.status,
  });
}

export function membershipAllows(
  membership: MosqueMembership,
  permission: MosquePermission,
  mosqueId: string | null = null,
): boolean {
  if (membership.status !== 'active') return false;
  if (!permissionsForRole(membership.role).includes(permission)) return false;
  if (mosqueId === null) return true;
  const normalized = createMosqueId(mosqueId);
  if (membership.role === 'organization-owner' && membership.scope.mosqueIds.length === 0) {
    return true;
  }
  return membership.scope.mosqueIds.includes(normalized);
}

export function changeMembershipRole(
  membership: MosqueMembership,
  role: MosqueAdminRole,
): MosqueMembership {
  return createMosqueMembership({ ...membership, role });
}

export function revokeMembership(membership: MosqueMembership): MosqueMembership {
  return createMosqueMembership({ ...membership, status: 'revoked' });
}

export function createMosqueInvitation(input: MosqueInvitation): MosqueInvitation {
  const createdAt = assertIsoTimestamp(input.createdAt, 'Invitation createdAt');
  const expiresAt = assertIsoTimestamp(input.expiresAt, 'Invitation expiresAt');
  if (expiresAt <= createdAt) {
    throw new RangeError('Invitation expiry must be later than creation time');
  }
  return Object.freeze({
    invitationId: assertBoundedIdentifier(input.invitationId, 'Invitation ID'),
    invitee: input.invitee.trim().toLowerCase(),
    role: input.role,
    scope: normalizeScope(input.scope),
    createdAt,
    expiresAt,
    status: input.status,
  });
}

export function invitationStatusAt(invitation: MosqueInvitation, now: string): InvitationStatus {
  if (invitation.status !== 'pending') return invitation.status;
  const current = assertIsoTimestamp(now, 'Current time');
  return current >= invitation.expiresAt ? 'expired' : 'pending';
}

export function revokeInvitation(invitation: MosqueInvitation): MosqueInvitation {
  return Object.freeze({ ...invitation, status: 'revoked' });
}

export function acceptInvitation(invitation: MosqueInvitation, now: string): MosqueInvitation {
  if (invitationStatusAt(invitation, now) !== 'pending') {
    throw new RangeError('Only a pending, unexpired invitation may be accepted');
  }
  return Object.freeze({ ...invitation, status: 'accepted' });
}

export function createManagedSession(input: ManagedSession): ManagedSession {
  return Object.freeze({
    sessionId: assertBoundedIdentifier(input.sessionId, 'Session ID'),
    memberId: assertBoundedIdentifier(input.memberId, 'Member ID'),
    deviceLabel: input.deviceLabel.trim(),
    createdAt: assertIsoTimestamp(input.createdAt, 'Session createdAt'),
    revokedAt:
      input.revokedAt === null ? null : assertIsoTimestamp(input.revokedAt, 'Session revokedAt'),
  });
}

export function revokeSession(session: ManagedSession, revokedAt: string): ManagedSession {
  const timestamp = assertIsoTimestamp(revokedAt, 'Session revokedAt');
  if (timestamp < session.createdAt) {
    throw new RangeError('Session revocation cannot precede session creation');
  }
  return Object.freeze({ ...session, revokedAt: timestamp });
}

export function revokeAllSessions(
  sessions: readonly ManagedSession[],
  memberId: string,
  revokedAt: string,
): readonly ManagedSession[] {
  const normalizedMemberId = assertBoundedIdentifier(memberId, 'Member ID');
  return Object.freeze(
    sessions.map((session) =>
      session.memberId === normalizedMemberId && session.revokedAt === null
        ? revokeSession(session, revokedAt)
        : session,
    ),
  );
}
