import { Utensils } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";

export default function MenuPage() {
  return (
    <ModuleShell
      title="Menu & Item Recipe Catalog"
      category="Management"
      description="Manage dishes, categories, pricing, variants, and modifiers."
      icon={<Utensils className="h-5 w-5" />}
    />
  );
}
