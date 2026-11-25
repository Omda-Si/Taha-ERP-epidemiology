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
    default: "Taha Clinic",
    template: "%s · Taha Clinic",
  },
  description:
    "Taha Clinic Khartoum. The clinic workstation keeps patient identifiers local. Headquarters receives anonymized diagnosis events only.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full`}>
      <body className="h-full overflow-hidden bg-paper font-sans text-ink antialiased">
        <Providers>
          <AppFrame>{children}</AppFrame>
        </Providers>
      </body>
    </html>
  );
}
