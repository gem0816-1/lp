export type DimensionKey = "K" | "S" | "A";

export type DimensionState = {
  K: number;
  S: number;
  A: number;
};

export type DimensionVector = {
  d_K: number;
  d_S: number;
  d_A: number;
};

export type DiscriminationVector = {
  k: number;
  s: number;
  a: number;
};

export type QuestionOptionSeed = {
  code: "A" | "B";
  text: string;
  logic: string;
  vector: DimensionVector;
};

export type QuestionSeed = {
  questionIndex: number;
  version: string;
  primaryAnchor: DimensionKey;
  scenario: string;
  difficulty: number;
  discriminationVector: DiscriminationVector;
  tags: string[];
  options: QuestionOptionSeed[];
};

export type ResultSummary = {
  dominantAxis: DimensionKey;
  scores: DimensionState;
  labels: {
    coreTalent: string;
    socialStyle: string;
    assetMode: string;
  };
  cheatRisk: "低" | "中" | "高";
  preview: string[];
  paidBlocks: string[];
};
