import { getBillingOverview } from "@/domain/billing/actions";
import { BillingPageClient } from "@/components/billing/BillingPageClient";

export default async function BillingPage() {
  const res = await getBillingOverview();

  return (
    <BillingPageClient initialOverview={res.overview || null} />
  );
}
