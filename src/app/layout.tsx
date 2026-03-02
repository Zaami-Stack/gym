import type { Metadata } from "next";
import { Bebas_Neue, Space_Grotesk } from "next/font/google";
import "./globals.css";

const headingFont = Bebas_Neue({
  weight: "400",
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Space_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Iron Temple Gym",
  description: "A modern gym website with admin-managed content and dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${headingFont.variable} ${bodyFont.variable} antialiased`}>{children}</body>
    </html>
  );
}
