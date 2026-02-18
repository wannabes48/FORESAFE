import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Changed to Inter
import "./globals.css";
// import { Toaster } from "@/components/ui/toaster" // I haven't created Toaster yet, will do later if needed.

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FORESAFE - Vehicle Safety System",
  description: "Secure, anonymous vehicle communication system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
