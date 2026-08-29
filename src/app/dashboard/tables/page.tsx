import { Grid } from "lucide-react";
import { ModuleShell } from "@/components/dashboard/ModuleShell";

export default function TablesPage() {
  return (
    <ModuleShell
      title="Floor Plan & Table Management"
      category="Operations"
      description="Visual table occupancy, seating reservations, and floor layouts."
      icon={<Grid className="h-5 w-5" />}
    />
  );
}
