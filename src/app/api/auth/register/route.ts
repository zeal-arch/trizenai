import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { id, email, fullName, role } = await req.json();

    if (!email || !fullName) {
      return NextResponse.json({ error: "Email and Full Name are required." }, { status: 400 });
    }

    const assignedRole: UserRole = role === "ADMIN" ? "ADMIN" : "TEAM_MEMBER";

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        fullName,
        role: assignedRole,
      },
      create: {
        id: id || undefined,
        email,
        fullName,
        role: assignedRole,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to register user in database.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
