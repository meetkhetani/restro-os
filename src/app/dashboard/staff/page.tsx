import { UserCheck } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";

export default function StaffPage() {
  return (
    <ModuleShell
      title="Staff Management & Shifts"
      category="Management"
      description="Employee roster, shift scheduling, and branch assignments."
      icon={<UserCheck className="h-5 w-5" />}
    />
  );
}
