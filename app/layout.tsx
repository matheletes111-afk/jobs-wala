import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import Footer from "@/components/Footer";
import FooterWrapper from "@/components/FooterWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JobDaddy - AI-Powered Job Portal | Wolf of the Job Street | India, USA, UK, Gulf",
  description: "India's AI-powered job portal & career launchpad. Resume enhancement from ₹999. Expert recruitment across India, USA, UK & Gulf.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  icons: {
    icon: [
      { url: "/images/favicon.png", type: "image/png" },
    ],
    shortcut: "/images/favicon.png",
    apple: "/images/favicon.png",
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
            <FooterWrapper>
              <Footer />
            </FooterWrapper>
          </div>
        </Providers>
      </body>
    </html>
  );
}
