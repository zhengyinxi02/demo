import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { audit, emit } from "../audit.js";
import { authRequired, requireRoles, type AuthedRequest } from "../middleware/auth.js";
import { mutateStore, getStore } from "../store.js";
import type { Investor } from "../types.js";

export const investorsRouter = Router();
investorsRouter.use(authRequired);

investorsRouter.get("/", (_req, res) => {
  const store = getStore();
  res.json({
    items: store.investors.map((inv) => enrich(inv)),
  });
});

investorsRouter.get("/templates", (_req, res) => {
  res.json({ items: getStore().templates });
});

investorsRouter.get("/operators", (_req, res) => {
  res.json({ items: getStore().operators });
});

investorsRouter.get("/:id", (req, res) => {
  const store = getStore();
  const inv = store.investors.find((i) => i.id === req.params.id);
  if (!inv) return res.status(404).json({ code: "NOT_FOUND", message: "投资者不存在" });
  res.json(enrich(inv));
});

investorsRouter.post("/", requireRoles("ops", "admin"), (req: AuthedRequest, res) => {
  const body = z
    .object({
      investorId: z.string().min(1),
      name: z.string().min(1),
      templateId: z.string().optional(),
      operatorId: z.string().optional(),
    })
    .safeParse(req.body);
  if (!body.success) return res.status(400).json({ code: "BAD_REQUEST", message: "参数错误" });

  try {
    const created = mutateStore((store) => {
      if (store.investors.some((i) => i.investorId === body.data.investorId)) {
        throw Object.assign(new Error("投资者代码已存在"), { status: 409, code: "DUPLICATE" });
      }
      const t = new Date().toISOString();
      const inv: Investor = {
        id: `inv_${nanoid(8)}`,
        investorId: body.data.investorId,
        name: body.data.name,
        status: "DRAFT",
        source: "MANUAL",
        templateId: body.data.templateId || store.templates[0]?.id,
        freezeOpen: false,
        createdAt: t,
        updatedAt: t,
      };
      store.investors.unshift(inv);
      store.fundAccounts.push({
        investorId: inv.id,
        balance: 0,
        available: 0,
        margin: 0,
        frozen: 0,
        updatedAt: t,
      });
      if (body.data.operatorId) {
        store.grants.push({
          id: nanoid(8),
          operatorId: body.data.operatorId,
          investorId: inv.id,
        });
      }
      audit(store, req.user!, "investor.create", inv.id, inv.investorId);
      emit(store, "investor.synced", { investorId: inv.id, source: inv.source, status: inv.status });
      return enrich(inv);
    });
    res.status(201).json(created);
  } catch (e) {
    const err = e as { status?: number; code?: string; message: string };
    res.status(err.status || 500).json({ code: err.code || "ERROR", message: err.message });
  }
});

investorsRouter.post("/:id/submit", requireRoles("ops", "admin"), (req: AuthedRequest, res) => {
  try {
    const item = mutateStore((store) => {
      const inv = store.investors.find((i) => i.id === req.params.id);
      if (!inv) throw Object.assign(new Error("不存在"), { status: 404, code: "NOT_FOUND" });
      if (inv.status !== "DRAFT") throw Object.assign(new Error("仅草稿可提交"), { status: 400, code: "BAD_STATE" });
      inv.status = "PENDING";
      inv.updatedAt = new Date().toISOString();
      audit(store, req.user!, "investor.submit", inv.id);
      return enrich(inv);
    });
    res.json(item);
  } catch (e) {
    const err = e as { status?: number; code?: string; message: string };
    res.status(err.status || 500).json({ code: err.code || "ERROR", message: err.message });
  }
});

investorsRouter.post("/:id/approve", requireRoles("admin", "risk"), (req: AuthedRequest, res) => {
  try {
    const item = mutateStore((store) => {
      const inv = store.investors.find((i) => i.id === req.params.id);
      if (!inv) throw Object.assign(new Error("不存在"), { status: 404, code: "NOT_FOUND" });
      if (inv.status !== "PENDING") throw Object.assign(new Error("仅待复核可批准"), { status: 400, code: "BAD_STATE" });
      inv.status = "ACTIVE";
      inv.updatedAt = new Date().toISOString();
      audit(store, req.user!, "investor.approve", inv.id);
      emit(store, "investor.synced", { investorId: inv.id, source: inv.source, status: inv.status });
      return enrich(inv);
    });
    res.json(item);
  } catch (e) {
    const err = e as { status?: number; code?: string; message: string };
    res.status(err.status || 500).json({ code: err.code || "ERROR", message: err.message });
  }
});

function enrich(inv: Investor) {
  const store = getStore();
  const template = store.templates.find((t) => t.id === inv.templateId);
  const grants = store.grants.filter((g) => g.investorId === inv.id);
  const operators = grants
    .map((g) => store.operators.find((o) => o.id === g.operatorId))
    .filter(Boolean);
  const fund = store.fundAccounts.find((f) => f.investorId === inv.id);
  return { ...inv, template, operators, fund };
}
