"use client";

import * as React from "react";
import {
  Utensils,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Tag,
  Sliders,
  DollarSign,
  Layers,
  Search,
  Image as ImageIcon,
  Check,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { Category, ModifierGroup } from "@/domain/pos/types";
import {
  MenuItemExtended,
  createCategory,
  deleteCategory,
  createMenuItem,
  deleteMenuItem,
  toggleMenuItemBranchOverride,
  createModifierGroup,
  addModifierOption,
  createItemVariant,
} from "@/domain/menu/actions";

interface MenuCatalogClientProps {
  initialCategories: Category[];
  initialItems: MenuItemExtended[];
  initialModifierGroups: ModifierGroup[];
  currentBranchId: string;
  branchName: string;
  onRefresh: () => void;
}

type MenuTab = "items" | "categories" | "modifiers";

export function MenuCatalogClient({
  initialCategories = [],
  initialItems = [],
  initialModifierGroups = [],
  currentBranchId,
  branchName,
  onRefresh,
}: MenuCatalogClientProps) {
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = React.useState<MenuTab>("items");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState<string>("all");

  // Modal States
  const [isAddCategoryOpen, setIsAddCategoryOpen] = React.useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = React.useState(false);
  const [isAddGroupOpen, setIsAddGroupOpen] = React.useState(false);
  const [isAddOptionOpen, setIsAddOptionOpen] = React.useState<string | null>(null);
  const [isAddVariantOpen, setIsAddVariantOpen] = React.useState<string | null>(null);

  // Form Inputs
  const [catName, setCatName] = React.useState("");
  const [catDesc, setCatDesc] = React.useState("");

  const [itemName, setItemName] = React.useState("");
  const [itemDesc, setItemDesc] = React.useState("");
  const [itemCatId, setItemCatId] = React.useState("");
  const [itemPrice, setItemPrice] = React.useState(10);
  const [itemTax, setItemTax] = React.useState(5);
  const [itemImageUrl, setItemImageUrl] = React.useState("");
  const [selectedGroupIds, setSelectedGroupIds] = React.useState<string[]>([]);

  const [groupName, setGroupName] = React.useState("");
  const [groupMin, setGroupMin] = React.useState(0);
  const [groupMax, setGroupMax] = React.useState(1);
  const [groupRequired, setGroupRequired] = React.useState(false);

  const [optionName, setOptionName] = React.useState("");
  const [optionPrice, setOptionPrice] = React.useState(1.5);

  const [variantName, setVariantName] = React.useState("");
  const [variantPrice, setVariantPrice] = React.useState(2.0);

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    setIsSubmitting(true);
    const res = await createCategory({
      name: catName,
      description: catDesc,
    });
    setIsSubmitting(false);

    if (res.success) {
      addToast({ type: "success", title: "Category Created", description: `Category "${catName}" created.` });
      setCatName("");
      setCatDesc("");
      setIsAddCategoryOpen(false);
      onRefresh();
    } else {
      addToast({ type: "error", title: "Creation Failed", description: res.error });
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}"?`)) return;
    const res = await deleteCategory(id);
    if (res.success) {
      addToast({ type: "success", title: "Category Deleted" });
      onRefresh();
    } else {
      addToast({ type: "error", title: "Delete Failed", description: res.error });
    }
  };

  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    setIsSubmitting(true);
    const res = await createMenuItem({
      name: itemName,
      description: itemDesc,
      category_id: itemCatId || undefined,
      price: itemPrice,
      tax_rate: itemTax,
      image_url: itemImageUrl,
      modifier_group_ids: selectedGroupIds,
    });
    setIsSubmitting(false);

    if (res.success) {
      addToast({ type: "success", title: "Menu Item Created", description: `Dish "${itemName}" added to catalog.` });
      setItemName("");
      setItemDesc("");
      setItemImageUrl("");
      setIsAddItemOpen(false);
      onRefresh();
    } else {
      addToast({ type: "error", title: "Creation Failed", description: res.error });
    }
  };

  const handleDeleteMenuItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    const res = await deleteMenuItem(id);
    if (res.success) {
      addToast({ type: "success", title: "Item Deleted" });
      onRefresh();
    } else {
      addToast({ type: "error", title: "Delete Failed", description: res.error });
    }
  };

  const handleToggleAvailability = async (item: MenuItemExtended) => {
    const nextAvailability = !item.is_available;
    const res = await toggleMenuItemBranchOverride(item.id, currentBranchId, nextAvailability);
    if (res.success) {
      addToast({
        type: "info",
        title: "Availability Updated",
        description: `"${item.name}" set to ${nextAvailability ? "Available" : "Unavailable"} for ${branchName}.`,
      });
      onRefresh();
    }
  };

  const handleCreateModifierGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsSubmitting(true);
    const res = await createModifierGroup({
      name: groupName,
      min_selection: groupMin,
      max_selection: groupMax,
      is_required: groupRequired,
    });
    setIsSubmitting(false);

    if (res.success) {
      addToast({ type: "success", title: "Modifier Group Created" });
      setGroupName("");
      setIsAddGroupOpen(false);
      onRefresh();
    } else {
      addToast({ type: "error", title: "Creation Failed", description: res.error });
    }
  };

  const handleAddModifierOption = async (groupId: string) => {
    if (!optionName.trim()) return;
    setIsSubmitting(true);
    const res = await addModifierOption(groupId, optionName, optionPrice);
    setIsSubmitting(false);

    if (res.success) {
      addToast({ type: "success", title: "Modifier Option Added" });
      setOptionName("");
      setIsAddOptionOpen(null);
      onRefresh();
    }
  };

  const handleCreateVariant = async (itemId: string) => {
    if (!variantName.trim()) return;
    setIsSubmitting(true);
    const res = await createItemVariant(itemId, variantName, variantPrice);
    setIsSubmitting(false);

    if (res.success) {
      addToast({ type: "success", title: "Variant Added", description: `Variant "${variantName}" added.` });
      setVariantName("");
      setIsAddVariantOpen(null);
      onRefresh();
    }
  };

  // Filtered Menu Items
  const filteredItems = React.useMemo(() => {
    return initialItems.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategoryFilter === "all" || item.category_id === selectedCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [initialItems, searchQuery, selectedCategoryFilter]);

  return (
    <div className="space-y-6">
      {/* Catalog Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Utensils className="h-6 w-6 text-brand-500" />
            Menu & Recipe Catalog
          </h1>
          <p className="text-xs font-medium text-gray-500">
            Manage categories, dishes, tax rates, modifier options, and branch availability overrides.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            onClick={() => setIsAddItemOpen(true)}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-md"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add New Dish
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("items")}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-xs font-bold transition-all ${
              activeTab === "items"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Utensils className="h-4 w-4" />
            <span>Dishes & Items ({initialItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("categories")}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-xs font-bold transition-all ${
              activeTab === "categories"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Tag className="h-4 w-4" />
            <span>Categories ({initialCategories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("modifiers")}
            className={`flex items-center space-x-2 px-4 py-3 border-b-2 text-xs font-bold transition-all ${
              activeTab === "modifiers"
                ? "border-brand-500 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Modifier Groups ({initialModifierGroups.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DISHES & MENU ITEMS */}
      {activeTab === "items" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search dishes by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white text-xs"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-gray-500">Category:</span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium focus:outline-none"
              >
                <option value="all">All Categories</option>
                {initialCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dishes Grid */}
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-white space-y-2">
              <Utensils className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-sm font-bold text-gray-700">No dishes found in menu catalog.</p>
              <p className="text-xs text-gray-500">Click &quot;Add New Dish&quot; to create your first menu item.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((item) => (
                <Card key={item.id} className="p-5 space-y-4 flex flex-col justify-between hover:shadow-lg transition-all">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                          {item.category_name}
                        </span>
                        <h3 className="text-base font-extrabold text-gray-900 mt-1">{item.name}</h3>
                      </div>

                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                          item.is_available
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {item.is_available ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Available
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5" /> Unavailable
                          </>
                        )}
                      </button>
                    </div>

                    {item.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                    )}

                    <div className="flex items-baseline space-x-3 pt-1">
                      <span className="text-xl font-black text-gray-900">
                        ${Number(item.price).toFixed(2)}
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium">
                        Tax: {item.tax_rate}%
                      </span>
                    </div>

                    {/* Variants & Modifiers Summary */}
                    <div className="pt-2 border-t border-gray-100 space-y-1.5">
                      {item.variants && item.variants.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Variants:</span>
                          {item.variants.map((v) => (
                            <span key={v.id} className="text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-semibold">
                              {v.name} (+${v.price_delta})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsAddVariantOpen(item.id)}
                      className="text-xs text-gray-700"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Variant
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteMenuItem(item.id, item.name)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CATEGORIES */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Menu Categories</h3>
              <p className="text-xs text-gray-500">Group dishes logically for POS display tabs.</p>
            </div>
            <Button size="sm" onClick={() => setIsAddCategoryOpen(true)} className="bg-brand-500 hover:bg-brand-600 text-white font-bold">
              <Plus className="h-4 w-4 mr-1.5" /> Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialCategories.map((cat) => (
              <Card key={cat.id} className="p-4 flex items-center justify-between border hover:shadow-md transition-all">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-900">{cat.name}</h4>
                  {cat.description && <p className="text-xs text-gray-500">{cat.description}</p>}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MODIFIER GROUPS */}
      {activeTab === "modifiers" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Modifier Groups & Options</h3>
              <p className="text-xs text-gray-500">Add-ons, choices, toppings, and customization options.</p>
            </div>
            <Button size="sm" onClick={() => setIsAddGroupOpen(true)} className="bg-brand-500 hover:bg-brand-600 text-white font-bold">
              <Plus className="h-4 w-4 mr-1.5" /> Add Modifier Group
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {initialModifierGroups.map((group) => (
              <Card key={group.id} className="p-5 space-y-4 border">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h4 className="text-base font-extrabold text-gray-900">{group.name}</h4>
                    <p className="text-xs text-gray-500 font-medium">
                      Select min {group.min_selection}, max {group.max_selection} | {group.is_required ? "Required" : "Optional"}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => setIsAddOptionOpen(group.id)} className="text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Option
                  </Button>
                </div>

                <div className="space-y-2">
                  {(group.options || []).map((opt) => (
                    <div key={opt.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg text-xs font-semibold">
                      <span>{opt.name}</span>
                      <span className="text-brand-600">+${Number(opt.price_delta).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD DISH */}
      {isAddItemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreateMenuItem} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Add New Dish</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Dish Name *</label>
                <Input value={itemName} onChange={(e) => setItemName(e.target.value)} required placeholder="e.g. Truffle Burger" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <Input value={itemDesc} onChange={(e) => setItemDesc(e.target.value)} placeholder="Ingredients & details..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={itemCatId}
                    onChange={(e) => setItemCatId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="">Select Category</option>
                    {initialCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Base Price ($) *</label>
                  <Input type="number" step="0.01" min={0} value={itemPrice} onChange={(e) => setItemPrice(Number(e.target.value))} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tax Rate (%)</label>
                  <Input type="number" step="0.1" min={0} value={itemTax} onChange={(e) => setItemTax(Number(e.target.value))} required />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Image URL</label>
                  <Input value={itemImageUrl} onChange={(e) => setItemImageUrl(e.target.value)} placeholder="https://..." />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button variant="ghost" type="button" onClick={() => setIsAddItemOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-500 hover:bg-brand-600 text-white font-bold">
                Save Dish
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD CATEGORY */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreateCategory} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Add Category</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category Name *</label>
              <Input value={catName} onChange={(e) => setCatName(e.target.value)} required placeholder="e.g. Starters, Main Course, Drinks" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
              <Input value={catDesc} onChange={(e) => setCatDesc(e.target.value)} placeholder="Optional description..." />
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button variant="ghost" type="button" onClick={() => setIsAddCategoryOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-500 text-white font-bold">
                Save Category
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD MODIFIER GROUP */}
      {isAddGroupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={handleCreateModifierGroup} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Add Modifier Group</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Group Name *</label>
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} required placeholder="e.g. Choice of Cheese, Cooking Temp" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Min Selection</label>
                <Input type="number" min={0} value={groupMin} onChange={(e) => setGroupMin(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Max Selection</label>
                <Input type="number" min={1} value={groupMax} onChange={(e) => setGroupMax(Number(e.target.value))} />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button variant="ghost" type="button" onClick={() => setIsAddGroupOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-500 text-white font-bold">
                Save Group
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ADD MODIFIER OPTION */}
      {isAddOptionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Add Option to Group</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Option Name *</label>
              <Input value={optionName} onChange={(e) => setOptionName(e.target.value)} required placeholder="e.g. Extra Cheese, Medium Rare" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Price Delta ($)</label>
              <Input type="number" step="0.01" value={optionPrice} onChange={(e) => setOptionPrice(Number(e.target.value))} />
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setIsAddOptionOpen(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleAddModifierOption(isAddOptionOpen)} disabled={isSubmitting} className="bg-brand-500 text-white font-bold">
                Add Option
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD VARIANT */}
      {isAddVariantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Add Portion Variant</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Variant Name *</label>
              <Input value={variantName} onChange={(e) => setVariantName(e.target.value)} required placeholder="e.g. Double Portion, Extra Large" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Price Delta ($)</label>
              <Input type="number" step="0.01" value={variantPrice} onChange={(e) => setVariantPrice(Number(e.target.value))} />
            </div>

            <div className="pt-3 border-t flex justify-end space-x-2">
              <Button variant="ghost" onClick={() => setIsAddVariantOpen(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleCreateVariant(isAddVariantOpen)} disabled={isSubmitting} className="bg-brand-500 text-white font-bold">
                Save Variant
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
