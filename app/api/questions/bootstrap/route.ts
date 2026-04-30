import { NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { ensureQuestionBank, questionBankMeta } from "@/lib/question-bank";

export async function GET() {
  await ensureQuestionBank();

  return NextResponse.json({
    version: questionBankMeta.version,
    total: questionBankMeta.total,
    ratio: questionBankMeta.ratio,
    provider: appConfig.questionBankProvider,
    coldStart: {
      syntheticPersona: appConfig.syntheticSimulationEnabled,
      humanGray: true
    },
    requiredFields: [
      "difficulty",
      "discrimination_vector",
      "option.vector",
      "option.vector.d_K",
      "option.vector.d_S",
      "option.vector.d_A"
    ]
  });
}
