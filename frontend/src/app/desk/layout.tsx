import type { Metadata } from "next";

export const metadata: Metadata = { title: "TEEDSS desk" };

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return children;
}