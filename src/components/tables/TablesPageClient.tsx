"use client";

import * as React from "react";
import {
  Utensils,
  Calendar,
  Building2,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { Floor, TableItemExtended, Reservation } from "@/domain/tables/types";
import { getTablesAndFloorData } from "@/domain/tables/actions";
import { FloorPlanView } from "./FloorPlanView";
import { ReservationsView } from "./ReservationsView";

interface BranchOptionItem {
  id: string;
  name: string;
  isAll?: boolean;
}

interface TablesPageClientProps {
  initialFloors: Floor[];
  initialTables: TableItemExtended[];
  initialReservations: Reservation[];
  initialStats: {
    total: number;
    available: number;
    occupied: number;
    reserved: number;
    cleaning: number;
    disabled: number;
  };
  branches: BranchOptionItem[];
  currentBranchId: string;
}

export function TablesPageClient({
  initialFloors,
  initialTables,
  initialReservations,
  initialStats,
  branches,
  currentBranchId,
}: TablesPageClientProps) {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = React.useState<"floor" | "reservations">("floor");
  const [floors, setFloors] = React.useState<Floor[]>(initialFloors);
  const [tables, setTables] = React.useState<TableItemExtended[]>(initialTables);
  const [reservations, setReservations] = React.useState<Reservation[]>(initialReservations);
  const [stats, setStats] = React.useState(initialStats);
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>(currentBranchId);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchLatestData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getTablesAndFloorData(selectedBranchId);
      setFloors(res.floors);
      setTables(res.tables);
      setReservations(res.reservations);
      setStats(res.stats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to refresh table data.";
      addToast({
        type: "error",
        title: "Error",
        description: msg,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedBranchId, addToast]);

  React.useEffect(() => {
    fetchLatestData();
  }, [selectedBranchId, fetchLatestData]);

  // Supabase Realtime Subscription for Live Floors, Tables & Reservations State
  React.useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("tables_live_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "floors" },
        () => fetchLatestData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables" },
        () => fetchLatestData()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => fetchLatestData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLatestData]);

  return (
    <div className="space-y-6">
      {/* Top Header & Multi-Branch Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4 border-gray-200">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Utensils className="h-7 w-7 text-amber-600" /> Tables & Floor Plans
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage floor layouts, table status, seating assignments, and guest reservations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Selector */}
          <div className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 p-1.5 shadow-sm">
            <Building2 className="h-4 w-4 text-amber-600 ml-2" />
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer pr-3"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            onClick={fetchLatestData}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm text-center">
          <span className="text-xs font-semibold text-gray-500 block">Total Tables</span>
          <span className="text-xl font-black text-gray-900">{stats.total}</span>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 shadow-sm text-center">
          <span className="text-xs font-semibold text-emerald-700 block">Available</span>
          <span className="text-xl font-black text-emerald-800">{stats.available}</span>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 shadow-sm text-center">
          <span className="text-xs font-semibold text-rose-700 block">Occupied</span>
          <span className="text-xl font-black text-rose-800">{stats.occupied}</span>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 shadow-sm text-center">
          <span className="text-xs font-semibold text-amber-700 block">Reserved</span>
          <span className="text-xl font-black text-amber-800">{stats.reserved}</span>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 shadow-sm text-center">
          <span className="text-xs font-semibold text-blue-700 block">Cleaning</span>
          <span className="text-xl font-black text-blue-800">{stats.cleaning}</span>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 shadow-sm text-center">
          <span className="text-xs font-semibold text-gray-500 block">Disabled</span>
          <span className="text-xl font-black text-gray-600">{stats.disabled}</span>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-gray-200 gap-6">
        <button
          onClick={() => setActiveTab("floor")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "floor"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Utensils className="h-4 w-4" /> Floor Plan Layout
        </button>

        <button
          onClick={() => setActiveTab("reservations")}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "reservations"
              ? "border-amber-600 text-amber-600"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Calendar className="h-4 w-4" /> Guest Reservations ({reservations.length})
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === "floor" ? (
        <FloorPlanView
          floors={floors}
          tables={tables}
          onRefresh={fetchLatestData}
        />
      ) : (
        <ReservationsView
          reservations={reservations}
          availableTables={tables}
          onRefresh={fetchLatestData}
        />
      )}
    </div>
  );
}
