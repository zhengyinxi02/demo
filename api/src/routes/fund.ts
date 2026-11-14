import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { audit, emit } from "../audit.js";
import { authRequired, requireRoles, type AuthedRequest } from "../middleware/auth.js";
import { getStore, mutateStore } from "../store.js";

export const fundRouter = Router();
fundRouter.use(authRequired);

fundRouter.get("/accounts", (_req, res) => {
  const store = getStore();
  res.json({
    items: store.fundAccounts.map((a) => {
      const inv = store.investors.find((i) => i.id === a.investorId);
      return { ...a, investorCode: inv?.investorId, investorName: inv?.name };
    }),
  });
});

fundRouter.get("/accounts/:investorId", (req, res) => {
  const store = getStore();
  const acc = store.fundAccounts.find((a) => a.investorId === req.params.investorId);
  if (!acc) return res.status(404).json({ code: "NOT_FOUND", message: "资金账户不存在" });
  res.json(acc);
});

fundRouter.get("/cash-requests", (_req, res) => {
  const store = getStore();
  res.json({
    items: store.cashRequests.map((c) => {
      const inv = store.investors.find((i) => i.id === c.investorId);
      return { ...c, investorCode: inv?.investorId, investorName: inv?.name };
    }),
  });
});

fundRouter.get("/ledger", (req, res) => {
  const investorId = String(req.query.investorId || "");
  const store = getStore();
  const items = investorId ? store.ledger.filter((l) => l.investorId === investorId) : store.ledger;
  res.json({ items: items.slice(0, 100) });
});

fundRouter.post("/cash-requests", requireRoles("ops", "admin"), (req: AuthedRequest, res) => {
  const body = z
    .object({
      investorId: z.string(),
      type: z.enum(["IN", "OUT"]),
      amount: z.number().positive(),
      remark: z.string().optional(),
      submit: z.boolean().optional(),
    })
    .safeParse(req.body);
  if (!body.success) return res.status(400).json({ code: "BAD_REQUEST", message: "参数错误" });

  try {
    const created = mutateStore((store) => {
      const inv = store.investors.find((i) => i.id === body.data.investorId);
      if (!inv) throw Object.assign(new Error("投资者不存在"), { status: 404, code: "NOT_FOUND" });
      const reqRow = {
        id: `cash_${nanoid(8)}`,
        investorId: body.data.investorId,
        type: body.data.type,
        amount: body.data.amount,
        status: (body.data.submit ? "PENDING" : "DRAFT") as "DRAFT" | "PENDING",
        remark: body.data.remark,
        createdBy: req.user!.id,
        createdAt: new Date().toISOString(),
      };
      store.cashRequests.unshift(reqRow);
      audit(store, req.user!, "cash.create", reqRow.id, `${reqRow.type} ${reqRow.amount}`);
      return reqRow;
    });
    res.status(201).json(created);
  } catch (e) {
    const err = e as { status?: number; code?: string; message: string };
    res.status(err.status || 500).json({ code: err.code || "ERROR", message: err.message });
  }
});

fundRouter.post("/cash-requests/:id/submit", requireRoles("ops", "admin"), (req: AuthedRequest, res) => {
  try {
    const row = mutateStore((store) => {
      const c = store.cashRequests.find((x) => x.id === req.params.id);
      if (!c) throw Object.assign(new Error("不存在"), { status: 404, code: "NOT_FOUND" });
      if (c.status !== "DRAFT") throw Object.assign(new Error("仅草稿可提交"), { status: 400, code: "BAD_STATE" });
      c.status = "PENDING";
      audit(store, req.user!, "cash.submit", c.id);
      return c;
    });
    res.json(row);
  } catch (e) {
    const err = e as { status?: number; code?: string; message: string };
    res.status(err.status || 500).json({ code: err.code || "ERROR", message: err.message });
  }
});

fundRouter.post("/cash-requests/:id/approve", requireRoles("ops", "admin", "risk"), (req: AuthedRequest, res) => {
  try {
    const row = mutateStore((store) => {
      const c = store.cashRequests.find((x) => x.id === req.params.id);
      if (!c) throw Object.assign(new Error("不存在"), { status: 404, code: "NOT_FOUND" });
      if (c.status !== "PENDING") throw Object.assign(new Error("仅待审可批准"), { status: 400, code: "BAD_STATE" });
      const acc = store.fundAccounts.find((a) => a.investorId === c.investorId);
      if (!acc) throw Object.assign(new Error("无资金账户"), { status: 400, code: "NO_ACCOUNT" });

      if (c.type === "OUT" && acc.available < c.amount) {
        throw Object.assign(new Error("可用资金不足"), { status: 400, code: "INSUFFICIENT" });
      }

      const delta = c.type === "IN" ? c.amount : -c.amount;
      acc.balance += delta;
      acc.available += delta;
      acc.updatedAt = new Date().toISOString();
      c.status = "APPROVED";
      c.decidedAt = acc.updatedAt;
      c.decidedBy = req.user!.id;

      const entry = {
        id: nanoid(10),
        investorId: c.investorId,
        kind: (c.type === "IN" ? "CASH_IN" : "CASH_OUT") as "CASH_IN" | "CASH_OUT",
        amount: delta,
        balanceAfter: acc.balance,
        refType: "CashRequest",
        refId: c.id,
        createdAt: acc.updatedAt,
      };
      store.ledger.unshift(entry);
      audit(store, req.user!, "cash.approve", c.id);
      emit(store, "cash.posted", { ledgerId: entry.id, investorId: c.investorId, delta });
      return c;
    });
    res.json(row);
  } catch (e) {
    const err = e as { status?: number; code?: string; message: string };
    res.status(err.status || 500).json({ code: err.code || "ERROR", message: err.message });
  }
});

fundRouter.post("/cash-requests/:id/reject", requireRoles("ops", "admin", "risk"), (req: AuthedRequest, res) => {
  try {
    const row = mutateStore((store) => {
      const c = store.cashRequests.find((x) => x.id === req.params.id);
      if (!c) throw Object.assign(new Error("不存在"), { status: 404, code: "NOT_FOUND" });
      if (c.status !== "PENDING") throw Object.assign(new Error("仅待审可驳回"), { status: 400, code: "BAD_STATE" });
      c.status = "REJECTED";
      c.decidedAt = new Date().toISOString();
      c.decidedBy = req.user!.id;
      audit(store, req.user!, "cash.reject", c.id);
      return c;
    });
    res.json(row);
  } catch (e) {
    const err = e as { status?: number; code?: string; message: string };
    res.status(err.status || 500).json({ code: err.code || "ERROR", message: err.message });
  }
});
