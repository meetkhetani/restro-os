import { Monitor } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";

export default function POSPage() {
  return (
    <ModuleShell
      title="Point of Sale (POS) Terminal Shell"
      category="Operations"
      description="High-speed order entry and cash register interface foundation."
      icon={<Monitor className="h-5 w-5" />}
    />
  );
}
