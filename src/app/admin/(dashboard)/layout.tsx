import "@/styles/satoshi.css";
import "@/styles/style.css";
import "@/styles/layout-utilities.css";

import type { Metadata } from "next";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";
import { Header } from "@/admin/(dashboard)/Layouts/header";
import { SidebarWrapper } from "./_components/sidebar-wrapper";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    template: "%s | Admin Dashboard",
    default: "Admin Dashboard",
  },
  description: "Admin dashboard section integrated into the main Next.js app.",
};

export default function AdminLayout({ children }: PropsWithChildren) {
  return (
    <Providers>
      <div data-admin-layout className="font-satoshi flex h-screen w-full overflow-hidden">
        <SidebarWrapper />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden dark:text-gray-300">
          <Header />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto p-3 md:p-4 2xl:p-6">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  );
}
