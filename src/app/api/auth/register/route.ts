import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { id, email, password, fullName, role } = await req.json();

    if (!email || !fullName) {
      return NextResponse.json({ error: "Email and Full Name are required." }, { status: 400 });
    }

    const assignedRole: UserRole = role === "ADMIN" ? "ADMIN" : "TEAM_MEMBER";
    const cleanEmail = email.toLowerCase().trim();

    let userId = id;

    // 1. If password is provided, create the user via Supabase Auth Admin with email_confirm: true
    if (password) {
      const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName.trim(),
          role: assignedRole,
        },
      });

      if (authErr) {
        if (
          authErr.message?.toLowerCase().includes("already registered") ||
          authErr.message?.toLowerCase().includes("already exists")
        ) {
          return NextResponse.json(
            { error: "An account with this email already exists. Please sign in instead." },
            { status: 400 }
          );
        }
        throw authErr;
      }

      userId = authUser.user.id;
    } else if (userId) {
      // Auto-confirm existing user in auth if ID provided
      await supabase.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });
    }

    // 2. Insert or update in PostgreSQL public.users
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingUser) {
      const { data: updated, error: updateErr } = await supabase
        .from("users")
        .update({
          fullName: fullName.trim(),
          role: existingUser.role || assignedRole,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", existingUser.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      return NextResponse.json({ success: true, user: updated, userId });
    }

    const newUser = {
      id: userId || `user-${Date.now()}`,
      email: cleanEmail,
      fullName: fullName.trim(),
      role: assignedRole,
      avatarUrl: "/image/user/user-01.png",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data: created, error: createErr } = await supabase
      .from("users")
      .insert([newUser])
      .select()
      .single();

    if (createErr) throw createErr;

    return NextResponse.json({ success: true, user: created, userId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to register user in database.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
