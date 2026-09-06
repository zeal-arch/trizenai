import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import Link from "next/link";
import { useSidebarContext } from "./sidebar-context";

const menuItemBaseStyles = cva(
  "rounded-xl px-3 text-[11px] md:text-xs font-medium leading-5 transition-all duration-200",
  {
    variants: {
      isActive: {
        true: "bg-primary/10 text-primary font-semibold hover:bg-primary/15 dark:bg-primary/20 dark:text-primary dark:hover:bg-primary/25 shadow-xs",
        false:
          "text-dark-5 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  },
);

export function MenuItem(
  props: {
    className?: string;
    children: React.ReactNode;
    isActive: boolean;
    ariaExpanded?: boolean;
  } & ({ as?: "button"; onClick: () => void } | { as: "link"; href: string }),
) {
  const { toggleSidebar, isMobile } = useSidebarContext();

  if (props.as === "link") {
    return (
      <Link
        href={props.href}
        // Close sidebar on clicking link if it's mobile
        onClick={() => isMobile && toggleSidebar()}
        className={cn(
          menuItemBaseStyles({
            isActive: props.isActive,
            className: "relative block py-2",
          }),
          props.className,
        )}
      >
        {props.children}
      </Link>
    );
  }

  return (
    <button
      onClick={props.onClick}
      aria-expanded={(props.ariaExpanded ?? props.isActive) ? "true" : "false"}
      className={cn(
        menuItemBaseStyles({
          isActive: props.isActive,
          className: "flex w-full items-center gap-3 py-3",
        }),
        props.className,
      )}
    >
      {props.children}
    </button>
  );
}
