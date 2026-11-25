import type { Metadata } from "next";
import { ClinicShell } from "@/components/shell";

export const metadata: Metadata = { title: "Clinic" };

export default function ClinicLayout({ children }: { children: React.ReactNode }) {
  return <ClinicShell>{children}</ClinicShell>;
}
