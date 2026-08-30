"use client";

import * as React from "react";
import {
  Users,
  Plus,
  Search,
  Star,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Utensils,
  Award,
  Heart,
  ShieldCheck,
  Edit2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  CustomerProfile,
  CustomerPreferences,
  createCustomer,
  updateCustomerPreferences,
} from "@/domain/customers/actions";

interface CustomersCatalogClientProps {
  initialCustomers: CustomerProfile[];
  branchName: string;
  onRefresh: () => void;
}

export function CustomersCatalogClient({
  initialCustomers = [],
  branchName,
  onRefresh,
}: CustomersCatalogClientProps) {
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedTierFilter, setSelectedTierFilter] = React.useState<string>("all");

  // Modal States
  const [isAddCustomerOpen, setIsAddCustomerOpen] = React.useState(false);
  const [selectedGuest, setSelectedGuest] = React.useState<CustomerProfile | null>(null);

  // Form Inputs
  const [custName, setCustName] = React.useState("");
  const [custPhone, setCustPhone] = React.useState("");
  const [custEmail, setCustEmail] = React.useState("");
  const [custNotes, setCustNotes] = React.useState("");
  const [dietaryInput, setDietaryInput] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Edit Preferences State
  const [editDietary, setEditDietary] = React.useState<string[]>([]);
  const [editSeating, setEditSeating] = React.useState<string>("");
  const [editNotes, setEditNotes] = React.useState<string>("");

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    setIsSubmitting(true);
    const dietaryTags = dietaryInput.split(",").map((s) => s.trim()).filter((s) => s !== "");
    const res = await createCustomer({
      name: custName,
      phone: custPhone,
      email: custEmail,
      notes: custNotes,
      preferences: { dietary: dietaryTags, favorite_items: [], seating: null },
    });
    setIsSubmitting(false);

    if (res.success) {
      addToast({ type: "success", title: "Customer Added", description: `Profile created for "${custName}".` });
      setCustName("");
      setCustPhone("");
      setCustEmail("");
      setCustNotes("");
      setDietaryInput("");
      setIsAddCustomerOpen(false);
      onRefresh();
    } else {
      addToast({ type: "error", title: "Failed", description: res.error });
    }
  };

  const handleUpdatePreferences = async () => {
    if (!selectedGuest) return;

    setIsSubmitting(true);
    const res = await updateCustomerPreferences(
      selectedGuest.id,
      {
        dietary: editDietary,
        favorite_items: selectedGuest.preferences?.favorite_items || [],
        seating: editSeating || null,
      },
      editNotes
    );
    setIsSubmitting(false);

    if (res.success) {
      addToast({ type: "success", title: "Preferences Updated" });
      setSelectedGuest(null);
      onRefresh();
    } else {
      addToast({ type: "error", title: "Update Failed", description: res.error });
    }
  };

  // Filter Customers
  const filteredCustomers = React.useMemo(() => {
    return initialCustomers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTier = selectedTierFilter === "all" || c.tier === selectedTierFilter;
      return matchesSearch && matchesTier;
    });
  }, [initialCustomers, searchQuery, selectedTierFilter]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-500" />
            Customer CRM & Guest Profiles
            <span className="text-xs bg-brand-100 text-brand-700 font-bold px-2.5 py-0.5 rounded-full">
              Organization Identity
            </span>
          </h1>
          <p className="text-xs font-medium text-gray-500">
            Guest Preferences, Dietary Requirements, Cross-Branch Spending, and Order Frequency.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsAddCustomerOpen(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Add Customer Profile
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search guests by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white text-xs"
          />
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-500">Guest Tier:</span>
          <select
            value={selectedTierFilter}
            onChange={(e) => setSelectedTierFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium focus:outline-none"
          >
            <option value="all">All Tiers</option>
            <option value="VIP">⭐ VIP Guests</option>
            <option value="Regular">Regulars</option>
            <option value="New Guest">New Guests</option>
          </select>
        </div>
      </div>

      {/* Guest Directory Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
          <Users className="h-8 w-8 text-gray-400 mx-auto" />
          <p className="text-sm font-bold text-gray-700">No customer profiles found.</p>
          <p className="text-xs text-gray-500">Click &quot;Add Customer Profile&quot; to register a guest profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((cust) => (
            <Card key={cust.id} className="p-5 space-y-4 border shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">{cust.name}</h3>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 font-medium mt-0.5">
                      {cust.phone && <span><Phone className="h-3 w-3 inline mr-1" />{cust.phone}</span>}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1 ${
                      cust.tier === "VIP"
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : cust.tier === "Regular"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {cust.tier === "VIP" && <Star className="h-3 w-3 fill-amber-500 text-amber-500" />}
                    {cust.tier}
                  </span>
                </div>

                {/* Spending Summary */}
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-lg text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Spent</span>
                    <strong className="text-sm font-black text-gray-900">${cust.total_spent.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-bold">Orders</span>
                    <strong className="text-sm font-black text-gray-900">{cust.total_orders} visits</strong>
                  </div>
                </div>

                {/* Dietary Tags */}
                {cust.preferences?.dietary && cust.preferences.dietary.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Dietary:</span>
                    {cust.preferences.dietary.map((tag, idx) => (
                      <span key={idx} className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                        🌱 {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedGuest(cust);
                    setEditDietary(cust.preferences?.dietary || []);
                    setEditSeating(cust.preferences?.seating || "");
                    setEditNotes(cust.notes || "");
                  }}
                  className="text-xs text-gray-700"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" /> View Profile & Notes
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL: ADD CUSTOMER */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreateCustomer} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Add Guest Profile</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Customer Name *</label>
              <Input value={custName} onChange={(e) => setCustName(e.target.value)} required placeholder="e.g. Sarah Jenkins" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                <Input value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="+1 555-0199" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                <Input type="email" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} placeholder="sarah@example.com" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Dietary Restrictions (comma separated)</label>
              <Input value={dietaryInput} onChange={(e) => setDietaryInput(e.target.value)} placeholder="Vegan, Gluten-Free, Nut Allergy" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Staff Notes</label>
              <Input value={custNotes} onChange={(e) => setCustNotes(e.target.value)} placeholder="Prefers quiet window seating..." />
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button variant="ghost" type="button" onClick={() => setIsAddCustomerOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-500 text-white font-bold">Save Guest Profile</Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: VIEW / EDIT GUEST PROFILE */}
      {selectedGuest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center justify-between">
              <span>{selectedGuest.name}</span>
              <span className="text-xs bg-brand-50 text-brand-700 font-extrabold px-2.5 py-0.5 rounded-full">
                {selectedGuest.tier}
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded-xl text-xs">
              <div>
                <span className="text-gray-400 block font-bold uppercase text-[10px]">Total Organization Spending</span>
                <strong className="text-base font-black text-gray-900">${selectedGuest.total_spent.toFixed(2)}</strong>
              </div>
              <div>
                <span className="text-gray-400 block font-bold uppercase text-[10px]">Total Dining Visits</span>
                <strong className="text-base font-black text-gray-900">{selectedGuest.total_orders} visits</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Seating Preference</label>
              <Input
                value={editSeating}
                onChange={(e) => setEditSeating(e.target.value)}
                placeholder="e.g. Window booth, Quiet area"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Staff Notes</label>
              <Input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Guest preferences or special instructions..."
              />
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setSelectedGuest(null)}>Cancel</Button>
              <Button onClick={handleUpdatePreferences} disabled={isSubmitting} className="bg-brand-500 text-white font-bold">
                Update Preferences
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
