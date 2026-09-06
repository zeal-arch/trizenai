"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Mail,
  Shield,
  UserCheck,
  Search,
  Check,
  Trash2,
} from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Badge } from "@/components/badge";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "TEAM_MEMBER";
  avatarUrl?: string;
  isAssigned: boolean;
  uploadedCount: number;
}

export default function EventTeamPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const [searchQuery, setSearchQuery] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: "7f55215b-06c9-44f3-9667-69f863393593",
      fullName: "Lead Administrator",
      email: "admin@trizen-ai.com",
      role: "ADMIN",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      isAssigned: true,
      uploadedCount: 42,
    },
  ]);

  const loadEventTeam = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/team`);
      if (res.ok) {
        const data = await res.json();
        if (data.members && data.members.length > 0) {
          setTeamMembers(data.members);
        }
      }
    } catch {
      // keep fallback
    }
  }, [eventId]);

  useEffect(() => {
    loadEventTeam();
  }, [loadEventTeam]);

  const toggleAssignment = async (memberId: string) => {
    const target = teamMembers.find((m) => m.id === memberId);
    if (!target) return;
    const nextState = !target.isAssigned;

    setTeamMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, isAssigned: nextState } : m))
    );

    try {
      if (nextState) {
        await fetch(`/api/events/${eventId}/team`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: memberId }),
        });
        toast.success(`Assigned ${target.fullName} to this event.`);
      } else {
        await fetch(`/api/events/${eventId}/team?userId=${memberId}`, {
          method: "DELETE",
        });
        toast.info(`Removed ${target.fullName} from this event.`);
      }
    } catch {
      // update happened locally
    }
  };

  const filteredMembers = teamMembers.filter((m) =>
    m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const assignedCount = teamMembers.filter((m) => m.isAssigned).length;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <Breadcrumb pageName="Event Team" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/events">
            <button
              type="button"
              className="flex size-9 items-center justify-center rounded-full border border-[#EBE8E3] bg-primary/10 text-primary shadow-xs transition hover:bg-primary/20 hover:scale-105 dark:border-white/15 dark:bg-primary/20"
              title="Back to Events"
            >
              <ArrowLeft className="size-4.5 text-primary stroke-[2.5]" />
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Event Team Assignments
            </h1>
            <p className="text-xs text-dark-5 dark:text-dark-6">
              Event ID: <span className="font-mono">{eventId.slice(0, 8)}...</span> · Assign photographers and team members who can upload photos for this event.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-dark-5 dark:text-dark-6">
            {assignedCount} of {teamMembers.length} members assigned
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Search photographers by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-gray-dark border-[#EBE8E3] dark:border-white/15 rounded-xl text-xs h-10"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dark-5" />
        </div>
      </div>

      {/* Team Members List Card */}
      <div className="overflow-hidden rounded-2xl border border-[#EBE8E3] bg-white shadow-xs dark:border-white/15 dark:bg-gray-dark">
        <div className="border-b border-[#EBE8E3] px-6 py-4 dark:border-white/15 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="size-4 text-primary" />
            Assigned Photographers & Staff
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#EBE8E3] bg-gray-50/50 text-[11px] font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200 dark:border-white/15 dark:bg-dark-2">
              <tr>
                <th className="px-6 py-3.5">Team Member</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Event Photos Uploaded</th>
                <th className="px-6 py-3.5">Assignment Status</th>
                <th className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE8E3] dark:divide-white/15">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-2/40 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src={member.avatarUrl!}
                        alt={member.fullName}
                        width={36}
                        height={36}
                        unoptimized
                        className="size-9 rounded-full object-cover border border-[#EBE8E3] dark:border-white/15"
                      />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {member.fullName}
                        </p>
                        <p className="text-[11px] text-dark-5 flex items-center gap-1">
                          <Mail className="size-3" /> {member.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {member.role === "ADMIN" ? (
                      <Badge variant="default" className="gap-1 bg-primary text-white">
                        <Shield className="size-3" /> Lead Admin
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <UserCheck className="size-3" /> Photographer
                      </Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">
                    {member.uploadedCount} photos
                  </td>
                  <td className="px-6 py-4">
                    {member.isAssigned ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                        <Check className="size-3" /> Assigned
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-dark-5 bg-gray-100 dark:bg-dark-2 px-2.5 py-0.5 rounded-full">
                        Not Assigned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      size="sm"
                      variant={member.isAssigned ? "outline" : "default"}
                      onClick={() => toggleAssignment(member.id)}
                      className={
                        member.isAssigned
                          ? "border-[#EBE8E3] dark:border-white/15 text-xs rounded-xl h-8 px-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          : "bg-primary hover:bg-primary/90 text-white text-xs rounded-xl h-8 px-3"
                      }
                    >
                      {member.isAssigned ? (
                        <>
                          <Trash2 className="size-3 mr-1" /> Remove
                        </>
                      ) : (
                        <>
                          <UserPlus className="size-3 mr-1" /> Assign to Event
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
