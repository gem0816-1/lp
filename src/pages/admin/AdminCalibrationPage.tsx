import { useEffect, useState } from "react";
import { Alert, Space, Spin, Typography, message } from "antd";
import { apiJson } from "@/lib/api";
import { AdminCalibrationPanel, type CalibrationRunItem } from "@/components/AdminCalibrationPanel";

export function AdminCalibrationPage() {
  const [runs, setRuns] = useState<CalibrationRunItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    setError(null);
    const next = await apiJson<CalibrationRunItem[]>("/api/admin/calibration/runs");
    setRuns(next);
  }

  useEffect(() => {
    void reload().catch((e: unknown) => setError(e instanceof Error ? e.message : "加载失败"));
  }, []);

  async function handleCreate() {
    await apiJson("/api/admin/calibration/simulate", { method: "POST" });
    message.success("已生成新的 Synthetic Persona 演练记录。");
    await reload();
  }

  if (error) {
    return <Alert type="error" message={error} showIcon />;
  }

  if (!runs) {
    return <Spin size="large" fullscreen />;
  }

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <Typography.Title style={{ color: "#fff", marginBottom: 0 }}>标定后台</Typography.Title>
      <AdminCalibrationPanel runs={runs} onCreate={handleCreate} />
    </Space>
  );
}

