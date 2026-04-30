import { Button, Card, List, Space, Table, Tag, Typography } from "antd";

export type CalibrationRunItem = {
  id: string;
  stage: string;
  runName: string;
  totalSimulations: number;
  summaryJson: unknown;
};

export function AdminCalibrationPanel({
  runs,
  onCreate
}: {
  runs: CalibrationRunItem[];
  onCreate: () => Promise<void>;
}) {
  return (
    <Space direction="vertical" size={24} style={{ display: "flex" }}>
      <Card>
        <Space direction="vertical" size={16} style={{ display: "flex" }}>
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            冷启动固定采用两段式推进：先用 Synthetic Persona 跑通动态系统，再用真人灰度把参数拉回现实。
          </Typography.Paragraph>
          <List
            dataSource={[
              "第一阶段：Synthetic Persona，快速检测塌缩题、全正向诱导题、低信息量题。",
              "第二阶段：真人灰度，观察答题时长、弃测点、标签认同与付费点击。",
              "调整项：η、ε、交叉权重系数、判词模板、伪装惩罚强度。"
            ]}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
          <Button type="primary" onClick={() => void onCreate()}>
            生成一条 Synthetic Persona 演练记录
          </Button>
        </Space>
      </Card>
      <Card>
        <Table<CalibrationRunItem>
          rowKey="id"
          columns={[
            { title: "阶段", dataIndex: "stage", render: (value: string) => <Tag color="purple">{value}</Tag> },
            { title: "名称", dataIndex: "runName" },
            { title: "模拟量", dataIndex: "totalSimulations" },
            {
              title: "摘要",
              dataIndex: "summaryJson",
              render: (value: unknown) => <Typography.Text>{JSON.stringify(value)}</Typography.Text>
            }
          ]}
          dataSource={runs}
        />
      </Card>
    </Space>
  );
}

