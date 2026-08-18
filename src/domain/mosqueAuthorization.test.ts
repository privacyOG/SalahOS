import { describe, expect, it } from 'vitest';
import {
  acceptInvitation,
  changeMembershipRole,
  createManagedSession,
  createMosqueInvitation,
  createMosqueMembership,
  invitationStatusAt,
  membershipAllows,
  permissionsForRole,
  revokeAllSessions,
  revokeInvitation,
  revokeMembership,
} from './mosqueAuthorization';
import { createMosqueId, createMosqueOrganizationId } from './mosqueIdentity';

const scope = {
  organizationId: createMosqueOrganizationId('org-sydney'),
  mosqueIds: [createMosqueId('masjid-al-noor:sydney')],
};

describe('managed mosque authorization', () => {
  it('defines least-privilege permissions for each roadmap role', () => {
    expect(permissionsForRole('organization-owner')).toContain('organization.manage');
    expect(permissionsForRole('mosque-administrator')).not.toContain('organization.manage');
    expect(permissionsForRole('prayer-time-manager')).toEqual([
      'prayer.read',
      'prayer.publish',
      'audit.read',
    ]);
    expect(permissionsForRole('content-editor')).toEqual(['content.read', 'content.publish']);
    expect(permissionsForRole('signage-operator')).toEqual(['signage.read', 'signage.manage']);
    expect(permissionsForRole('read-only-auditor')).not.toContain('prayer.publish');
  });

  it('enforces mosque scope and membership revocation', () => {
    const membership = createMosqueMembership({
      memberId: 'member-001',
      role: 'prayer-time-manager',
      scope,
      status: 'active',
    });

    expect(membershipAllows(membership, 'prayer.publish', 'masjid-al-noor:sydney')).toBe(true);
    expect(membershipAllows(membership, 'prayer.publish', 'lakemba-mosque')).toBe(false);
    expect(membershipAllows(membership, 'content.publish', 'masjid-al-noor:sydney')).toBe(false);
    expect(membershipAllows(revokeMembership(membership), 'prayer.read')).toBe(false);
  });

  it('supports explicit role changes without changing scope', () => {
    const membership = createMosqueMembership({
      memberId: 'member-001',
      role: 'content-editor',
      scope,
      status: 'active',
    });
    const changed = changeMembershipRole(membership, 'signage-operator');

    expect(changed.role).toBe('signage-operator');
    expect(changed.scope).toEqual(membership.scope);
    expect(membershipAllows(changed, 'signage.manage', 'masjid-al-noor:sydney')).toBe(true);
    expect(membershipAllows(changed, 'content.publish', 'masjid-al-noor:sydney')).toBe(false);
  });

  it('supports organization-owner scope across an organization', () => {
    const membership = createMosqueMembership({
      memberId: 'owner-001',
      role: 'organization-owner',
      scope: {
        organizationId: createMosqueOrganizationId('org-sydney'),
        mosqueIds: [],
      },
      status: 'active',
    });

    expect(membershipAllows(membership, 'organization.manage')).toBe(true);
    expect(membershipAllows(membership, 'prayer.publish', 'lakemba-mosque')).toBe(true);
  });

  it('models invitation expiry, revocation and acceptance', () => {
    const invitation = createMosqueInvitation({
      invitationId: 'invite-001',
      invitee: 'Admin@Example.org',
      role: 'mosque-administrator',
      scope,
      createdAt: '2026-08-19T00:00:00.000Z',
      expiresAt: '2026-08-20T00:00:00.000Z',
      status: 'pending',
    });

    expect(invitation.invitee).toBe('admin@example.org');
    expect(invitationStatusAt(invitation, '2026-08-19T12:00:00.000Z')).toBe('pending');
    expect(invitationStatusAt(invitation, '2026-08-20T00:00:00.000Z')).toBe('expired');
    expect(acceptInvitation(invitation, '2026-08-19T12:00:00.000Z').status).toBe('accepted');
    expect(revokeInvitation(invitation).status).toBe('revoked');
    expect(() => acceptInvitation(invitation, '2026-08-20T00:00:00.000Z')).toThrow(/pending/u);
  });

  it('supports per-session and sign-out-all-devices revocation', () => {
    const first = createManagedSession({
      sessionId: 'session-001',
      memberId: 'member-001',
      deviceLabel: 'Office tablet',
      createdAt: '2026-08-19T00:00:00.000Z',
      revokedAt: null,
    });
    const second = createManagedSession({
      sessionId: 'session-002',
      memberId: 'member-002',
      deviceLabel: 'Prayer office laptop',
      createdAt: '2026-08-19T00:00:00.000Z',
      revokedAt: null,
    });

    const revoked = revokeAllSessions(
      [first, second],
      'member-001',
      '2026-08-19T02:00:00.000Z',
    );

    expect(revoked[0]?.revokedAt).toBe('2026-08-19T02:00:00.000Z');
    expect(revoked[1]?.revokedAt).toBeNull();
  });

  it('rejects malformed invitation and session timestamps', () => {
    expect(() =>
      createMosqueInvitation({
        invitationId: 'invite-001',
        invitee: 'admin@example.org',
        role: 'mosque-administrator',
        scope,
        createdAt: '2026-08-20T00:00:00.000Z',
        expiresAt: '2026-08-19T00:00:00.000Z',
        status: 'pending',
      }),
    ).toThrow(/later than creation/u);
  });
});
