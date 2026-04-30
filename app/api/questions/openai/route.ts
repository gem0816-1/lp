import { NextRequest, NextResponse } from "next/server";
import { generateQuestionSeedByOpenAI } from "@/lib/openai-question-bank";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const questionIndex = Number(searchParams.get("questionIndex") || "");

  if (!Number.isInteger(questionIndex)) {
    return NextResponse.json(
      { message: "缺少或非法的 questionIndex（必须为整数）" },
      { status: 400 }
    );
  }

  try {
    const seed = await generateQuestionSeedByOpenAI(questionIndex);
    return NextResponse.json(seed, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "出题失败";
    return NextResponse.json({ message }, { status: 500 });
  }
}

