import { CreditCard } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";

export default function PaymentsPage() {
  return (
    <ModuleShell
      title="Payment Gateways & Settlements"
      category="Finance"
      description="Card settlements, UPI transactions, cash reconciliations, and payout reports."
      icon={<CreditCard className="h-5 w-5" />}
    />
  );
}
