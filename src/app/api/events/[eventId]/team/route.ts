import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEventRole } from "@/lib/permissions/require-role";

export const dynamic = "force-dynamic";

// GET /api/events/[eventId]/team - Get team members with assignment status for this event (ADMIN ONLY)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const authResult = await requireEventRole(eventId, ["LEAD"], "view event team assignments");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = createAdminClient();

    // 1. Fetch all users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .order("fullName", { ascending: true });

    if (usersError) throw usersError;

    // 2. Fetch assignments for this event
    const { data: assignments } = await supabase
      .from("event_members")
      .select("userId, role, assignedAt")
      .eq("eventId", eventId);

    const assignmentMap = new Map((assignments || []).map((a) => [a.userId, a]));

    // 3. Fetch photos uploaded for this event
    const { data: photos } = await supabase
      .from("photos")
      .select("uploadedBy")
      .eq("eventId", eventId);

    const membersWithStatus = (users || []).map((user) => {
      const assignment = assignmentMap.get(user.id);
      const uploadedCount = (photos || []).filter((p) => p.uploadedBy === user.id).length;

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        globalRole: user.role,
        eventRole: assignment?.role || null,
        avatarUrl: user.avatarUrl,
        isAssigned: Boolean(assignment),
        assignedAt: assignment?.assignedAt || null,
        uploadedCount,
      };
    });

    return NextResponse.json({
      success: true,
      members: membersWithStatus,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch event team";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/events/[eventId]/team - Assign user to event (ADMIN ONLY)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const authResult = await requireEventRole(eventId, ["LEAD"], "assign team members to events");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = createAdminClient();
    const body = await req.json();
    const { userId, role } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const eventRole = role === "LEAD" ? "LEAD" : "TEAM_MEMBER";
    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (targetUserError) throw targetUserError;
    if (!targetUser) {
      return NextResponse.json({ error: "The selected user does not exist." }, { status: 404 });
    }

    const { data: existingAssignment, error: existingAssignmentError } = await supabase
      .from("event_members")
      .select("id")
      .eq("eventId", eventId)
      .eq("userId", userId)
      .maybeSingle();

    if (existingAssignmentError) throw existingAssignmentError;

    const assignmentQuery = existingAssignment
      ? supabase
          .from("event_members")
          .update({ role: eventRole, assignedAt: new Date().toISOString() })
          .eq("id", existingAssignment.id)
      : supabase
          .from("event_members")
          .insert([{ id: crypto.randomUUID(), eventId, userId, role: eventRole, assignedAt: new Date().toISOString() }]);

    const { data, error } = await assignmentQuery.select().single();

    if (error) throw error;

    return NextResponse.json({ success: true, assignment: data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to assign team member";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/events/[eventId]/team - Unassign user from event (ADMIN ONLY)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const authResult = await requireEventRole(eventId, ["LEAD"], "remove team members from events");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("event_members")
      .delete()
      .eq("eventId", eventId)
      .eq("userId", userId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "Unassigned successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to unassign team member";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
