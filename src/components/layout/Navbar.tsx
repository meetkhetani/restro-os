"use client";

import * as React from "react";
import { LogOut, User, HelpCircle, Search, Command } from "lucide-react";
import { NotificationBellDropdown } from "@/components/notifications/NotificationBellDropdown";
import { OrgSwitcher } from "./OrgSwitcher";
import { Breadcrumbs } from "./Breadcrumbs";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { MobileNav } from "./MobileNav";
import { mainNavigation, adminNavigation } from "./Sidebar";
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
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const router = useRouter();

  // Cmd+K / Ctrl+K listener for Global Search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const userMenuItems = [
    {
      id: "profile",
      label: "My Profile",
      icon: <User className="h-3.5 w-3.5" />,
      onClick: () => router.push("/dashboard/profile"),
    },
    {
      id: "billing",
      label: "SaaS Billing & Plan",
      icon: <HelpCircle className="h-3.5 w-3.5" />,
      onClick: () => router.push("/dashboard/billing"),
    },
    {
      id: "logout",
      label: "Sign Out",
      danger: true,
      icon: <LogOut className="h-3.5 w-3.5" />,
      onClick: () => router.push("/login"),
    },
  ];

  const mobileNavGroups = [
    { title: "Main Operations", items: mainNavigation },
    { title: "Administration", items: adminNavigation },
  ];

  return (
    <>
      <header className="h-16 border-b border-restro-200 bg-surface px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
        {/* Left Side: Mobile Drawer Toggle & Breadcrumbs / Context Switcher */}
        <div className="flex items-center space-x-3">
          <MobileNav groups={mobileNavGroups} />

          <OrgSwitcher
            organizations={organizations}
            currentOrgId={selectedOrg}
            onSelectOrg={setSelectedOrg}
            locations={locations}
            currentLocationId={selectedLoc}
            onSelectLocation={setSelectedLoc}
          />

          <div className="hidden md:block h-4 w-px bg-restro-200 mx-2" />

          <div className="hidden md:block">
            <Breadcrumbs />
          </div>
        </div>

        {/* Right Side: Global Search, Notifications, Profile Menu */}
        <div className="flex items-center space-x-3">
          {/* Global Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center space-x-2 rounded-md border border-restro-300 bg-restro-50 px-3 py-1.5 text-xs text-restro-500 hover:bg-restro-100 hover:text-restro-900 transition-colors shadow-subtle"
          >
            <Search className="h-3.5 w-3.5 text-restro-400" />
            <span className="hidden sm:inline-block">Search...</span>
            <kbd className="hidden sm:inline-flex items-center text-[10px] text-restro-400 bg-surface px-1 py-0.5 rounded border border-restro-200">
              <Command className="h-2.5 w-2.5 mr-0.5" /> K
            </kbd>
          </button>

          {/* Live Notification Bell Dropdown */}
          <NotificationBellDropdown />

          <div className="h-4 w-px bg-restro-200 mx-1 hidden sm:block" />

          {/* User Account Dropdown */}
          <Dropdown
            trigger={
              <button className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-restro-100 transition-colors">
                <div className="h-7 w-7 rounded-full bg-restro-200 flex items-center justify-center text-xs font-bold text-restro-800">
                  AO
                </div>
                <span className="text-xs font-semibold text-restro-900 hidden md:inline-block">
                  Admin Operator
                </span>
              </button>
            }
            items={userMenuItems}
            align="right"
          />
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
