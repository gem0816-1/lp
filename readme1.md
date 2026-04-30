# SPT 测评系统（交接与模块化文档）

本仓库是 **SPT（K/S/A 三维）动态测评系统** 的首版工程骨架，技术栈固定为 **Next.js App Router + Prisma + MySQL**，并使用 **Ant Design** 完成前后台界面。

本文档是“交接 + 续写”的主入口：你可以先按模块读清现状，再按模板新增模块，避免文档越写越散。

---

## 快速开始（本地）

### 1) 安装依赖

```bash
npm install
```

### 2) 配置环境变量

复制示例文件（Windows PowerShell）：

```bash
copy .env.example .env
```

最小可运行变量见 `.env.example`（关键项：`DATABASE_URL`）。

### 3) 同步 Prisma

```bash
npm run prisma:generate
npm run prisma:push
```

### 4) 启动

```bash
npm run dev
```

### 5) 最小验证

- 健康检查：`GET /api/health`
- 后台题库页：`/admin/questions`
- 测评入口：`/start` → `/test` → `/result/:sessionId` → `/report/:sessionId`

---

## 核心业务约束（硬规则）

这些约束是系统“可解释性与可标定”的基础，**除非明确做版本升级，否则不要随意改动**。

- **总题量固定**：80 题（不做缩减版问卷）。
- **主锚点比例固定**：K/S/A = 24 / 32 / 24。
- **每题必备字段**：`difficulty`、`discriminationVector`、完整 `option vector`。
- **选项联动**：每个选项必须同时牵动 K/S/A（不存在“纯安全选项”）。
- **冷启动两段式**：`Synthetic Persona` → `真人灰度`（先跑通动态系统，再用真实数据校准参数）。

---

## 架构与模块化（两层视图）

### 业务域模块视图（建议从这里读）

- **题库模块（QuestionBank）**：题目生成、入库、查询、版本与比例元信息
- **测评会话模块（AssessmentSession）**：创建会话、进度、状态（进行中/已完成）
- **作答与状态演进模块（Answering + Measurement）**：信息量计算、向量更新、作弊惩罚、快照记录
- **结果与报告模块（Result + Report）**：免费结果、预览报告、（预留）解锁与支付链路
- **标定与冷启动模块（Calibration）**：演练记录、阶段化推进（占位数据 + 后续跑批）
- **健康检查模块（Health）**：数据库连通性自检

### 目录映射视图（代码落点）

```text
app/
  api/                      # HTTP API 入口（Next.js Route Handlers）
  admin/                    # 后台页面（题库、标定等）
  start/ test/              # 测评入口与答题页
  result/[sessionId]/       # 免费结果页
  report/[sessionId]/       # 深度报告页（预览态）
components/                 # 复用 UI 组件（后台表格、面板等）
lib/                        # 领域逻辑（题库/测评/报告/配置/Prisma client）
prisma/schema.prisma        # 数据模型（MySQL）
```

---

## 模块清单（逐模块）

> 每个模块固定写法：**职责** / **数据模型** / **API** / **页面与组件** / **关键规则与边界**。后续新增模块也按同样结构续写。

### 模块：题库与生成（QuestionBank）

- **职责**
  - 生成固定题量的题库（80题），并保证 K/S/A 主锚点比例
  - 将题目与选项写入数据库；提供查询“激活题库 + 选项”的读取能力
- **数据模型**
  - `Question`、`QuestionOption`（见 `prisma/schema.prisma`）
  - 关键字段：`questionIndex`（全局唯一）、`primaryAnchor`、`difficulty`、`discriminationVector`、`option.vector`
- **API**
  - `POST /api/admin/questions/import`：确保题库存在（首次会生成并入库）
  - `GET /api/questions/bootstrap`：用于前端启动/拉取题库元信息（如后续扩展需要）
