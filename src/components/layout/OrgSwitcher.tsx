"use client";

import * as React from "react";
import { Building2, ChevronDown, Check, Store } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";

interface OrgOption {
  id: string;
  name: string;
  slug: string;
}

interface LocationOption {
  id: string;
  name: string;
}

interface OrgSwitcherProps {
  organizations: OrgOption[];
  currentOrgId: string;
  onSelectOrg: (id: string) => void;
  locations?: LocationOption[];
  currentLocationId?: string;
  onSelectLocation?: (id: string) => void;
}

export function OrgSwitcher({
  organizations,
  currentOrgId,
  onSelectOrg,
  locations = [],
  currentLocationId,
  onSelectLocation,
}: OrgSwitcherProps) {
  const currentOrg = organizations.find((o) => o.id === currentOrgId) || organizations[0];
  const currentLocation = locations.find((l) => l.id === currentLocationId) || locations[0];

  const orgItems = organizations.map((org) => ({
    id: org.id,
    label: org.name,
    icon: org.id === currentOrg?.id ? <Check className="h-3.5 w-3.5 text-brand-600" /> : <Building2 className="h-3.5 w-3.5 text-restro-400" />,
    onClick: () => onSelectOrg(org.id),
  }));

  const locationItems = locations.map((loc) => ({
    id: loc.id,
    label: loc.name,
    icon: loc.id === currentLocation?.id ? <Check className="h-3.5 w-3.5 text-brand-600" /> : <Store className="h-3.5 w-3.5 text-restro-400" />,
    onClick: () => onSelectLocation?.(loc.id),
  }));

  return (
    <div className="flex items-center space-x-2">
      {/* Organization Dropdown */}
      <Dropdown
        trigger={
          <button className="flex items-center space-x-2 rounded-md border border-restro-300 bg-surface px-3 py-1.5 text-xs font-semibold text-restro-900 shadow-subtle hover:bg-restro-50 transition-colors">
            <Building2 className="h-4 w-4 text-brand-600" />
            <span className="max-w-[140px] truncate">{currentOrg ? currentOrg.name : "Select Organization"}</span>
            <ChevronDown className="h-3.5 w-3.5 text-restro-400" />
          </button>
        }
        items={orgItems}
        align="left"
      />

      <span className="text-restro-300 text-sm">/</span>

      {/* Location Dropdown */}
      {locations.length > 0 && (
        <Dropdown
          trigger={
            <button className="flex items-center space-x-2 rounded-md border border-restro-300 bg-surface px-3 py-1.5 text-xs font-semibold text-restro-900 shadow-subtle hover:bg-restro-50 transition-colors">
              <Store className="h-4 w-4 text-restro-600" />
              <span className="max-w-[140px] truncate">{currentLocation ? currentLocation.name : "All Locations"}</span>
              <ChevronDown className="h-3.5 w-3.5 text-restro-400" />
            </button>
          }
          items={locationItems}
          align="left"
        />
      )}
    </div>
  );
}
