import type { PropsWithChildren } from "react";
import { Toaster } from "sonner";
import "@/styles/satoshi.css";
import "@/styles/style.css";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="font-satoshi min-h-screen bg-[#FAF9F7] dark:bg-[#0E0E10] text-gray-900 dark:text-gray-100 flex items-center justify-center p-4">
      {children}
      <Toaster position="top-right" richColors />
    </div>
  );
}
