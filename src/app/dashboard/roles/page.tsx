import { getRolePermissionsMatrix } from "@/domain/staff/actions";
import { RolesMatrixClient } from "@/components/roles/RolesMatrixClient";

export default async function RolesPage() {
  const res = await getRolePermissionsMatrix();

  return <RolesMatrixClient matrix={res.matrix || []} />;
}
