import { Receipt } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";

export default function ExpensesPage() {
  return (
    <ModuleShell
      title="Store Expenses & Petty Cash"
      category="Finance"
      description="Track operational expenses, utility bills, and daily payouts."
      icon={<Receipt className="h-5 w-5" />}
    />
  );
}
