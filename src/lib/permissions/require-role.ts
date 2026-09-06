import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import type { UserRole } from '@/types';

export interface RoleGuardSuccess {
  user: {
    id: string;
    email: string;
    fullName?: string;
  };
  role: UserRole;
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
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
  }

  // Fetch or resolve user profile from DB
  let dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, fullName: true, role: true },
  });

  if (!dbUser) {
    // If not in DB yet, check email or fallback to metadata role
    const metaRole = (user.user_metadata?.role as UserRole) || 'TEAM_MEMBER';
    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name || user.email.split('@')[0],
        role: metaRole,
        avatarUrl: user.user_metadata?.avatar_url || null,
      },
      select: { id: true, email: true, fullName: true, role: true },
    });
  }

  const role = dbUser.role as UserRole;

  if (!allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: `Forbidden: Your role (${role}) is not authorized to ${action}.` },
      { status: 403 }
    );
  }

  return {
    user: {
      id: dbUser.id,
      email: dbUser.email,
      fullName: dbUser.fullName,
    },
    role,
  };
}
