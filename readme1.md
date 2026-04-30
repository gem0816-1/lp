# SPT 测评系统：进度与交接

本项目当前聚焦基于 `Next.js App Router + Prisma + MySQL` 构建一个网页全栈测评系统。系统以后端动态测量模型为核心，以前端社交标签化结果页为输出，目标是在 `K-S-A` 三维框架下完成题库管理、动态测评、结果解释、付费报告与运营灰度闭环。

## 快速开始

1. 安装依赖：

```bash
yarn install
```

2. 配置环境变量（项目根目录 `.env`，Prisma CLI 与 Next.js 共用）：

```env
DATABASE_URL="mysql://root:password@127.0.0.1:3306/spt_app"
JWT_SECRET="dev_secret_change_me"
NEXT_PUBLIC_APP_NAME="SPT"
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
MEASUREMENT_LEARNING_RATE="0.18"
MEASUREMENT_INFO_THRESHOLD="0.12"
MEASUREMENT_CHEAT_PENALTY="0.35"
SYNTHETIC_SIMULATION_ENABLED="true"
REPORT_PREVIEW_LOCK_MINUTES="15"
```

3. 同步 Prisma 结构：

```bash
yarn prisma:generate
yarn prisma:push
```

4. 启动 Web 应用：

```bash
yarn dev
```

5. 打开浏览器访问：

```text
http://localhost:3000
```

## Docker 部署（docker compose）

本仓库建议提供 `docker-compose.yml`，将以下服务编排在同一网络中运行：

- `mysql`：数据库（持久化到命名卷）
- `migrate`：一次性 Prisma 初始化（`prisma db push`）
- `web`：Next.js 全栈应用（SSR + API Route）
- `nginx`：反向代理与静态出口

### 1. 准备环境变量

复制环境变量示例文件：

```bash
cp .env.docker.example .env.docker
```

然后启动：

```bash
docker compose --env-file .env.docker up -d --build
```

说明：

- `DATABASE_URL` 必须指向 docker 内 MySQL 服务名，例如 `mysql:3306`
- `NEXT_PUBLIC_API_BASE_URL` 在构建阶段会注入前端 bundle，修改后需重新 build
- 测量参数如 `MEASUREMENT_LEARNING_RATE`、`MEASUREMENT_INFO_THRESHOLD` 不建议硬编码在代码中，需保留可调能力

### 2. 最小验证

1. 健康检查：

```bash
curl -s http://localhost:3000/api/health
```

期望返回：

```json
{
  "ok": true,
  "database": "connected"
}
```

2. 题库接口检查：

```bash
curl -s http://localhost:3000/api/questions/bootstrap
```

期望返回当前启用题库版本、三维比例与冷启动参数摘要。

### 常用命令

停止服务：

```bash
docker compose --env-file .env.docker down
```

## 生产部署建议（阿里云 / ECS 单机）

推荐使用 `docker compose` + 反向代理对外提供服务：

- 对公网仅开放 `80/443`
- `web` 与 `mysql` 仅在 docker 内网互通
- 管理后台、题库编辑、模拟标定接口不直接暴露到公网

生产环境变量建议：

- `JWT_SECRET`：使用随机强密钥
- `DATABASE_URL`：使用独立生产库
- `SYNTHETIC_SIMULATION_ENABLED`：仅在内网或后台任务中启用
- 报告售卖相关价格、锁定时长、灰度分组策略应独立配置

## 当前后端能力（设计与实现目标）

- 认证与会话：用户注册、登录、付费状态识别、报告解锁权限
- 题库系统：按版本管理题目、锚点、向量、标签、启用状态
- 测评引擎：动态状态更新、跳题、信息量筛题、反伪装检测
- 结果系统：基础标签、二阶效应诊断、付费报告解锁
- 标定系统：真人灰度 + Synthetic Persona 模拟跑批

建议的核心数据实体：

- `User`
- `AssessmentSession`
- `Question`
- `QuestionOption`
- `ResponseRecord`
- `StateSnapshot`
- `Report`
- `PaymentOrder`
- `CalibrationRun`
- `SyntheticPersonaProfile`

## 前端进度（持续迭代）

- 技术栈：
  - `Next.js App Router`
  - `Ant Design`
  - `TailwindCSS`
  - `Prisma + MySQL`

