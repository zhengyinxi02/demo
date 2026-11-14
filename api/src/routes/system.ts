import { Router } from "express";
import { z } from "zod";
import { audit } from "../audit.js";
import { authRequired, requireRoles, type AuthedRequest } from "../middleware/auth.js";
import { getStore, mutateStore, resetStore } from "../store.js";

export const systemRouter = Router();
systemRouter.use(authRequired);

systemRouter.get("/channels", (_req, res) => {
  res.json({ items: getStore().channels });
});

systemRouter.patch("/channels/:id", requireRoles("admin"), (req: AuthedRequest, res) => {
  const body = z.object({ enabled: z.boolean() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ code: "BAD_REQUEST", message: "参数错误" });
  try {
    const row = mutateStore((store) => {
      const ch = store.channels.find((c) => c.id === req.params.id);
      if (!ch) throw Object.assign(new Error("不存在"), { status: 404, code: "NOT_FOUND" });
      ch.enabled = body.data.enabled;
      audit(store, req.user!, "channel.toggle", ch.id, String(ch.enabled));
      return ch;
    });
    res.json(row);
  } catch (e) {
    const err = e as { status?: number; code?: string; message: string };
    res.status(err.status || 500).json({ code: err.code || "ERROR", message: err.message });
  }
});

systemRouter.get("/risk-rules", (_req, res) => {
  res.json({ items: getStore().riskRules });
});

systemRouter.get("/audit", (_req, res) => {
  res.json({ items: getStore().auditLogs.slice(0, 100) });
});

systemRouter.get("/outbox", (_req, res) => {
  res.json({ items: getStore().outbox.slice(0, 50) });
});

systemRouter.post("/reset-demo", requireRoles("admin"), (req: AuthedRequest, res) => {
  const store = resetStore();
  audit(store, req.user!, "system.reset_demo");
  mutateStore((s) => {
    /* audit already on reset seed; re-open file */
    s.auditLogs.unshift({
      id: `reset_${Date.now()}`,
      actorId: req.user!.id,
      actorName: req.user!.displayName,
      action: "system.reset_demo",
      createdAt: new Date().toISOString(),
    });
  });
  res.json({ ok: true });
});
