import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FanHouse",
  description: "Creator platform for exclusive content",
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
