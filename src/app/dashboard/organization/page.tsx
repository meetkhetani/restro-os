import { Building2 } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";

export default function OrganizationPage() {
  return (
    <ModuleShell
      title="Organization Profile & Corporate Tenant"
      category="Administration"
      description="Corporate entity settings, tax identifiers, branding, and tenant roots."
      icon={<Building2 className="h-5 w-5" />}
    />
  );
}
