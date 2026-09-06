import type { Metadata } from "next";
import "@/styles/satoshi.css";
import "@/styles/style.css";
import "@/styles/layout-utilities.css";
import { inter, mulish, playfair } from "@/lib/fonts";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "TrizenAI Photo Sharing Platform",
  description: "Collaborative event photo sharing and PIN-protected customer galleries.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${mulish.variable} ${playfair.variable} ${inter.className} font-satoshi bg-brand-cream dark:bg-[#0E0E10] text-brand-nearBlack dark:text-gray-100 antialiased min-h-screen`}
        suppressHydrationWarning
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster position="top-right" richColors />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
