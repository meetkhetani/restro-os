import { ShoppingBag } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";

export default function OrdersPage() {
  return (
    <ModuleShell
      title="Live Orders Management"
      category="Operations"
      description="Track dine-in, takeaway, and delivery orders across active branches."
      icon={<ShoppingBag className="h-5 w-5" />}
    />
  );
}
