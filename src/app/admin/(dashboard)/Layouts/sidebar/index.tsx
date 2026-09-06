"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NAV_DATA } from "./data";
import { ArrowLeftIcon, ChevronUp } from "@/admin/assets/icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";

const LARGE_DESKTOP_QUERY = "(min-width: 1440px)";
const DESKTOP_WIDTH = {
  expanded: 170,
  collapsed: 60,
};
const LARGE_DESKTOP_WIDTH = {
  expanded: 200,
  collapsed: 72,
};

type SidebarSectionData = (typeof NAV_DATA)[number];
type SidebarItem = SidebarSectionData["items"][number];

export function Sidebar() {
  const pathname = usePathname();
  const sidebar = useSidebarContext();
  const isLargeDesktop = useIsLargeDesktop();
  const { expandedItems, toggleExpanded, setExpanded } = useExpandedSections();

  useEffect(() => {
    const activeParent = findParentItemByPath(NAV_DATA, pathname);
    if (activeParent) setExpanded(activeParent);
  }, [pathname, setExpanded]);

  const widths = isLargeDesktop ? LARGE_DESKTOP_WIDTH : DESKTOP_WIDTH;
  const computedWidth = useMemo(() => {
    if (sidebar.isMobile) {
      return sidebar.isOpen ? "100%" : "0";
    }

    if (!sidebar.isOpen) return "0";
    return sidebar.isCollapsed ? widths.collapsed : widths.expanded;
  }, [sidebar.isMobile, sidebar.isOpen, sidebar.isCollapsed, widths]);

  return (
    <>
      {/* Mobile Overlay */}
      {sidebar.isMobile && sidebar.isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 transition-opacity duration-300"
          onClick={() => sidebar.setIsOpen(false)}
        />
      )}

      <aside
        data-width={computedWidth}
        className={cn(
          "group/sidebar overflow-hidden border-r border-[#EBE8E3] dark:border-white/10 bg-[#FAF9F7] dark:bg-gray-dark transition-[width] duration-500 ease-in-out",
          "w-(--sidebar-width,250px)",
          sidebar.isMobile ? "fixed bottom-0 top-0 z-30" : "h-full",
        )}
        style={{ "--sidebar-width": computedWidth } as React.CSSProperties}
        aria-label="Main navigation"
        inert={sidebar.isMobile && !sidebar.isOpen ? true : undefined}
      >
        <div
          className={cn(
            "flex h-full flex-col overflow-hidden py-5 pl-4 pr-2",
            !sidebar.isMobile && sidebar.isCollapsed && "pl-3 pr-1",
          )}
        >
          <div className="relative pr-4.5">
            {sidebar.isMobile && (
              <button
                onClick={sidebar.toggleSidebar}
                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
              >
                <span className="sr-only">Close Menu</span>

                <ArrowLeftIcon className="ml-auto size-5 text-gray-500 dark:text-gray-300" />
              </button>
            )}

            {!sidebar.isMobile && (
              <button
                onClick={sidebar.toggleCollapsed}
                aria-pressed={sidebar.isCollapsed}
                className="ml-auto flex size-7 items-center justify-center rounded-full text-gray-500 hover:text-black hover:bg-gray-200/80 dark:text-gray-200 dark:hover:text-black dark:hover:bg-gray-300/80"
              >
                <span className="sr-only">Toggle collapse</span>
                <ChevronUp
                  className={cn(
                    "h-4 w-4 transition-transform",
                    sidebar.isCollapsed ? "rotate-90" : "-rotate-90",
                  )}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="mt-4 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar scrollbar-hide pr-2 min-w-0 min-[850px]:mt-6">
            {NAV_DATA.map((section) => (
              <SidebarSection
                key={section.label}
                section={section}
                pathname={pathname}
                isCollapsed={sidebar.isCollapsed}
                isMobile={sidebar.isMobile}
                expandedItems={expandedItems}
                onToggleSection={toggleExpanded}
              />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}

function useIsLargeDesktop() {
  const [isLargeDesktop, setIsLargeDesktop] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const query = window.matchMedia(LARGE_DESKTOP_QUERY);
    setIsLargeDesktop(query.matches);

    const handler = (event: MediaQueryListEvent) => setIsLargeDesktop(event.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  return isLargeDesktop;
}

function useExpandedSections() {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = useCallback((title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));
  }, []);

  const setExpanded = useCallback((title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? prev : [title]));
  }, []);

  return { expandedItems, toggleExpanded, setExpanded } as const;
}

function findParentItemByPath(sections: typeof NAV_DATA, path: string) {
  for (const section of sections) {
    for (const item of section.items) {
      // Check if item has a direct url match
      if (item.url === path) {
        return item.title;
      }
      // Check nested items
      if (item.items && item.items.length > 0) {
        const hasMatch = item.items.some(
          (sub: { url?: string }) => sub.url === path,
        );
        if (hasMatch) {
          return item.title;
        }
      }
    }
  }
  return null;
}

function SidebarSection({
  section,
  pathname,
  isCollapsed,
  isMobile,
  expandedItems,
  onToggleSection,
}: {
  section: SidebarSectionData;
  pathname: string;
  isCollapsed: boolean;
  isMobile: boolean;
  expandedItems: string[];
  onToggleSection: (title: string) => void;
}) {
  return (
    <div className="mb-6">
      <h3
        className={cn(
          "mb-3 text-[10px] font-semibold uppercase tracking-wider text-dark-4 dark:text-gray-400 px-1 select-none",
          !isMobile && isCollapsed && "sr-only",
        )}
      >
        {section.label}
      </h3>

      <ul className="space-y-1.5">
        {section.items.map((item) => (
          <li key={item.title}>
            {item.items.length ? (
              <CollapsibleItem
                item={item}
                pathname={pathname}
                isCollapsed={isCollapsed}
                isMobile={isMobile}
                expandedItems={expandedItems}
                onToggleSection={onToggleSection}
              />
            ) : (
              <SimpleItem
                item={item}
                pathname={pathname}
                isCollapsed={isCollapsed}
                isMobile={isMobile}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CollapsibleItem({
  item,
  pathname,
  isCollapsed,
  isMobile,
  expandedItems,
  onToggleSection,
}: {
  item: SidebarItem;
  pathname: string;
  isCollapsed: boolean;
  isMobile: boolean;
  expandedItems: string[];
  onToggleSection: (title: string) => void;
}) {
  const isActive = item.items.some(({ url }) => url === pathname);
  const isExpanded = expandedItems.includes(item.title);

  return (
    <div>
      <MenuItem
        className={cn(
          "flex items-center gap-2 py-2",
          !isMobile && isCollapsed && "justify-center px-0",
        )}
        isActive={isActive}
        ariaExpanded={isExpanded}
        onClick={() => !isCollapsed && onToggleSection(item.title)}
      >
        <item.icon className="size-4 shrink-0" aria-hidden="true" />

        <span className={cn(!isMobile && isCollapsed && "hidden")}>
          {item.title}
        </span>

        {!isCollapsed && (
          <ChevronUp
            className={cn(
              "ml-auto rotate-180 transition-transform duration-200",
              isExpanded && "rotate-0",
            )}
            aria-hidden="true"
          />
        )}
      </MenuItem>

      {!isCollapsed && (
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.ul
              key={item.title}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="ml-9 mr-0 space-y-1.5 pb-[15px] pr-0 pt-2"
              role="menu"
            >
              {item.items.map((subItem) => (
                <li key={subItem.title} role="none">
                  <MenuItem
                    as="link"
                    href={subItem.url}
                    isActive={pathname === subItem.url}
                  >
                    <span>{subItem.title}</span>
                  </MenuItem>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function SimpleItem({
  item,
  pathname,
  isCollapsed,
  isMobile,
}: {
  item: SidebarItem;
  pathname: string;
  isCollapsed: boolean;
  isMobile: boolean;
}) {
  const isActive = pathname === item.url;

  return (
    <MenuItem
      className={cn(
        "flex items-center gap-2 py-2",
        !isMobile && isCollapsed && "justify-center px-0",
      )}
      as="link"
      href={item.url}
      isActive={isActive}
    >
      <item.icon className="size-4 shrink-0" aria-hidden="true" />
      <span className={cn(!isMobile && isCollapsed && "hidden")}>
        {item.title}
      </span>
    </MenuItem>
  );
}
