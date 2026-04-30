import { NextResponse } from "next/server";
import { createSyntheticCalibrationRun } from "@/lib/session-service";

export async function POST() {
  const run = await createSyntheticCalibrationRun();
  return NextResponse.json(run);
}