- 页面建议：
  - `/`：产品首页或测评落地页
  - `/start`：测评说明与入口
  - `/test`：正式答题页
  - `/result`：免费结果页
  - `/report`：付费深度报告页
  - `/admin/questions`：题库管理后台
  - `/admin/calibration`：参数标定与模拟后台

- 核心前端模块：
  - 答题流程容器：题目切换、进度条、跳题逻辑、断点续答
  - 结果展示模块：身份牌、三维标签、巴纳姆判词、付费遮罩
  - 后台配置模块：题库上传、参数开关、灰度实验看板

### 主题与视觉方向（前端）

- 结果页风格不走论文感，强调“社交身份牌 + 冷峻科技感”
- 免费报告只展示一级标签与部分解释
- 深度报告采用“绝密档案”式视觉，后半段模糊锁定
- 所有前端命名使用用户可传播语言，不直接暴露学术术语

## 核心测量模型

### 三维正交状态向量

用户在答题进程 `t` 下的状态定义为：

```math
U_t = \begin{bmatrix} K_t \\ S_t \\ A_t \end{bmatrix}
```

其中：

- `K_t`：天赋内核
- `S_t`：逻辑性格
- `A_t`：认知资产

系统输出不是单一分数，而是用户在三维空间中的动态坐标与偏移轨迹。

### 题量配比

80 道题按 `3:4:3` 分配：

- `K` 主锚点：24 题
- `S` 主锚点：32 题
- `A` 主锚点：24 题

这只是主锚点比例，不代表题目只作用于单一维度。每个选项都必须同时牵动 `K / S / A` 三个维度的升降。

### 多维项目反应理论（MIRT）

定义第 `i` 道题的区分度向量为 `\vec{a}_i`，难度参数为 `b_i`。用户选择选项 A 的概率为：

```math
P(X_i = A | U_t) = \frac{1}{1 + e^{-(\vec{a}_i \cdot U_t - b_i)}}
```

题目不是“你像不像某种人”，而是“在某个高压情境下，你会推动哪种维度组合”。

## 张量空间测量补充

### 1. 选项扰动向量（Perturbation Vector）

设第 `i` 题的选项 A 与 B 的响应向量分别为：

```math
\vec{r}_{i,A} = \begin{bmatrix} \Delta K_A \\ \Delta S_A \\ \Delta A_A \end{bmatrix},
\quad
\vec{r}_{i,B} = \begin{bmatrix} \Delta K_B \\ \Delta S_B \\ \Delta A_B \end{bmatrix}
```

要求：

- 每个选项必须同时包含 `d_K`、`d_S`、`d_A`
- 数值范围建议在 `-1.0 ~ 1.0`
- 不允许出现“只有一个维度变化，另外两个维度为 0”的偷懒题

### 2. 张力法则（Zero-sum vs Non-zero-sum）

为了形成真正的迫选博弈，两个选项在向量空间中必须具备张力。建议约束：

```math
\vec{r}_{i,A} \cdot \vec{r}_{i,B} \le 0
```

直观含义：

- A 方案可能提高 `K` 和 `A`，但强烈消耗 `S`
- B 方案可能保护 `S`，但削弱 `K` 的锋利度或 `A` 的沉淀效率

如果两个选项都“面面俱到”，题目就失去了测量意义。

### 3. 动态权重矩阵

系统引入状态转移矩阵 `W_t`：

```math
W_t = \begin{bmatrix}
w_{KK} & \alpha_{KS}K_{t-1} & \alpha_{KA}K_{t-1} \\
\alpha_{SK}S_{t-1} & w_{SS} & \alpha_{SA}S_{t-1} \\
\alpha_{AK}A_{t-1} & \alpha_{AS}A_{t-1} & w_{AA}
\end{bmatrix}
```

用户在第 `t` 题选择某个选项后的状态更新为：

```math
U_t = U_{t-1} + \eta \left( W_t \cdot \vec{r}_{i,choice} \right)
```

其中：

- `\eta`：学习率或步长
- `\vec{r}_{i,choice}`：当前所选项的三维扰动向量

这部分负责把前序题的表现转化为后续题的权重偏移，也就是你定义的“化学反应”。

## 统计学过滤与防作弊

### 项目信息函数（IIF）

