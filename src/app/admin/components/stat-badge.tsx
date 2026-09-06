import { memo } from "react";

type ColorVariant = "emerald" | "sky" | "purple";

interface StatBadgeProps {
  label: string;
  value: number;
  variant?: ColorVariant;
}

const colorVariants: Record<ColorVariant, {
  dot: string;
  text: string;
}> = {
  emerald: {
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  sky: {
    dot: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-400",
  },
  purple: {
    dot: "bg-purple-500",
    text: "text-purple-700 dark:text-purple-400",
  },
};

function StatBadgeComponent({ label, value, variant = "emerald" }: StatBadgeProps) {
  const colors = colorVariants[variant];

  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
      <span className={`text-sm font-medium ${colors.text}`}>
        {value}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {label}
      </span>
    </div>
  );
}

export const StatBadge = memo(StatBadgeComponent);
