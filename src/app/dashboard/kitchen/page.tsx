import { ChefHat } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";

export default function KitchenPage() {
  return (
    <ModuleShell
      title="Kitchen Display System (KDS)"
      category="Operations"
      description="Real-time order ticket dispatch and prep status tracking."
      icon={<ChefHat className="h-5 w-5" />}
    />
  );
}
