"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Mail,
  Shield,
  UserCheck,
  Search,
  Trash2,
  UserPlus,
  Camera,
  Copy,
  Check,
  KeyRound,
} from "lucide-react";
import Image from "next/image";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { Badge } from "@/components/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/dialog";
import { ConfirmDialog } from "@/app/admin/components/ConfirmDialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TeamUser {
  id: string;
  fullName: string;
  email: string;
  role: "ADMIN" | "TEAM_MEMBER";
  avatarUrl: string;
  assignedEventsCount: number;
  uploadedPhotosCount: number;
  joinedDate: string;
}

const DEFAULT_AVATARS = [
  "/image/user/user-01.png",
  "/image/user/user-02.png",
  "/image/user/user-03.png",
  "/image/user/user-04.png",
  "/image/user/user-05.png",
  "/image/user/user-06.png",
];

export default function TeamPage() {
  const router = useRouter();
  const { isTeamMember, loading: authLoading } = useCurrentUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [team, setTeam] = useState<TeamUser[]>([]);

  // Add Member Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"ADMIN" | "TEAM_MEMBER">("TEAM_MEMBER");
  const [newAvatar, setNewAvatar] = useState(DEFAULT_AVATARS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete User Dialog State
  const [userToDelete, setUserToDelete] = useState<TeamUser | null>(null);

  // Credentials Modal State (shown after member is added)
  interface NewCredentials { email: string; tempPassword: string; fullName: string; }
  const [newCredentials, setNewCredentials] = useState<NewCredentials | null>(null);
  const [credCopied, setCredCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && isTeamMember) {
      toast.error("Access Restricted: Team management is reserved for Team Admins.");
      router.replace("/admin/events");
    }
  }, [authLoading, isTeamMember, router]);

  const loadTeam = async () => {
    try {
      const res = await fetch("/api/team");
      if (res.ok) {
        const data = await res.json();
        if (data.team && data.team.length > 0) {
          setTeam(data.team);
        }
      }
    } catch {
      // keep fallback
    }
  };

  useEffect(() => {
    if (authLoading || isTeamMember) return;
    loadTeam();
  }, [authLoading, isTeamMember]);

  if (authLoading || isTeamMember) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  const copyCredentials = () => {
    if (!newCredentials) return;
    const text = `Login URL: ${window.location.origin}/admin/login\nEmail: ${newCredentials.email}\nPassword: ${newCredentials.tempPassword}`;
    navigator.clipboard.writeText(text).then(() => {
      setCredCopied(true);
      setTimeout(() => setCredCopied(false), 2500);
    });
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Please enter a valid full name and email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          role: newRole,
          avatarUrl: newAvatar,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add team member");
      }

      const data = await res.json();
      setTeam((prev) => [data.user, ...prev.filter((u) => u.id !== data.user.id)]);
      setIsAddOpen(false);

      // Reset form
      setNewName("");
      setNewEmail("");
      setNewRole("TEAM_MEMBER");
      setNewAvatar(DEFAULT_AVATARS[0]);

      // Show generated credentials
      if (data.tempPassword) {
        setNewCredentials({
          email: data.user.email,
          tempPassword: data.tempPassword,
          fullName: data.user.fullName,
        });
      }

      toast.success(`Added ${data.user.fullName} to the team successfully!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error adding member";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    if (userToDelete.id === "7f55215b-06c9-44f3-9667-69f863393593") {
      toast.error("Cannot delete the primary Lead Administrator.");
      setUserToDelete(null);
      return;
    }

    const targetName = userToDelete.fullName;
    try {
      const res = await fetch(`/api/team?userId=${userToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete team member");
      }

      setTeam((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setUserToDelete(null);
      toast.success(`Removed ${targetName} from the team.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting member";
      toast.error(msg);
    }
  };

  const filteredTeam = team.filter((u) =>
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Team Management" />

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Team & Staff Members
          </h1>
          <p className="text-xs text-dark-5 dark:text-dark-6 mt-0.5">
            Manage photographers, staff access, permissions, and event assignments.
          </p>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-5 py-2 text-xs shadow-md shadow-primary/20 flex items-center gap-2"
        >
          <Plus className="size-4" />
          Add Member
        </Button>
      </div>

      {/* Search Bar & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white dark:bg-gray-dark border-[#EBE8E3] dark:border-white/15 rounded-xl text-xs h-10"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dark-5" />
        </div>

        <span className="text-xs text-dark-5 dark:text-dark-6">
          Showing <strong>{filteredTeam.length}</strong> team member{filteredTeam.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Team Table */}
      <div className="overflow-hidden rounded-2xl border border-[#EBE8E3] bg-white shadow-xs dark:border-white/15 dark:bg-gray-dark">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#EBE8E3] bg-gray-50/50 text-[11px] font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200 dark:border-white/15 dark:bg-dark-2">
              <tr>
                <th className="px-5 py-3.5">Member</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Assigned Events</th>
                <th className="px-5 py-3.5">Photos Uploaded</th>
                <th className="px-5 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE8E3] dark:divide-white/15">
              {filteredTeam.map((member) => {
                const isLeadAdmin = member.id === "7f55215b-06c9-44f3-9667-69f863393593";
                return (
                  <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-dark-2/40 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={member.avatarUrl}
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
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Mail className="size-3" /> {member.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
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
                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-100">
                      {member.assignedEventsCount} events
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-100">
                      {member.uploadedPhotosCount} photos
                    </td>
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300 font-medium">
                      {member.joinedDate}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {!isLeadAdmin ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUserToDelete(member)}
                          className="size-8 p-0 rounded-lg text-dark-5 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition"
                          title={`Delete ${member.fullName}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 italic pr-2">Owner</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add User Modal ─────────────────────────────────────────────────── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-[#EBE8E3] bg-white p-6 shadow-2xl dark:border-white/15 dark:bg-gray-dark">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UserPlus className="size-5 text-primary" />
              <span>Add New Team Member</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-dark-5 dark:text-dark-6">
        Invite a photographer or co-admin. Login credentials will be generated automatically.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMember} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="add-name" className="text-xs font-semibold">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="add-name"
                placeholder="e.g. Maya Sharma"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-xl border-[#EBE8E3] bg-gray-50/50 text-xs h-10 dark:border-white/15 dark:bg-dark-2"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add-email" className="text-xs font-semibold">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="add-email"
                type="email"
                placeholder="maya@trizen-ai.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="rounded-xl border-[#EBE8E3] bg-gray-50/50 text-xs h-10 dark:border-white/15 dark:bg-dark-2"
                required
              />
            </div>

            {/* Role selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Role & Permissions</Label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setNewRole("TEAM_MEMBER")}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition cursor-pointer text-center",
                    newRole === "TEAM_MEMBER"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-[#EBE8E3] bg-white dark:border-white/15 dark:bg-dark-2 text-dark-5 hover:border-primary/40"
                  )}
                >
                  <Camera className="size-4 mb-1" />
                  Photographer
                </button>
                <button
                  type="button"
                  onClick={() => setNewRole("ADMIN")}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition cursor-pointer text-center",
                    newRole === "ADMIN"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-[#EBE8E3] bg-white dark:border-white/15 dark:bg-dark-2 text-dark-5 hover:border-primary/40"
                  )}
                >
                  <Shield className="size-4 mb-1" />
                  Admin / Lead
                </button>
              </div>
            </div>

            {/* Default Avatar Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Default Avatar</Label>
              <div className="flex items-center gap-2.5 pt-1">
                {DEFAULT_AVATARS.map((avatarUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewAvatar(avatarUrl)}
                    className={cn(
                      "relative size-9 rounded-full overflow-hidden border-2 transition hover:scale-105",
                      newAvatar === avatarUrl
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-[#EBE8E3] dark:border-white/15 opacity-70 hover:opacity-100"
                    )}
                  >
                    <Image src={avatarUrl} alt="Avatar option" fill unoptimized className="object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <DialogFooter className="mt-6 flex items-center justify-end gap-2.5 border-t border-[#EBE8E3] dark:border-white/15 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="rounded-full border-[#EBE8E3] dark:border-white/15 text-xs h-9 px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-full bg-primary hover:bg-primary/90 text-white text-xs h-9 px-5 font-semibold"
              >
                {isSubmitting ? "Adding..." : "Add Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Credentials Display Modal ───────────────────────────────────────── */}
      <Dialog open={!!newCredentials} onOpenChange={(open) => !open && setNewCredentials(null)}>
        <DialogContent className="max-w-sm rounded-2xl border border-[#EBE8E3] bg-white p-6 shadow-2xl dark:border-white/15 dark:bg-gray-dark">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              Login Credentials Generated
            </DialogTitle>
            <DialogDescription className="text-xs text-dark-5 dark:text-dark-6">
              Share these credentials with <strong>{newCredentials?.fullName}</strong>. They should change their password after first login.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 rounded-xl border border-[#EBE8E3] dark:border-white/15 bg-gray-50 dark:bg-dark-2 p-4 space-y-2.5 font-mono text-xs">
            <div>
              <span className="text-dark-5 uppercase tracking-wider text-[10px]">Login URL</span>
              <p className="text-gray-900 dark:text-white font-medium mt-0.5">{typeof window !== "undefined" ? window.location.origin : ""}/admin/login</p>
            </div>
            <div>
              <span className="text-dark-5 uppercase tracking-wider text-[10px]">Email</span>
              <p className="text-gray-900 dark:text-white font-medium mt-0.5">{newCredentials?.email}</p>
            </div>
            <div>
              <span className="text-dark-5 uppercase tracking-wider text-[10px]">Temporary Password</span>
              <p className="text-primary font-bold mt-0.5 tracking-widest">{newCredentials?.tempPassword}</p>
            </div>
          </div>

          <DialogFooter className="mt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={copyCredentials}
              className="flex-1 rounded-full border-[#EBE8E3] dark:border-white/15 text-xs h-9 gap-1.5"
            >
              {credCopied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              {credCopied ? "Copied!" : "Copy Credentials"}
            </Button>
            <Button
              onClick={() => setNewCredentials(null)}
              className="flex-1 rounded-full bg-primary hover:bg-primary/90 text-white text-xs h-9 font-semibold"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Delete Dialog ──────────────────────────────────────────── */}
      {userToDelete && (
        <ConfirmDialog
          open={!!userToDelete}
          onOpenChange={(open) => !open && setUserToDelete(null)}
          title={`Remove ${userToDelete.fullName}?`}
          description={`Are you sure you want to remove ${userToDelete.fullName} (${userToDelete.email}) from the team? They will immediately lose access to upload photos and manage assigned events.`}
          confirmText="Delete Member"
          cancelText="Cancel"
          variant="danger"
          onConfirm={confirmDeleteUser}
        />
      )}
    </div>
  );
}
