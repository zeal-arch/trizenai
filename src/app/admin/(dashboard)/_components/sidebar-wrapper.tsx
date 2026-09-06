"use client";

import dynamic from "next/dynamic";

const Sidebar = dynamic(() => import("@/admin/(dashboard)/Layouts/sidebar").then(m => m.Sidebar), { 
  ssr: false,
  loading: () => <div className="w-[200px] h-full bg-[#FAF9F7] dark:bg-gray-dark border-r border-[#EBE8E3] dark:border-white/5" /> 
});

export function SidebarWrapper() {
  return <Sidebar />;
}
