import { Card, Col, Row, Space, Statistic, Typography } from "antd";
import { AdminQuestionsTable } from "@/components/admin-questions-table";
import { getQuestionBankWithOptions, questionBankMeta } from "@/lib/question-bank";

export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage() {
  const questions = await getQuestionBankWithOptions();

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <Typography.Title style={{ color: "#fff", marginBottom: 0 }}>题库后台</Typography.Title>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Statistic title="题目总量" value={questions.length} />
        </Col>
        <Col span={8}>
          <Statistic title="K / S / A" value={`${questionBankMeta.ratio.K} / ${questionBankMeta.ratio.S} / ${questionBankMeta.ratio.A}`} />
        </Col>
        <Col span={8}>
          <Statistic title="版本" value={questionBankMeta.version} />
        </Col>
      </Row>
      <Card>
        <AdminQuestionsTable questions={questions} />
      </Card>
    </Space>
  );
}
