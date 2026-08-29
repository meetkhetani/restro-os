import { Users } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";

export default function CustomersPage() {
  return (
    <ModuleShell
      title="Customer CRM & Loyalty Database"
      category="CRM"
      description="Guest profiles, dining history, preferences, and reward points."
      icon={<Users className="h-5 w-5" />}
    />
  );
}