某道题在当前状态下的信息量为：

```math
I_i(U_t) = \vec{a}_i^2 \cdot P_i(U_t) \cdot (1 - P_i(U_t))
```

若 `I_i(U_t) < \epsilon`，则：

- 前端可直接跳题
- 或后端将该题计为低权重样本

### 防伪装逻辑

由于每个选项都绑定三维扰动，用户无法轻易通过“选看起来最体面的一项”来伪装自己。

建议加入以下检测：

- 若用户连续大量选择三维全正增量选项，判定为异常模式
- 若用户刻意维持 `K/S/A` 全部高正向而缺少现实损耗，触发伪装惩罚
- 在结果页二阶效应中可归类为“高伪装度”或“端水型自我呈现”

这部分可通过 `MEASUREMENT_CHEAT_PENALTY` 控制惩罚强度。

## 题库 JSON 生成标准

题库不应只存文本，必须存可计算结构。建议单题 JSON 结构如下：

```json
{
  "question_id": 1,
  "primary_anchor": "K",
  "scenario": "你的团队发现了一个可能导致项目延期半年的底层逻辑漏洞，但客户明天就要验收。指出漏洞会立刻引发团队恐慌和客户追责，瞒报则可能在未来爆发。",
  "difficulty": 0.42,
  "discrimination_vector": {
    "k": 0.81,
    "s": 0.36,
    "a": 0.58
  },
  "tags": ["职场", "风险", "高压决策"],
  "options": {
    "A": {
      "text": "立刻拉停项目，强行拆解漏洞逻辑，不惜承担当下的信任危机。",
      "vector": {
        "d_K": 0.8,
        "d_S": -0.6,
        "d_A": 0.4
      },
      "logic": "极高的一眼洞察力与实战战斗力的体现，但会明显消耗系统稳态。"
    },
    "B": {
      "text": "按期交付，在不惊动客户的情况下，私下建立补丁任务线，用时间换空间。",
      "vector": {
        "d_K": -0.4,
        "d_S": 0.7,
        "d_A": 0.2
      },
      "logic": "维持团队兼容度与现实平衡，但牺牲了一部分判断锐度。"
    }
  }
}
```

出题约束：

- 严格保持 `24 / 32 / 24` 主锚点比例
- 每题都要有 `difficulty` 与 `discrimination_vector`
- 每个选项都要有完整 `vector`
- 场景必须是高压、复杂、去学术化的现实博弈

## API 设计建议

建议首批 API：

- `GET /api/health`
- `GET /api/questions/bootstrap`
- `POST /api/assessment/session`
- `POST /api/assessment/answer`
- `GET /api/assessment/:sessionId/progress`
- `GET /api/result/:sessionId`
- `GET /api/report/:sessionId`
- `POST /api/admin/questions/import`
- `POST /api/admin/calibration/simulate`
- `GET /api/admin/calibration/runs`

## 前端结果命名

### 天赋内核（K）

| 后端指标 | 前端称谓 | 潜台词 |
| :--- | :--- | :--- |
| 流体推理 | 一眼洞察（Vibe Check） | 是否能瞬间抓到核心逻辑 |
| 工作记忆 | 并发上限（Multi-Task） | 是否能同时处理多线任务 |
| 空间/结构 | 全局直觉（Map-Sense） | 是否能站在局中看全局 |
| 处理速度 | 爆发反应（Trigger） | 接到信号后的精准反馈速度 |

### 逻辑性格（S）

| 性格维度 | 对立标签 | 社交黑话 |
| :--- | :--- | :--- |
| 内/外向 | 独行型 ⇄ 强连型 | 靠独处蓄能，还是靠连接起势 |
| 开放性 | 破圈者 ⇄ 守序者 | 爱折腾新鲜事，还是偏熟悉秩序 |
| 尽责性 | 死磕派 ⇄ 灵感派 | 靠毅力推进，还是靠状态爆发 |
| 宜人性 | 独狼 ⇄ 团队挂 | 防御性强，还是协同适配强 |
| 神经质 | 高冷脸 ⇄ 易碎感 | 稳定压场，还是容易内耗 |

### 认知资产（A）

