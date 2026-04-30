import { NextResponse } from "next/server";
import { listCalibrationRuns } from "@/lib/session-service";

export async function GET() {
  const runs = await listCalibrationRuns();
  return NextResponse.json(runs);
}
