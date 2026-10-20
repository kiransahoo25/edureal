import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ... (keep your imports the same)

export const metadata: Metadata = {
  title: "EduReal - Find & Book Tutors",
  description: "Connect with expert teachers for physical classes near you.",
};

// ADD THIS BLOCK RIGHT HERE
export const viewport = {
  themeColor: "#020617",
};

// ... (keep your imports and metadata the same)

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
        <Navbar />
        <main className="pt-28 pb-12">{children}</main>
      </body>
    </html>
  );
}
