import { FileText } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";

export default function AuditPage() {
  return (
    <ModuleShell
      title="System Audit Trail & Security Logs"
      category="Administration"
      description="Immutable logs of user actions, login events, and administrative changes."
      icon={<FileText className="h-5 w-5" />}
    />
  );
}
