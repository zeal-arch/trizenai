import Link from "next/link";
import { cn } from "@/lib/utils";

interface ButtonProps {
  children: React.ReactNode;
  variant?:
    | "solid"
    | "outline"
    | "brand"
    | "gradient"
    | "creative-liquid"
    | "creative-halo"
    | "creative-glass"
    | "popup"
    | "bounce"
    | "premium-pill-glass"
    | "cyber-radar"
    | "cartoony-pop";
  href?: string;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
}

export default function Button({
  children,
  variant = "solid",
  href,
  className,
  type = "button",
  onClick,
  disabled = false,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium transition-all duration-300";
  const variants = {
    solid: "bg-[#8E94F2] text-white hover:bg-[#595c96]/90",
    outline: "border border-[#46A6E7] text-[#007AFF] hover:bg-[#E8F4FF]",
    brand:
      "bg-brand-softPeriwinkle text-white hover:bg-brand-wisteriaBlue shadow-sm hover:shadow-md",
    gradient:
      "bg-linear-to-r from-brand-softPeriwinkle to-brand-mauve text-white hover:opacity-90 shadow-sm hover:shadow-md hover:-translate-y-0.5",
    "creative-liquid":
      "bg-linear-to-r from-brand-softPeriwinkle via-brand-mauve to-brand-wisteriaBlue bg-[length:200%_auto] hover:bg-[position:right_center] text-white shadow-[0_4px_15px_rgba(142,148,242,0.4)] hover:shadow-[0_8px_25px_rgba(187,173,255,0.6)] transition-all duration-500 hover:-translate-y-1",
    "creative-halo":
      "relative group isolate text-brand-nearBlack bg-brand-cream hover:text-brand-softPeriwinkle transition-colors duration-300 before:absolute before:-inset-[2px] before:-z-10 before:rounded-full before:bg-linear-to-r before:from-brand-lavenderGrey before:via-brand-softPeriwinkle before:to-brand-mauve before:opacity-50 hover:before:opacity-100 before:blur-md before:transition-opacity before:duration-500 after:absolute after:inset-[1.5px] after:-z-10 after:rounded-full after:bg-brand-cream",
    "creative-glass":
      "relative overflow-hidden bg-brand-softPeriwinkle/10 backdrop-blur-md border border-brand-softPeriwinkle/30 text-brand-nearBlack shadow-inner hover:bg-brand-softPeriwinkle/25 hover:border-brand-mauve/60 transition-all duration-300 before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700 before:bg-linear-to-r before:from-transparent before:via-white/60 before:to-transparent",
    popup:
      "bg-white text-brand-softPeriwinkle font-bold border-2 border-brand-softPeriwinkle/50 shadow-[0_6px_0_0_#8E94F2] hover:shadow-[0_8px_0_0_#9FA0FF] hover:-translate-y-1 active:shadow-[0_0px_0_0_#8E94F2] active:translate-y-[6px]",
    bounce:
      "bg-white/90 backdrop-blur-sm text-brand-softPeriwinkle hover:bg-white hover:text-brand-wisteriaBlue transition-all transform hover:scale-110 active:scale-95 shadow-md hover:shadow-xl",
    "cartoony-pop":
      "bg-white text-brand-softPeriwinkle text-sm font-black uppercase tracking-wider border-[3px] border-brand-softPeriwinkle shadow-[5px_5px_0px_0px_#8E94F2] hover:bg-brand-softPeriwinkle hover:text-white hover:border-brand-wisteriaBlue hover:shadow-[7px_7px_0px_0px_#9FA0FF] hover:-translate-y-1 hover:-translate-x-1 hover:-rotate-2 active:shadow-[0px_0px_0px_0px_#8E94F2] active:translate-y-[5px] active:translate-x-[5px] active:rotate-0 transition-all duration-200",
    "premium-pill-glass":
      "group relative isolate overflow-hidden border border-white/40 bg-white/10 backdrop-blur-md text-white shadow-lg transition-all duration-700 hover:shadow-xl hover:-translate-y-1 before:absolute before:inset-0 before:-z-10 before:-translate-x-full before:rounded-full before:bg-white before:transition-transform before:duration-700 hover:before:translate-x-0 active:scale-95",
    "cyber-radar":
      "relative isolate overflow-hidden bg-brand-nearBlack text-white border border-white/10 shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 before:absolute before:left-1/2 before:top-1/2 before:-z-20 before:h-[250%] before:w-[250%] before:-translate-x-1/2 before:-translate-y-1/2 before:bg-[conic-gradient(transparent_0%,_#BBADFF_30%,_transparent_50%)] before:animate-[spin_4s_linear_infinite] after:absolute after:inset-[1.5px] after:-z-10 after:rounded-full after:bg-brand-nearBlack after:transition-colors after:duration-300 hover:after:bg-brand-nearBlack/80",
  };

  const classes = cn(base, variants[variant], className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
