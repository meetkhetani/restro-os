"use client";

import * as React from "react";
import {
  Truck,
  Plus,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  Search,
  DollarSign,
  PackageCheck,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  PurchaseOrder,
  Supplier,
  POStatus,
  createSupplier,
  createPurchaseOrder,
  submitPurchaseOrder,
  receivePOItemStock,
} from "@/domain/purchasing/actions";
import { Ingredient } from "@/domain/inventory/actions";

interface PurchasingCatalogClientProps {
  initialSuppliers: Supplier[];
  initialPurchaseOrders: PurchaseOrder[];
  initialIngredients?: Ingredient[];
  currentBranchId: string;
  branchName: string;
  onRefresh: () => void;
}

type PurchasingTab = "pos" | "suppliers";

export function PurchasingCatalogClient({
  initialSuppliers = [],
  initialPurchaseOrders = [],
  initialIngredients = [],
  currentBranchId,
  branchName,
  onRefresh,
}: PurchasingCatalogClientProps) {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = React.useState<PurchasingTab>("pos");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modal States
  const [isAddSupplierOpen, setIsAddSupplierOpen] = React.useState(false);
  const [isCreatePOOpen, setIsCreatePOOpen] = React.useState(false);
  const [receivingItem, setReceivingItem] = React.useState<{
    poId: string;
    itemId: string;
    itemName: string;
    ingredientId?: string;
    orderedQty: number;
    receivedQty: number;
  } | null>(null);

  // Supplier Form
  const [supName, setSupName] = React.useState("");
  const [supContact, setSupContact] = React.useState("");
  const [supEmail, setSupEmail] = React.useState("");
  const [supPhone, setSupPhone] = React.useState("");
  const [supTerms, setSupTerms] = React.useState("Net 30");

  // PO Form
  const [poSupplierId, setPoSupplierId] = React.useState("");
  const [poNotes, setPoNotes] = React.useState("");
  const [poItems, setPoItems] = React.useState<Array<{ ingredient_id: string; item_name: string; unit_price: number; ordered_qty: number }>>([
    { ingredient_id: "", item_name: "", unit_price: 5.0, ordered_qty: 10 },
  ]);

  // Receiving Form
  const [qtyReceivingNow, setQtyReceivingNow] = React.useState(5);
  const [receivingNotes, setReceivingNotes] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Handlers
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    setIsSubmitting(true);
    const res = await createSupplier({
      name: supName,
      contact_person: supContact,
      email: supEmail,
      phone: supPhone,
      payment_terms: supTerms,
    });
    setIsSubmitting(false);

    if (res.success) {
      addToast({ type: "success", title: "Supplier Created", description: `Vendor "${supName}" added.` });
      setSupName("");
      setSupContact("");
      setSupEmail("");
      setIsAddSupplierOpen(false);
      onRefresh();
    } else {
      addToast({ type: "error", title: "Failed", description: res.error });
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId || poItems.length === 0) return;

    setIsSubmitting(true);
    const res = await createPurchaseOrder({
      supplier_id: poSupplierId,
      notes: poNotes,
      items: poItems.filter((i) => i.item_name.trim() !== ""),
    });
    setIsSubmitting(false);

    if (res.success) {
      addToast({ type: "success", title: "PO Created", description: `Draft purchase order created.` });
      setIsCreatePOOpen(false);
      setPoNotes("");
      onRefresh();
    } else {
      addToast({ type: "error", title: "PO Creation Failed", description: res.error });
    }
  };

  const handleSubmitPO = async (poId: string) => {
    setIsSubmitting(true);
    const res = await submitPurchaseOrder(poId);
    setIsSubmitting(false);

    if (res.success) {
      addToast({ type: "success", title: "PO Submitted", description: "PO status set to Submitted." });
      onRefresh();
    } else {
      addToast({ type: "error", title: "Failed", description: res.error });
    }
  };

  const handleReceiveStock = async () => {
    if (!receivingItem || qtyReceivingNow <= 0) return;

    setIsSubmitting(true);
    const res = await receivePOItemStock(
      receivingItem.poId,
      receivingItem.itemId,
      receivingItem.ingredientId,
      qtyReceivingNow,
      receivingNotes
    );
    setIsSubmitting(false);

    if (res.success) {
      addToast({
        type: "success",
        title: "Stock Received & Ledger Updated",
        description: `Posted ${qtyReceivingNow} units to Stock Ledger. PO status: ${res.nextStatus?.toUpperCase()}`,
      });
      setReceivingItem(null);
      setReceivingNotes("");
      onRefresh();
    } else {
      addToast({ type: "error", title: "Receiving Failed", description: res.error });
    }
  };

  const handleAddPOLineItem = () => {
    setPoItems((prev) => [...prev, { ingredient_id: "", item_name: "", unit_price: 5.0, ordered_qty: 10 }]);
  };

  // Filter Purchase Orders
  const filteredPOs = React.useMemo(() => {
    return initialPurchaseOrders.filter((po) =>
      po.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplier?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [initialPurchaseOrders, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Catalog Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Truck className="h-6 w-6 text-brand-500" />
            Purchasing & Supplier Management
            <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2.5 py-0.5 rounded-full">
              {branchName}
            </span>
          </h1>
          <p className="text-xs font-medium text-gray-500">
            Vendor Directory, Purchase Orders Lifecycle, Partial Receiving, and Automated Stock Ledger.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            onClick={() => setIsAddSupplierOpen(true)}
            variant="outline"
            className="font-bold border-gray-300 text-gray-700"
          >
            <Users className="h-4 w-4 mr-1.5" /> + New Vendor
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreatePOOpen(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Create Purchase Order
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("pos")}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-xs font-bold transition-all ${
              activeTab === "pos"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Purchase Orders ({initialPurchaseOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("suppliers")}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-xs font-bold transition-all ${
              activeTab === "suppliers"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Suppliers & Vendors ({initialSuppliers.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PURCHASE ORDERS */}
      {activeTab === "pos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search PO number or vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white text-xs"
              />
            </div>
          </div>

          {filteredPOs.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
              <FileText className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-sm font-bold text-gray-700">No purchase orders created yet.</p>
              <p className="text-xs text-gray-500">Click &quot;Create Purchase Order&quot; to generate a vendor PO.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredPOs.map((po) => (
                <Card key={po.id} className="p-5 space-y-4 border shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                          {po.po_number}
                        </span>
                        <h3 className="text-base font-extrabold text-gray-900 mt-1">{po.supplier?.name}</h3>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase ${
                          po.status === "received"
                            ? "bg-emerald-100 text-emerald-800"
                            : po.status === "partially_received"
                            ? "bg-amber-100 text-amber-800"
                            : po.status === "submitted"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {po.status.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg">
                      <span>Total Cost: <strong className="text-gray-900">${Number(po.total_amount).toFixed(2)}</strong></span>
                      <span>Date: {new Date(po.created_at).toLocaleDateString()}</span>
                    </div>

                    {/* PO Line Items Table */}
                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-bold text-gray-700">Line Items:</p>
                      {(po.items || []).map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs bg-white p-2 rounded border border-gray-100">
                          <div>
                            <span className="font-bold text-gray-900">{item.item_name}</span>
                            <span className="block text-[10px] text-gray-500">
                              Ordered: {item.ordered_qty} | Received: {item.received_qty}
                            </span>
                          </div>

                          {(po.status === "submitted" || po.status === "partially_received") && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setQtyReceivingNow(Number(item.ordered_qty) - Number(item.received_qty));
                                setReceivingItem({
                                  poId: po.id,
                                  itemId: item.id,
                                  itemName: item.item_name,
                                  ingredientId: item.ingredient_id,
                                  orderedQty: Number(item.ordered_qty),
                                  receivedQty: Number(item.received_qty),
                                });
                              }}
                              className="text-[11px] bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 font-bold"
                            >
                              <PackageCheck className="h-3.5 w-3.5 mr-1" /> Receive
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  {po.status === "draft" && (
                    <div className="pt-3 border-t flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleSubmitPO(po.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                      >
                        <Send className="h-3.5 w-3.5 mr-1.5" /> Submit PO to Vendor
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUPPLIERS & VENDORS */}
      {activeTab === "suppliers" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initialSuppliers.map((sup) => (
              <Card key={sup.id} className="p-5 space-y-3 border shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">{sup.name}</h3>
                    {sup.contact_person && (
                      <p className="text-xs text-gray-500 font-medium">Contact: {sup.contact_person}</p>
                    )}
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                    {sup.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-gray-600 pt-2 border-t border-gray-100">
                  {sup.email && <p><strong>Email:</strong> {sup.email}</p>}
                  {sup.phone && <p><strong>Phone:</strong> {sup.phone}</p>}
                  <p><strong>Terms:</strong> {sup.payment_terms}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD SUPPLIER */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreateSupplier} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Add Vendor / Supplier</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Company / Supplier Name *</label>
              <Input value={supName} onChange={(e) => setSupName(e.target.value)} required placeholder="e.g. Fresh Farms Produce Ltd." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Person</label>
                <Input value={supContact} onChange={(e) => setSupContact(e.target.value)} placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                <Input value={supPhone} onChange={(e) => setSupPhone(e.target.value)} placeholder="+1 555-0192" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
              <Input type="email" value={supEmail} onChange={(e) => setSupEmail(e.target.value)} placeholder="orders@freshfarms.com" />
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button variant="ghost" type="button" onClick={() => setIsAddSupplierOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-500 text-white font-bold">Save Vendor</Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CREATE PO */}
      {isCreatePOOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <form onSubmit={handleCreatePO} className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-8">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Create Purchase Order</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Select Supplier *</label>
              <select
                value={poSupplierId}
                onChange={(e) => setPoSupplierId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:outline-none"
              >
                <option value="">Select Vendor</option>
                {initialSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.payment_terms})
                  </option>
                ))}
              </select>
            </div>

            {/* Line Items Builder */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b pb-1">
                <label className="text-xs font-bold text-gray-800">PO Line Items</label>
                <Button size="sm" type="button" variant="outline" onClick={handleAddPOLineItem} className="text-xs">
                  + Add Line Item
                </Button>
              </div>

              {poItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 bg-gray-50 p-2.5 rounded-lg items-center">
                  <div className="col-span-5">
                    <Input
                      placeholder="Item name / ingredient..."
                      value={item.item_name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPoItems((prev) => prev.map((it, i) => (i === idx ? { ...it, item_name: val } : it)));
                      }}
                      required
                      className="bg-white text-xs"
                    />
                  </div>

                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Unit Price"
                      value={item.unit_price}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPoItems((prev) => prev.map((it, i) => (i === idx ? { ...it, unit_price: val } : it)));
                      }}
                      required
                      className="bg-white text-xs"
                    />
                  </div>

                  <div className="col-span-4">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.ordered_qty}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setPoItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ordered_qty: val } : it)));
                      }}
                      required
                      className="bg-white text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button variant="ghost" type="button" onClick={() => setIsCreatePOOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-500 text-white font-bold">Generate PO</Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: RECEIVE PO STOCK */}
      {receivingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">
              Receive PO Stock: {receivingItem.itemName}
            </h3>

            <div className="bg-amber-50 p-3 rounded-lg text-xs text-amber-900 space-y-1">
              <p>Ordered: <strong>{receivingItem.orderedQty} units</strong></p>
              <p>Already Received: <strong>{receivingItem.receivedQty} units</strong></p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity Receiving Now *</label>
              <Input
                type="number"
                step="0.1"
                min={0.1}
                value={qtyReceivingNow}
                onChange={(e) => setQtyReceivingNow(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Receiving Notes</label>
              <Input
                value={receivingNotes}
                onChange={(e) => setReceivingNotes(e.target.value)}
                placeholder="e.g. Shipment delivered via Truck #402"
              />
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setReceivingItem(null)}>Cancel</Button>
              <Button onClick={handleReceiveStock} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                Post to Stock Ledger
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
