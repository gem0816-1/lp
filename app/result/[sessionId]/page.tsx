import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card, Col, Row, Space, Statistic, Tag, Typography } from "antd";
import { getSessionResult } from "@/lib/session-service";

export const dynamic = "force-dynamic";

export default async function ResultPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const result = await getSessionResult(sessionId);

  if (!result) {
    notFound();
  }

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <Typography.Title style={{ color: "#fff", marginBottom: 0 }}>免费结果</Typography.Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card>
            <Space direction="vertical" size={16} style={{ display: "flex" }}>
              <Tag color="blue">主导轴心：{result.summary.dominantAxis}</Tag>
              <Typography.Title level={3} style={{ margin: 0 }}>
                {result.summary.labels.coreTalent}
              </Typography.Title>
              <Typography.Paragraph style={{ fontSize: 16 }}>
                {result.summary.preview.join(" ")}
              </Typography.Paragraph>
              <Space wrap>
                <Tag>{result.summary.labels.socialStyle}</Tag>
                <Tag>{result.summary.labels.assetMode}</Tag>
                <Tag color={result.summary.cheatRisk === "高" ? "red" : result.summary.cheatRisk === "中" ? "orange" : "green"}>
                  伪装风险：{result.summary.cheatRisk}
                </Tag>
              </Space>
              <Button type="primary">
                <Link href={`/report/${sessionId}`}>查看深度报告</Link>
              </Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <Space direction="vertical" size={16} style={{ display: "flex" }}>
              <Statistic title="K" value={result.scores.K} precision={2} />
              <Statistic title="S" value={result.scores.S} precision={2} />
              <Statistic title="A" value={result.scores.A} precision={2} />
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
