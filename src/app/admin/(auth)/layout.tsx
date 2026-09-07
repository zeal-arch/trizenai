import type { PropsWithChildren } from "react";

export const dynamic = "force-dynamic";

export default function AuthLayout({ children }: PropsWithChildren) {
  return <>{children}</>;
}
