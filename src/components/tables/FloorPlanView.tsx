"use client";

import * as React from "react";
import {
  Utensils,
  Plus,
  ArrowRightLeft,
  Link,
  Unlink,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  TableItemExtended,
  TableStatus,
  TableShape,
} from "@/domain/tables/types";
import {
  createTable,
  updateTableStatus,
  transferTableOrder,
  mergeTables,
  splitTables,
} from "@/domain/tables/actions";

interface FloorPlanViewProps {
  tables: TableItemExtended[];
  floorAreas: string[];
  onRefresh: () => void;
}

export function FloorPlanView({
  tables,
  floorAreas,
  onRefresh,
}: FloorPlanViewProps) {
  const { addToast } = useToast();

  const [activeFloor, setActiveFloor] = React.useState<string>(
    floorAreas[0] || "Main Floor"
  );

  // Selected Table & Action Modals
  const [selectedTable, setSelectedTable] = React.useState<TableItemExtended | null>(null);
  const [isAddTableOpen, setIsAddTableOpen] = React.useState(false);
  const [isTransferOpen, setIsTransferOpen] = React.useState(false);
  const [isMergeOpen, setIsMergeOpen] = React.useState(false);

  // Transfer & Merge Target State
  const [targetTableId, setTargetTableId] = React.useState("");

  // Add Table Form State
  const [newTableNumber, setNewTableNumber] = React.useState("");
  const [newCapacity, setNewCapacity] = React.useState(4);
  const [newFloorArea, setNewFloorArea] = React.useState(activeFloor);
  const [newShape, setNewShape] = React.useState<TableShape>("square");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const filteredTables = React.useMemo(() => {
    return tables.filter((t) => t.floor_area === activeFloor);
  }, [tables, activeFloor]);

  const handleStatusChange = async (tableId: string, status: TableStatus) => {
    const res = await updateTableStatus(tableId, status);
    if (res.success) {
      addToast({
        type: "success",
        title: "Status Updated",
        description: res.message,
      });
      onRefresh();
    } else {
      addToast({
        type: "error",
        title: "Error",
        description: res.error || "Failed to update status.",
      });
    }
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber.trim()) {
      addToast({
        type: "error",
        title: "Validation Error",
        description: "Please enter a table number.",
      });
      return;
    }

    setIsSubmitting(true);
    const res = await createTable({
      table_number: newTableNumber.trim(),
      capacity: Number(newCapacity),
      floor_area: newFloorArea || activeFloor,
      shape: newShape,
    });

    if (res.success) {
      addToast({
        type: "success",
        title: "Table Created",
        description: `Table ${newTableNumber} created successfully.`,
      });
      setIsAddTableOpen(false);
      setNewTableNumber("");
      onRefresh();
    } else {
      addToast({
        type: "error",
        title: "Create Failed",
        description: res.error || "Failed to create table.",
      });
    }
    setIsSubmitting(false);
  };

  const handleConfirmTransfer = async () => {
    if (!selectedTable || !targetTableId) return;

    setIsSubmitting(true);
    const res = await transferTableOrder({
      from_table_id: selectedTable.id,
      to_table_id: targetTableId,
    });

    if (res.success) {
      addToast({
        type: "success",
        title: "Order Transferred",
        description: res.message,
      });
      setIsTransferOpen(false);
      setSelectedTable(null);
      onRefresh();
    } else {
      addToast({
        type: "error",
        title: "Transfer Failed",
        description: res.error || "Failed to transfer order.",
      });
    }
    setIsSubmitting(false);
  };

  const handleConfirmMerge = async () => {
    if (!selectedTable || !targetTableId) return;

    setIsSubmitting(true);
    const res = await mergeTables({
      source_table_id: selectedTable.id,
      target_table_id: targetTableId,
    });

    if (res.success) {
      addToast({
        type: "success",
        title: "Tables Merged",
        description: res.message,
      });
      setIsMergeOpen(false);
      setSelectedTable(null);
      onRefresh();
    } else {
      addToast({
        type: "error",
        title: "Merge Failed",
        description: res.error || "Failed to merge tables.",
      });
    }
    setIsSubmitting(false);
  };

  const handleSplitTable = async (tableId: string) => {
    const res = await splitTables(tableId);
    if (res.success) {
      addToast({
        type: "success",
        title: "Table Unmerged",
        description: res.message,
      });
      onRefresh();
    } else {
      addToast({
        type: "error",
        title: "Error",
        description: res.error || "Failed to unmerge table.",
      });
    }
  };

  const getStatusStyle = (status: TableStatus) => {
    const styles: Record<TableStatus, { bg: string; border: string; text: string; badge: string }> = {
      available: {
        bg: "bg-emerald-50/60 hover:bg-emerald-100/70",
        border: "border-emerald-300",
        text: "text-emerald-900",
        badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
      },
      occupied: {
        bg: "bg-blue-50/80 hover:bg-blue-100/90",
        border: "border-blue-400",
        text: "text-blue-900",
        badge: "bg-blue-100 text-blue-800 border-blue-300",
      },
      reserved: {
        bg: "bg-amber-50/70 hover:bg-amber-100/80",
        border: "border-amber-400",
        text: "text-amber-900",
        badge: "bg-amber-100 text-amber-800 border-amber-300",
      },
      cleaning: {
        bg: "bg-purple-50/70 hover:bg-purple-100/80",
        border: "border-purple-300",
        text: "text-purple-900",
        badge: "bg-purple-100 text-purple-800 border-purple-300",
      },
      disabled: {
        bg: "bg-restro-100/60 opacity-60",
        border: "border-restro-300",
        text: "text-restro-600",
        badge: "bg-restro-200 text-restro-700 border-restro-300",
      },
    };
    return styles[status];
  };

  return (
    <div className="space-y-4">
      {/* Floor Area Tabs & Add Table Action */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-restro-200 pb-3">
        <div className="flex space-x-2 overflow-x-auto w-full sm:w-auto">
          {floorAreas.map((area) => (
            <button
              key={area}
              onClick={() => setActiveFloor(area)}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold whitespace-nowrap transition-all ${
                activeFloor === area
                  ? "bg-brand-500 text-white shadow-card"
                  : "bg-surface text-restro-700 hover:bg-restro-100 border border-restro-200"
              }`}
            >
              {area} ({tables.filter((t) => t.floor_area === area).length})
            </button>
          ))}
        </div>

        <Button size="sm" onClick={() => setIsAddTableOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Add New Table
        </Button>
      </div>

      {/* Table Status Legend */}
      <div className="flex items-center space-x-4 text-xs font-semibold text-restro-600 bg-surface p-3 rounded-lg border border-restro-200">
        <span className="text-restro-400 font-bold uppercase text-[10px]">Legend:</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Occupied</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Reserved</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Cleaning</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-restro-400" /> Disabled</span>
      </div>

      {/* Visual Floor Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 min-h-[300px]">
        {filteredTables.map((tbl) => {
          const style = getStatusStyle(tbl.status);

          return (
            <Card
              key={tbl.id}
              onClick={() => setSelectedTable(tbl)}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex flex-col justify-between h-36 relative shadow-card ${style.bg} ${style.border}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className={`text-base font-black ${style.text}`}>
                    Table {tbl.table_number}
                  </h4>
                  <span className="text-[11px] font-bold text-restro-500 flex items-center gap-1 mt-0.5">
                    <Users className="h-3 w-3 inline" /> {tbl.capacity} Seats
                  </span>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${style.badge}`}>
                  {tbl.status}
                </span>
              </div>

              {/* Active Order snippet if occupied */}
              {tbl.status === "occupied" && tbl.active_order && (
                <div className="my-1 bg-white/80 p-1.5 rounded border border-blue-200 text-[11px]">
                  <span className="font-extrabold text-blue-900 block">
                    {tbl.active_order.order_number}
                  </span>
                  <span className="text-[10px] text-blue-700 block truncate">
                    ${tbl.active_order.total_amount.toFixed(2)} • {tbl.active_order.customer?.name || "Walk-in"}
                  </span>
                </div>
              )}

              {/* Merged Link Indicator */}
              {tbl.merged_into_table_id && (
                <span className="text-[10px] font-bold text-purple-700 flex items-center gap-1 mt-1">
                  <Link className="h-3 w-3" /> Merged
                </span>
              )}

              <div className="flex justify-between items-center text-[10px] font-bold text-restro-400 border-t border-black/5 pt-1 mt-auto">
                <span className="capitalize">{tbl.shape}</span>
                <span className="text-brand-600 hover:underline font-extrabold">Manage →</span>
              </div>
            </Card>
          );
        })}

        {filteredTables.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center text-restro-400 bg-surface rounded-xl border border-restro-200">
            <Utensils className="h-10 w-10 text-restro-300 mb-2" />
            <p className="text-xs font-semibold">No tables found on {activeFloor}</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setIsAddTableOpen(true)}>
              Add First Table
            </Button>
          </div>
        )}
      </div>

      {/* Selected Table Quick Actions Drawer */}
      {selectedTable && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-dialog max-w-md w-full p-5 space-y-4 border border-restro-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-restro-200 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-restro-900">
                  Manage Table {selectedTable.table_number}
                </h3>
                <p className="text-xs text-restro-500">
                  Floor: {selectedTable.floor_area} • Capacity: {selectedTable.capacity} Persons
                </p>
              </div>
              <button onClick={() => setSelectedTable(null)} className="text-restro-400 hover:text-restro-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Status Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-restro-700 uppercase">Change Status</label>
              <div className="grid grid-cols-3 gap-2">
                {(["available", "occupied", "reserved", "cleaning", "disabled"] as TableStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedTable.id, st)}
                    className={`py-2 rounded-lg text-xs font-extrabold capitalize border transition-all ${
                      selectedTable.status === st
                        ? "bg-brand-500 text-white border-brand-600 shadow-sm"
                        : "bg-background text-restro-700 border-restro-200 hover:bg-restro-50"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Table Operations */}
            <div className="space-y-2 pt-2 border-t border-restro-200">
              <label className="text-xs font-bold text-restro-700 uppercase">Table Operations</label>

              <div className="grid grid-cols-2 gap-2">
                {selectedTable.status === "occupied" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setIsTransferOpen(true);
                    }}
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5 mr-1.5 text-blue-600" /> Transfer Order
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setIsMergeOpen(true);
                  }}
                >
                  <Link className="h-3.5 w-3.5 mr-1.5 text-purple-600" /> Merge Table
                </Button>

                {selectedTable.merged_into_table_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 border-red-200"
                    onClick={() => handleSplitTable(selectedTable.id)}
                  >
                    <Unlink className="h-3.5 w-3.5 mr-1.5" /> Unmerge Table
                  </Button>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedTable(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Table Modal */}
      {isAddTableOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateTable}
            className="bg-surface rounded-xl shadow-dialog max-w-md w-full p-5 space-y-4 border border-restro-200 animate-in fade-in zoom-in-95"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-extrabold text-restro-900">Add New Floor Table</h3>
                <p className="text-xs text-restro-500">Add a table to branch floor layout</p>
              </div>
              <button type="button" onClick={() => setIsAddTableOpen(false)} className="text-restro-400 hover:text-restro-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <Input
              label="Table Number / Code"
              placeholder="e.g. T-12, Outdoor-3"
              value={newTableNumber}
              onChange={(e) => setNewTableNumber(e.target.value)}
              required
            />

            <Input
              label="Capacity (Seating Persons)"
              type="number"
              min="1"
              max="30"
              value={newCapacity}
              onChange={(e) => setNewCapacity(Number(e.target.value))}
              required
            />

            <Input
              label="Floor / Area Name"
              placeholder="e.g. Main Floor, Patio, VIP Section"
              value={newFloorArea}
              onChange={(e) => setNewFloorArea(e.target.value)}
              required
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-restro-700">Table Shape</label>
              <select
                value={newShape}
                onChange={(e) => setNewShape(e.target.value as TableShape)}
                className="w-full bg-background border border-restro-200 rounded-lg p-2 text-xs font-semibold"
              >
                <option value="square">Square</option>
                <option value="round">Round</option>
                <option value="rectangle">Rectangle</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-restro-200">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddTableOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" isLoading={isSubmitting} disabled={isSubmitting}>
                Save Table
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Transfer Order Dialog */}
      {isTransferOpen && selectedTable && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-dialog max-w-md w-full p-5 space-y-4 border border-restro-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-extrabold text-restro-900">
                  Transfer Order from Table {selectedTable.table_number}
                </h3>
                <p className="text-xs text-restro-500">Select target table to transfer active order</p>
              </div>
              <button onClick={() => setIsTransferOpen(false)} className="text-restro-400 hover:text-restro-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-restro-700">Target Table</label>
              <select
                value={targetTableId}
                onChange={(e) => setTargetTableId(e.target.value)}
                className="w-full bg-background border border-restro-200 rounded-lg p-2 text-xs font-semibold"
              >
                <option value="">-- Select Target Table --</option>
                {tables
                  .filter((t) => t.id !== selectedTable.id && t.status === "available")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      Table {t.table_number} ({t.floor_area}) [{t.capacity} seats]
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-restro-200">
              <Button variant="outline" size="sm" onClick={() => setIsTransferOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                isLoading={isSubmitting}
                disabled={!targetTableId || isSubmitting}
                onClick={handleConfirmTransfer}
              >
                Confirm Transfer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Tables Dialog */}
      {isMergeOpen && selectedTable && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl shadow-dialog max-w-md w-full p-5 space-y-4 border border-restro-200 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-extrabold text-restro-900">
                  Merge Table {selectedTable.table_number} into Another Table
                </h3>
                <p className="text-xs text-restro-500">Link tables for large group seating</p>
              </div>
              <button onClick={() => setIsMergeOpen(false)} className="text-restro-400 hover:text-restro-700">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-restro-700">Primary Parent Table</label>
              <select
                value={targetTableId}
                onChange={(e) => setTargetTableId(e.target.value)}
                className="w-full bg-background border border-restro-200 rounded-lg p-2 text-xs font-semibold"
              >
                <option value="">-- Select Parent Table --</option>
                {tables
                  .filter((t) => t.id !== selectedTable.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      Table {t.table_number} ({t.floor_area})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-restro-200">
              <Button variant="outline" size="sm" onClick={() => setIsMergeOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                isLoading={isSubmitting}
                disabled={!targetTableId || isSubmitting}
                onClick={handleConfirmMerge}
              >
                Confirm Merge
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
