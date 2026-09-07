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
      // Preserve existing user role - do NOT overwrite role
      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (fullName && !existingUser.fullName) updateData.fullName = fullName;
      if (avatarUrl && !existingUser.avatarUrl) updateData.avatarUrl = avatarUrl;

      const { data: updatedUser, error: updateErr } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", existingUser.id)
        .select()
        .maybeSingle();

      if (updateErr) {
        console.error("Error updating existing user in /api/auth/sync:", updateErr);
        // Fallback return existingUser without throwing 500
        return NextResponse.json({ success: true, user: existingUser });
      }
      return NextResponse.json({ success: true, user: updatedUser || existingUser });
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
      .maybeSingle();

    if (createErr) {
      console.error("Error creating user in /api/auth/sync:", createErr);
      throw createErr;
    }

    return NextResponse.json({ success: true, user: createdUser });
  } catch (error: unknown) {
    console.error("Catch block in /api/auth/sync:", error);
    const message = error instanceof Error ? error.message : "Failed to sync user.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
