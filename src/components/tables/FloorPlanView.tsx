"use client";

import * as React from "react";
import {
  Utensils,
  Plus,
  ArrowRightLeft,
  Link as LinkIcon,
  Unlink,
  X,
  Users,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  Floor,
  TableItemExtended,
  TableStatus,
  TableShape,
} from "@/domain/tables/types";
import {
  createFloor,
  createTable,
  updateTableStatus,
  transferTableOrder,
  mergeTables,
  splitTables,
} from "@/domain/tables/actions";

interface FloorPlanViewProps {
  floors: Floor[];
  tables: TableItemExtended[];
  onRefresh: () => void;
}

export function FloorPlanView({
  floors = [],
  tables = [],
  onRefresh,
}: FloorPlanViewProps) {
  const { addToast } = useToast();

  const safeFloors = React.useMemo(() => floors || [], [floors]);
  const safeTables = React.useMemo(() => tables || [], [tables]);

  const [activeFloorId, setActiveFloorId] = React.useState<string>(
    safeFloors[0]?.id || ""
  );

  // Synchronize active floor ID when floors update
  React.useEffect(() => {
    if (safeFloors.length > 0 && (!activeFloorId || !safeFloors.some((f) => f.id === activeFloorId))) {
      setActiveFloorId(safeFloors[0].id);
    }
  }, [safeFloors, activeFloorId]);

  // Selected Table & Modals State
  const [selectedTable, setSelectedTable] = React.useState<TableItemExtended | null>(null);
  const [isAddFloorOpen, setIsAddFloorOpen] = React.useState(false);
  const [isAddTableOpen, setIsAddTableOpen] = React.useState(false);
  const [isTransferOpen, setIsTransferOpen] = React.useState(false);
  const [isMergeOpen, setIsMergeOpen] = React.useState(false);

  // Form Inputs
  const [newFloorName, setNewFloorName] = React.useState("");
  const [newTableNumber, setNewTableNumber] = React.useState("");
  const [newCapacity, setNewCapacity] = React.useState(4);
  const [targetFloorId, setTargetFloorId] = React.useState(activeFloorId);
  const [newShape, setNewShape] = React.useState<TableShape>("square");
  const [targetTableId, setTargetTableId] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Keep targetFloorId aligned with activeFloorId
  React.useEffect(() => {
    setTargetFloorId(activeFloorId);
  }, [activeFloorId]);

  const activeFloor = React.useMemo(() => {
    return safeFloors.find((f) => f.id === activeFloorId) || safeFloors[0];
  }, [safeFloors, activeFloorId]);

  const filteredTables = React.useMemo(() => {
    if (!activeFloorId) return safeTables;
    return safeTables.filter((t) => t.floor_id === activeFloorId || t.floor_area === activeFloor?.name);
  }, [safeTables, activeFloorId, activeFloor]);

  const handleStatusChange = async (tableId: string, status: TableStatus) => {
    const res = await updateTableStatus(tableId, status);
    if (res.success) {
      addToast({
        type: "success",
        title: "Status Updated",
        description: "Table status updated successfully.",
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

  const handleCreateFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorName.trim()) {
      addToast({
        type: "error",
        title: "Validation Error",
        description: "Please enter a floor name.",
      });
      return;
    }

    setIsSubmitting(true);
    const res = await createFloor({ name: newFloorName.trim() });
    setIsSubmitting(false);

    if (res.success && res.floor) {
      addToast({
        type: "success",
        title: "Floor Created",
        description: `Floor "${res.floor.name}" has been created.`,
      });
      setNewFloorName("");
      setIsAddFloorOpen(false);
      onRefresh();
    } else {
      addToast({
        type: "error",
        title: "Create Failed",
        description: res.error || "Failed to create floor.",
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

    const selectedFloor = targetFloorId || activeFloorId;
    if (!selectedFloor) {
      addToast({
        type: "error",
        title: "Validation Error",
        description: "Please select a floor for the table.",
      });
      return;
    }

    setIsSubmitting(true);
    const res = await createTable({
      floor_id: selectedFloor,
      table_number: newTableNumber.trim(),
      capacity: newCapacity,
      shape: newShape,
    });
    setIsSubmitting(false);

    if (res.success) {
      addToast({
        type: "success",
        title: "Table Created",
        description: `Table #${newTableNumber} created successfully.`,
      });
      setNewTableNumber("");
      setNewCapacity(4);
      setIsAddTableOpen(false);
      onRefresh();
    } else {
      addToast({
        type: "error",
        title: "Create Failed",
        description: res.error || "Failed to create table.",
      });
    }
  };

  const handleTransferOrder = async () => {
    if (!selectedTable || !targetTableId) return;

    setIsSubmitting(true);
    const res = await transferTableOrder({
      from_table_id: selectedTable.id,
      to_table_id: targetTableId,
    });
    setIsSubmitting(false);

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
        description: res.error,
      });
    }
  };

  const handleMergeTables = async () => {
    if (!selectedTable || !targetTableId) return;

    setIsSubmitting(true);
    const res = await mergeTables({
      source_table_id: selectedTable.id,
      target_table_id: targetTableId,
    });
    setIsSubmitting(false);

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
        description: res.error,
      });
    }
  };

  const handleSplitTable = async (tableId: string) => {
    setIsSubmitting(true);
    const res = await splitTables(tableId);
    setIsSubmitting(false);

    if (res.success) {
      addToast({
        type: "success",
        title: "Table Unmerged",
        description: res.message,
      });
      setSelectedTable(null);
      onRefresh();
    } else {
      addToast({
        type: "error",
        title: "Split Failed",
        description: res.error,
      });
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case "available":
        return "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100";
      case "occupied":
        return "bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100";
      case "reserved":
        return "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100";
      case "cleaning":
        return "bg-blue-50 border-blue-300 text-blue-800 hover:bg-blue-100";
      case "disabled":
        return "bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-200 cursor-not-allowed";
      default:
        return "bg-white border-gray-200 text-gray-700";
    }
  };

  const getShapeStyle = (shape: TableShape) => {
    switch (shape) {
      case "round":
        return "rounded-full w-36 h-36";
      case "rectangle":
        return "rounded-xl w-52 h-32";
      case "square":
      default:
        return "rounded-2xl w-36 h-36";
    }
  };

  return (
    <div className="space-y-6">
      {/* Floor Selection Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {safeFloors.map((floor) => (
            <button
              key={floor.id}
              onClick={() => setActiveFloorId(floor.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                activeFloorId === floor.id
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              <Layers className="h-4 w-4" />
              {floor.name}
            </button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddFloorOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border-dashed border-gray-300 text-gray-600 hover:border-amber-600 hover:text-amber-600"
          >
            <Plus className="h-4 w-4" />
            Add Floor
          </Button>
        </div>

        <Button
          onClick={() => setIsAddTableOpen(true)}
          className="flex items-center gap-2 bg-amber-600 font-semibold text-white hover:bg-amber-700 shadow-md shadow-amber-600/20"
        >
          <Plus className="h-4 w-4" />
          Add Table
        </Button>
      </div>

      {/* Visual Floor Plan Grid */}
      <Card className="min-h-[460px] p-6 border-gray-200 shadow-sm bg-slate-50/50">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-lg">
              {activeFloor?.name || "Main Floor"} Layout
            </h3>
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
              {filteredTables.length} Tables
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500" /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500" /> Occupied
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-500" /> Reserved
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-blue-500" /> Cleaning
            </span>
          </div>
        </div>

        {filteredTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Utensils className="h-12 w-12 text-gray-300 mb-3" />
            <p className="font-semibold text-gray-700">No tables on this floor</p>
            <p className="text-sm text-gray-500 mb-4">
              Add tables to {activeFloor?.name || "this floor"} to start managing dine-in seating.
            </p>
            <Button
              onClick={() => setIsAddTableOpen(true)}
              size="sm"
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Add First Table
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredTables.map((table) => (
              <div
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className={`relative flex flex-col items-center justify-between p-4 border-2 cursor-pointer transition-all hover:scale-105 shadow-sm ${getShapeStyle(
                  table.shape
                )} ${getStatusColor(table.status)}`}
              >
                {/* Table Header */}
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                    T-{table.table_number}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold">
                    <Users className="h-3 w-3" /> {table.capacity}
                  </span>
                </div>

                {/* Table Center Info */}
                <div className="my-auto text-center">
                  <span className="block font-black text-xl tracking-tight">
                    #{table.table_number}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest block mt-0.5">
                    {table.status}
                  </span>
                  {table.active_order && (
                    <span className="mt-1 inline-block rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      ${Number(table.active_order.total_amount).toFixed(2)}
                    </span>
                  )}
                  {table.merged_into_table_id && (
                    <span className="mt-1 inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700">
                      <LinkIcon className="h-2.5 w-2.5" /> Merged
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Selected Table Quick Actions Drawer / Modal */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Table #{selectedTable.table_number}
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedTable.floor?.name || selectedTable.floor_area || "Main Floor"} • Capacity: {selectedTable.capacity} persons
                </p>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Status Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700">Change Status</label>
              <div className="grid grid-cols-3 gap-2">
                {(["available", "occupied", "reserved", "cleaning", "disabled"] as TableStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedTable.id, st)}
                    className={`rounded-lg px-2.5 py-2 text-xs font-bold capitalize transition-all border ${
                      selectedTable.status === st
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {selectedTable.status === "occupied" && (
                <Button
                  onClick={() => setIsTransferOpen(true)}
                  variant="outline"
                  className="flex items-center justify-center gap-2 border-gray-300 text-xs font-bold"
                >
                  <ArrowRightLeft className="h-4 w-4" /> Transfer Order
                </Button>
              )}

              <Button
                onClick={() => setIsMergeOpen(true)}
                variant="outline"
                className="flex items-center justify-center gap-2 border-gray-300 text-xs font-bold"
              >
                <LinkIcon className="h-4 w-4" /> Merge Tables
              </Button>

              {selectedTable.merged_into_table_id && (
                <Button
                  onClick={() => handleSplitTable(selectedTable.id)}
                  variant="outline"
                  className="col-span-2 border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold"
                >
                  <Unlink className="h-4 w-4 mr-2" /> Unmerge Table
                </Button>
              )}
            </div>

            <div className="pt-2 border-t flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTable(null)}
                className="text-gray-500"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Floor Modal */}
      {isAddFloorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Add New Floor / Area</h3>
              <button onClick={() => setIsAddFloorOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFloor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Floor / Area Name
                </label>
                <Input
                  value={newFloorName}
                  onChange={(e) => setNewFloorName(e.target.value)}
                  placeholder="e.g. Ground Floor, First Floor, Rooftop, Patio"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddFloorOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-amber-600 text-white hover:bg-amber-700">
                  {isSubmitting ? "Saving..." : "Save Floor"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Table Modal */}
      {isAddTableOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Add New Floor Table</h3>
              <button onClick={() => setIsAddTableOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Table Number / Code
                </label>
                <Input
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="e.g. 101, T01, VIP-1"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Capacity (Seating Persons)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Floor / Area
                </label>
                <select
                  value={targetFloorId}
                  onChange={(e) => setTargetFloorId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                >
                  {safeFloors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Table Shape
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["square", "round", "rectangle"] as TableShape[]).map((shape) => (
                    <button
                      type="button"
                      key={shape}
                      onClick={() => setNewShape(shape)}
                      className={`rounded-lg p-2 text-xs font-semibold capitalize border ${
                        newShape === shape
                          ? "bg-amber-600 text-white border-amber-600"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddTableOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-amber-600 text-white hover:bg-amber-700">
                  {isSubmitting ? "Saving..." : "Save Table"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Order Dialog */}
      {isTransferOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Transfer Order from Table #{selectedTable.table_number}
            </h3>
            <p className="text-xs text-gray-500">
              Select destination table to move active order details and items.
            </p>

            <select
              value={targetTableId}
              onChange={(e) => setTargetTableId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">-- Select Destination Table --</option>
              {tables
                .filter((t) => t.id !== selectedTable.id && t.status === "available")
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    Table #{t.table_number} ({t.floor?.name || t.floor_area || "Main Floor"})
                  </option>
                ))}
            </select>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsTransferOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!targetTableId || isSubmitting}
                onClick={handleTransferOrder}
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                Confirm Transfer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Tables Dialog */}
      {isMergeOpen && selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Merge Table #{selectedTable.table_number}
            </h3>
            <p className="text-xs text-gray-500">
              Select primary table to merge seating capacity for large group parties.
            </p>

            <select
              value={targetTableId}
              onChange={(e) => setTargetTableId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">-- Select Target Table --</option>
              {tables
                .filter((t) => t.id !== selectedTable.id)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    Table #{t.table_number} ({t.floor?.name || t.floor_area || "Main Floor"})
                  </option>
                ))}
            </select>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsMergeOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!targetTableId || isSubmitting}
                onClick={handleMergeTables}
                className="bg-amber-600 text-white hover:bg-amber-700"
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
