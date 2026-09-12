import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { EventRole, UserRole } from '@/types';

export interface RoleGuardSuccess {
  user: {
    id: string;
    authId?: string;
    email: string;
    fullName?: string;
  };
  role: UserRole;
  eventRole?: EventRole;
}

/**
 * Gets the current authenticated user and their role, or returns null if not authenticated.
 * Supports both cookie-based sessions (Next.js App Router) and Bearer token Authorization headers.
 */
export async function getCurrentUserOrNull(): Promise<RoleGuardSuccess | null> {
  try {
    let authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null = null;

    // 1. Try reading user from cookies via createClient()
    try {
      const supabase = await createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user && user.email) {
        authUser = user;
      }
    } catch (cookieErr) {
      console.warn('[getCurrentUserOrNull] Cookie auth extraction error:', cookieErr);
    }

    // 2. If cookie session not found, check for Authorization: Bearer <token> header
    if (!authUser) {
      try {
        const headerList = await headers();
        const authHeader = headerList.get('authorization') || headerList.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7).trim();
          if (token) {
            const adminSupabase = createAdminClient();
            const { data: { user }, error } = await adminSupabase.auth.getUser(token);
            if (!error && user && user.email) {
              authUser = user;
            }
          }
        }
      } catch (headerErr) {
        console.warn('[getCurrentUserOrNull] Header auth extraction error:', headerErr);
      }
    }

    if (!authUser || !authUser.email) {
      return null;
    }

    // 3. Query public.users to get the authoritative role from database
    try {
      const adminSupabase = createAdminClient();
      const { data: dbUser, error: dbError } = await adminSupabase
        .from('users')
        .select('id, email, fullName, role')
        .or(`id.eq.${authUser.id},email.eq.${authUser.email.toLowerCase().trim()}`)
        .maybeSingle();

      if (!dbError && dbUser) {
        return {
          user: {
            id: dbUser.id,
            authId: authUser.id,
            email: dbUser.email,
            fullName: dbUser.fullName,
          },
          role: (dbUser.role as UserRole) || 'TEAM_MEMBER',
        };
      }
    } catch (dbErr) {
      console.warn('[getCurrentUserOrNull] DB role query failed, falling back to metadata:', dbErr);
    }

    // 4. Fallback to user_metadata role
    const metaRole = (authUser.user_metadata?.role as UserRole) || 'TEAM_MEMBER';
    return {
      user: {
        id: authUser.id,
        email: authUser.email,
        fullName: (authUser.user_metadata?.full_name as string) || authUser.email.split('@')[0],
      },
      role: metaRole,
    };
  } catch (err) {
    console.error('[getCurrentUserOrNull] Unexpected error:', err);
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

  // Event membership is authoritative for project access. A platform Admin
  // remains a backwards-compatible lead only when no project membership row
  // exists yet (for example, before an older event is migrated).
  const supabase = createAdminClient();
  const userIds = [current.user.id, current.user.authId].filter(Boolean) as string[];
  const { data: assignment, error } = await supabase
    .from('event_members')
    .select('id, role')
    .eq('eventId', eventId)
    .in('userId', userIds)
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: 'Event membership could not be checked. Apply the project-role database migration first.' },
      { status: 500 }
    );
  }

  if (!assignment && current.role === 'ADMIN') {
    return { ...current, eventRole: 'LEAD' };
  }

  if (!assignment) {
    return NextResponse.json(
      { error: `Forbidden: You are not assigned to this event and cannot ${action}.` },
      { status: 403 }
    );
  }

  const eventRole = assignment.role as EventRole;
  return {
    ...current,
    eventRole,
    // Keep the existing response shape compatible with callers while making
    // the role event-scoped for all event APIs.
    role: eventRole === 'LEAD' ? 'ADMIN' : 'TEAM_MEMBER',
  };
}

/** Requires a specific role inside one event/project. */
export async function requireEventRole(
  eventId: string,
  allowedRoles: EventRole[],
  action = 'perform this action'
): Promise<RoleGuardSuccess | NextResponse> {
  const current = await requireEventAccess(eventId, action);

  if (current instanceof NextResponse) {
    return current;
  }

  if (!current.eventRole || !allowedRoles.includes(current.eventRole)) {
    return NextResponse.json(
      { error: `Forbidden: Your role in this project is not authorized to ${action}.` },
      { status: 403 }
    );
  }

  return current;
}
