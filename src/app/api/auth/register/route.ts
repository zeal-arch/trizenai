import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { id, email, fullName, role } = await req.json();

    if (!email || !fullName) {
      return NextResponse.json({ error: "Email and Full Name are required." }, { status: 400 });
    }

    const assignedRole: UserRole = role === "ADMIN" ? "ADMIN" : "TEAM_MEMBER";
    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists in PostgreSQL
    const { data: existingUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingUser) {
      const { data: updated, error: updateErr } = await supabase
        .from("users")
        .update({
          fullName,
          role: assignedRole,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", existingUser.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      return NextResponse.json({ success: true, user: updated });
    }

    const newUser = {
      id: id || `user-${Date.now()}`,
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

    return NextResponse.json({ success: true, user: created });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to register user in database.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
