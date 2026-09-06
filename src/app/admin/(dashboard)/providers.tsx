"use client";

import { SidebarProvider } from "@/admin/(dashboard)/Layouts/sidebar/sidebar-context";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add("admin-font-scale");
    return () => {
      document.body.classList.remove("admin-font-scale");
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <SidebarProvider>
        {children}
        <Toaster />
      </SidebarProvider>
    </ThemeProvider>
  );
}
