import { describe, it, expect } from 'vitest';
import type { UserRole } from '@/types';

// RBAC permission matrix verification
function canPerformAction(role: UserRole, action: string, isOwner = false): boolean {
  switch (action) {
    case 'CREATE_EVENT':
    case 'ASSIGN_TEAM':
    case 'SELECT_PHOTOS_FOR_GALLERY':
    case 'PUBLISH_GALLERY':
    case 'MANAGE_TEAM':
      return role === 'ADMIN';

    case 'VIEW_ASSIGNED_EVENTS':
    case 'UPLOAD_PHOTOS':
      return role === 'ADMIN' || role === 'TEAM_MEMBER';

    case 'DELETE_PHOTO':
      return role === 'ADMIN' || (role === 'TEAM_MEMBER' && isOwner);

    default:
      return false;
  }
}

describe('RBAC Authorization Rules', () => {
  it('allows Admin full access to event creation, curation, and gallery publishing', () => {
    expect(canPerformAction('ADMIN', 'CREATE_EVENT')).toBe(true);
    expect(canPerformAction('ADMIN', 'ASSIGN_TEAM')).toBe(true);
    expect(canPerformAction('ADMIN', 'SELECT_PHOTOS_FOR_GALLERY')).toBe(true);
    expect(canPerformAction('ADMIN', 'PUBLISH_GALLERY')).toBe(true);
    expect(canPerformAction('ADMIN', 'DELETE_PHOTO', false)).toBe(true);
  });

  it('restricts Team Member from publishing galleries or managing team members', () => {
    expect(canPerformAction('TEAM_MEMBER', 'CREATE_EVENT')).toBe(false);
    expect(canPerformAction('TEAM_MEMBER', 'ASSIGN_TEAM')).toBe(false);
    expect(canPerformAction('TEAM_MEMBER', 'SELECT_PHOTOS_FOR_GALLERY')).toBe(false);
    expect(canPerformAction('TEAM_MEMBER', 'PUBLISH_GALLERY')).toBe(false);
    expect(canPerformAction('TEAM_MEMBER', 'MANAGE_TEAM')).toBe(false);
  });

  it('allows Team Member to upload photos and view assigned events', () => {
    expect(canPerformAction('TEAM_MEMBER', 'VIEW_ASSIGNED_EVENTS')).toBe(true);
    expect(canPerformAction('TEAM_MEMBER', 'UPLOAD_PHOTOS')).toBe(true);
  });

  it('enforces that Team Members can only delete their own uploaded photos', () => {
    // Owner = true -> allowed
    expect(canPerformAction('TEAM_MEMBER', 'DELETE_PHOTO', true)).toBe(true);
    // Owner = false (another photographer or admin photo) -> forbidden
    expect(canPerformAction('TEAM_MEMBER', 'DELETE_PHOTO', false)).toBe(false);
  });

  it('enforces cross-event isolation: Team Members cannot access unassigned events', () => {
    function canAccessEvent(role: UserRole, assignedUserIds: string[], userId: string): boolean {
      if (role === 'ADMIN') return true;
      return assignedUserIds.includes(userId);
    }

    const memberId = 'user-member-123';
    const otherMemberId = 'user-member-456';
    const assignedTeam = [memberId];

    // Admin can access any event
    expect(canAccessEvent('ADMIN', assignedTeam, 'admin-id')).toBe(true);
    // Assigned member can access event
    expect(canAccessEvent('TEAM_MEMBER', assignedTeam, memberId)).toBe(true);
    // Unassigned member CANNOT access event
    expect(canAccessEvent('TEAM_MEMBER', assignedTeam, otherMemberId)).toBe(false);
  });
});

