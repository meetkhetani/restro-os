"use client";

import * as React from "react";
import {
  Building2,
  Store,
  Users,
  Shield,
  Plus,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Tabs } from "@/components/ui/tabs";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

const demoLocations = [
  {
    id: "loc-101",
    name: "Downtown Bistro & Bar",
    brand: "Artisan Bistro Chain",
    timezone: "America/New_York",
    status: "active",
    phone: "+1 (555) 234-5678",
  },
  {
    id: "loc-102",
    name: "Uptown Express Outlet",
    brand: "Artisan Bistro Chain",
    timezone: "America/New_York",
    status: "active",
    phone: "+1 (555) 876-5432",
  },
  {
    id: "loc-103",
    name: "Harbor Point Fine Dining",
    brand: "Grand Restro Group",
    timezone: "America/Los_Angeles",
    status: "maintenance",
    phone: "+1 (555) 999-1122",
  },
];

export function DashboardView() {
  const [activeTab, setActiveTab] = React.useState("locations");
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [locationName, setLocationName] = React.useState("");
  const { addToast } = useToast();

  const tabs = [
    { id: "locations", label: "Active Locations", count: 3 },
    { id: "restaurants", label: "Restaurant Brands", count: 2 },
    { id: "roles", label: "RBAC Roles & Permissions", count: 4 },
  ];

  const handleCreateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddModalOpen(false);
    addToast({
      type: "success",
      title: "Location Provisioned",
      description: `Successfully registered "${locationName}" under active organization tenant.`,
    });
    setLocationName("");
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-restro-200 pb-6">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-restro-900 tracking-tight">
              Platform Architecture & Multi-Tenant Control
            </h1>
            <Badge variant="brand" className="font-semibold text-[11px]">
              Phase 01 Active
            </Badge>
          </div>
          <p className="text-xs text-restro-500 mt-1">
            Foundation schema, Supabase clients, RLS policy enforcement, and UI component showcase.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              addToast({
                type: "info",
                title: "RLS Audit",
                description: "All queries restricted by auth_user_org_ids().",
              })
            }
          >
            <Shield className="mr-2 h-3.5 w-3.5 text-brand-600" />
            Audit RLS Policies
          </Button>

          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Location
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="bg-surface shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-restro-500">
              Active Organizations
            </CardTitle>
            <Building2 className="h-4 w-4 text-brand-600" />
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-2xl font-bold text-restro-900">2</div>
            <p className="text-[11px] text-restro-500 mt-1">
              Multi-tenant isolated entities
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-restro-500">
              Operating Locations
            </CardTitle>
            <Store className="h-4 w-4 text-restro-600" />
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-2xl font-bold text-restro-900">3</div>
            <p className="text-[11px] text-restro-500 mt-1">
              Across 2 timezones
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-restro-500">
              System Roles
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-2xl font-bold text-restro-900">4</div>
            <p className="text-[11px] text-restro-500 mt-1">
              Owner, Admin, Manager, Staff
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface shadow-subtle">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-restro-500">
              Database RLS
            </CardTitle>
            <Database className="h-4 w-4 text-brand-600" />
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <div className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
              Enforced (100%)
            </div>
            <p className="text-[11px] text-restro-500 mt-1">
              Supabase PostgreSQL RLS
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabbed Data View */}
      <div className="space-y-4">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "locations" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location Name</TableHead>
                <TableHead>Brand Entity</TableHead>
                <TableHead>Timezone</TableHead>
                <TableHead>Contact Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {demoLocations.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium text-restro-900">
                    {loc.name}
                  </TableCell>
                  <TableCell>{loc.brand}</TableCell>
                  <TableCell className="font-mono text-xs text-restro-600">
                    {loc.timezone}
                  </TableCell>
                  <TableCell className="text-xs">{loc.phone}</TableCell>
                  <TableCell>
                    {loc.status === "active" ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="warning">Maintenance</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Configure
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {activeTab === "restaurants" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="bg-surface">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">Grand Restro Group</CardTitle>
                  <Badge variant="outline">Code: GRG</Badge>
                </div>
                <CardDescription>Primary fine dining brand entity</CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-surface">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">Artisan Bistro Chain</CardTitle>
                  <Badge variant="outline">Code: ABC</Badge>
                </div>
                <CardDescription>Casual dining and express bar outlets</CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {activeTab === "roles" && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Title</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Assigned Permissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-bold text-restro-900">Owner</TableCell>
                <TableCell><Badge variant="brand">System Root</Badge></TableCell>
                <TableCell>Full organization governance and billing control</TableCell>
                <TableCell className="text-xs font-mono">org:manage, location:manage, menu:manage, pos:operate</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-bold text-restro-900">Admin</TableCell>
                <TableCell><Badge variant="default">Organization</Badge></TableCell>
                <TableCell>Location management, staff provisioning, reporting</TableCell>
                <TableCell className="text-xs font-mono">location:manage, menu:manage, reports:view</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-bold text-restro-900">Manager</TableCell>
                <TableCell><Badge variant="outline">Location</Badge></TableCell>
                <TableCell>Daily operational supervision and floor management</TableCell>
                <TableCell className="text-xs font-mono">location:view, menu:manage, pos:operate</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-bold text-restro-900">Staff</TableCell>
                <TableCell><Badge variant="outline">Location</Badge></TableCell>
                <TableCell>POS operation, order entry, table service</TableCell>
                <TableCell className="text-xs font-mono">pos:operate, location:view</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add Location Modal */}
      <Dialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Operating Location"
        description="Add a physical outlet under the current multi-tenant organization."
      >
        <form onSubmit={handleCreateLocation} className="space-y-4">
          <Input
            label="Location Name"
            placeholder="e.g. Westside Waterfront Branch"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            required
          />
          <Input
            label="Timezone"
            defaultValue="America/New_York"
            required
          />
          <Input
            label="Contact Phone"
            placeholder="+1 (555) 000-0000"
          />
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Provision Location
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
