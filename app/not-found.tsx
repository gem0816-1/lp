import Link from "next/link";
import { Button, Result } from "antd";

export default function NotFound() {
  return (
    <Result
      status="404"
      title="页面不存在"
      subTitle="当前请求的资源还没有被创建，或者对应会话已经失效。"
      extra={
        <Button type="primary">
          <Link href="/">返回首页</Link>
        </Button>
      }
    />
  );
}
