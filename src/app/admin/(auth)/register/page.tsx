"use client";

import { useState, useCallback, Suspense, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { playfair } from "@/lib/fonts";
import { Check, X } from "lucide-react";
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

function RegisterPageContent() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("ADMIN");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  // Password Strength Validation Rules (min 16 chars + uppercase + lowercase + number + symbol)
  const passwordCriteria = useMemo(() => {
    return {
      minLength: password.length >= 16,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
    };
  }, [password]);

  const isPasswordValid = useMemo(() => {
    return (
      passwordCriteria.minLength &&
      passwordCriteria.hasUpper &&
      passwordCriteria.hasLower &&
      passwordCriteria.hasNumber &&
      passwordCriteria.hasSymbol
    );
  }, [passwordCriteria]);

  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!fullName.trim()) {
        setError("Please enter your full name.");
        return;
      }

      if (!email.trim()) {
        setError("Please enter a valid email address.");
        return;
      }

      // Strict 16+ char password validation
      if (!isPasswordValid) {
        const missing: string[] = [];
        if (!passwordCriteria.minLength) missing.push("minimum 16 characters");
        if (!passwordCriteria.hasUpper) missing.push("at least one uppercase letter (A-Z)");
        if (!passwordCriteria.hasLower) missing.push("at least one lowercase letter (a-z)");
        if (!passwordCriteria.hasNumber) missing.push("at least one number (0-9)");
        if (!passwordCriteria.hasSymbol) missing.push("at least one special symbol (!@#$%...)");

        setError(`Password requirements not met: ${missing.join(", ")}.`);
        return;
      }

      setError("");
      setLoading(true);

      try {
        // 1. Create account via backend with instant email confirmation
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            fullName: fullName.trim(),
            role,
          }),
        });

        const regData = await regRes.json();

        if (!regRes.ok || regData.error) {
          throw new Error(regData.error || "Failed to create account.");
        }

        // 2. Establish client session immediately
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (signInError) {
          logger.warn("Auto sign-in fallback", signInError);
        }

        toast.success("Account created successfully!");
        router.push("/admin/dashboard");
        router.refresh();
      } catch (err: unknown) {
        const rawMessage = err instanceof Error ? err.message : "Failed to create account.";
        logger.error("Registration error", err);
        if (
          rawMessage.toLowerCase().includes("already registered") ||
          rawMessage.toLowerCase().includes("already exists") ||
          rawMessage.toLowerCase().includes("user already registered")
        ) {
          setError(
            "An account with this email already exists. If you previously created an account, please sign in instead."
          );
        } else if (rawMessage.toLowerCase().includes("security purposes") || rawMessage.toLowerCase().includes("rate limit")) {
          setError(
            "Rate limit protection: Please wait a few seconds before creating another account."
          );
        } else {
          setError(rawMessage);
        }
      } finally {
        setLoading(false);
      }
    },
    [fullName, email, password, role, isPasswordValid, passwordCriteria, router, supabase]
  );

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-cream text-brand-nearBlack overflow-hidden px-6">
      <div className="w-full max-w-md mx-auto my-auto animate-in fade-in duration-700">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className={`text-4xl sm:text-5xl tracking-tight text-brand-nearBlack mb-2 ${playfair.className}`}>
            Create <span className="italic font-normal">Account.</span>
          </h1>
          <p className="text-brand-warmGray text-xs sm:text-sm font-light tracking-wide mb-4">
            Join the TrizenAI photo sharing team.
          </p>

          {/* Clean Editorial Role Pill Switcher */}
          <div className="flex justify-center">
            <div className="inline-flex p-1.5 rounded-full bg-white border border-brand-lightGray shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
              <button
                type="button"
                onClick={() => setRole("ADMIN")}
                className={cn(
                  "px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.16em] transition-all duration-300 cursor-pointer",
                  role === "ADMIN"
                    ? "bg-brand-softPeriwinkle text-white shadow-[0_3px_12px_rgba(142,148,242,0.35)]"
                    : "text-brand-warmGray hover:text-brand-nearBlack"
                )}
              >
                Team Admin
              </button>
              <button
                type="button"
                onClick={() => setRole("TEAM_MEMBER")}
                className={cn(
                  "px-6 py-2 rounded-full text-xs font-semibold uppercase tracking-[0.16em] transition-all duration-300 cursor-pointer",
                  role === "TEAM_MEMBER"
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
          <div className="mb-4 p-3 rounded-lg border border-rose-400/50 bg-rose-50/70 text-rose-600 text-xs font-light italic leading-relaxed">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {/* Full Name */}
          <div className="flex flex-col relative group">
            <label
              htmlFor="fullName"
              className="text-brand-lavenderGrey group-focus-within:text-brand-softPeriwinkle transition-colors text-[11px] uppercase tracking-[0.2em] font-medium mb-1"
            >
              Full Name *
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Arjun Mehta"
              className="w-full bg-transparent border-b border-brand-lightGray py-2 focus:outline-none focus:border-brand-softPeriwinkle transition-colors text-base font-light text-brand-nearBlack rounded-none hover:border-brand-lavenderGrey placeholder-transparent"
            />
          </div>

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
              placeholder="arjun@trizen-ai.com"
              className="w-full bg-transparent border-b border-brand-lightGray py-2 focus:outline-none focus:border-brand-softPeriwinkle transition-colors text-base font-light text-brand-nearBlack rounded-none hover:border-brand-lavenderGrey placeholder-transparent"
            />
          </div>

          {/* Password (16+ chars requirement) */}
          <div className="flex flex-col relative group">
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="password"
                className="text-brand-lavenderGrey group-focus-within:text-brand-softPeriwinkle transition-colors text-[11px] uppercase tracking-[0.2em] font-medium"
              >
                Password (min 16 chars) *
              </label>
              <span className={cn(
                "text-[10px] uppercase tracking-wider font-semibold transition-colors",
                isPasswordValid ? "text-emerald-600" : "text-brand-lavenderGrey"
              )}>
                {password.length}/16+
              </span>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                required
                placeholder="••••••••••••••••"
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

            {/* Live Password Requirements Checklist */}
            {(isPasswordFocused || password.length > 0) && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-white/80 border border-brand-lightGray/70 text-[11px] space-y-1 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
                  <div className={cn("flex items-center gap-1", passwordCriteria.minLength ? "text-emerald-600 font-medium" : "text-gray-400")}>
                    {passwordCriteria.minLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>16+ Characters</span>
                  </div>
                  <div className={cn("flex items-center gap-1", passwordCriteria.hasUpper ? "text-emerald-600 font-medium" : "text-gray-400")}>
                    {passwordCriteria.hasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>Uppercase (A-Z)</span>
                  </div>
                  <div className={cn("flex items-center gap-1", passwordCriteria.hasLower ? "text-emerald-600 font-medium" : "text-gray-400")}>
                    {passwordCriteria.hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>Lowercase (a-z)</span>
                  </div>
                  <div className={cn("flex items-center gap-1", passwordCriteria.hasNumber ? "text-emerald-600 font-medium" : "text-gray-400")}>
                    {passwordCriteria.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>Number (0-9)</span>
                  </div>
                  <div className={cn("flex items-center gap-1 col-span-2", passwordCriteria.hasSymbol ? "text-emerald-600 font-medium" : "text-gray-400")}>
                    {passwordCriteria.hasSymbol ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>Special Symbol (!@#$%...)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button with Signature Slide Hover */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 bg-brand-softPeriwinkle text-white py-3.5 rounded-full text-xs font-semibold uppercase tracking-[0.2em] relative overflow-hidden group/btn shadow-[0_4px_20px_rgba(142,148,242,0.3)] hover:shadow-[0_6px_25px_rgba(159,160,255,0.45)] transition-all duration-500 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                "Create Account"
              )}
            </span>
            <div className="absolute inset-0 h-full w-0 bg-brand-wisteriaBlue transition-all duration-500 ease-out group-hover/btn:w-full z-0" />
          </button>
        </form>

        <div className="mt-4 text-center text-xs">
          <span className="text-brand-warmGray">Already have an account? </span>
          <Link
            href="/admin/login"
            className="uppercase tracking-wider text-brand-softPeriwinkle font-semibold hover:underline text-[11px]"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-brand-cream">
          <div className="w-8 h-8 rounded-full border-2 border-brand-mauve/30 border-t-brand-softPeriwinkle animate-spin" />
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
