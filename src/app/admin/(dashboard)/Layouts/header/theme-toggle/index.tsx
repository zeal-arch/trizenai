"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Moon, Sun } from "@/admin/assets/icons";

const THEMES = [
  {
    name: "light",
    Icon: Sun,
  },
  {
    name: "dark",
    Icon: Moon,
  },
];

export function ThemeToggleSwitch() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
      className="group rounded-full bg-gray-3 p-[5px] text-dark outline-1 outline-primary focus-visible:outline dark:bg-[#020D1A] dark:text-white"
    >
      <span className="sr-only">
        Switch to {resolvedTheme === "light" ? "dark" : "light"} mode
      </span>

      <span aria-hidden className="relative flex gap-1.5">
        {/* Indicator */}
        <span className="absolute size-7 rounded-full border border-[#EBE8E3] bg-white transition-all dark:translate-x-8.5 dark:border-white/15 dark:bg-dark-2 dark:group-hover:bg-dark-3" />

        {THEMES.map(({ name, Icon }) => (
          <span
            key={name}
            className={cn(
              "relative grid size-7 place-items-center rounded-full",
              name === "dark" && "dark:text-white",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
        ))}
      </span>
    </button>
  );
}
