# 次席运营（云上优先）

Cursor Apps 可发布目录：`seat-ops/`

- Next.js App Router + API Route Handlers（`export async function GET(request)`）
- Cursor Identity（私有/团队登录）
- Postgres（发布时）/ 本地 PGlite
- Phase 0–1：工作台、开户镜像、资金、JR/T Mock

## 本地

```bash
cd seat-ops
npm install
npm run dev
```

打开 http://127.0.0.1:3000 （本地用 `cursor/identity.dev.js` 模拟登录用户）
