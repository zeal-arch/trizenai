import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database with development dummy data...");

  // 1. Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@trizen-ai.com" },
    update: {
      fullName: "Lead Administrator",
      role: "ADMIN",
    },
    create: {
      email: "admin@trizen-ai.com",
      fullName: "Lead Administrator",
      role: "ADMIN",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 2. Create Team Member User
  const teamMember = await prisma.user.upsert({
    where: { email: "photographer@trizen-ai.com" },
    update: {
      fullName: "Alex Rivera (Photographer)",
      role: "TEAM_MEMBER",
    },
    create: {
      email: "photographer@trizen-ai.com",
      fullName: "Alex Rivera (Photographer)",
      role: "TEAM_MEMBER",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 3. Create Sample Event
  const sampleEvent = await prisma.event.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      title: "TrizenAI Annual Gala 2026",
      description: "Annual leadership gala, keynote showcases, and team awards.",
      date: new Date("2026-09-15T18:00:00Z"),
      location: "The Grand Ballroom, Bangalore",
      coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80",
      createdBy: admin.id,
    },
  });

  // 4. Assign Team Member to Event
  await prisma.eventMember.upsert({
    where: {
      eventId_userId: {
        eventId: sampleEvent.id,
        userId: teamMember.id,
      },
    },
    update: {},
    create: {
      eventId: sampleEvent.id,
      userId: teamMember.id,
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log(`   Admin: admin@trizen-ai.com (Password: AdminPass@2026)`);
  console.log(`   Team:  photographer@trizen-ai.com (Password: TeamPass@2026)`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
