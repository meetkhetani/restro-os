import * as React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Persistent App Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
