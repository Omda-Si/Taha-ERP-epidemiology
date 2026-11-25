import type { Metadata } from "next";
import { HqShell } from "@/components/shell";

export const metadata: Metadata = { title: "HQ analytics" };

export default function HqLayout({ children }: { children: React.ReactNode }) {
  return <HqShell>{children}</HqShell>;
}
