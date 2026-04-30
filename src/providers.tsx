import { ConfigProvider, theme } from "antd";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#6ea8fe",
          borderRadius: 8,
          colorBgBase: "#050816",
          colorTextBase: "#edf2ff"
        }
      }}
    >
      {children}
    </ConfigProvider>
  );
}

