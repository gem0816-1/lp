import { Space, Table, Tag, Typography } from "antd";

export type AdminQuestionOption = {
  id: string;
  code: string;
  vector: unknown;
};

export type AdminQuestion = {
  id: string;
  questionIndex: number;
  primaryAnchor: string;
  scenario: string;
  difficulty: number;
  options: AdminQuestionOption[];
};

export function AdminQuestionsTable({ questions }: { questions: AdminQuestion[] }) {
  return (
    <Table<AdminQuestion>
      rowKey="id"
      pagination={{ pageSize: 10 }}
      columns={[
        { title: "题号", dataIndex: "questionIndex", width: 80 },
        { title: "主锚点", dataIndex: "primaryAnchor", render: (value: string) => <Tag color="blue">{value}</Tag> },
        { title: "场景", dataIndex: "scenario" },
        { title: "难度", dataIndex: "difficulty", width: 100 },
        {
          title: "选项向量",
          key: "options",
          render: (_, record) => (
            <Space direction="vertical" size={4}>
              {record.options.map((option) => (
                <Typography.Text key={option.id}>
                  {option.code}: {JSON.stringify(option.vector)}
                </Typography.Text>
              ))}
            </Space>
          )
        }
      ]}
      dataSource={questions}
    />
  );
}

