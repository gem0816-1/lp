import { Question, QuestionOption } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  DimensionKey,
  DimensionVector,
  QuestionOptionSeed,
  QuestionSeed
} from "@/lib/types";

const VERSION = "spt-v1";
const TOTALS: Record<DimensionKey, number> = { K: 24, S: 32, A: 24 };

const scenarioThemes: Record<DimensionKey, string[]> = {
  K: ["项目止损", "危机拆解", "逆向研判", "策略转向", "资源压缩", "高压复盘"],
  S: ["团队冲突", "合作博弈", "公开站队", "信任修复", "角色协调", "组织沟通"],
  A: ["认知套利", "信息筛选", "长期积累", "副业选择", "能力变现", "认知升级"]
};

function toFixed(n: number) {
  return Number(n.toFixed(2));
}

function buildVector(anchor: DimensionKey, index: number, optionCode: "A" | "B"): DimensionVector {
  const phase = (index % 6) + 1;
  const sign = optionCode === "A" ? 1 : -1;

  const base = {
    d_K: toFixed(0.22 + phase * 0.09),
    d_S: toFixed(0.18 + ((phase + 2) % 6) * 0.08),
    d_A: toFixed(0.2 + ((phase + 4) % 6) * 0.07)
  };

  const mapped: Record<DimensionKey, DimensionVector> = {
    K: {
      d_K: sign * base.d_K,
      d_S: -sign * Math.max(0.16, base.d_S - 0.04),
      d_A: sign * Math.max(0.14, base.d_A - 0.03)
    },
    S: {
      d_K: -sign * Math.max(0.14, base.d_K - 0.05),
      d_S: sign * base.d_S,
      d_A: sign * Math.max(0.12, base.d_A - 0.02)
    },
    A: {
      d_K: sign * Math.max(0.14, base.d_K - 0.03),
      d_S: -sign * Math.max(0.12, base.d_S - 0.05),
      d_A: sign * base.d_A
    }
  };

  return Object.fromEntries(
    Object.entries(mapped[anchor]).map(([key, value]) => [key, value === 0 ? sign * 0.12 : toFixed(value)])
  ) as DimensionVector;
}

function buildOptions(anchor: DimensionKey, index: number): QuestionOptionSeed[] {
  const theme = scenarioThemes[anchor][index % scenarioThemes[anchor].length];

  return [
    {
      code: "A",
      text: `先硬切主线，围绕“${theme}”直接重构局面，接受短期关系震荡，换确定性。`,
      logic: "偏向正面承压与主动改写局势，强调快判断、快动作、快承担。",
      vector: buildVector(anchor, index, "A")
    },
    {
      code: "B",
      text: `先稳住表层秩序，把“${theme}”拆成可控缓冲带，用时间和协同换回旋余地。`,
      logic: "偏向稳定系统与延迟冲突，强调结构保护、协同节奏与代价平衡。",
      vector: buildVector(anchor, index, "B")
    }
  ];
}

function buildQuestion(anchor: DimensionKey, localIndex: number, globalIndex: number): QuestionSeed {
  const theme = scenarioThemes[anchor][localIndex % scenarioThemes[anchor].length];
  return {
    questionIndex: globalIndex,
    version: VERSION,
    primaryAnchor: anchor,
    scenario: `在一次涉及“${theme}”的高压现场里，你必须在信息不完整、角色立场冲突、且后果会外溢到未来六个月的前提下立刻做决定。你更倾向于怎样推动局势？`,
    difficulty: toFixed(0.28 + (localIndex % 8) * 0.08),
    discriminationVector: {
      k: toFixed(anchor === "K" ? 0.78 : 0.42 + (localIndex % 4) * 0.08),
      s: toFixed(anchor === "S" ? 0.82 : 0.34 + (localIndex % 5) * 0.07),
      a: toFixed(anchor === "A" ? 0.8 : 0.36 + (localIndex % 3) * 0.09)
    },
    tags: [theme, "高压决策", "KSA联动"],
    options: buildOptions(anchor, localIndex)
  };
}

export function generateQuestionBank(): QuestionSeed[] {
  const bank: QuestionSeed[] = [];
  let globalIndex = 1;

  (["K", "S", "A"] as DimensionKey[]).forEach((anchor) => {
    for (let localIndex = 0; localIndex < TOTALS[anchor]; localIndex += 1) {
      bank.push(buildQuestion(anchor, localIndex, globalIndex));
      globalIndex += 1;
    }
  });

  return bank;
}

export async function ensureQuestionBank() {
  const count = await prisma.question.count();
  if (count > 0) {
    return;
  }

  const bank = generateQuestionBank();

  for (const item of bank) {
    await prisma.question.create({
      data: {
        questionIndex: item.questionIndex,
        version: item.version,
        primaryAnchor: item.primaryAnchor,
        scenario: item.scenario,
        difficulty: item.difficulty,
        discriminationVector: item.discriminationVector,
        tags: item.tags,
        options: {
          create: item.options.map((option) => ({
            code: option.code,
            text: option.text,
            logic: option.logic,
            vector: option.vector
          }))
        }
      }
    });
  }
}

export async function getQuestionBankWithOptions() {
  await ensureQuestionBank();
  return prisma.question.findMany({
    where: { active: true },
    include: { options: true },
    orderBy: { questionIndex: "asc" }
  });
}

export type PersistedQuestion = Question & { options: QuestionOption[] };

export const questionBankMeta = {
  version: VERSION,
  total: 80,
  ratio: TOTALS
} as const;
