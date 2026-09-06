"use client";

import {
  LogOutIcon,
  SettingsIcon,
  UserInfoIcon as UserIcon,
  ChevronUpIcon,
} from "@/admin/assets/icons";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { SmartImage } from "@/components/ui/SmartImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

type UserData = {
  name: string;
  email: string;
  img: string;
};

const DEFAULT_USER: UserData = {
  name: "User",
  email: "",
  img: "/image/user/user-03.png",
};

export function UserInfo() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<UserData>(DEFAULT_USER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      // 1. Instantly load from cache if available
      const cachedProfile = sessionStorage.getItem("admin_user_profile");
      if (cachedProfile) {
        try {
          setUser(JSON.parse(cachedProfile));
          setLoading(false);
        } catch {
          // ignore parse errors
        }
      }

      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        let authUser = session?.user;
        if (!authUser) {
          const { data } = await supabase.auth.getUser();
          authUser = data?.user ?? undefined;
        }

        if (authUser) {
          const newUserData: UserData = {
            name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
            email: authUser.email || "",
            img: authUser.user_metadata?.avatar_url || DEFAULT_USER.img,
          };
          
          setUser(newUserData);
          sessionStorage.setItem("admin_user_profile", JSON.stringify(newUserData));

          // Sync authenticated user (including Google OAuth users) to public.users
          fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: authUser.id,
              email: authUser.email,
              fullName: newUserData.name,
              avatarUrl: newUserData.img,
              role: authUser.user_metadata?.role || "ADMIN",
            }),
          }).catch(() => {
            // non-blocking sync
          });
        }
      } catch (err) {
        logger.error('Unexpected error in UserInfo header fetch:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      sessionStorage.removeItem("admin_user_profile");
      await supabase.auth.signOut();

      toast.success("Logged out successfully", {
        description: "You have been signed out from this device.",
      });

      setIsOpen(false);
      router.push("/admin/login");
    } catch {
      toast.error("Logout failed", {
        description: "An error occurred while logging out.",
      });
    }
  };

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger className="rounded align-middle outline-none ring-primary ring-offset-2 focus-visible:ring-1 dark:ring-offset-gray-dark">
        <span className="sr-only">My Account</span>

        <figure className="flex items-center gap-2">
          {loading ? (
            <div className="size-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-500" />
          ) : (
            <SmartImage
              src={user.img}
              className="size-8 rounded-full object-cover"
              alt={`Avatar of ${user.name}`}
              role="presentation"
              width={200}
              height={200}
            />
          )}
          <figcaption className="flex items-center gap-1 text-sm font-medium text-dark dark:text-dark-6 max-[1024px]:sr-only">
            <span>{loading ? "..." : user.name}</span>

            <ChevronUpIcon
              aria-hidden
              className={cn(
                "h-4 w-4 rotate-180 transition-transform",
                isOpen && "rotate-0",
              )}
              strokeWidth={1.5}
            />
          </figcaption>
        </figure>
      </DropdownTrigger>

      <DropdownContent
        className="border border-[#EBE8E3] bg-white shadow-xl dark:border-white/15 dark:bg-gray-dark min-[280px]:min-w-80 rounded-2xl"
        align="end"
      >
        <h2 className="sr-only">User information</h2>

        <figure className="flex items-center gap-2.5 px-4 py-3">
          <SmartImage
            src={user.img}
            className="size-10 rounded-full object-cover"
            alt={`Avatar for ${user.name}`}
            role="presentation"
            width={200}
            height={200}
          />

          <figcaption className="space-y-0.5 text-sm font-medium">
            <div className="leading-tight text-dark dark:text-white">
              {user.name}
            </div>

            <div className="text-xs leading-tight text-gray-6">{user.email}</div>
          </figcaption>
        </figure>

        <hr className="border-[#EBE8E3] dark:border-white/15" />

        <div className="p-1.5 text-sm text-dark-4 dark:text-dark-8 *:cursor-pointer">
          <Link
            href={"/admin/profile"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <UserIcon />
            <span className="font-medium">View profile</span>
          </Link>

          <Link
            href={"/admin/profile"}
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 hover:bg-gray-2 hover:text-gray-500 dark:hover:bg-dark-3 dark:hover:text-white"
          >
            <SettingsIcon />
            <span className="font-medium">Account Settings</span>
          </Link>
        </div>

        <hr className="border-[#EBE8E3] dark:border-white/15" />

        <div className="p-1.5 text-sm text-dark-4 dark:text-dark-8">
          <button
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 hover:bg-gray-2 hover:text-dark dark:hover:bg-dark-3 dark:hover:text-gray-200"
            onClick={handleLogout}
          >
            <LogOutIcon />
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
