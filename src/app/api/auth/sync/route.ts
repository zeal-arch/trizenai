import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/sync
 * Automatically syncs an authenticated Supabase Auth user (including Google OAuth users)
 * into the PostgreSQL `public.users` table so they have an active database record.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { id, email, fullName, avatarUrl, role } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const assignedRole = role === "TEAM_MEMBER" ? "TEAM_MEMBER" : "ADMIN";
    const name = fullName || email.split("@")[0] || "User";

    // 1. Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (existingUser) {
      // Update avatar or name if newly provided
      const { data: updatedUser, error: updateErr } = await supabase
        .from("users")
        .update({
          fullName: existingUser.fullName || name,
          avatarUrl: avatarUrl || existingUser.avatarUrl,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", existingUser.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      return NextResponse.json({ success: true, user: updatedUser });
    }

    // 2. Create new user record
    const newUser = {
      id: id || `user-${Date.now()}`,
      email: email.toLowerCase().trim(),
      fullName: name,
      role: assignedRole,
      avatarUrl: avatarUrl || "/image/user/user-01.png",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data: createdUser, error: createErr } = await supabase
      .from("users")
      .insert([newUser])
      .select()
      .single();

    if (createErr) throw createErr;

    return NextResponse.json({ success: true, user: createdUser });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to sync user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
