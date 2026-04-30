import { Link, useLocation } from "react-router-dom";
import { Layout, Menu, Typography } from "antd";

const { Header, Content } = Layout;

const items = [
  { key: "/", label: <Link to="/">总览</Link> },
  { key: "/start", label: <Link to="/start">开始测评</Link> },
  { key: "/admin/questions", label: <Link to="/admin/questions">题库后台</Link> },
  { key: "/admin/calibration", label: <Link to="/admin/calibration">标定后台</Link> }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const selected = items.find((item) => location.pathname.startsWith(item.key))?.key ?? "/";

  return (
    <Layout style={{ minHeight: "100vh", background: "#050816" }}>
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(5, 8, 22, 0.92)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)"
        }}
      >
        <Typography.Title level={4} style={{ color: "#fff", margin: 0 }}>
          SPT 测评系统
        </Typography.Title>
        <Menu
          mode="horizontal"
          theme="dark"
          selectedKeys={[selected]}
          items={items}
          style={{ flex: 1, justifyContent: "flex-end", minWidth: 0, background: "transparent" }}
        />
      </Header>
      <Content style={{ padding: "24px", maxWidth: 1280, width: "100%", margin: "0 auto" }}>
        {children}
      </Content>
    </Layout>
  );
}

