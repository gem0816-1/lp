import AdminCalibrationClientPage from "@/app/admin/calibration/client-page";
import { listCalibrationRuns } from "@/lib/session-service";

export const dynamic = "force-dynamic";

export default async function AdminCalibrationPage() {
  const runs = await listCalibrationRuns();
  return <AdminCalibrationClientPage runs={runs} />;
}
