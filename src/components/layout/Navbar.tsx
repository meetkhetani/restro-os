"use client";

import * as React from "react";
import { LogOut, User, Bell, HelpCircle } from "lucide-react";
import { OrgSwitcher } from "./OrgSwitcher";
import { Dropdown } from "@/components/ui/dropdown";
import { useRouter } from "next/navigation";

interface NavbarProps {
  organizations?: Array<{ id: string; name: string; slug: string }>;
  locations?: Array<{ id: string; name: string }>;
}

export function Navbar({
  organizations = [
    { id: "org-1", name: "Grand Restro Group", slug: "grand-restro" },
    { id: "org-2", name: "Artisan Bistro Chain", slug: "artisan-bistro" },
  ],
  locations = [
    { id: "loc-1", name: "Downtown Main Branch" },
    { id: "loc-2", name: "Uptown Express Outlet" },
  ],
}: NavbarProps) {
  const [selectedOrg, setSelectedOrg] = React.useState(organizations[0]?.id || "");
  const [selectedLoc, setSelectedLoc] = React.useState(locations[0]?.id || "");
  const router = useRouter();

  const userMenuItems = [
    {
      id: "profile",
      label: "My Profile",
      icon: <User className="h-3.5 w-3.5" />,
      onClick: () => router.push("/dashboard/profile"),
    },
    {
      id: "help",
      label: "System Documentation",
      icon: <HelpCircle className="h-3.5 w-3.5" />,
      onClick: () => {},
    },
    {
      id: "logout",
      label: "Sign Out",
      danger: true,
      icon: <LogOut className="h-3.5 w-3.5" />,
      onClick: () => router.push("/login"),
    },
  ];

  return (
    <header className="h-16 border-b border-restro-200 bg-surface px-6 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
      {/* Contextual Multi-Tenant Switcher */}
      <OrgSwitcher
        organizations={organizations}
        currentOrgId={selectedOrg}
        onSelectOrg={setSelectedOrg}
        locations={locations}
        currentLocationId={selectedLoc}
        onSelectLocation={setSelectedLoc}
      />

      {/* Right Navbar Actions */}
      <div className="flex items-center space-x-3">
        <button className="relative p-2 rounded-md text-restro-500 hover:bg-restro-100 hover:text-restro-900 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-brand-500 ring-2 ring-white" />
        </button>

        <div className="h-4 w-px bg-restro-200 mx-1" />

        {/* User Account Dropdown */}
        <Dropdown
          trigger={
            <button className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-restro-100 transition-colors">
              <div className="h-7 w-7 rounded-full bg-restro-200 flex items-center justify-center text-xs font-bold text-restro-800">
                AO
              </div>
              <span className="text-xs font-semibold text-restro-900 hidden sm:inline-block">
                Admin Operator
              </span>
            </button>
          }
          items={userMenuItems}
          align="right"
        />
      </div>
    </header>
  );
}
