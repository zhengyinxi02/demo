import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { getStore } from "../store.js";

export const dashboardRouter = Router();
dashboardRouter.use(authRequired);

dashboardRouter.get("/overview", (_req, res) => {
  const store = getStore();
  const pendingInvestors = store.investors.filter((i) => i.status === "PENDING").length;
  const pendingCash = store.cashRequests.filter((c) => c.status === "PENDING").length;
  const openConflicts = store.syncConflicts.filter((c) => c.status === "OPEN").length;
  const lastSync = store.syncJobs[0] || null;
  const channels = store.channels.map((c) => ({
    id: c.id,
    type: c.type,
    name: c.name,
    enabled: c.enabled,
  }));

  res.json({
    todos: {
      pendingInvestors,
      pendingCash,
      openConflicts,
      riskHits: 0,
    },
    syncHealth: {
      lastJob: lastSync,
      openConflicts,
      status: openConflicts > 0 ? "DEGRADED" : lastSync ? "OK" : "IDLE",
    },
    channels,
    recentAudit: store.auditLogs.slice(0, 20),
    envBadge: channels.find((c) => c.enabled && c.type === "MOCK")
      ? "Mock"
      : channels.find((c) => c.enabled)?.type || "Mock",
  });
});
