import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-xs font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/90 shadow-xs shadow-primary/20",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-xs shadow-red-600/20",
        outline: "border border-[#EBE8E3] dark:border-white/10 bg-white dark:bg-dark-2 hover:bg-gray-50 dark:hover:bg-dark-3 text-gray-800 dark:text-gray-200",
        secondary: "bg-gray-100 dark:bg-dark-3 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-dark-4",
        ghost: "hover:bg-gray-100 dark:hover:bg-dark-3 text-gray-700 dark:text-gray-300",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9.5 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-[11px]",
        lg: "h-11 rounded-xl px-6 text-sm",
        icon: "size-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export default Button;
