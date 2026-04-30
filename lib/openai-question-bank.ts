import type { DimensionKey, QuestionSeed } from "./types";
import { questionBankMeta } from "./question-bank";

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少环境变量：${name}`);
  }
  return value;
}

function clampNumber(n: number, min: number, max: number) {
  if (Number.isNaN(n) || !Number.isFinite(n)) {
    return min;
  }
  return Math.min(max, Math.max(min, n));
}

function inferAnchor(questionIndex: number): { anchor: DimensionKey; localIndex: number } {
  const totals = questionBankMeta.ratio;
  const kEnd = totals.K;
  const sEnd = totals.K + totals.S;

  if (questionIndex <= kEnd) return { anchor: "K", localIndex: questionIndex - 1 };
  if (questionIndex <= sEnd) return { anchor: "S", localIndex: questionIndex - kEnd - 1 };
  return { anchor: "A", localIndex: questionIndex - sEnd - 1 };
}

function scenarioTheme(anchor: DimensionKey, localIndex: number) {
  const themes: Record<DimensionKey, string[]> = {
    K: ["项目止损", "危机拆解", "逆向研判", "策略转向", "资源压缩", "高压复盘"],
    S: ["团队冲突", "合作博弈", "公开站队", "信任修复", "角色协调", "组织沟通"],
    A: ["认知套利", "信息筛选", "长期积累", "副业选择", "能力变现", "认知升级"]
  };
  const arr = themes[anchor];
  return arr[localIndex % arr.length];
}

function extractJsonObject(text: string) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("模型输出不是 JSON 对象");
  }
  return JSON.parse(text.slice(start, end + 1)) as unknown;
}

type OpenAIChatCompletionsResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

function assertValidSeed(
  seed: unknown,
  expectedIndex: number,
  expectedAnchor: DimensionKey
): asserts seed is QuestionSeed {
  if (!seed || typeof seed !== "object") throw new Error("题库 seed 不是对象");

  const record = seed as Record<string, unknown>;
  if (record.questionIndex !== expectedIndex) {
    throw new Error(`题库 seed.questionIndex 不一致：期望 ${expectedIndex}，实际 ${String(record.questionIndex)}`);
  }
  if (record.primaryAnchor !== expectedAnchor) {
    throw new Error(`题库 seed.primaryAnchor 不一致：期望 ${expectedAnchor}，实际 ${String(record.primaryAnchor)}`);
  }

  const options = record.options;
  if (!Array.isArray(options) || options.length !== 2) throw new Error("题库 seed.options 必须为 2 个选项");

  const codes = options
    .map((opt) => (opt && typeof opt === "object" ? (opt as Record<string, unknown>).code : undefined))
    .sort()
    .join(",");
  if (codes !== "A,B") throw new Error("题库 seed.options.code 必须为 A/B 各一个");
}

export async function generateQuestionSeedByOpenAI(questionIndex: number): Promise<QuestionSeed> {
  if (questionIndex < 1 || questionIndex > questionBankMeta.total) {
    throw new Error(`题号超出范围：${questionIndex}（总题量 ${questionBankMeta.total}）`);
  }

  const apiKey = requireEnv("OPENAI_API_KEY");
  const { anchor, localIndex } = inferAnchor(questionIndex);
  const theme = scenarioTheme(anchor, localIndex);

  const system = [
    "你是一个严谨的心理测评题库生成器，必须输出可被程序解析的 JSON。",
    "本题库用于 K/S/A 三维动态测评：K=判断与策略，S=协作与关系，A=认知与资产。",
    "每道题必须有且仅有 2 个选项（A/B）。每个选项必须同时牵动 d_K/d_S/d_A（不能出现 0 或缺失）。",
    "difficulty 与 discriminationVector(k/s/a) 取 0~1 的小数；vector 的绝对值建议 0.12~1.20 之间。",
    "严禁输出代码块标记、解释文字、或多余字段；只输出一个 JSON 对象。"
  ].join("\n");

  const user = [
    `请生成第 ${questionIndex} 题（总题量 ${questionBankMeta.total}）。`,
    `约束：version 固定为 "${questionBankMeta.version}"；primaryAnchor 固定为 "${anchor}"。`,
    `场景主题建议围绕“${theme}”，但不要直接重复模板句式，要写得像真实高压决策场景。`,
    "输出 JSON schema（字段必须齐全、类型正确）：",
    "{",
    '  "questionIndex": number,',
    '  "version": string,',
    '  "primaryAnchor": "K"|"S"|"A",',
    '  "scenario": string,',
    '  "difficulty": number,',
    '  "discriminationVector": {"k": number, "s": number, "a": number},',
    '  "tags": string[],',
    '  "options": [',
    '    {"code":"A","text":string,"logic":string,"vector":{"d_K":number,"d_S":number,"d_A":number}},',
    '    {"code":"B","text":string,"logic":string,"vector":{"d_K":number,"d_S":number,"d_A":number}}',
    "  ]",
    "}"
  ].join("\n");

  const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ]
    }),
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`OpenAI 出题失败：${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`);
  }

  const payload = (await res.json()) as OpenAIChatCompletionsResponse;
  const content = payload.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") {
    throw new Error("OpenAI 返回结构异常：缺少 message.content");
  }

  const seedAny = extractJsonObject(content);
  assertValidSeed(seedAny, questionIndex, anchor);

  const seed = seedAny as QuestionSeed;
  seed.version = questionBankMeta.version;
  seed.primaryAnchor = anchor;
  seed.questionIndex = questionIndex;

  seed.difficulty = clampNumber(Number(seed.difficulty), 0.05, 0.95);
  seed.discriminationVector = {
    k: clampNumber(Number(seed.discriminationVector?.k), 0.05, 0.95),
    s: clampNumber(Number(seed.discriminationVector?.s), 0.05, 0.95),
    a: clampNumber(Number(seed.discriminationVector?.a), 0.05, 0.95)
  };

  seed.options = seed.options.map((opt) => ({
    ...opt,
    vector: {
      d_K: clampNumber(Number(opt.vector?.d_K), -1.2, 1.2) || (opt.code === "A" ? 0.12 : -0.12),
      d_S: clampNumber(Number(opt.vector?.d_S), -1.2, 1.2) || (opt.code === "A" ? -0.12 : 0.12),
      d_A: clampNumber(Number(opt.vector?.d_A), -1.2, 1.2) || (opt.code === "A" ? 0.12 : -0.12)
    }
  }));

  return seed;
}

