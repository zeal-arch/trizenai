"use client";

import { useState, useCallback, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { playfair } from "@/lib/fonts";
import type { UserRole } from "@/types";

const EyeIcon = ({
  className = "h-5 w-5 text-brand-lavenderGrey group-focus-within:text-brand-softPeriwinkle transition-colors",
}: {
  className?: string;
}) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const EyeOffIcon = ({
  className = "h-5 w-5 text-brand-lavenderGrey group-focus-within:text-brand-softPeriwinkle transition-colors",
}: {
  className?: string;
}) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
    />
  </svg>
);

interface InputFieldProps {
  id: string;
  type: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
}

const InputField = ({
  id,
  type,
  label,
  value,
  onChange,
  placeholder,
  rightIcon,
  onRightIconClick,
}: InputFieldProps) => (
  <div className="flex flex-col relative group">
    <label
      htmlFor={id}
      className="text-brand-lavenderGrey group-focus-within:text-brand-softPeriwinkle transition-colors text-[11px] uppercase tracking-[0.2em] font-medium mb-3"
    >
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        required
        suppressHydrationWarning
        className="w-full bg-transparent border-b py-3 focus:outline-none focus:border-brand-softPeriwinkle transition-colors text-lg lg:text-xl font-light rounded-none placeholder-transparent border-brand-lightGray text-brand-nearBlack hover:border-brand-lavenderGrey"
        placeholder={placeholder}
      />
      {rightIcon && (
        <button
          type="button"
          onClick={onRightIconClick}
          suppressHydrationWarning
          className="absolute inset-y-0 right-0 pr-2 flex items-center justify-center transition-colors"
        >
          {rightIcon}
        </button>
      )}
    </div>
  </div>
);

function RegisterPageContent() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("ADMIN");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleRegister = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!fullName.trim() || !email.trim() || password.length < 6) {
        setError("Please fill in all fields with a valid password (min 6 characters).");
        return;
      }

      setError("");
      setLoading(true);

      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role,
            },
          },
        });

        if (authError) throw authError;

        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: authData.user?.id,
            email,
            fullName,
            role,
          }),
        });

        toast.success("Account created successfully!");
        router.push("/admin/dashboard");
        router.refresh();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create account.";
        logger.error("Registration error", err);
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [fullName, email, password, role, router, supabase]
  );

  return (
    <div className="min-h-screen w-full flex bg-brand-cream items-center justify-center py-12 px-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="mb-10 text-center">
          <h1 className={`text-5xl tracking-tight mb-4 text-brand-nearBlack ${playfair.className}`}>
            Create <span className="italic opacity-90">Account.</span>
          </h1>
          <p className="text-brand-warmGray text-sm md:text-base font-light tracking-wide">
            Join the TrizenAI photo sharing team.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 border border-rose-400/60 bg-rose-50/50 text-rose-500/90 text-sm italic font-light">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="flex flex-col gap-8">
          <InputField
            id="fullName"
            type="text"
            label="Full Name *"
            value={fullName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
            placeholder="Arjun Mehta"
          />

          <InputField
            id="email"
            type="email"
            label="Email Address *"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            placeholder="arjun@trizen-ai.com"
          />

          <InputField
            id="password"
            type={showPassword ? "text" : "password"}
            label="Password (min 6 chars) *"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            placeholder="••••••••"
            rightIcon={showPassword ? <EyeIcon /> : <EyeOffIcon />}
            onRightIconClick={() => setShowPassword(!showPassword)}
          />

          {/* Role selector in RAYVOY pill style */}
          <div className="flex flex-col gap-3">
            <label className="text-brand-lavenderGrey text-[11px] uppercase tracking-[0.2em] font-medium">
              Account Role *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("ADMIN")}
                className={cn(
                  "py-3 px-4 rounded-full text-xs font-semibold uppercase tracking-[0.15em] border transition-all duration-300 cursor-pointer text-center",
                  role === "ADMIN"
                    ? "bg-brand-softPeriwinkle text-white border-brand-softPeriwinkle shadow-[0_4px_15px_rgba(142,148,242,0.3)]"
                    : "bg-white text-brand-nearBlack border-brand-lightGray hover:border-brand-lavenderGrey"
                )}
              >
                Admin / Lead
              </button>
              <button
                type="button"
                onClick={() => setRole("TEAM_MEMBER")}
                className={cn(
                  "py-3 px-4 rounded-full text-xs font-semibold uppercase tracking-[0.15em] border transition-all duration-300 cursor-pointer text-center",
                  role === "TEAM_MEMBER"
                    ? "bg-brand-softPeriwinkle text-white border-brand-softPeriwinkle shadow-[0_4px_15px_rgba(142,148,242,0.3)]"
                    : "bg-white text-brand-nearBlack border-brand-lightGray hover:border-brand-lavenderGrey"
                )}
              >
                Team Member
              </button>
            </div>
          </div>

          <div className="w-full flex justify-center mt-4">
            <button
              type="submit"
              disabled={loading}
              suppressHydrationWarning
              className="w-full bg-brand-softPeriwinkle text-white transition-all duration-500 px-12 py-4 rounded-full text-xs font-semibold uppercase tracking-[0.2em] relative overflow-hidden group/btn shadow-[0_4px_20px_rgba(142,148,242,0.3)] hover:shadow-[0_6px_25px_rgba(159,160,255,0.4)] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="relative z-10 flex items-center justify-center gap-4">
                {loading ? "Creating Account..." : "Create Account"}
              </span>
              <div className="absolute inset-0 h-full w-0 bg-brand-wisteriaBlue transition-all duration-500 ease-out group-hover/btn:w-full z-0"></div>
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-xs">
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
        <div className="min-h-screen flex items-center justify-center bg-brand-cream">
          <div className="w-8 h-8 rounded-full border-2 border-brand-mauve/30 border-t-brand-softPeriwinkle animate-spin" />
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
