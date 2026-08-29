import { ShieldCheck } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";

export default function RolesPage() {
  return (
    <ModuleShell
      title="Users & Role-Based Access Control (RBAC)"
      category="Administration"
      description="Manage system permissions, user invitations, and access control levels."
      icon={<ShieldCheck className="h-5 w-5" />}
    />
  );
}
