import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, Button, Card, Col, Row, Space, Spin, Statistic, Tag, Typography } from "antd";
import { apiJson } from "@/lib/api";

type ResultPayload = {
  sessionId: string;
  scores: { K: number; S: number; A: number };
  summary: {
    dominantAxis: string;
    labels: { coreTalent: string; socialStyle: string; assetMode: string };
    cheatRisk: "低" | "中" | "高";
    preview: string[];
  };
};

export function ResultPage() {
  const { sessionId } = useParams();
  const [data, setData] = useState<ResultPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    setError(null);
    void apiJson<ResultPayload>(`/api/result/${sessionId}`)
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "加载失败"));
  }, [sessionId]);

  if (!sessionId) {
    return <Alert type="error" message="缺少 sessionId" showIcon />;
  }

  if (error) {
    return <Alert type="error" message={error} showIcon />;
  }

  if (!data) {
    return <Spin size="large" fullscreen />;
  }

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <Typography.Title style={{ color: "#fff", marginBottom: 0 }}>免费结果</Typography.Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card>
            <Space direction="vertical" size={16} style={{ display: "flex" }}>
              <Tag color="blue">主导轴心：{data.summary.dominantAxis}</Tag>
              <Typography.Title level={3} style={{ margin: 0 }}>
                {data.summary.labels.coreTalent}
              </Typography.Title>
              <Typography.Paragraph style={{ fontSize: 16 }}>{data.summary.preview.join(" ")}</Typography.Paragraph>
              <Space wrap>
                <Tag>{data.summary.labels.socialStyle}</Tag>
                <Tag>{data.summary.labels.assetMode}</Tag>
                <Tag color={data.summary.cheatRisk === "高" ? "red" : data.summary.cheatRisk === "中" ? "orange" : "green"}>
                  伪装风险：{data.summary.cheatRisk}
                </Tag>
              </Space>
              <Button type="primary">
                <Link to={`/report/${sessionId}`}>查看深度报告</Link>
              </Button>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card>
            <Space direction="vertical" size={16} style={{ display: "flex" }}>
              <Statistic title="K" value={data.scores.K} precision={2} />
              <Statistic title="S" value={data.scores.S} precision={2} />
              <Statistic title="A" value={data.scores.A} precision={2} />
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}

