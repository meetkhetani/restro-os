import { Settings } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";

export default function SettingsPage() {
  return (
    <ModuleShell
      title="Platform Settings & Configurations"
      category="Administration"
      description="System defaults, currency options, printer configurations, and notifications."
      icon={<Settings className="h-5 w-5" />}
    />
  );
}
