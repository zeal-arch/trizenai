import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// GET /api/team - List all users / team members with assigned events and photo counts
export async function GET() {
  try {
    const supabase = createAdminClient();

    // 1. Fetch users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .order("createdAt", { ascending: false });

    if (usersError) throw usersError;

    // 2. Fetch assigned events count
    const { data: assignments } = await supabase
      .from("event_members")
      .select("userId, eventId");

    // 3. Fetch uploaded photos count
    const { data: photos } = await supabase
      .from("photos")
      .select("uploadedBy");

    const formattedTeam = (users || []).map((user) => {
      const assignedCount = (assignments || []).filter((a) => a.userId === user.id).length;
      const uploadedCount = (photos || []).filter((p) => p.uploadedBy === user.id).length;
      const joinedFormatted = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
        : "Recent";

      return {
        id: user.id,
        fullName: user.fullName || "User",
        email: user.email,
        role: user.role || "TEAM_MEMBER",
        avatarUrl: user.avatarUrl || "/image/user/user-03.png",
        assignedEventsCount: assignedCount,
        uploadedPhotosCount: uploadedCount,
        joinedDate: joinedFormatted,
      };
    });

    return NextResponse.json({
      success: true,
      team: formattedTeam,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch team members";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/team - Add new team member / photographer
export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await req.json();
    const { fullName, email, role, avatarUrl } = body;

    if (!fullName || !email) {
      return NextResponse.json({ error: "Full Name and Email are required." }, { status: 400 });
    }

    const userId = `user-${Date.now()}`;
    const newUser = {
      id: userId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      role: role === "ADMIN" ? "ADMIN" : "TEAM_MEMBER",
      avatarUrl: avatarUrl || "/image/user/user-01.png",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("users")
      .insert([newUser])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      user: {
        ...data,
        assignedEventsCount: 0,
        uploadedPhotosCount: 0,
        joinedDate: "Just now",
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add team member";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/team - Delete team member
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query param is required" }, { status: 400 });
    }

    // Clean up event memberships
    await supabase.from("event_members").delete().eq("userId", userId);

    const { error } = await supabase.from("users").delete().eq("id", userId);
    if (error) throw error;

    return NextResponse.json({ success: true, message: "Team member deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete team member";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
