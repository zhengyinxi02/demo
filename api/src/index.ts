import cors from "cors";
import express from "express";
import { getStore } from "./store.js";
import { authRouter } from "./routes/auth.js";
import { investorsRouter } from "./routes/investors.js";
import { fundRouter } from "./routes/fund.js";
import { syncRouter } from "./routes/sync.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { systemRouter } from "./routes/system.js";

const app = express();
const PORT = Number(process.env.PORT || 8787);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  const store = getStore();
  res.json({
    ok: true,
    service: "seat-ops-api",
    phase: "0-1",
    investors: store.investors.length,
    time: new Date().toISOString(),
  });
});

app.use("/api/auth", authRouter);
app.use("/api/investors", investorsRouter);
app.use("/api/fund", fundRouter);
app.use("/api/sync", syncRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/system", systemRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ code: "INTERNAL", message: "服务器错误" });
});

// ensure seed on boot
getStore();

app.listen(PORT, "127.0.0.1", () => {
  console.log(`[seat-ops-api] http://127.0.0.1:${PORT}`);
  console.log(`[seat-ops-api] demo accounts: ops/ops123 | risk/risk123 | admin/admin123`);
});
