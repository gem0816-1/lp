import { NextResponse } from "next/server";
import { getReportDetail } from "@/lib/session-service";

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const report = await getReportDetail(sessionId);

  if (!report) {
    return NextResponse.json({ message: "报告不存在" }, { status: 404 });
  }

  return NextResponse.json(report);
}
