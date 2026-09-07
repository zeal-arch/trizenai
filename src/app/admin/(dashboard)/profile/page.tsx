"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Camera,
  Mail,
  Shield,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  Save,
  MapPin,
  Phone,
} from "lucide-react";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { Textarea } from "@/components/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, isTeamMember } = useCurrentUser();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("/image/user/user-03.png");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("9876543210");
  const [location, setLocation] = useState("Bangalore, India");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "User");
      setEmail(user.email || "");
      setRole(user.role === "ADMIN" ? "SUPER ADMIN" : "TEAM PHOTOGRAPHER");
      setAvatarUrl(user.avatarUrl || "/image/user/user-03.png");
      setBio(
        user.role === "ADMIN"
          ? "Lead Photographer & Studio Director at TrizenAI. Specializing in high-end keynote galas, product reveals, and luxury editorial event galleries."
          : "Professional event photographer and media specialist contributing to TrizenAI collaborative shoots and galleries."
      );
    }
  }, [user]);

  // Default images from /image folder
  const coverPhoto = "/image/cover/cover-01.png";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number (+91).");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Profile information updated successfully!");
    }, 600);
  };

  return (
    <div className="mx-auto w-full max-w-[970px] space-y-6">
      <Breadcrumb pageName="Profile" />

      {/* ── Main Profile Header Card (RAYVOY Cover Banner Style) ─────────────── */}
      <div className="overflow-hidden rounded-2xl border border-[#EBE8E3] bg-white shadow-xs dark:border-white/15 dark:bg-gray-dark">
        {/* Cover Photo Banner (Fixed Default Cover Image) */}
        <div className="relative z-0 h-40 md:h-64 w-full overflow-hidden bg-gray-100 dark:bg-dark-2">
          <Image
            src={coverPhoto}
            alt="profile cover"
            className="object-cover object-center"
            fill
            sizes="(max-width: 970px) 100vw, 970px"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
        </div>

        {/* Profile Info Container */}
        <div className="px-4 pb-6 text-center lg:pb-8">
          {/* Overlapping Avatar */}
          <div className="relative z-1 mx-auto -mt-16 h-28 w-28 rounded-full bg-white p-1 shadow-md dark:bg-gray-dark sm:-mt-22 sm:h-36 sm:w-36 sm:p-1.5">
            <div className="relative h-full w-full overflow-hidden rounded-full border-2 border-white dark:border-white/15">
              <Image
                src={avatarUrl}
                fill
                sizes="(max-width: 640px) 112px, 144px"
                className="object-cover"
                alt={fullName || "User Avatar"}
                unoptimized
              />
            </div>
            <button
              type="button"
              className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary/90 transition hover:scale-105"
              title="Change Avatar"
            >
              <Camera className="size-4" />
            </button>
          </div>

          {/* User Details */}
          <div className="mt-4">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {fullName || "User"}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-ios-light-blue/10 dark:bg-ios-dark-blue/20 px-2.5 py-0.5 text-[11px] font-semibold text-ios-light-blue dark:text-ios-dark-blue">
                <Shield className="size-3" /> {role || (isTeamMember ? "TEAM PHOTOGRAPHER" : "ADMIN")}
              </span>
            </div>
            <p className="mt-1 text-xs text-dark-5 dark:text-dark-6 flex items-center justify-center gap-1.5">
              <Mail className="size-3.5 text-primary" /> {email}
            </p>
            <p className="mx-auto mt-2.5 max-w-xl text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {bio}
            </p>

            {/* Quick Activity Stats */}
            <div className="mx-auto mt-6 grid max-w-lg grid-cols-3 divide-x divide-[#EBE8E3] rounded-xl border border-[#EBE8E3] bg-gray-50/50 py-3 dark:divide-white/15 dark:border-white/15 dark:bg-dark-2">
              <div className="text-center px-2">
                <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-dark-5 dark:text-dark-6">
                  <Calendar className="size-3.5 text-ios-light-blue dark:text-ios-dark-blue" /> Events
                </div>
                <p className="mt-0.5 text-base font-bold text-gray-900 dark:text-white">
                  12
                </p>
              </div>
              <div className="text-center px-2">
                <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-dark-5 dark:text-dark-6">
                  <ImageIcon className="size-3.5 text-ios-light-orange dark:text-ios-dark-orange" /> Uploads
                </div>
                <p className="mt-0.5 text-base font-bold text-gray-900 dark:text-white">
                  1,480
                </p>
              </div>
              <div className="text-center px-2">
                <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-dark-5 dark:text-dark-6">
                  <CheckCircle2 className="size-3.5 text-ios-light-green dark:text-ios-dark-green" /> Curated
                </div>
                <p className="mt-0.5 text-base font-bold text-gray-900 dark:text-white">
                  420
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Personal Information Form ──────────────────────────────────── */}
      <div className="rounded-2xl border border-[#EBE8E3] bg-white p-6 shadow-xs dark:border-white/15 dark:bg-gray-dark">
        <div className="border-b border-[#EBE8E3] pb-4 dark:border-white/15 mb-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white">
            Personal Information & Settings
          </h3>
          <p className="text-xs text-dark-5 dark:text-dark-6 mt-0.5">
            Update your administrator details, studio contact info, and public bio.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-xs font-semibold">
                Full Name
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="rounded-xl border-[#EBE8E3] bg-gray-50/50 text-xs h-10 dark:border-white/15 dark:bg-dark-2"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold">
                Email Address (Read-only)
              </Label>
              <Input
                id="email"
                value={email}
                disabled
                className="rounded-xl border-[#EBE8E3] bg-gray-100 text-xs h-10 opacity-70 cursor-not-allowed dark:border-white/15 dark:bg-dark-3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-semibold flex items-center gap-1">
                <Phone className="size-3 text-dark-5" /> Phone Number (+91 Only)
              </Label>
              <div className="flex items-center rounded-xl border border-[#EBE8E3] bg-gray-50/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary dark:border-white/15 dark:bg-dark-2 overflow-hidden h-10 transition">
                <span className="flex items-center gap-1 bg-gray-100 dark:bg-dark-3 px-3 text-xs font-semibold text-gray-700 dark:text-gray-200 border-r border-[#EBE8E3] dark:border-white/15 h-full select-none">
                  🇮🇳 +91
                </span>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhone(digits);
                  }}
                  placeholder="98765 43210"
                  maxLength={10}
                  className="flex-1 bg-transparent px-3 text-xs outline-none text-gray-900 dark:text-white placeholder:text-dark-5"
                />
              </div>
              <p className="text-[10px] text-dark-5 dark:text-dark-6">
                Must be a valid 10-digit Indian mobile number.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs font-semibold flex items-center gap-1">
                <MapPin className="size-3 text-dark-5" /> Location / Studio City
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-xl border-[#EBE8E3] bg-gray-50/50 text-xs h-10 dark:border-white/15 dark:bg-dark-2"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-xs font-semibold">
              Public Bio & Studio Role
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="rounded-xl border-[#EBE8E3] bg-gray-50/50 text-xs min-h-[90px] dark:border-white/15 dark:bg-dark-2"
            />
          </div>

          <div className="pt-4 border-t border-[#EBE8E3] dark:border-white/15 flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full px-6 py-2 text-xs shadow-md shadow-primary/20 flex items-center gap-2"
            >
              {saving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="size-3.5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
