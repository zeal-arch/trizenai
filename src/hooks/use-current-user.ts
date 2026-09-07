"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

export interface CurrentUserProfile {
  id: string;
  authId?: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: UserRole;
}

const STORAGE_KEY = "current_user_profile";

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = useCallback(async () => {
    // 1. Try loading cached user profile from session storage for instant render
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (cached) {
        try {
          setUser(JSON.parse(cached));
          setLoading(false);
        } catch {
          // ignore cache parse error
        }
      }
    }

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      let authUser = session?.user;
      if (!authUser) {
        const { data } = await supabase.auth.getUser();
        authUser = data?.user ?? undefined;
      }

      if (authUser) {
        const metadataRole = (authUser.user_metadata?.role as UserRole) || "TEAM_MEMBER";
        const metadataName =
          authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User";
        const metadataAvatar = authUser.user_metadata?.avatar_url || "/image/user/user-01.png";

        // Query public.users to get the exact role from database
        const { data: dbUser } = await supabase
          .from("users")
          .select("id, email, fullName, role, avatarUrl")
          .or(`id.eq.${authUser.id},email.eq.${authUser.email?.toLowerCase().trim()}`)
          .maybeSingle();

        const profile: CurrentUserProfile = {
          id: dbUser?.id || authUser.id,
          authId: authUser.id,
          email: authUser.email || "",
          fullName: dbUser?.fullName || metadataName,
          avatarUrl: dbUser?.avatarUrl || metadataAvatar,
          role: (dbUser?.role as UserRole) || metadataRole,
        };

        setUser(profile);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        }
      } else {
        setUser(null);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // keep whatever cached state exists
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    role: user?.role || ("TEAM_MEMBER" as UserRole),
    isAdmin: user?.role === "ADMIN",
    isTeamMember: user?.role === "TEAM_MEMBER",
    loading,
    refetch: fetchUser,
  };
}
