"use client";

import Image, { ImageProps } from "next/image";

/**
 * SmartImage automatically handles external domains by setting unoptimized={true}
 * for domains not explicitly configured in next.config.ts.
 * This prevents runtime errors and app crashes when using dynamic external images.
 */
export function SmartImage({ src, unoptimized, alt, ...props }: ImageProps & { alt?: string }) {
  const isExternal = typeof src === "string" && (src.startsWith("http://") || src.startsWith("https://"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const isConfiguredDomain = typeof src === "string" && (
    src.startsWith("/") ||
    (supabaseUrl && src.includes(new URL(supabaseUrl).hostname))
  );

  const shouldSkipOptimization = unoptimized || (isExternal && !isConfiguredDomain);

  return (
    <Image
      src={src}
      alt={alt || ""}
      {...props}
      unoptimized={shouldSkipOptimization}
    />
  );
}
