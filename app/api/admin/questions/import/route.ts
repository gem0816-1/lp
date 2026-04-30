import { NextResponse } from "next/server";
import { ensureQuestionBank, getQuestionBankWithOptions, questionBankMeta } from "@/lib/question-bank";

export async function POST() {
  await ensureQuestionBank();
  const questions = await getQuestionBankWithOptions();

  return NextResponse.json({
    ok: true,
    imported: questions.length,
    version: questionBankMeta.version,
    ratio: questionBankMeta.ratio
  });
}
