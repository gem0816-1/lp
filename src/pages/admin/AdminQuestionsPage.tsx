import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Row, Space, Spin, Statistic, Typography, message } from "antd";
import { apiJson } from "@/lib/api";
import { AdminQuestionsTable, type AdminQuestion } from "@/components/AdminQuestionsTable";

type QuestionBankMeta = { version: string; ratio: { K: number; S: number; A: number } };
type QuestionsPayload = { questions: AdminQuestion[]; meta: QuestionBankMeta };

export function AdminQuestionsPage() {
  const [data, setData] = useState<QuestionsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ratioText = useMemo(() => (data ? `${data.meta.ratio.K} / ${data.meta.ratio.S} / ${data.meta.ratio.A}` : "-"), [data]);

  async function reload() {
    setError(null);
    const next = await apiJson<QuestionsPayload>("/api/admin/questions");
    setData(next);
  }

  useEffect(() => {
    void reload().catch((e: unknown) => setError(e instanceof Error ? e.message : "加载失败"));
  }, []);

  async function handleImport() {
    await apiJson("/api/admin/questions/import", { method: "POST" });
    message.success("题库已确保存在（local 模式会生成并入库）。");
    await reload();
  }

  if (error) {
    return <Alert type="error" message={error} showIcon />;
  }

  if (!data) {
    return <Spin size="large" fullscreen />;
  }

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <Typography.Title style={{ color: "#fff", marginBottom: 0 }}>题库后台</Typography.Title>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Statistic title="题目总量" value={data.questions.length} />
        </Col>
        <Col span={8}>
          <Statistic title="K / S / A" value={ratioText} />
        </Col>
        <Col span={8}>
          <Statistic title="版本" value={data.meta.version} />
        </Col>
      </Row>
      <Card>
        <Space direction="vertical" size={12} style={{ display: "flex" }}>
          <Button onClick={() => void handleImport()}>确保题库存在（import）</Button>
          <AdminQuestionsTable questions={data.questions} />
        </Space>
      </Card>
    </Space>
  );
}

