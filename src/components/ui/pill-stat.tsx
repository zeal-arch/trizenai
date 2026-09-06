import { ChevronDownIcon, ChevronUpIcon, MinusIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Badge } from "../../app/admin/components/Badge";
import { Button } from "./button1";
import { cn } from "@/lib/utils";

export type PillProps = ComponentProps<typeof Badge> & {
    themed?: boolean;
};

export const Pill = ({
    variant = "secondary",

    className,
    ...props
}: PillProps) => (
    <Badge
        className={cn("gap-2 rounded-full px-3 py-1.5 font-normal", className)}
        variant={variant}
        {...props}
    />
);

export type PillAvatarProps = ComponentProps<typeof AvatarImage> & {
    fallback?: string;
};

export const PillAvatar = ({
    fallback,
    className,
    ...props
}: PillAvatarProps) => (
    <Avatar className={cn("-ml-1 h-4 w-4", className)}>
        <AvatarImage {...props} />
        <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
);

export type PillButtonProps = ComponentProps<typeof Button>;

export const PillButton = ({ className, ...props }: PillButtonProps) => (
    <Button
        className={cn(
            "-my-2 -mr-2 size-6 rounded-full p-0.5 hover:bg-foreground/5",
            className
        )}
        size="icon"
        variant="ghost"
        {...props}
    />
);

export type PillStatusProps = {
    children: ReactNode;
    className?: string;
};

export const PillStatus = ({
    children,
    className,
    ...props
}: PillStatusProps) => (
    <div
        className={cn(
            "flex items-center gap-2 border-r pr-2 font-medium",
            className
        )}
        {...props}
    >
        {children}
    </div>
);

export type PillIndicatorProps = {
    variant?: "success" | "error" | "warning" | "info";
    pulse?: boolean;
};

export const PillIndicator = ({
    variant = "success",
    pulse = false,
}: PillIndicatorProps) => (
    <span className="relative flex size-2">
        {pulse && (
            <span
                className={cn(
                    "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                    variant === "success" && "bg-emerald-400",
                    variant === "error" && "bg-rose-400",
                    variant === "warning" && "bg-amber-400",
                    variant === "info" && "bg-sky-400"
                )}
            />
        )}
        <span
            className={cn(
                "relative inline-flex size-2 rounded-full",
                variant === "success" && "bg-emerald-500",
                variant === "error" && "bg-rose-500",
                variant === "warning" && "bg-amber-500",
                variant === "info" && "bg-sky-500"
            )}
        />
    </span>
);

export type PillDeltaProps = {
    className?: string;
    delta: number;
};

export const PillDelta = ({ className, delta }: PillDeltaProps) => {
    if (!delta) {
        return (
            <MinusIcon className={cn("size-3 text-muted-foreground", className)} />
        );
    }

    if (delta > 0) {
        return (
            <ChevronUpIcon className={cn("size-3 text-emerald-500", className)} />
        );
    }

    return <ChevronDownIcon className={cn("size-3 text-rose-500", className)} />;
};

export type PillIconProps = {
    icon: typeof ChevronUpIcon;
    className?: string;
};

export const PillIcon = ({
    icon: Icon,
    className,
    ...props
}: PillIconProps) => (
    <Icon
        className={cn("size-3 text-muted-foreground", className)}
        size={12}
        {...props}
    />
);

export type PillAvatarGroupProps = {
    children: ReactNode;
    className?: string;
};

export const PillAvatarGroup = ({
    children,
    className,
    ...props
}: PillAvatarGroupProps) => (
    <div
        className={cn(
            "-space-x-1 flex items-center",
            "[&>*:not(:first-of-type)]:[mask-radial-gradient(circle_9px_at_-4px_50%,transparent_99%,white_100%)]",
            className
        )}
        {...props}
    >
        {children}
    </div>
);

// Custom PillStat component for displaying statistics
type ColorVariant = "emerald" | "sky" | "purple" | "blue" | "amber";

interface PillStatProps {
    label: string;
    value: number | string;
    variant?: ColorVariant;
}

const colorVariants: Record<ColorVariant, {
    bg: string;
    border: string;
    text: string;
}> = {
    emerald: {
        bg: "bg-[#34C759]/10 dark:bg-[#30D158]/10",
        border: "border-[#34C759]/20 dark:border-[#30D158]/20",
        text: "text-[#34C759] dark:text-[#30D158]",
    },
    sky: {
        bg: "bg-[#32ADE6]/10 dark:bg-[#64D2FF]/10",
        border: "border-[#32ADE6]/20 dark:border-[#64D2FF]/20",
        text: "text-[#32ADE6] dark:text-[#64D2FF]",
    },
    purple: {
        bg: "bg-[#AF52DE]/10 dark:bg-[#BF5AF2]/10",
        border: "border-[#AF52DE]/20 dark:border-[#BF5AF2]/20",
        text: "text-[#AF52DE] dark:text-[#BF5AF2]",
    },
    blue: {
        bg: "bg-[#007AFF]/10 dark:bg-[#0A84FF]/10",
        border: "border-[#007AFF]/20 dark:border-[#0A84FF]/20",
        text: "text-[#007AFF] dark:text-[#0A84FF]",
    },
    amber: {
        bg: "bg-[#FF9500]/10 dark:bg-[#FF9F0A]/10",
        border: "border-[#FF9500]/20 dark:border-[#FF9F0A]/20",
        text: "text-[#FF9500] dark:text-[#FF9F0A]",
    },
};

export const PillStat = ({ label, value, variant = "emerald" }: PillStatProps) => {
    const colors = colorVariants[variant];

    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 shadow-sm",
            colors.bg,
            colors.border
        )}>
            <span className={cn(
                "text-xs font-semibold leading-none uppercase tracking-wide",
                colors.text
            )}>
                {label}
            </span>
            <span className={cn(
                "text-xs font-semibold leading-none",
                colors.text
            )}>
                {value}
            </span>
        </div>
    );
};