| 后端指标 | 前端称谓 | 潜台词 |
| :--- | :--- | :--- |
| 连接密度 | 举一反三力（Link） | 知识是否能自动串联 |
| 半衰期 | 认知含金量（Gold） | 你懂的东西会不会越来越值钱 |
| 杠杆率 | 实战战斗力（Attack） | 想法能不能转成现实结果 |

## 商业化判词与付费逻辑

免费结果页结构：

- 肯定天赋
- 指出内耗
- 暗示存在二阶错位

推荐付费墙文案：

> 系统检测到你的 `K-S-A` 序列存在错位摩擦。
>
> 你的天赋内核并不低，但你的性格配置正在限制你的资产兑现速度。你现在的一部分努力，不是在放大自己，而是在对冲自己。

付费报告建议包含：

1. 系统兼容性诊断
2. 十年收益仿真曲线
3. 副业 / 职业 / 合作方式建议
4. 高伪装度或高内耗风险提示

## 冷启动参数标定

在正式上线前，不建议只走单一路线。建议采用“两段式冷启动”：

### 第一阶段：Synthetic Persona 跑批

目标：

- 快速验证动态权重矩阵 `W_t` 是否稳定
- 检查题库是否存在“端水题”“无张力题”“全正向诱导题”
- 跑出不同人格与策略下的状态轨迹分布

执行方式：

- 让大语言模型扮演不同合成人类画像
- 例如：高算力独狼、稳定执行者、社交协调者、伪装型高情商、焦虑型高潜用户
- 每类 Persona 跑数千次，累计上万局模拟

观察指标：

- 三维分布是否塌缩
- 某些题是否信息量过低
- 伪装惩罚是否过强或过弱
- 结果标签是否过度集中

### 第二阶段：真人灰度测试

目标：

- 修正 LLM 模拟与真人行为差异
- 检测题目语言是否引发误解
- 评估结果页共鸣度与付费转化潜力

执行方式：

- 先找一批熟人、小范围目标用户、种子用户灰度
- 收集答题时长、弃测点、标签认同度、付费点击率
- 对比后台模拟结果，修正 `\eta`、`\epsilon`、交叉权重系数与判词模板

结论：

- 冷启动不应只靠真人，也不应只靠 LLM
- 最优策略是先用 Synthetic Persona 跑通动态系统，再用真人灰度把参数拉回现实

## 已落实的关键规则

- 项目是网页全栈架构，不是单页静态展示
- 技术栈对齐 `Next.js App Router + Prisma + MySQL`
- 80 题固定按 `3:4:3` 分配，即 `24 / 32 / 24`
- 每个选项必须同时牵动三个维度
- 每题必须具备可计算 JSON 结构
- 前序状态必须影响后序权重
- 免费结果只给一级解释，核心二阶效应进入付费报告

## 文档规范

- 本仓库面向中文读者，`README` 与项目说明默认使用中文
- 技术名词、数学符号、API 路径、环境变量可保留英文
- 对外文案禁止回退为论文腔
- 同一概念只保留一套前端命名，不混用多套说法

## Prisma 说明

建议主结构文件为：

- `prisma/schema.prisma`

建议在 schema 中覆盖：

- 用户
- 测评会话
- 题目
- 题目选项
- 作答记录
- 状态快照
- 报告
- 订单
- 标定任务

修改 schema 后执行：

```bash
yarn prisma:generate && yarn prisma:push
```

## 在新对话中如何续写

新开对话时可直接粘贴：

```text
请基于 readme1.md 的「SPT 测评系统：进度与交接」继续开发，不要重做已有世界观。
先快速确认以下约束：
- 技术栈固定为 Next.js App Router + Prisma + MySQL
- 80 题总量固定
- 题库比例按 24 / 32 / 24 生成
- 每题必须包含 difficulty、discrimination_vector、完整 option vector
- 每个选项必须同时牵动 K / S / A 三个维度
- 冷启动按 Synthetic Persona + 真人灰度两段式推进

当前优先任务：<在这里填写本次目标>
要求：先直接改代码或输出结构化设计，再给说明；说明与文档统一使用中文。
```

## 建议的后续模块

- 题库导入与审核后台
- 动态测评 API 与状态缓存
- 结果页与报告页前端实现
- 支付与报告解锁链路
- Synthetic Persona 批量模拟脚本
- 参数热更新与灰度实验看板
