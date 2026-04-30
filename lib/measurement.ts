import { appConfig } from "./config";
import {
  DimensionState,
  DimensionVector,
  DiscriminationVector,
  ResultSummary
} from "./types";

export function createInitialState(): DimensionState {
  return { K: 0, S: 0, A: 0 };
}

function probability(state: DimensionState, discrimination: DiscriminationVector, difficulty: number) {
  const score = discrimination.k * state.K + discrimination.s * state.S + discrimination.a * state.A - difficulty;
  return 1 / (1 + Math.exp(-score));
}

export function infoScore(state: DimensionState, discrimination: DiscriminationVector, difficulty: number) {
  const p = probability(state, discrimination, difficulty);
  const sumSquares = discrimination.k ** 2 + discrimination.s ** 2 + discrimination.a ** 2;
  return Number((sumSquares * p * (1 - p)).toFixed(4));
}

export function applyVector(state: DimensionState, vector: DimensionVector): DimensionState {
  return {
    K: Number((state.K + appConfig.learningRate * vector.d_K).toFixed(4)),
    S: Number((state.S + appConfig.learningRate * vector.d_S).toFixed(4)),
    A: Number((state.A + appConfig.learningRate * vector.d_A).toFixed(4))
  };
}

export function getCheatScoreIncrement(vector: DimensionVector) {
  const values = [vector.d_K, vector.d_S, vector.d_A];
  const allPositive = values.every((value) => value > 0);
  const sum = values.reduce((acc, value) => acc + value, 0);

  if (allPositive || sum > 1.1) {
    return appConfig.cheatPenalty;
  }

  return 0;
}

function dominantAxis(scores: DimensionState) {
  const entries = Object.entries(scores) as Array<[keyof DimensionState, number]>;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

const labelMap = {
  coreTalent: {
    K: "一眼洞穿",
    S: "关系调频",
    A: "认知杠杆"
  },
  socialStyle: {
    K: "高压直推型",
    S: "协同牵引型",
    A: "延迟爆发型"
  },
  assetMode: {
    K: "用判断换空间",
    S: "用秩序换稳定",
    A: "用积累换复利"
  }
} as const;

export function buildResultSummary(scores: DimensionState, cheatScore: number): ResultSummary {
  const axis = dominantAxis(scores);
  const cheatRisk = cheatScore >= 1.2 ? "高" : cheatScore >= 0.35 ? "中" : "低";

  return {
    dominantAxis: axis,
    scores,
    labels: {
      coreTalent: labelMap.coreTalent[axis],
      socialStyle: labelMap.socialStyle[axis],
      assetMode: labelMap.assetMode[axis]
    },
    cheatRisk,
    preview: [
      `你的主导轴心落在 ${axis} 维，说明你在高压场景里最优先调用的是这一组能力。`,
      `当前结果更像“${labelMap.coreTalent[axis]} + ${labelMap.socialStyle[axis]}”的组合，而不是均衡分布。`,
      "免费结果只展示一级标签，二阶错位与长期收益路径保留在深度报告。"
    ],
    paidBlocks: [
      "系统兼容性诊断",
      "十年收益仿真曲线",
      "副业 / 职业 / 合作方式建议",
      "高伪装度与高内耗风险提示"
    ]
  };
}
