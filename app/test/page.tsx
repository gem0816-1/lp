"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Progress, Radio, Space, Spin, Tag, Typography, message } from "antd";

type ProgressPayload = {
  sessionId: string;
  answeredCount: number;
  total: number;
  progress: number;
  question: {
    questionIndex: number;
    primaryAnchor: string;
    scenario: string;
    difficulty: number;
    tags: string[];
    options: { code: string; text: string; logic: string }[];
  } | null;
};

export default function TestPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressPayload | null>(null);
  const [selected, setSelected] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      const created = await fetch("/api/assessment/session", { method: "POST" }).then((res) => res.json());
      setSessionId(created.sessionId);
      const next = await fetch(`/api/assessment/${created.sessionId}/progress`).then((res) => res.json());
      setProgress(next);
      setLoading(false);
    }

    void bootstrap();
  }, []);

  const options = useMemo(() => progress?.question?.options ?? [], [progress]);

  async function handleSubmit() {
    if (!sessionId || !selected) {
      message.warning("请选择一个选项后再继续。");
      return;
    }

    setSubmitting(true);
    const result = await fetch("/api/assessment/answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, optionCode: selected })
    }).then((res) => res.json());

    if (result.completed) {
      router.push(`/result/${sessionId}`);
      return;
    }

    const next = await fetch(`/api/assessment/${sessionId}/progress`).then((res) => res.json());
    setProgress(next);
    setSelected(undefined);
    setSubmitting(false);
  }

  if (loading || !progress?.question) {
    return <Spin size="large" fullscreen />;
  }

  return (
    <Space direction="vertical" size={20} style={{ display: "flex" }}>
      <Typography.Title level={3} style={{ color: "#fff", marginBottom: 0 }}>
        正式答题
      </Typography.Title>
      <Progress percent={progress.progress} status="active" />
      <Card>
        <Space direction="vertical" size={16} style={{ display: "flex" }}>
          <Space wrap>
            <Tag color="blue">第 {progress.question.questionIndex} / {progress.total} 题</Tag>
            <Tag>{progress.question.primaryAnchor} 主锚点</Tag>
            <Tag>难度 {progress.question.difficulty}</Tag>
          </Space>
          <Typography.Paragraph style={{ fontSize: 18, marginBottom: 0 }}>
            {progress.question.scenario}
          </Typography.Paragraph>
          <Space wrap>
            {progress.question.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
          <Radio.Group
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            style={{ width: "100%" }}
          >
            <Space direction="vertical" size={12} style={{ display: "flex" }}>
              {options.map((option) => (
                <Card
                  key={option.code}
                  size="small"
                  style={{
                    borderColor: selected === option.code ? "#6ea8fe" : undefined
                  }}
                >
                  <Radio value={option.code}>
                    <Space direction="vertical" size={4}>
                      <Typography.Text strong>{option.code}. {option.text}</Typography.Text>
                      <Typography.Text type="secondary">{option.logic}</Typography.Text>
                    </Space>
                  </Radio>
                </Card>
              ))}
            </Space>
          </Radio.Group>
          <Button type="primary" size="large" onClick={handleSubmit} loading={submitting}>
            提交并进入下一题
          </Button>
        </Space>
      </Card>
    </Space>
  );
}
