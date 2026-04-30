import { NextRequest, NextResponse } from "next/server";
import { answerQuestion } from "@/lib/session-service";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await answerQuestion(body.sessionId, body.optionCode);
  return NextResponse.json(result);
}
