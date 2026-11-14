# 期货次席管理系统 · Phase 0–1

## 云上优先（推荐）

可发布目录：**`seat-ops/`**（Next.js + Cursor Identity + Postgres/PGlite）

```bash
cd seat-ops
npm install
npm run dev
```

打开 **http://127.0.0.1:3000**。云上通过 Cursor 私有/团队登录；本地使用模拟身份。

详见 `seat-ops/README.md`。用 Cursor 聊天里的 Publish 确认发布。

## 本地三进程版（web + api + adapter-mock）

```bash
cd /path/to/demo
npm install
npm run dev
```

然后打开：**http://127.0.0.1:5173**

| 进程 | 地址 | 作用 |
|------|------|------|
| web | http://127.0.0.1:5173 | 管理后台 UI（Vite，`/api` 代理到 API） |
| api | http://127.0.0.1:8787 | 领域 API（JSON 文件库，易调试） |
| adapter-mock | http://127.0.0.1:8790 | CTP Mock 边界占位（Phase 2 接报单） |

## 演示账号

| 用户 | 密码 | 角色 |
|------|------|------|
| ops | ops123 | 运营 |
| risk | risk123 | 风控 |
| admin | admin123 | 管理员 |

## Phase 0–1 已包含

- 登录 / 角色、通道配置、审计日志、风控规则 schema
- 投资者镜像 CRUD、权限模板、操作员授权、开户状态机
- 出入金申请 / 审批 / 资金账本
- JR/T Mock JSON 摄入、冲突列表、工作台同步健康

## 本地调试提示

- 持久化文件：`api/data/store.json`（改完可热观察；admin 可在「系统」页重置）
- 只起 API：`npm run dev:api`
- 冒烟：先 `npm run dev:api`，另开终端 `npm run smoke`
- IDE 可直接对 `api/src` / `web/src` 下断点（tsx / Vite）

## 目录

```
api/            Nest 风格 Express 模块（Account/Fund/Sync/System）
web/            React 管理台
adapter-mock/   CounterGateway Mock 进程
scripts/smoke.mjs
```

原仓库中的 Java RPN Calculator 未改动。