- **配置（可选：外部题库出题）**
  - `QUESTION_BANK_PROVIDER`：`local`（默认）/ `external`
  - `QUESTION_BANK_EXTERNAL_URL`：外部出题接口（GET），服务端会携带 `questionIndex` 查询参数
    - 返回体支持两种形态：`QuestionSeed` 或 `{ question: QuestionSeed }`
    - 系统会把外部返回的题目 **upsert 回本地数据库**（按 `questionIndex`），以保证 `ResponseRecord.questionId` 外键约束不被破坏
- **页面与组件**
  - 后台：`/admin/questions`（题库统计 + 列表）
  - 组件：`components/admin-questions-table.tsx`
- **关键规则与边界**
  - 题库不是“自由编辑型问卷”，而是版本化、可标定的动态系统输入源
  - `questionIndex` 与总题量/比例绑定，改动等同于“新版本题库”

关键入口文件：
- `lib/question-bank.ts`
- `app/api/admin/questions/import/route.ts`
- `app/admin/questions/page.tsx`

---

### 模块：测评会话（AssessmentSession）

- **职责**
  - 创建测评会话，保存初始状态、当前状态与进度
  - 输出“当前应答题目 + 选项”给前端渲染
- **数据模型**
  - `AssessmentSession`：状态机与进度（`DRAFT/IN_PROGRESS/COMPLETED`）
  - `ResponseRecord`：作答记录
  - `StateSnapshot`：每题前后状态快照（用于回放、诊断与标定）
- **API**
  - `POST /api/assessment/session`：创建会话
  - `GET /api/assessment/:sessionId/progress`：读取进度与当前题
- **页面与组件**
  - `/test`：创建会话 → 拉进度 → 展示题目与选项
- **关键规则与边界**
  - 会话逻辑集中在 `lib/session-service.ts`，API 层只做薄转发（避免“业务散在 route.ts”）
  - 若启用外部题库（`QUESTION_BANK_PROVIDER=external`），会话启动时会先拉取第 1 题并写入本地库，后续每次取题按题号向外部接口拉取并同步

关键入口文件：
- `lib/session-service.ts`
- `app/api/assessment/session/route.ts`
- `app/api/assessment/[sessionId]/progress/route.ts`
- `app/test/page.tsx`

---

### 模块：作答与状态演进（Answering + Measurement）

- **职责**
  - 接收用户选择的 optionCode，计算信息量并更新状态向量
  - 记录作答与快照；必要时触发“会话完成 → 生成报告（预览态）”
- **数据模型**
  - `ResponseRecord.infoScore`：每题信息量分数
  - `AssessmentSession.currentState`：K/S/A 当前状态（Json）
  - `AssessmentSession.cheatScore`：伪装/投机风险累计值
- **API**
  - `POST /api/assessment/answer`：提交答案并推进状态
- **页面与组件**
  - `/test`：提交后若完成则跳 `/result/:sessionId`，否则继续拉进度
- **关键规则与边界**
  - 信息量：`infoScore(state, discrimination, difficulty)`（见 `lib/measurement.ts`）
  - 状态更新：`applyVector` 使用 `MEASUREMENT_LEARNING_RATE`
  - 伪装惩罚：满足“全正向/过高总增量”等触发 `MEASUREMENT_CHEAT_PENALTY`
  - 返回结构包含 `skippedByInfoThreshold`（阈值：`MEASUREMENT_INFO_THRESHOLD`），便于后续做自适应策略（首版先保留信号位）

关键入口文件：
- `lib/measurement.ts`
- `app/api/assessment/answer/route.ts`

---

### 模块：结果与报告（Result + Report）

- **职责**
  - 免费结果页：展示主导轴心与一级标签（更快、更克制）
  - 深度报告页：展示预览态摘要 + 二阶解读（并预留解锁链路）
- **数据模型**
  - `Report`：`previewText`、`fullJson`、`unlockStatus`（`LOCKED/PREVIEW/UNLOCKED`）
  - `AssessmentSession.dimensionSummary`：会话完成时的摘要缓存（可回放/复用）
- **API**
  - `GET /api/result/:sessionId`：免费结果数据
  - `GET /api/report/:sessionId`：深度报告数据（首版以 `PREVIEW` 为主）
