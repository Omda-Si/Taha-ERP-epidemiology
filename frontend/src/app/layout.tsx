import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { AppFrame } from "@/components/app-frame";
import { Providers } from "@/components/providers";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: {
    default: "Genial",
    template: "%s · Genial",
  },
  description:
    "Genial Clínica Especializada. Clinic workstation and headquarters epidemiology. Patient identifiers stay inside the facility.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full`}>
      <body className="min-h-full bg-paper font-sans text-ink antialiased">
        <Providers>
          <AppFrame>{children}</AppFrame>
        </Providers>
      </body>
    </html>
  );
}
