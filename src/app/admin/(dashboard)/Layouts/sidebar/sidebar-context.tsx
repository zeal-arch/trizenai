"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { createContext, useContext, useState } from "react";

type SidebarState = "expanded" | "collapsed";

type SidebarContextType = {
  state: SidebarState;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  isCollapsed: boolean;
  toggleCollapsed: () => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within a SidebarProvider");
  }
  return context;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [desktopOpen, setDesktopOpen] = useState(defaultOpen);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const isOpen = isMobile ? mobileOpen : desktopOpen;

  const setIsOpen = (open: boolean) => {
    if (isMobile) {
      setMobileOpen(open);
    } else {
      setDesktopOpen(open);
    }
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen((prev) => !prev);
    } else {
      setDesktopOpen((prev) => !prev);
    }
  };

  function toggleCollapsed() {
    if (isMobile) return;
    setIsCollapsed((prev) => !prev);
  }

  return (
    <SidebarContext.Provider
      value={{
        state: isOpen ? "expanded" : "collapsed",
        isOpen,
        setIsOpen,
        isMobile,
        toggleSidebar,
        isCollapsed: isMobile ? false : isCollapsed,
        toggleCollapsed,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
