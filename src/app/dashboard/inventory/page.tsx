import { Boxes } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";

export default function InventoryPage() {
  return (
    <ModuleShell
      title="Stock & Inventory Control"
      category="Management"
      description="Raw ingredient tracking, stock levels, waste management, and reorder alerts."
      icon={<Boxes className="h-5 w-5" />}
    />
  );
}
