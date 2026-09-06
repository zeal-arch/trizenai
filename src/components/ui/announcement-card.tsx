"use client";

import React from "react";
import { AlertCircle, Newspaper, Calendar, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnnouncementCardProps {
  type: string;
  message: string;
  image_url?: string;
  isPreview?: boolean;
  isSquare?: boolean; // New prop for square layout
}

const ANNOUNCEMENT_CONFIG: Record<string, { icon: React.ElementType, color: string, bgTint: string, label: string }> = {
  alert: { icon: AlertCircle, color: "text-amber-500", bgTint: "bg-amber-50 dark:bg-amber-900/20", label: "Attention" },
  news: { icon: Newspaper, color: "text-blue-500", bgTint: "bg-blue-50 dark:bg-blue-900/20", label: "Latest News" },
  event: { icon: Calendar, color: "text-purple-500", bgTint: "bg-purple-50 dark:bg-purple-900/20", label: "Upcoming Event" },
  update: { icon: Bell, color: "text-emerald-500", bgTint: "bg-emerald-50 dark:bg-emerald-900/20", label: "Platform Update" },
  default: { icon: Bell, color: "text-primary", bgTint: "bg-primary/10", label: "New Announcement" },
};

export const AnnouncementCard = ({ type, message, image_url, isPreview, isSquare }: AnnouncementCardProps) => {
  const config = ANNOUNCEMENT_CONFIG[type as keyof typeof ANNOUNCEMENT_CONFIG] || ANNOUNCEMENT_CONFIG.default;
  const Icon = config.icon;

  const isAlert = type === "alert" || type === "warning";
  const isUpdate = type === "update" || type === "feature";
  const isNews = type === "news" || type === "info";
  const isEvent = type === "event";

  // Structural Logic
  const isHorizontal = isAlert || isUpdate;
  const isReverse = isUpdate; // Image on the right for updates

  // Split message into title (first line) and description (rest)
  const lines = message.split('\n');
  const title = lines[0] || "";
  const description = lines.slice(1).join('\n').trim();

  return (
    <div className={cn(
      "relative w-full rounded-2xl shadow-xl bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 overflow-hidden isolate group transition-all duration-300",
      isSquare ? "aspect-square flex-col h-full" : isHorizontal ? "flex flex-col sm:flex-row min-h-[160px]" : "flex flex-col",
      isPreview ? "scale-[0.85] origin-top shadow-sm" : ""
    )}>

      {/* Cover Section */}
      {image_url ? (
        <div className={cn(
          "relative bg-gray-100 dark:bg-gray-800 shrink-0 overflow-hidden",
          isSquare ? "h-[45%]" : isHorizontal ? "w-full h-40 sm:w-2/5 sm:h-auto lg:w-[180px]" : "w-full h-48",
          isReverse && !isSquare && "sm:order-last"
        )}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image_url} alt="Announcement" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />

          {/* Badge Over Image (Vertical Only) */}
          {!isHorizontal && !isSquare && (
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <div className={cn("p-1.5 rounded-md backdrop-blur-md shadow-sm border border-white/20", 
                isAlert ? "bg-amber-500/90 text-white" : isNews ? "bg-blue-600/90 text-white" : "bg-gray-900/90 text-white")}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-white drop-shadow-sm uppercase">
                {config.label}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className={cn(
          "shrink-0 flex items-center justify-center relative overflow-hidden",
          isHorizontal ? "w-full h-24 sm:w-[120px] sm:min-h-full sm:h-auto border-b sm:border-b-0 sm:border-r border-gray-100 dark:border-gray-800" : isSquare ? "h-[40%]" : "h-32 w-full border-b border-gray-100 dark:border-gray-800",
          isAlert ? "bg-amber-50/50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500" :
            isNews ? "bg-blue-50/50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500" :
              isEvent ? "bg-purple-50/50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-500" :
                "bg-gray-50 dark:bg-gray-800/50 text-gray-500",
          isReverse && !isSquare && "order-last border-r-0 border-l"
        )}>
          <Icon className="w-8 h-8 stroke-[1.5px] opacity-80" />
        </div>
      )}

      {/* Content Section */}
      <div className={cn(
        "p-5 sm:p-6 flex-1 w-full flex flex-col relative z-20",
        isSquare && "justify-center items-center text-center",
        isHorizontal && "justify-center items-start text-left"
      )}>
        {/* Subtle accent bar for alerts */}
        {isAlert && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />}

        {/* Type label badge */}
        <span className={cn(
          "inline-flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase mb-3",
          isAlert ? "text-amber-600 dark:text-amber-500" :
            isNews ? "text-blue-600 dark:text-blue-500" :
              isEvent ? "text-purple-600 dark:text-purple-500" :
                isUpdate ? "text-emerald-600 dark:text-emerald-500" :
                  "text-gray-500 dark:text-gray-400",
          isSquare && "mx-auto"
        )}>
          <Icon className="w-3.5 h-3.5" />
          {config.label}
        </span>

        {/* Title */}
        <h2 className={cn(
          "font-semibold leading-snug tracking-tight mb-2",
          isSquare ? "text-lg" : isHorizontal ? "text-lg" : "text-xl",
          "text-gray-900 dark:text-gray-100"
        )}>
          {title || <span className="opacity-40 italic">Announcement Title</span>}
        </h2>

        {/* Description */}
        <p className={cn(
          "leading-relaxed text-gray-600 dark:text-gray-400",
          isSquare ? "text-[13px] max-w-[90%] mx-auto" :
            isHorizontal ? "text-[13px]" : "text-sm"
        )}>
          {description || <span className="italic opacity-40">No description provided.</span>}
        </p>
      </div>
    </div>
  );
};
