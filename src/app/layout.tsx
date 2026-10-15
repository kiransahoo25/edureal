import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EduReal - Find & Book Tutors",
  description: "Connect with expert teachers for physical classes near you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
