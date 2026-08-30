import { getPosInitialData } from "@/domain/pos/actions";
import { PosTerminalView } from "@/components/pos/PosTerminalView";

export default async function POSPage() {
  const initialData = await getPosInitialData();

  return (
    <PosTerminalView
      initialCategories={initialData.categories}
      initialMenuItems={initialData.menuItems}
      initialTables={initialData.tables}
      initialCustomers={initialData.customers}
      activeLocationName={initialData.activeLocation?.name || "Main Branch"}
      activeRestaurantName={initialData.activeRestaurant?.name || "Restro OS Store"}
    />
  );
}
