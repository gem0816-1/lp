export const appConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "SPT",
  learningRate: Number(process.env.MEASUREMENT_LEARNING_RATE || "0.18"),
  infoThreshold: Number(process.env.MEASUREMENT_INFO_THRESHOLD || "0.12"),
  cheatPenalty: Number(process.env.MEASUREMENT_CHEAT_PENALTY || "0.35"),
  syntheticSimulationEnabled: process.env.SYNTHETIC_SIMULATION_ENABLED === "true",
  reportPreviewLockMinutes: Number(process.env.REPORT_PREVIEW_LOCK_MINUTES || "15")
} as const;
