import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/permissions/require-role";

export const dynamic = "force-dynamic";

// GET /api/team - List all users / team members with assigned events and photo counts (ADMIN ONLY)
export async function GET() {
  try {
    const authResult = await requireRole(["ADMIN"], "view team members directory");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

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

// POST /api/team - Add new team member / photographer (ADMIN ONLY)
export async function POST(req: NextRequest) {
  try {
    const authResult = await requireRole(["ADMIN"], "add new team members");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = createAdminClient();
    const body = await req.json();
    const { fullName, email, role, avatarUrl } = body;

    if (!fullName || !email) {
      return NextResponse.json({ error: "Full Name and Email are required." }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const requestedRole = role === "ADMIN" ? "ADMIN" : "TEAM_MEMBER";

    // Adding a team member must also work for an account that already exists.
    // The previous flow tried to create the Supabase Auth user first, which
    // caused existing accounts to fail before they could be reused.
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("*")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingUserError) throw existingUserError;

    if (existingUser) {
      // Never downgrade an existing administrator just because the form's
      // default role is TEAM_MEMBER. Selecting ADMIN may promote a member.
      const effectiveRole = existingUser.role === "ADMIN" || requestedRole === "ADMIN"
        ? "ADMIN"
        : "TEAM_MEMBER";

      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          fullName: fullName.trim(),
          role: effectiveRole,
          avatarUrl: avatarUrl || existingUser.avatarUrl,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", existingUser.id)
        .select()
        .single();

      if (updateError) throw updateError;

      const [{ count: assignedEventsCount }, { count: uploadedPhotosCount }] = await Promise.all([
        supabase
          .from("event_members")
          .select("id", { count: "exact", head: true })
          .eq("userId", existingUser.id),
        supabase
          .from("photos")
          .select("id", { count: "exact", head: true })
          .eq("uploadedBy", existingUser.id),
      ]);

      const roleLabel = effectiveRole === "ADMIN" ? "Administrator" : "Team Member";
      return NextResponse.json({
        success: true,
        existing: true,
        message: `${cleanEmail} is already on the team as ${roleLabel}. You can assign this account to events from the Event Team page.`,
        user: {
          ...updatedUser,
          assignedEventsCount: assignedEventsCount || 0,
          uploadedPhotosCount: uploadedPhotosCount || 0,
          joinedDate: updatedUser.createdAt
            ? new Date(updatedUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
            : "Recent",
        },
      });
    }

    // Generate a secure temporary password for a brand-new account.
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const rand = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const tempPassword = `Trizen${rand}@${new Date().getFullYear()}`;

    // 1. Create a real Supabase Auth account so the user can login
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: cleanEmail,
      password: tempPassword,
      email_confirm: true, // auto-confirm so they can login immediately without an email link
      user_metadata: {
        full_name: fullName.trim(),
        role: requestedRole,
        avatar_url: avatarUrl || "/image/user/user-01.png",
      },
    });

    if (authError) {
      if (authError.message?.toLowerCase().includes("already registered") || authError.status === 422) {
        return NextResponse.json(
          { error: `A user with email ${cleanEmail} already exists. Refresh the team list and assign the existing account to an event instead.` },
          { status: 409 }
        );
      }
      throw authError;
    }

    const userId = authData.user.id;
    const newUser = {
      id: userId,
      fullName: fullName.trim(),
      email: cleanEmail,
      role: requestedRole,
      avatarUrl: avatarUrl || "/image/user/user-01.png",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 2. Upsert into public.users (the DB trigger may have already created a row)
    const { data, error } = await supabase
      .from("users")
      .upsert([newUser], { onConflict: "id" })
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
      tempPassword,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to add team member";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/team - Delete team member (ADMIN ONLY)
export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireRole(["ADMIN"], "delete team members");
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query param is required" }, { status: 400 });
    }

    // Prevent self-deletion
    if (userId === authResult.user.id || (authResult.user.authId && userId === authResult.user.authId)) {
      return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    // Check if target is an Admin and prevent deleting the only admin
    const { data: targetUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (targetUser?.role === "ADMIN") {
      const { count: adminCount } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "ADMIN");

      if ((adminCount || 0) <= 1) {
        return NextResponse.json(
          { error: "Cannot delete the only remaining Administrator on the platform." },
          { status: 400 }
        );
      }
    }

    // Clean up event memberships
    await supabase.from("event_members").delete().eq("userId", userId);

    // Remove from public.users
    const { error: userError } = await supabase.from("users").delete().eq("id", userId);
    if (userError) throw userError;

    // Delete from Supabase Auth (best-effort — don't fail if auth user doesn't exist)
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch {
      // Non-fatal: public.users row is already deleted
    }

    return NextResponse.json({ success: true, message: "Team member deleted successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete team member";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
