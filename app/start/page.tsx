import Link from "next/link";

export default function StartPage() {
  return (
    <main style={{ color: "#fff", padding: "24px 0" }}>
      <h1>测评入口</h1>
      <p style={{ maxWidth: 760, color: "rgba(255,255,255,0.72)", lineHeight: 1.7 }}>
        本测评不是静态标签题，而是观察你在高压情境下如何推动局势。每个选项都会同时改写 K / S / A 三个维度，因此没有纯安全答案。
      </p>
      <ul style={{ lineHeight: 1.8, color: "rgba(255,255,255,0.72)" }}>
        <li>总题量固定 80 题，不做缩减版问卷。</li>
        <li>题库主锚点比例固定为 24 / 32 / 24。</li>
        <li>每题都包含难度、区分度向量与完整选项向量。</li>
        <li>结果页先给免费一级标签，深度报告再展开二阶错位。</li>
      </ul>
      <Link
        href="/test"
        style={{
          display: "inline-block",
          marginTop: 16,
          padding: "10px 18px",
          borderRadius: 8,
          background: "#6ea8fe",
          color: "#08101f",
          textDecoration: "none",
          fontWeight: 600
        }}
      >
        开始答题
      </Link>
    </main>
  );
}
