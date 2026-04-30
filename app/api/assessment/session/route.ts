import { NextResponse } from "next/server";
import { createAssessmentSession } from "@/lib/session-service";

export async function POST() {
  const session = await createAssessmentSession();
  return NextResponse.json({ sessionId: session.id, status: session.status });
}
