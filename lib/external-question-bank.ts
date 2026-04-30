import { appConfig } from "./config";
import type { QuestionSeed } from "./types";

type ExternalQuestionResponse =
  | QuestionSeed
  | {
      question: QuestionSeed;
    };

function normalizeExternalQuestionResponse(payload: ExternalQuestionResponse): QuestionSeed {
  if ("question" in payload) {
    return payload.question;
  }
  return payload;
}

export async function fetchExternalQuestionSeed(questionIndex: number): Promise<QuestionSeed> {
  if (!appConfig.questionBankExternalUrl) {
    throw new Error("未配置外部题库接口：QUESTION_BANK_EXTERNAL_URL");
  }

  const url = new URL(appConfig.questionBankExternalUrl);
  url.searchParams.set("questionIndex", String(questionIndex));

  const res = await fetch(url.toString(), { method: "GET", cache: "no-store" });
  if (!res.ok) {
    throw new Error(`外部题库接口请求失败：${res.status} ${res.statusText}`);
  }

  const payload = (await res.json()) as ExternalQuestionResponse;
  const seed = normalizeExternalQuestionResponse(payload);

  if (seed.questionIndex !== questionIndex) {
    throw new Error(`外部题库返回题号不一致：期望 ${questionIndex}，实际 ${seed.questionIndex}`);
  }

  return seed;
}

