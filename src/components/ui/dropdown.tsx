"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  Dispatch,
  SetStateAction,
  type PropsWithChildren,
} from "react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { cn } from "@/lib/utils";

type DropdownContextType = {
  isOpen: boolean;
  handleOpen: () => void;
  handleClose: () => void;
};

const DropdownContext = createContext<DropdownContextType | null>(null);

function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error("useDropdownContext must be used within a Dropdown");
  }
  return context;
}

type DropdownProps = {
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
};

export function Dropdown({ children, isOpen, setIsOpen }: DropdownProps) {
  const triggerRef = useRef<HTMLElement>(null);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      handleClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement;
    } else {
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 0);
    }
  }, [isOpen]);

  function handleClose() {
    setIsOpen(false);
  }

  function handleOpen() {
    setIsOpen(true);
  }

  return (
    <DropdownContext.Provider value={{ isOpen, handleOpen, handleClose }}>
      <div className="relative" onKeyDown={handleKeyDown}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

type DropdownContentProps = {
  align?: "start" | "end" | "center";
  className?: string;
  children: React.ReactNode;
};

export function DropdownContent({
  children,
  align = "center",
  className,
}: DropdownContentProps) {
  const { isOpen, handleClose } = useDropdownContext();

  const contentRef = useClickOutside<HTMLDivElement>(() => {
    if (isOpen) handleClose();
  });

  if (!isOpen) return null;

  return (
    <div
      ref={contentRef}
      className={cn(
        "fade-in-0 zoom-in-95 pointer-events-auto absolute z-[9999] mt-2 min-w-32 origin-top-right rounded-lg",
        {
          "animate-in right-0": align === "end",
          "left-0": align === "start",
          "left-1/2 -translate-x-1/2": align === "center",
        },
        className,
      )}
    >
      {children}
    </div>
  );
}

type DropdownTriggerProps = React.HTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function DropdownTrigger({ children, className }: DropdownTriggerProps) {
  const { handleOpen, isOpen } = useDropdownContext();

  return (
    <button
      className={className}
      onClick={handleOpen}
      aria-expanded={isOpen ? "true" : "false"}
      aria-haspopup="menu"
      data-state={isOpen ? "open" : "closed"}
    >
      {children}
    </button>
  );
}

export function DropdownClose({ children }: PropsWithChildren) {
  const { handleClose } = useDropdownContext();

  return <div onClick={handleClose}>{children}</div>;
}
