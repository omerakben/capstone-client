import { HttpAuthProvider } from "@/components/HttpAuthProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { Toaster } from "@/components/ui/use-toast";
import { AuthProvider } from "@/contexts/AuthContext";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DEADLINE - Developer Command Center",
  description:
    "Unified hub for managing development artifacts across environments",
  icons: {
    icon: [
      { url: "/deadline_favicon.ico" },
      { url: "/deadline_favicon_16.png", type: "image/png", sizes: "16x16" },
      { url: "/deadline_favicon_32.png", type: "image/png", sizes: "32x32" },
      { url: "/deadline_favicon_48.png", type: "image/png", sizes: "48x48" },
      { url: "/deadline_favicon_64.png", type: "image/png", sizes: "64x64" },
      { url: "/deadline_favicon_128.png", type: "image/png", sizes: "128x128" },
      { url: "/deadline_favicon_256.png", type: "image/png", sizes: "256x256" },
      { url: "/deadline_favicon_512.png", type: "image/png", sizes: "512x512" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <HttpAuthProvider>
            <SiteHeader />
            {children}
            <Toaster />
          </HttpAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
