export const appConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "SPT",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
  learningRate: Number(process.env.MEASUREMENT_LEARNING_RATE || "0.18"),
  infoThreshold: Number(process.env.MEASUREMENT_INFO_THRESHOLD || "0.12"),
  cheatPenalty: Number(process.env.MEASUREMENT_CHEAT_PENALTY || "0.35"),
  syntheticSimulationEnabled: process.env.SYNTHETIC_SIMULATION_ENABLED === "true",
  reportPreviewLockMinutes: Number(process.env.REPORT_PREVIEW_LOCK_MINUTES || "15"),
  questionBankProvider: (process.env.QUESTION_BANK_PROVIDER || "local") as "local" | "external",
  questionBankExternalUrl: process.env.QUESTION_BANK_EXTERNAL_URL || "",
  openai: {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    enabled: Boolean(process.env.OPENAI_API_KEY)
  }
} as const;
