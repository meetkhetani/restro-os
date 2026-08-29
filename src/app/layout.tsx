import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "Restro OS — Operating System for Modern Restaurants",
  description:
    "Production-grade restaurant operating system built on Next.js, TypeScript, and Supabase multi-tenant PostgreSQL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background text-restro-900 antialiased min-h-screen">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
