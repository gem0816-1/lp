import "dotenv/config";
import cors from "cors";
import express from "express";
import { prisma } from "../lib/prisma";
import { appConfig } from "../lib/config";
import { ensureQuestionBank, getQuestionBankWithOptions, questionBankMeta } from "../lib/question-bank";
import {
  answerQuestion,
  createAssessmentSession,
  createSyntheticCalibrationRun,
  getReportDetail,
  getSessionProgress,
  getSessionResult,
  listCalibrationRuns
} from "../lib/session-service";
import { generateQuestionSeedByOpenAI } from "../lib/openai-question-bank";

const app = express();
app.disable("x-powered-by");
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, database: "connected" });
  } catch {
    res.status(500).json({ ok: false, database: "disconnected" });
  }
});

app.get("/api/questions/bootstrap", async (_req, res) => {
  await ensureQuestionBank();
  res.json({
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
});

app.get("/api/questions/openai", async (req, res) => {
  const questionIndex = Number(req.query.questionIndex || "");
  if (!Number.isInteger(questionIndex)) {
    res.status(400).json({ message: "缺少或非法的 questionIndex（必须为整数）" });
    return;
  }

  try {
    const seed = await generateQuestionSeedByOpenAI(questionIndex);
    res.setHeader("Cache-Control", "no-store");
    res.json(seed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "出题失败";
    res.status(500).json({ message });
  }
});

app.post("/api/assessment/session", async (_req, res) => {
  const session = await createAssessmentSession();
  res.json({ sessionId: session.id, status: session.status });
});

app.get("/api/assessment/:sessionId/progress", async (req, res) => {
  const progress = await getSessionProgress(req.params.sessionId);
  if (!progress) {
    res.status(404).json({ message: "会话不存在" });
    return;
  }
  res.json(progress);
});

app.post("/api/assessment/answer", async (req, res) => {
  const { sessionId, optionCode } = req.body ?? {};
  const result = await answerQuestion(String(sessionId || ""), String(optionCode || ""));
  res.json(result);
});

app.get("/api/result/:sessionId", async (req, res) => {
  const result = await getSessionResult(req.params.sessionId);
  if (!result) {
    res.status(404).json({ message: "结果不存在" });
    return;
  }
  res.json(result);
});

app.get("/api/report/:sessionId", async (req, res) => {
  const report = await getReportDetail(req.params.sessionId);
  if (!report) {
    res.status(404).json({ message: "报告不存在" });
    return;
  }
  res.json(report);
});

app.post("/api/admin/questions/import", async (_req, res) => {
  await ensureQuestionBank();
  const questions = await getQuestionBankWithOptions();
  res.json({
    ok: true,
    imported: questions.length,
    version: questionBankMeta.version,
    ratio: questionBankMeta.ratio
  });
});

app.get("/api/admin/questions", async (_req, res) => {
  const questions = await getQuestionBankWithOptions();
  res.json({
    meta: { version: questionBankMeta.version, ratio: questionBankMeta.ratio },
    questions
  });
});

app.get("/api/admin/calibration/runs", async (_req, res) => {
  const runs = await listCalibrationRuns();
  res.json(runs);
});

app.post("/api/admin/calibration/simulate", async (_req, res) => {
  const run = await createSyntheticCalibrationRun();
  res.json(run);
});

app.use((err: unknown, _req: express.Request, res: express.Response) => {
  const message = err instanceof Error ? err.message : "服务端错误";
  res.status(500).json({ message });
});

const port = Number(process.env.PORT || "3000");
app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
});

