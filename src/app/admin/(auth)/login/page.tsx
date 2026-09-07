"use client";

import { useState, useCallback, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { playfair } from "@/lib/fonts";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

function EyeIcon() {
  return (
    <svg className="h-5 w-5 text-brand-lavenderGrey hover:text-brand-softPeriwinkle transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg className="h-5 w-5 text-brand-lavenderGrey hover:text-brand-softPeriwinkle transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

function LoginPageContent() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("ADMIN");
  const [email, setEmail] = useState("admin@trizen-ai.com");
  const [password, setPassword] = useState("AdminPass@2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleRoleToggle = (role: UserRole) => {
    setSelectedRole(role);
    if (role === "ADMIN") {
      setEmail("admin@trizen-ai.com");
      setPassword("AdminPass@2026");
    } else {
      setEmail("member@trizen-ai.com");
      setPassword("MemberPass@2026");
    }
  };

  const handleLogin = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setError("");
      setLoading(true);

      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(authError.message || "Invalid login credentials. Please try again.");
          setLoading(false);
          return;
        }

        // Query database to get authoritative role
        const { data: dbUser } = await supabase
          .from("users")
          .select("id, email, fullName, role, avatarUrl")
          .or(`id.eq.${authData.user.id},email.eq.${authData.user.email?.toLowerCase().trim()}`)
          .maybeSingle();

        const userRole: UserRole = (dbUser?.role as UserRole) || (authData.user?.user_metadata?.role as UserRole) || selectedRole;

        // Set session cache immediately so all components have role without delay
        const profile = {
          id: dbUser?.id || authData.user.id,
          email: authData.user.email || email,
          fullName: dbUser?.fullName || authData.user?.user_metadata?.full_name || email.split("@")[0],
          avatarUrl: dbUser?.avatarUrl || authData.user?.user_metadata?.avatar_url || "/image/user/user-01.png",
          role: userRole,
        };

        if (typeof window !== "undefined") {
          sessionStorage.setItem("current_user_profile", JSON.stringify(profile));
          sessionStorage.setItem("admin_user_profile", JSON.stringify({
            name: profile.fullName,
            email: profile.email,
            img: profile.avatarUrl,
          }));
        }

        toast.success("Welcome back!");

        if (userRole === "TEAM_MEMBER") {
          router.push("/admin/events");
        } else {
          router.push("/admin/dashboard");
        }
        router.refresh();
      } catch (err) {
        logger.error("Login fetch error", err);
        setError("Unexpected error during login. Please try again.");
        setLoading(false);
      }
    },
    [email, password, router, selectedRole, supabase]
  );


  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-cream text-brand-nearBlack overflow-hidden px-6">
      <div className="w-full max-w-md mx-auto my-auto animate-in fade-in duration-700">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl sm:text-5xl tracking-tight text-brand-nearBlack mb-2.5 ${playfair.className}`}>
            Welcome <span className="italic font-normal">Back.</span>
          </h1>
          <p className="text-brand-warmGray text-xs sm:text-sm font-light tracking-wide mb-6">
            Please sign in to access the TrizenAI photo portal.
          </p>

          {/* Clean Editorial Role Pill Switcher */}
          <div className="flex justify-center">
            <div className="inline-flex p-1.5 rounded-full bg-white border border-brand-lightGray shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
              <button
                type="button"
                onClick={() => handleRoleToggle("ADMIN")}
                className={cn(
                  "px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.16em] transition-all duration-300 cursor-pointer",
                  selectedRole === "ADMIN"
                    ? "bg-brand-softPeriwinkle text-white shadow-[0_3px_12px_rgba(142,148,242,0.35)]"
                    : "text-brand-warmGray hover:text-brand-nearBlack"
                )}
              >
                Team Admin
              </button>
              <button
                type="button"
                onClick={() => handleRoleToggle("TEAM_MEMBER")}
                className={cn(
                  "px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.16em] transition-all duration-300 cursor-pointer",
                  selectedRole === "TEAM_MEMBER"
                    ? "bg-brand-softPeriwinkle text-white shadow-[0_3px_12px_rgba(142,148,242,0.35)]"
                    : "text-brand-warmGray hover:text-brand-nearBlack"
                )}
              >
                Team Member
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg border border-rose-400/50 bg-rose-50/70 text-rose-600 text-xs font-light italic">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          {/* Email */}
          <div className="flex flex-col relative group">
            <label
              htmlFor="email"
              className="text-brand-lavenderGrey group-focus-within:text-brand-softPeriwinkle transition-colors text-[11px] uppercase tracking-[0.2em] font-medium mb-1"
            >
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@trizen-ai.com"
              className="w-full bg-transparent border-b border-brand-lightGray py-2 focus:outline-none focus:border-brand-softPeriwinkle transition-colors text-base font-light text-brand-nearBlack rounded-none hover:border-brand-lavenderGrey placeholder-transparent"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col relative group">
            <label
              htmlFor="password"
              className="text-brand-lavenderGrey group-focus-within:text-brand-softPeriwinkle transition-colors text-[11px] uppercase tracking-[0.2em] font-medium mb-1"
            >
              Password *
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-transparent border-b border-brand-lightGray py-2 pr-10 focus:outline-none focus:border-brand-softPeriwinkle transition-colors text-base font-light text-brand-nearBlack rounded-none hover:border-brand-lavenderGrey placeholder-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 pr-1 flex items-center justify-center cursor-pointer"
              >
                {showPassword ? <EyeIcon /> : <EyeOffIcon />}
              </button>
            </div>
          </div>

          {/* Sub links */}
          <div className="flex items-center justify-between -mt-2 text-xs">
            <Link
              href="/admin/register"
              className="text-[10px] uppercase tracking-[0.18em] text-brand-lavenderGrey hover:text-brand-softPeriwinkle transition-colors font-medium"
            >
              Create Account
            </Link>
            <span className="text-[10px] uppercase tracking-[0.18em] text-brand-lavenderGrey">
              Secure Access
            </span>
          </div>

          {/* Submit Button with Signature Slide Hover */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-brand-softPeriwinkle text-white py-3.5 rounded-full text-xs font-semibold uppercase tracking-[0.2em] relative overflow-hidden group/btn shadow-[0_4px_20px_rgba(142,148,242,0.3)] hover:shadow-[0_6px_25px_rgba(159,160,255,0.45)] transition-all duration-500 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                "Sign In"
              )}
            </span>
            <div className="absolute inset-0 h-full w-0 bg-brand-wisteriaBlue transition-all duration-500 ease-out group-hover/btn:w-full z-0" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-brand-cream">
          <div className="w-8 h-8 rounded-full border-2 border-brand-mauve/30 border-t-brand-softPeriwinkle animate-spin" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
