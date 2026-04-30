import { NextResponse } from "next/server";
import { getSessionResult } from "@/lib/session-service";

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const result = await getSessionResult(sessionId);

  if (!result) {
    return NextResponse.json({ message: "结果不存在" }, { status: 404 });
  }

  return NextResponse.json(result);
}