- **页面与组件**
  - `/result/[sessionId]`：免费结果页
  - `/report/[sessionId]`：深度报告页（含 unlockStatus 提示）
- **关键规则与边界**
  - “免费结果”只暴露一级标签；二阶错位与长期收益路径在深度报告中展开
  - 解锁链路当前只保留状态位与文案占位，后续模块化接入支付/订单即可

关键入口文件：
- `lib/report.ts`
- `app/api/result/[sessionId]/route.ts`
- `app/api/report/[sessionId]/route.ts`
- `app/result/[sessionId]/page.tsx`
- `app/report/[sessionId]/page.tsx`

---

### 模块：标定与冷启动（Calibration）

- **职责**
  - 保存每次“冷启动演练/标定”运行记录，作为参数讨论与题库诊断的载体
  - 当前实现为占位：生成一条 Synthetic Persona 演练记录，并展示列表
- **数据模型**
  - `CalibrationRun`：`stage`、`runName`、`totalSimulations`、`summaryJson`
- **API**
  - `GET /api/admin/calibration/runs`：最近 20 条演练记录
  - `POST /api/admin/calibration/simulate`：生成一条 Synthetic Persona 演练记录（占位）
- **页面与组件**
  - `/admin/calibration`：标定后台
  - 组件：`components/admin-calibration-panel.tsx`
- **关键规则与边界**
  - 两段式推进是“方法论”，不是 UI 文案：先系统稳定性诊断，再真人灰度修正参数
  - 后续若接入真实跑批，应将“生成任务/队列/结果归档”单独拆为新模块（见文末模板）

关键入口文件：
- `app/api/admin/calibration/runs/route.ts`
- `app/api/admin/calibration/simulate/route.ts`
- `app/admin/calibration/page.tsx`
- `components/admin-calibration-panel.tsx`

---

### 模块：健康检查（Health）

- **职责**
  - 校验服务与数据库连通性，作为最小运行自检
- **API**
  - `GET /api/health`：返回 `{ ok, database }`
- **关键规则与边界**
  - 只做“连通性”，不承担迁移、修复等副作用操作

关键入口文件：
- `app/api/health/route.ts`

---

## 配置项与可调参数

配置集中在：
- `.env.example`
- `lib/config.ts`

当前已存在的关键参数（含默认值）：
- **数据库**：`DATABASE_URL`（MySQL）
- **安全预留**：`JWT_SECRET`（首版未接入鉴权流程也先保留）
- **前端展示**：`NEXT_PUBLIC_APP_NAME`
- **可观测/联调**：`NEXT_PUBLIC_API_BASE_URL`
- **测量系统参数**
  - `MEASUREMENT_LEARNING_RATE`：学习率（状态更新的步长）
  - `MEASUREMENT_INFO_THRESHOLD`：信息量阈值（用于后续自适应策略信号）
  - `MEASUREMENT_CHEAT_PENALTY`：伪装惩罚增量
- **冷启动**：`SYNTHETIC_SIMULATION_ENABLED`
- **报告**：`REPORT_PREVIEW_LOCK_MINUTES`（预览锁定窗口/展示策略预留）
- **外部题库（站内 OpenAI 出题实现）**
  - `QUESTION_BANK_PROVIDER=external`：启用外部题库模式（会话拉题时按题号请求外部接口，并 upsert 回本地）
  - `QUESTION_BANK_EXTERNAL_URL`：外部题库接口（GET），必须是**绝对 URL**，例如：
    - 本地：`http://localhost:3000/api/questions/openai`
    - Vercel：`https://<你的域名>/api/questions/openai`
  - OpenAI/ChatGPT 出题所需：
    - `OPENAI_API_KEY`：你的 OpenAI API Key（仅服务端使用，不会暴露到浏览器）
    - `OPENAI_MODEL`：默认 `gpt-4o-mini`
    - `OPENAI_BASE_URL`：默认 `https://api.openai.com/v1`（一般无需改）

---

## 文档规范（写作与更新时机）

