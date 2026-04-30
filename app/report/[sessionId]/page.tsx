import { notFound } from "next/navigation";
import { Alert, Card, Space, Tag, Typography } from "antd";
import { getReportDetail } from "@/lib/session-service";

export const dynamic = "force-dynamic";

export default async function ReportPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const report = await getReportDetail(sessionId);

  if (!report) {
    notFound();
  }

  const fullJson = report.fullJson as {
    summary: { paidBlocks: string[] };
    deepDive: { mismatchSignal: string; incomeCurve: string; collaborationAdvice: string[] };
  };

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <Typography.Title style={{ color: "#fff", marginBottom: 0 }}>深度报告</Typography.Title>
      <Alert
        type="info"
        message={`当前解锁状态：${report.unlockStatus}`}
        description="首版先保留预览态，后续可接支付与完整解锁链路。"
        showIcon
      />
      <Card>
        <Space direction="vertical" size={16} style={{ display: "flex" }}>
          <Typography.Title level={4} style={{ margin: 0 }}>预览摘要</Typography.Title>
          <Typography.Paragraph>{report.previewText}</Typography.Paragraph>
          <Space wrap>
            {fullJson.summary.paidBlocks.map((item) => (
              <Tag key={item}>{item}</Tag>
            ))}
          </Space>
        </Space>
      </Card>
      <Card>
        <Typography.Title level={4}>二阶解读</Typography.Title>
        <Space direction="vertical" size={10} style={{ display: "flex" }}>
          {[
            fullJson.deepDive.mismatchSignal,
            fullJson.deepDive.incomeCurve,
            ...fullJson.deepDive.collaborationAdvice
          ].map((item) => (
            <Typography.Paragraph key={item} style={{ marginBottom: 0 }}>
              {item}
            </Typography.Paragraph>
          ))}
        </Space>
      </Card>
    </Space>
  );
}
