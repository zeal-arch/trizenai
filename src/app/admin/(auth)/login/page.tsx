"use client";

import { useState, useCallback, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { logger } from "@/lib/logger";
import { playfair } from "@/lib/fonts";

// Google Icon
const GoogleIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19.8055 10.2292C19.8055 9.55057 19.7489 8.86829 19.6292 8.19873H10.2002V12.0492H15.6014C15.3773 13.2911 14.6571 14.3898 13.6025 15.0879V17.5866H16.8264C18.7132 15.845 19.8055 13.2728 19.8055 10.2292Z"
      fill="#4285F4"
    />
    <path
      d="M10.2002 20C12.9512 20 15.2709 19.1045 16.8297 17.5866L13.6058 15.0879C12.7058 15.6979 11.5488 16.0433 10.2034 16.0433C7.55005 16.0433 5.28974 14.2832 4.50974 11.9169H1.19824V14.4927C2.80405 17.6894 6.30986 20 10.2002 20Z"
      fill="#34A853"
    />
    <path
      d="M4.50652 11.9169C4.07431 10.675 4.07431 9.33009 4.50652 8.08817V5.51233H1.19502C-0.259766 8.39447 -0.259766 11.6106 1.19502 14.4927L4.50652 11.9169Z"
      fill="#FBBC04"
    />
    <path
      d="M10.2002 3.95675C11.625 3.936 13.0022 4.47293 14.0467 5.45674L16.8966 2.60673C15.1887 0.990637 12.9367 0.0895352 10.2002 0.11228C6.30986 0.11228 2.80405 2.42283 1.19824 5.51235L4.50974 8.08819C5.28652 5.71848 7.54682 3.95675 10.2002 3.95675Z"
      fill="#EA4335"
    />
  </svg>
);

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

const REDIRECT_URL = "/admin/dashboard";

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

function LoginPageContent() {
  // Default dummy credentials for development convenience
  const [email, setEmail] = useState("admin@trizen-ai.com");
  const [password, setPassword] = useState("AdminPass@2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleGoogleSignIn = useCallback(async () => {
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/admin/dashboard`,
        },
      });
      if (error) {
        toast.error("Sign-In failed", { description: error.message });
        setGoogleLoading(false);
      }
    } catch (error) {
      logger.error("Google sign-in error", error);
      setGoogleLoading(false);
    }
  }, [supabase]);

  const handleLogin = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      setError("");
      setLoading(true);

      try {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setError(authError.message || "Invalid login credentials. Please try again.");
          setLoading(false);
          return;
        }

        toast.success("Welcome back!");
        router.push(REDIRECT_URL);
        router.refresh();
      } catch (err) {
        logger.error("Login fetch error", err);
        setError("Unexpected error during login. Please try again.");
        setLoading(false);
      }
    },
    [email, password, router, supabase]
  );

  return (
    <div className="min-h-screen w-full flex bg-brand-cream items-center justify-center py-12 px-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="mb-12 text-center">
          <h1 className={`text-5xl tracking-tight mb-4 text-brand-nearBlack ${playfair.className}`}>
            Welcome <span className="italic opacity-90">Back.</span>
          </h1>
          <p className="text-brand-warmGray text-sm md:text-base font-light tracking-wide">
            Please sign in to access the TrizenAI photo portal.
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 border border-rose-400/60 bg-rose-50/50 text-rose-500/90 text-sm italic font-light">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-10">
          <InputField
            id="email"
            type="email"
            label="Email Address *"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setEmail(e.target.value)
            }
            placeholder="name@gmail.com"
          />

          <InputField
            id="password"
            type={showPassword ? "text" : "password"}
            label="Password *"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setPassword(e.target.value)
            }
            placeholder="••••••••"
            rightIcon={showPassword ? <EyeIcon /> : <EyeOffIcon />}
            onRightIconClick={() => setShowPassword(!showPassword)}
          />

          <div className="flex items-center justify-between -mt-4 text-xs">
            <Link
              href="/admin/register"
              className="uppercase tracking-wider text-brand-lavenderGrey hover:text-brand-softPeriwinkle transition-colors text-[11px]"
            >
              Create Account
            </Link>
            <span className="text-[11px] uppercase tracking-wider text-brand-lavenderGrey">
              Secure Access
            </span>
          </div>

          <div className="w-full flex justify-center mt-2">
            <button
              type="submit"
              disabled={loading}
              suppressHydrationWarning
              className="w-full bg-brand-softPeriwinkle text-white transition-all duration-500 px-12 py-4 rounded-full text-xs font-semibold uppercase tracking-[0.2em] relative overflow-hidden group/btn shadow-[0_4px_20px_rgba(142,148,242,0.3)] hover:shadow-[0_6px_25px_rgba(159,160,255,0.4)] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className="relative z-10 flex items-center justify-center gap-4">
                {loading ? "Signing in..." : "Sign In"}
              </span>
              <div className="absolute inset-0 h-full w-0 bg-brand-wisteriaBlue transition-all duration-500 ease-out group-hover/btn:w-full z-0"></div>
            </button>
          </div>
        </form>

        <div className="my-10 flex items-center gap-4">
          <div className="flex-1 border-t border-brand-lightGray" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-brand-lavenderGrey">
            Or continue with
          </span>
          <div className="flex-1 border-t border-brand-lightGray" />
        </div>

        <div className="w-full flex justify-center">
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            suppressHydrationWarning
            className="flex items-center justify-center gap-3 w-full border border-brand-lightGray px-6 py-4 rounded-full hover:border-brand-softPeriwinkle hover:text-brand-softPeriwinkle transition-colors disabled:opacity-50 disabled:cursor-not-allowed group text-brand-nearBlack bg-white cursor-pointer shadow-xs"
          >
            <GoogleIcon />
            <span className="text-xs uppercase tracking-[0.15em] transition-colors font-medium">
              Sign in with Google
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-brand-cream">
          <div className="w-8 h-8 rounded-full border-2 border-brand-mauve/30 border-t-brand-softPeriwinkle animate-spin" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
