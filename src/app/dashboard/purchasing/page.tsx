import { Truck } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";

export default function PurchasingPage() {
  return (
    <ModuleShell
      title="Purchasing & Vendor Management"
      category="Management"
      description="Purchase orders, supplier contracts, and receiving logs."
      icon={<Truck className="h-5 w-5" />}
    />
  );
}
