"use client";

import * as React from "react";
import {
  Boxes,
  Plus,
  ArrowRightLeft,
  AlertTriangle,
  FileText,
  TrendingDown,
  TrendingUp,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  Package,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  BranchInventoryItem,
  Ingredient,
  StockMovement,
  StockTransfer,
  MovementType,
  createIngredient,
  recordStockMovement,
  createStockTransfer,
  completeStockTransfer,
} from "@/domain/inventory/actions";

interface InventoryCatalogClientProps {
  initialInventory: BranchInventoryItem[];
  initialIngredients: Ingredient[];
  initialMovements: StockMovement[];
  initialTransfers: StockTransfer[];
  currentBranchId: string;
  branchName: string;
  availableBranches?: Array<{ id: string; name: string }>;
  onRefresh: () => void;
}

type InventoryTab = "levels" | "ledger" | "transfers";

export function InventoryCatalogClient({
  initialInventory = [],
  initialIngredients = [],
  initialMovements = [],
  initialTransfers = [],
  currentBranchId,
  branchName,
  availableBranches = [],
  onRefresh,
}: InventoryCatalogClientProps) {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = React.useState<InventoryTab>("levels");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modal States
  const [isAddIngredientOpen, setIsAddIngredientOpen] = React.useState(false);
  const [isReceiveStockOpen, setIsReceiveStockOpen] = React.useState<string | null>(null);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = React.useState<string | null>(null);
  const [isTransferOpen, setIsTransferOpen] = React.useState(false);

  // Form Inputs
  const [ingName, setIngName] = React.useState("");
  const [ingSku, setIngSku] = React.useState("");
  const [ingCategory, setIngCategory] = React.useState("General");
  const [ingUnit, setIngUnit] = React.useState("kg");
  const [ingCost, setIngCost] = React.useState(5.0);
  const [ingThreshold, setIngThreshold] = React.useState(10.0);

  const [movementQty, setMovementQty] = React.useState(10);
  const [movementType, setMovementType] = React.useState<MovementType>("purchase_received");
  const [movementNotes, setMovementNotes] = React.useState("");

  const [transferTargetBranch, setTransferTargetBranch] = React.useState("");
  const [transferIngredientId, setTransferIngredientId] = React.useState("");
  const [transferQty, setTransferQty] = React.useState(5);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Handlers
  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingName.trim()) return;

    setIsSubmitting(true);
    const res = await createIngredient({
      name: ingName,
      sku: ingSku,
      category: ingCategory,
      unit: ingUnit,
      unit_cost: ingCost,
      min_threshold: ingThreshold,
      reorder_level: ingThreshold * 2,
    });
    setIsSubmitting(false);

    if (res.success) {
      addToast({ type: "success", title: "Ingredient Added", description: `"${ingName}" added to catalog.` });
      setIngName("");
      setIngSku("");
      setIsAddIngredientOpen(false);
      onRefresh();
    } else {
      addToast({ type: "error", title: "Failed", description: res.error });
    }
  };

  const handleRecordMovement = async (ingredientId: string) => {
    if (movementQty === 0) return;

    setIsSubmitting(true);
    // Quantity delta sign: positive for purchase/transfer_in, negative for wastage/adjustment/pos_deduction
    const delta = movementType === "purchase_received" || movementType === "transfer_in"
      ? Math.abs(movementQty)
      : -Math.abs(movementQty);

    const res = await recordStockMovement({
      ingredient_id: ingredientId,
      movement_type: movementType,
      quantity: delta,
      notes: movementNotes,
      branch_id: currentBranchId,
    });
    setIsSubmitting(false);

    if (res.success) {
      addToast({
        type: "success",
        title: "Stock Ledger Updated",
        description: `New balance snapshot: ${res.newBalance}`,
      });
      setIsReceiveStockOpen(null);
      setIsAdjustmentOpen(null);
      setMovementNotes("");
      onRefresh();
    } else {
      addToast({ type: "error", title: "Ledger Update Failed", description: res.error });
    }
  };

  const handleInitiateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferTargetBranch || !transferIngredientId || transferQty <= 0) return;

    setIsSubmitting(true);
    const res = await createStockTransfer({
      from_branch_id: currentBranchId,
      to_branch_id: transferTargetBranch,
      ingredient_id: transferIngredientId,
      quantity: transferQty,
    });
    setIsSubmitting(false);

    if (res.success) {
      addToast({ type: "success", title: "Transfer Initiated", description: "Inter-branch stock transfer logged." });
      setIsTransferOpen(false);
      onRefresh();
    } else {
      addToast({ type: "error", title: "Transfer Failed", description: res.error });
    }
  };

  const handleCompleteTransfer = async (transferId: string) => {
    setIsSubmitting(true);
    const res = await completeStockTransfer(transferId);
    setIsSubmitting(false);

    if (res.success) {
      addToast({ type: "success", title: "Transfer Completed", description: "Stock ledgers updated for both branches." });
      onRefresh();
    } else {
      addToast({ type: "error", title: "Failed", description: res.error });
    }
  };

  // Filter Inventory Items
  const filteredInventory = React.useMemo(() => {
    return initialInventory.filter((item) =>
      item.ingredient?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ingredient?.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [initialInventory, searchQuery]);

  const lowStockCount = initialInventory.filter((i) => i.is_low_stock).length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Boxes className="h-6 w-6 text-brand-500" />
            Stock & Branch Inventory
            <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2.5 py-0.5 rounded-full">
              {branchName}
            </span>
          </h1>
          <p className="text-xs font-medium text-gray-500">
            Immutable Stock Ledger, Inter-Branch Transfers, Waste Tracking, and Reorder Alerts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            onClick={() => setIsTransferOpen(true)}
            variant="outline"
            className="font-bold border-gray-300 text-gray-700"
          >
            <ArrowRightLeft className="h-4 w-4 mr-1.5" /> Inter-Branch Transfer
          </Button>

          <Button
            size="sm"
            onClick={() => setIsAddIngredientOpen(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Ingredient
          </Button>
        </div>
      </div>

      {/* Reorder Low Stock Alert Banner */}
      {lowStockCount > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-amber-900">
                {lowStockCount} Ingredient{lowStockCount > 1 ? "s" : ""} Below Reorder Threshold
              </h3>
              <p className="text-xs text-amber-700 font-medium">
                Stock level is below configured minimum threshold. Receive incoming purchase stock to prevent stockouts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("levels")}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-xs font-bold transition-all ${
              activeTab === "levels"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Package className="h-4 w-4" />
            <span>Stock Levels ({initialInventory.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("ledger")}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-xs font-bold transition-all ${
              activeTab === "ledger"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Stock Ledger Trail ({initialMovements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("transfers")}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-xs font-bold transition-all ${
              activeTab === "transfers"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <ArrowRightLeft className="h-4 w-4" />
            <span>Inter-Branch Transfers ({initialTransfers.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: STOCK LEVELS */}
      {activeTab === "levels" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search raw ingredients by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white text-xs"
              />
            </div>
          </div>

          <Card className="overflow-hidden border shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Ingredient</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Quantity On Hand</th>
                  <th className="p-3">Unit Cost</th>
                  <th className="p-3">Threshold</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 font-medium">
                    <td className="p-3 font-bold text-gray-900">
                      {item.ingredient?.name}
                      {item.ingredient?.sku && (
                        <span className="block text-[10px] font-mono text-gray-400">SKU: {item.ingredient.sku}</span>
                      )}
                    </td>
                    <td className="p-3 text-gray-600">{item.ingredient?.category}</td>
                    <td className="p-3">
                      <span className="text-sm font-extrabold text-gray-900">
                        {item.quantity_on_hand} {item.ingredient?.unit}
                      </span>
                    </td>
                    <td className="p-3 text-gray-700">${Number(item.unit_cost).toFixed(2)}</td>
                    <td className="p-3 text-gray-500">Min: {item.ingredient?.min_threshold} {item.ingredient?.unit}</td>
                    <td className="p-3">
                      {item.is_low_stock ? (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          <AlertTriangle className="h-3 w-3" /> LOW STOCK
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit">
                          Optimal
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setMovementType("purchase_received");
                          setIsReceiveStockOpen(item.ingredient_id);
                        }}
                        className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      >
                        + Receive
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setMovementType("wastage");
                          setIsAdjustmentOpen(item.ingredient_id);
                        }}
                        className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                      >
                        - Waste / Adjust
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* TAB 2: STOCK LEDGER TRAIL */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          <Card className="overflow-hidden border shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Ingredient</th>
                  <th className="p-3">Movement Type</th>
                  <th className="p-3">Quantity Delta</th>
                  <th className="p-3">Balance After</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {initialMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50 font-medium">
                    <td className="p-3 text-gray-500 font-mono">
                      {new Date(mov.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-gray-900">{mov.ingredient?.name}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          mov.movement_type === "purchase_received" || mov.movement_type === "transfer_in"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {mov.movement_type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3 font-bold">
                      {Number(mov.quantity) > 0 ? (
                        <span className="text-emerald-600 flex items-center">
                          <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" /> +{mov.quantity}
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center">
                          <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" /> {mov.quantity}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-gray-900">{mov.balance_after}</td>
                    <td className="p-3 text-gray-600 italic">{mov.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* TAB 3: INTER-BRANCH TRANSFERS */}
      {activeTab === "transfers" && (
        <div className="space-y-4">
          <Card className="overflow-hidden border shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Ingredient</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {initialTransfers.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 font-medium">
                    <td className="p-3 text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="p-3 font-bold text-gray-900">{t.ingredient?.name}</td>
                    <td className="p-3 font-extrabold text-gray-900">{t.quantity}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {t.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleCompleteTransfer(t.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                        >
                          Complete Transfer
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {/* MODAL: ADD INGREDIENT */}
      {isAddIngredientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreateIngredient} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Add Raw Ingredient</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ingredient Name *</label>
              <Input value={ingName} onChange={(e) => setIngName(e.target.value)} required placeholder="e.g. Mozzarella Cheese" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">SKU / Code</label>
                <Input value={ingSku} onChange={(e) => setIngSku(e.target.value)} placeholder="ING-101" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Unit *</label>
                <Input value={ingUnit} onChange={(e) => setIngUnit(e.target.value)} required placeholder="kg, grams, liters, pcs" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Unit Cost ($)</label>
                <Input type="number" step="0.01" value={ingCost} onChange={(e) => setIngCost(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reorder Threshold</label>
                <Input type="number" value={ingThreshold} onChange={(e) => setIngThreshold(Number(e.target.value))} />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button variant="ghost" type="button" onClick={() => setIsAddIngredientOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-500 text-white font-bold">Save Ingredient</Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: RECEIVE / ADJUSTMENT */}
      {(isReceiveStockOpen || isAdjustmentOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              {isReceiveStockOpen ? "Receive Stock Purchase" : "Log Wastage / Adjustment"}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity Delta *</label>
              <Input
                type="number"
                step="0.1"
                value={movementQty}
                onChange={(e) => setMovementQty(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Reason</label>
              <Input
                value={movementNotes}
                onChange={(e) => setMovementNotes(e.target.value)}
                placeholder="e.g. Received shipment invoice #402, or Damaged in transit"
              />
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => { setIsReceiveStockOpen(null); setIsAdjustmentOpen(null); }}>
                Cancel
              </Button>
              <Button
                onClick={() => handleRecordMovement(isReceiveStockOpen || isAdjustmentOpen || "")}
                disabled={isSubmitting}
                className="bg-brand-500 text-white font-bold"
              >
                Log Movement
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
