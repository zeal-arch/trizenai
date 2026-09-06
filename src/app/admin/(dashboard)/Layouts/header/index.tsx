"use client";

import { SearchIcon, MenuIcon } from "@/admin/assets/icons";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";

export function Header() {
  const { toggleSidebar } = useSidebarContext();

  return (
    <header className="sticky top-0 z-10 flex min-w-0 shrink-0 items-center justify-between gap-2 overflow-visible bg-[#FAF9F7] px-3 py-2 border-b border-[#EBE8E3] shadow-xs dark:bg-gray-dark dark:border-white/10 md:px-4">
      <button
        onClick={toggleSidebar}
        className="rounded-lg border border-[#EBE8E3] p-1.5 text-dark-5 hover:text-dark dark:border-white/10 dark:text-gray-400 dark:hover:text-white dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A] lg:hidden transition"
      >
        <MenuIcon className="h-4 w-4" />
        <span className="sr-only">Toggle Sidebar</span>
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
        <div className="relative w-full max-w-[220px]">
          <input
            type="search"
            placeholder="Search..."
            className="flex w-full items-center gap-2 rounded-full border border-[#EBE8E3] bg-gray-2 py-1.5 pl-8 pr-3 text-xs outline-none focus-visible:border-primary dark:border-white/10 dark:bg-dark-2 dark:text-white dark:focus-visible:border-primary transition"
          />
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dark-5 dark:text-gray-400" />
        </div>

        <ThemeToggleSwitch />

        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}
