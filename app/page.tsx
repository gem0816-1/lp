import Link from "next/link";
import type { CSSProperties } from "react";
import { questionBankMeta } from "@/lib/question-bank";

export default function HomePage() {
  return (
    <main style={{ color: "#fff", display: "grid", gap: 24 }}>
      <section
        style={{
          minHeight: "calc(100vh - 160px)",
          display: "grid",
          alignItems: "center",
          background:
            "radial-gradient(circle at top right, rgba(110,168,254,0.18), transparent 28%), linear-gradient(135deg, rgba(10,18,40,0.96), rgba(4,7,20,1))",
          padding: 32,
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <div style={{ display: "grid", gap: 18, maxWidth: 760 }}>
          <div style={{ color: "#6ea8fe", fontSize: 14 }}>Next.js App Router + Prisma + MySQL</div>
          <h1 style={{ margin: 0, fontSize: 48 }}>SPT 测评系统</h1>
          <p style={{ color: "rgba(255,255,255,0.72)", lineHeight: 1.8, margin: 0 }}>
            这不是静态问卷，而是一套围绕 K / S / A 三维状态向量运行的动态测量系统。首版已经把 80 题固定比例、题目向量结构、冷启动标定流程和结果分层展示全部落成工程骨架。
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/start" style={buttonPrimary}>进入测评入口</Link>
            <Link href="/admin/questions" style={buttonGhost}>查看题库后台</Link>
          </div>
        </div>
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitle}>世界观约束</h2>
        <ul style={listStyle}>
          <li>技术栈固定为 Next.js App Router + Prisma + MySQL</li>
          <li>80 题总量固定，按 24 / 32 / 24 生成</li>
          <li>每题包含 difficulty、discrimination_vector、完整 option vector</li>
          <li>每个选项同时牵动 K / S / A 三个维度</li>
          <li>冷启动按 Synthetic Persona + 真人灰度两段式推进</li>
        </ul>
      </section>

      <section style={panelStyle}>
        <h2 style={sectionTitle}>题库元信息</h2>
        <ul style={listStyle}>
          <li>题目总量：{questionBankMeta.total}</li>
          <li>题库版本：{questionBankMeta.version}</li>
          <li>K 题量：{questionBankMeta.ratio.K}</li>
          <li>S 题量：{questionBankMeta.ratio.S}</li>
          <li>A 题量：{questionBankMeta.ratio.A}</li>
        </ul>
      </section>
    </main>
  );
}

const panelStyle: CSSProperties = {
  padding: 24,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.02)"
};

const sectionTitle: CSSProperties = {
  marginTop: 0,
  marginBottom: 16
};

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  lineHeight: 1.9,
  color: "rgba(255,255,255,0.72)"
};

const buttonPrimary: CSSProperties = {
  display: "inline-block",
  padding: "10px 18px",
  borderRadius: 8,
  background: "#6ea8fe",
  color: "#08101f",
  textDecoration: "none",
  fontWeight: 600
};

const buttonGhost: CSSProperties = {
  display: "inline-block",
  padding: "10px 18px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.14)",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 600
};
