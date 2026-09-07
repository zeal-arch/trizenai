import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { UserRole } from '@/types';

export interface RoleGuardSuccess {
  user: {
    id: string;
    authId?: string;
    email: string;
    fullName?: string;
  };
  role: UserRole;
}

/**
 * Gets the current authenticated user and their role, or returns null if not authenticated.
 */
export async function getCurrentUserOrNull(): Promise<RoleGuardSuccess | null> {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || !user.email) {
      return null;
    }

    const adminSupabase = createAdminClient();
    const { data: dbUser } = await adminSupabase
      .from('users')
      .select('id, email, fullName, role')
      .or(`id.eq.${user.id},email.eq.${user.email.toLowerCase().trim()}`)
      .maybeSingle();

    if (dbUser) {
      return {
        user: {
          id: dbUser.id,
          authId: user.id,
          email: dbUser.email,
          fullName: dbUser.fullName,
        },
        role: (dbUser.role as UserRole) || 'TEAM_MEMBER',
      };
    }

    // Fallback to metadata
    const metaRole = (user.user_metadata?.role as UserRole) || 'TEAM_MEMBER';
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || user.email.split('@')[0],
      },
      role: metaRole,
    };
  } catch {
    return null;
  }
}

/**
 * Server-side role guard for API routes and Server Actions.
 *
 * @param allowedRoles Array of permitted roles (e.g. ['ADMIN'] or ['ADMIN', 'TEAM_MEMBER'])
 * @param action Human-readable action description for logs/errors
 */
export async function requireRole(
  allowedRoles: UserRole[],
  action = 'perform this action'
): Promise<RoleGuardSuccess | NextResponse> {
  const current = await getCurrentUserOrNull();

  if (!current) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
  }

  if (!allowedRoles.includes(current.role)) {
    return NextResponse.json(
      { error: `Forbidden: Your role (${current.role}) is not authorized to ${action}.` },
      { status: 403 }
    );
  }

  return current;
}

/**
 * Verifies that the authenticated user has access to a specific event.
 * - ADMIN: Granted access to all events.
 * - TEAM_MEMBER: Granted access ONLY if assigned in the event_members table.
 */
export async function requireEventAccess(
  eventId: string,
  action = 'access this event'
): Promise<RoleGuardSuccess | NextResponse> {
  const current = await getCurrentUserOrNull();

  if (!current) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
  }

  if (current.role === 'ADMIN') {
    return current;
  }

  // Team Member check: Verify assignment in event_members
  const supabase = createAdminClient();
  const { data: assignment, error } = await supabase
    .from('event_members')
    .select('id')
    .eq('eventId', eventId)
    .eq('userId', current.user.id)
    .maybeSingle();

  if (error || !assignment) {
    return NextResponse.json(
      { error: `Forbidden: You are not assigned to this event and cannot ${action}.` },
      { status: 403 }
    );
  }

  return current;
}

