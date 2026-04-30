import { DimensionState, ResultSummary } from "@/lib/types";
import { buildResultSummary } from "@/lib/measurement";

export function createReportPayload(scores: DimensionState, cheatScore: number) {
  const summary = buildResultSummary(scores, cheatScore);

  return {
    summary,
    deepDive: {
      mismatchSignal:
        "系统检测到你的主导维度与次级维度之间存在明显牵拉，这会直接影响资源兑现速度。",
      incomeCurve:
        "你的曲线更适合先稳后陡，不适合依赖短期情绪峰值做职业级押注。",
      collaborationAdvice: [
        "避免把所有关键判断都留到最后一拍。",
        "让强项维度负责定方向，次强维度负责校偏差。",
        "在关系密集场景里，先定义边界，再争取理解。"
      ]
    }
  };
}

export function createPreviewText(summary: ResultSummary) {
  return `${summary.labels.coreTalent} / ${summary.labels.socialStyle} / ${summary.labels.assetMode}`;
}