- **语言**：文档面向中文读者；专有名词/代码路径/环境变量名可保留英文。
- **更新时机**：每完成一个模块（或对某模块产生行为变更）时，在同一批变更中更新 `readme1.md` 对应模块章节。
- **更新粒度**：以模块为单位更新，不在 README 里堆零散“杂项记录”。杂项写进模块的“关键规则与边界”或“验证方式”。

---

## 在新对话 / 新迭代中如何续写（可复制）

新开 Cursor 对话时可以直接粘贴以下提示词，让协作者“基于现状续写”而不是重做：

```text
请基于仓库的 readme1.md 继续开发，不要重做已有模块。
先快速阅读以下文件确认现状与边界：
- prisma/schema.prisma
- lib/session-service.ts
- lib/question-bank.ts
- lib/measurement.ts
- lib/report.ts
- app/api/assessment/answer/route.ts

当前优先任务：<在这里填写你这次要做的具体目标>
要求：先直接改代码并自查 lint，再给出变更说明与最小验证方式；说明与文档使用中文。
```

---

## 新增模块如何续写（重点：模板 + Checklist）

### 续写原则（模块化约束）

- **一个模块=一个清晰职责边界**：不要把新逻辑散落在多个 `route.ts` 里；API 保持薄层，核心逻辑落到 `lib/*`。
- **每个模块必须可追溯**：至少包含“入口文件 + 数据模型 + API + 页面/组件 + 规则 + 验证方式”。
- **新增模块不改旧模块语义**：若必须改，写清“破坏性变更点”和迁移/兼容方案。

### 模块章节骨架（直接复制到本文档末尾续写）

```text
### 模块：<模块名（中英文可选）>

- 职责
  - <一句话目标>
  - <本模块解决什么、不解决什么（边界）>

- 数据模型（Prisma）
  - 影响的 model：<ModelA / ModelB ...>
  - 新增/修改字段：<字段与含义>
  - 关键约束与索引：<unique / index / enum>

- API（Next.js Route Handlers）
  - <METHOD> <PATH>：<用途>
    - 请求：<body/query>
    - 响应：<字段>
    - 错误：<常见错误与 status>

- 页面与组件（如有）
  - 页面：<路由>
  - 组件：<components/*>

- 领域逻辑落点（lib）
  - 新增文件：<lib/xxx.ts>
  - 核心函数：<export 的入口函数>
  - 与旧模块的耦合点：<调用关系>

- 配置项（如有）
  - 新增 env：<.env.example + lib/config.ts>
  - 默认值与影响面：<一句话>

- 验证方式（最小步骤）
  - curl / 浏览器路径：
    - <GET/POST ...>
  - 预期结果：<一句话>

- 关键规则与边界
  - <权限/状态机/幂等/一致性/性能 等关键约束>
```

### 新增模块 Checklist（提交前自检）

- **代码结构**
  - [ ] 业务逻辑主要落在 `lib/*`，`app/api/*` 仅做参数解析与返回
  - [ ] 相关页面/后台入口与 API 对齐，路径写入模块章节
- **数据与兼容**
  - [ ] `prisma/schema.prisma` 已更新（如有）
  - [ ] 说明是否为破坏性变更；如是，写清迁移与兼容策略
- **配置与文档联动**
  - [ ] `.env.example` 与 `lib/config.ts` 同步（如有新配置）
  - [ ] `readme1.md`：新增模块章节已补齐（按骨架）
- **可验证**
  - [ ] 给出最小验证路径（curl 或 UI 点击路径）
  - [ ] 自查 `npm run lint`（或至少 `next lint`）无新增报错

---

## 建议的后续模块（Roadmap）

- **支付与解锁链路**：`PaymentOrder` → 报告解锁（`Report.unlockStatus=UNLOCKED`）
- **题库版本管理**：题库版本升级、灰度投放、回放对比
- **标定跑批系统**：把“演练记录”升级为“任务队列 + 结果归档 + 诊断报表”
- **审计与风控**：异常答题时长、重复模式、作弊风险解释面板
