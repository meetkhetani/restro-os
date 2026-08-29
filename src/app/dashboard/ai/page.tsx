import { Sparkles } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";

export default function AIPage() {
  return (
    <ModuleShell
      title="Restro OS AI Assistant & Intelligence Copilot"
      category="Intelligence"
      description="Operational demand forecasting, menu optimization, and automated insights."
      icon={<Sparkles className="h-5 w-5" />}
    />
  );
}
