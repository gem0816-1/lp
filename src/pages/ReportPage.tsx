import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, Card, Space, Spin, Tag, Typography } from "antd";
import { apiJson } from "@/lib/api";

type ReportPayload = {
  sessionId: string;
  unlockStatus: string;
  previewText: string;
  fullJson: {
    summary: { paidBlocks: string[] };
    deepDive: { mismatchSignal: string; incomeCurve: string; collaborationAdvice: string[] };
  };
};

export function ReportPage() {
  const { sessionId } = useParams();
  const [data, setData] = useState<ReportPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    setError(null);
    void apiJson<ReportPayload>(`/api/report/${sessionId}`)
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "加载失败"));
  }, [sessionId]);

  const blocks = useMemo(() => data?.fullJson?.summary?.paidBlocks ?? [], [data]);
  const deepDive = data?.fullJson?.deepDive;

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
      <Typography.Title style={{ color: "#fff", marginBottom: 0 }}>深度报告</Typography.Title>
      <Alert
        type="info"
        message={`当前解锁状态：${data.unlockStatus}`}
        description="首版先保留预览态，后续可接支付与完整解锁链路。"
        showIcon
      />
      <Card>
        <Space direction="vertical" size={16} style={{ display: "flex" }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            预览摘要
          </Typography.Title>
          <Typography.Paragraph>{data.previewText}</Typography.Paragraph>
          <Space wrap>
            {blocks.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </Space>
        </Space>
      </Card>
      <Card>
        <Typography.Title level={4}>二阶解读</Typography.Title>
        <Space direction="vertical" size={10} style={{ display: "flex" }}>
          {deepDive
            ? [deepDive.mismatchSignal, deepDive.incomeCurve, ...deepDive.collaborationAdvice].map((item) => (
                <Typography.Paragraph key={item} style={{ marginBottom: 0 }}>
                  {item}
                </Typography.Paragraph>
              ))
            : null}
        </Space>
      </Card>
    </Space>
  );
}

