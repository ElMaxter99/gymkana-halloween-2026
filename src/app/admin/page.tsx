import { requireAdmin } from "@/lib/admin-auth";
import { getOverview } from "@/lib/overview";
import { TIMEZONE } from "@/lib/format";
import Dashboard from "./Dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  return <Dashboard initial={await getOverview()} timeZone={TIMEZONE} />;
}
