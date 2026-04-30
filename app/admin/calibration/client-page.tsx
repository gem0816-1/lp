"use client";

import { useRouter } from "next/navigation";
import { message, Space, Typography } from "antd";
import { AdminCalibrationPanel } from "@/components/admin-calibration-panel";

type CalibrationRunItem = {
  id: string;
  stage: string;
  runName: string;
  totalSimulations: number;
  summaryJson: unknown;
};

export default function AdminCalibrationClientPage({ runs }: { runs: CalibrationRunItem[] }) {
  const router = useRouter();

  async function handleCreate() {
    await fetch("/api/admin/calibration/simulate", { method: "POST" });
    message.success("已生成新的 Synthetic Persona 演练记录。");
    router.refresh();
  }

  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <Typography.Title style={{ color: "#fff", marginBottom: 0 }}>标定后台</Typography.Title>
      <AdminCalibrationPanel runs={runs} onCreate={handleCreate} />
    </Space>
  );
}
