import { NextResponse } from "next/server";
import { getSessionProgress } from "@/lib/session-service";

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const progress = await getSessionProgress(sessionId);

  if (!progress) {
    return NextResponse.json({ message: "会话不存在" }, { status: 404 });
  }

  return NextResponse.json(progress);
}
