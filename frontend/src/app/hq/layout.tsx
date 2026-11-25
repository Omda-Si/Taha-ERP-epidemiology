import type { Metadata } from "next";
import { HqShell } from "@/components/shell";

export const metadata: Metadata = { title: "Surveillance desk" };

export default function HqLayout({ children }: { children: React.ReactNode }) {
  return <HqShell>{children}</HqShell>;
}
