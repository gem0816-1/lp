# SPT 测评系统

这是基于 `readme1.md` 继续落地的首版工程骨架，技术栈固定为 `Next.js App Router + Prisma + MySQL`，并使用 `Ant Design` 完成前后台界面。

## 已固定的业务约束

- 总题量固定为 `80`
- 主锚点比例固定为 `24 / 32 / 24`
- 每题必须包含 `difficulty`、`discrimination_vector`、完整 `option vector`
- 每个选项必须同时牵动 `K / S / A`
- 冷启动固定为 `Synthetic Persona + 真人灰度` 两段式

## 当前目录结构

```text
app/
  api/
  admin/
  report/[sessionId]/
  result/[sessionId]/
  start/
  test/
components/
lib/
prisma/
```

## 首版已实现

1. Prisma 数据模型
2. 80 题自动生成器
3. 测评会话创建、进度读取、作答提交
4. 免费结果页与深度报告页
5. 题库后台与标定后台

## 启动方式

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

```bash
copy .env.example .env
```

3. 同步 Prisma

```bash
npm run prisma:generate
npm run prisma:push
```

4. 启动项目

```bash
npm run dev
```
