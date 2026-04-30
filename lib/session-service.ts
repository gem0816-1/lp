import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getQuestionByIndexWithOptions, PersistedQuestion, questionBankMeta } from "@/lib/question-bank";
import {
  applyVector,
  buildResultSummary,
  createInitialState,
  getCheatScoreIncrement,
  infoScore
} from "@/lib/measurement";
import { createPreviewText, createReportPayload } from "@/lib/report";
import { appConfig } from "@/lib/config";

function parseJson<T>(value: Prisma.JsonValue): T {
  return value as T;
}

async function getQuestionByIndex(questionIndex: number): Promise<PersistedQuestion | null> {
  return getQuestionByIndexWithOptions(questionIndex);
}

export async function createAssessmentSession() {
  const firstQuestion = await getQuestionByIndexWithOptions(1);
  if (!firstQuestion) {
    throw new Error("题库初始化失败：无法获取第 1 题");
  }

  const state = createInitialState();

  return prisma.assessmentSession.create({
    data: {
      status: "IN_PROGRESS",
      questionVersion: firstQuestion.version,
      initialState: state,
      currentState: state
    }
  });
}

export async function getSessionProgress(sessionId: string) {
  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId }
  });

  if (!session) {
    return null;
  }

  const question = await getQuestionByIndex(session.currentQuestionIndex);

  return {
    sessionId: session.id,
    status: session.status,
    answeredCount: session.answeredCount,
    total: questionBankMeta.total,
    progress: Number(((session.answeredCount / questionBankMeta.total) * 100).toFixed(2)),
    question: question
      ? {
          id: question.id,
          questionIndex: question.questionIndex,
          primaryAnchor: question.primaryAnchor,
          scenario: question.scenario,
          difficulty: question.difficulty,
          tags: question.tags,
          options: question.options.map((option) => ({
            code: option.code,
            text: option.text,
            logic: option.logic
          }))
        }
      : null
  };
}

export async function answerQuestion(sessionId: string, optionCode: string) {
  const session = await prisma.assessmentSession.findUnique({ where: { id: sessionId } });
  if (!session) {
    throw new Error("会话不存在");
  }

  if (session.status === "COMPLETED") {
    return { completed: true, sessionId };
  }

  const question = await getQuestionByIndex(session.currentQuestionIndex);
  if (!question) {
    throw new Error("题目不存在");
  }

  const option = question.options.find((item) => item.code === optionCode);
  if (!option) {
    throw new Error("选项不存在");
  }

  const currentState = parseJson<{ K: number; S: number; A: number }>(session.currentState);
  const vector = parseJson<{ d_K: number; d_S: number; d_A: number }>(option.vector);
  const discrimination = parseJson<{ k: number; s: number; a: number }>(question.discriminationVector);

  const score = infoScore(currentState, discrimination, question.difficulty);
  const nextState = applyVector(currentState, vector);
  const cheatIncrement = getCheatScoreIncrement(vector);
  const nextQuestionIndex = session.currentQuestionIndex + 1;
  const completed = nextQuestionIndex > questionBankMeta.total;
  const totalCheat = Number((session.cheatScore + cheatIncrement).toFixed(4));

  await prisma.$transaction([
    prisma.responseRecord.create({
      data: {
        sessionId,
        questionId: question.id,
        selectedOptionCode: option.code,
        infoScore: score,
        cheatFlag: cheatIncrement > 0
      }
    }),
    prisma.stateSnapshot.create({
      data: {
        sessionId,
        questionIndex: question.questionIndex,
        preState: currentState,
        postState: nextState,
        appliedVector: vector
      }
    }),
    prisma.assessmentSession.update({
      where: { id: sessionId },
      data: {
        currentState: nextState,
        answeredCount: { increment: 1 },
        currentQuestionIndex: completed ? session.currentQuestionIndex : nextQuestionIndex,
        cheatScore: totalCheat,
        status: completed ? "COMPLETED" : "IN_PROGRESS",
        completedAt: completed ? new Date() : null,
        dimensionSummary: completed ? buildResultSummary(nextState, totalCheat) : undefined
      }
    })
  ]);

  if (completed) {
    const reportPayload = createReportPayload(nextState, totalCheat);
    await prisma.report.upsert({
      where: { sessionId },
      update: {
        previewText: createPreviewText(reportPayload.summary),
        fullJson: reportPayload,
        unlockStatus: "PREVIEW"
      },
      create: {
        sessionId,
        previewText: createPreviewText(reportPayload.summary),
        fullJson: reportPayload,
        unlockStatus: "PREVIEW"
      }
    });
  }

  return {
    completed,
    sessionId,
    nextQuestionIndex: completed ? null : nextQuestionIndex,
    infoScore: score,
    skippedByInfoThreshold: score < appConfig.infoThreshold
  };
}

export async function getSessionResult(sessionId: string) {
  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    include: { report: true }
  });

  if (!session) {
    return null;
  }

  const scores = parseJson<{ K: number; S: number; A: number }>(session.currentState);
  const summary =
    session.dimensionSummary !== null && session.dimensionSummary !== undefined
      ? parseJson<ReturnType<typeof buildResultSummary>>(session.dimensionSummary)
      : buildResultSummary(scores, session.cheatScore);

  return {
    sessionId,
    status: session.status,
    answeredCount: session.answeredCount,
    total: questionBankMeta.total,
    scores,
    summary,
    previewText: session.report?.previewText ?? null
  };
}

export async function getReportDetail(sessionId: string) {
  const report = await prisma.report.findUnique({
    where: { sessionId }
  });

  if (!report) {
    return null;
  }

  return {
    sessionId,
    unlockStatus: report.unlockStatus,
    previewText: report.previewText,
    fullJson: report.fullJson
  };
}

export async function listCalibrationRuns() {
  return prisma.calibrationRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 20
  });
}

export async function createSyntheticCalibrationRun() {
  const payload = {
    ratio: questionBankMeta.ratio,
    stages: ["Synthetic Persona", "真人灰度"],
    personas: [
      "高算力独狼",
      "稳定执行者",
      "社交协调者",
      "伪装型高情商",
      "焦虑型高潜用户"
    ],
    stability: "待人工复核",
    note: "当前为首版占位数据，后续接入批量模拟任务。"
  };

  return prisma.calibrationRun.create({
    data: {
      stage: "SYNTHETIC_PERSONA",
      runName: `冷启动演练-${new Date().toISOString()}`,
      totalSimulations: 5000,
      summaryJson: payload
    }
  });
}
