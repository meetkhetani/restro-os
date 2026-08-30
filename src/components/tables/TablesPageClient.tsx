"use client";

import * as React from "react";
import {
  Utensils,
  Calendar,
  Building2,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { TableItemExtended, Reservation } from "@/domain/tables/types";
import { getTablesAndFloorData } from "@/domain/tables/actions";
import { FloorPlanView } from "./FloorPlanView";
import { ReservationsView } from "./ReservationsView";

interface BranchOptionItem {
  id: string;
  name: string;
  isAll?: boolean;
}

interface TablesPageClientProps {
  initialTables: TableItemExtended[];
  initialReservations: Reservation[];
  initialFloorAreas: string[];
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
  initialTables,
  initialReservations,
  initialFloorAreas,
  initialStats,
  branches,
  currentBranchId,
}: TablesPageClientProps) {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = React.useState<"floor" | "reservations">("floor");
  const [tables, setTables] = React.useState<TableItemExtended[]>(initialTables);
  const [reservations, setReservations] = React.useState<Reservation[]>(initialReservations);
  const [floorAreas, setFloorAreas] = React.useState<string[]>(initialFloorAreas);
  const [stats, setStats] = React.useState(initialStats);
  const [selectedBranchId, setSelectedBranchId] = React.useState<string>(currentBranchId);
  const [isLoading, setIsLoading] = React.useState(false);

  const fetchLatestData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getTablesAndFloorData(selectedBranchId);
      setTables(res.tables);
      setReservations(res.reservations);
      setFloorAreas(res.floorAreas);
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

  // Supabase Realtime Subscription for Live Table & Reservation State
  React.useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("tables_live_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tables" },
        () => {
          fetchLatestData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservations" },
        () => {
          fetchLatestData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLatestData]);

  return (
    <div className="space-y-5 p-6 max-w-7xl mx-auto font-sans">
      {/* Header & Branch Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-restro-900 tracking-tight">
            Tables & Floor Plan Management
          </h1>
          <p className="text-xs font-medium text-restro-500 flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3.5 w-3.5 text-brand-500 inline" /> Real-time dine-in floor layout, table statuses & guest reservations
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {branches.length > 0 && (
            <div className="flex items-center space-x-2 bg-surface border border-restro-200 px-3 py-1.5 rounded-lg shadow-card">
              <Building2 className="h-4 w-4 text-brand-500" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs font-bold text-restro-800 focus:outline-none"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button variant="outline" size="sm" onClick={() => fetchLatestData()} isLoading={isLoading}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="p-3 bg-surface border-restro-200 shadow-card">
          <span className="text-restro-500 text-xs">Total Tables</span>
          <p className="text-lg font-extrabold text-restro-900 mt-0.5">{stats.total}</p>
        </Card>

        <Card className="p-3 bg-surface border-restro-200 shadow-card">
          <span className="text-emerald-600 text-xs font-semibold">Available</span>
          <p className="text-lg font-extrabold text-emerald-700 mt-0.5">{stats.available}</p>
        </Card>

        <Card className="p-3 bg-surface border-restro-200 shadow-card">
          <span className="text-blue-600 text-xs font-semibold">Occupied</span>
          <p className="text-lg font-extrabold text-blue-700 mt-0.5">{stats.occupied}</p>
        </Card>

        <Card className="p-3 bg-surface border-restro-200 shadow-card">
          <span className="text-amber-600 text-xs font-semibold">Reserved</span>
          <p className="text-lg font-extrabold text-amber-700 mt-0.5">{stats.reserved}</p>
        </Card>

        <Card className="p-3 bg-surface border-restro-200 shadow-card">
          <span className="text-purple-600 text-xs font-semibold">Cleaning</span>
          <p className="text-lg font-extrabold text-purple-700 mt-0.5">{stats.cleaning}</p>
        </Card>

        <Card className="p-3 bg-surface border-restro-200 shadow-card">
          <span className="text-restro-500 text-xs font-semibold">Disabled</span>
          <p className="text-lg font-extrabold text-restro-700 mt-0.5">{stats.disabled}</p>
        </Card>
      </div>

      {/* Main Mode Tabs */}
      <div className="bg-surface p-1.5 rounded-xl border border-restro-200 inline-flex space-x-1 shadow-card">
        <button
          onClick={() => setActiveTab("floor")}
          className={`flex items-center px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
            activeTab === "floor"
              ? "bg-brand-500 text-white shadow-card"
              : "text-restro-700 hover:bg-restro-100"
          }`}
        >
          <Utensils className="h-4 w-4 mr-2" /> Visual Floor Plan
        </button>

        <button
          onClick={() => setActiveTab("reservations")}
          className={`flex items-center px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
            activeTab === "reservations"
              ? "bg-brand-500 text-white shadow-card"
              : "text-restro-700 hover:bg-restro-100"
          }`}
        >
          <Calendar className="h-4 w-4 mr-2" /> Reservations ({reservations.length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "floor" ? (
        <FloorPlanView
          tables={tables}
          floorAreas={floorAreas}
          onRefresh={fetchLatestData}
        />
      ) : (
        <ReservationsView
          reservations={reservations}
          availableTables={tables.filter((t) => t.status === "available")}
          onRefresh={fetchLatestData}
        />
      )}
    </div>
  );
}
