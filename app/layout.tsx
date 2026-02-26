import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Job Portal - Find Your Dream Job",
  description: "Connect with top employers and discover opportunities that match your skills",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  icons: {
    icon: [
      { url: "/images/logo.jpeg", type: "image/jpeg", sizes: "any" },
    ],
    shortcut: "/images/logo.jpeg",
    apple: "/images/logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full overflow-x-hidden">
      <body className={`${inter.className} flex min-h-screen w-full min-w-0 flex-col overflow-x-hidden`}>
        <Providers>
          <div className="flex min-h-screen w-full min-w-0 flex-col">
            <div className="min-w-0 flex-1">{children}</div>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
