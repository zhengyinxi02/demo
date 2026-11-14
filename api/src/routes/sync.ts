import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { audit, emit } from "../audit.js";
import { authRequired, requireRoles, type AuthedRequest } from "../middleware/auth.js";
import { getStore, mutateStore } from "../store.js";
import type { Investor } from "../types.js";

export const syncRouter = Router();
syncRouter.use(authRequired);

syncRouter.get("/jobs", (_req, res) => {
  res.json({ items: getStore().syncJobs });
});

syncRouter.get("/conflicts", (req, res) => {
  const status = String(req.query.status || "");
  const items = getStore().syncConflicts.filter((c) => (status ? c.status === status : true));
  res.json({ items });
});

/**
 * JR/T Mock ingest — accepts JSON batch mimicking authority → secondary seat sync.
 * Body: { investors: [{ investorId, name, status?, balance?, available?, margin?, frozen? }] }
 */
syncRouter.post("/jrt/ingest", requireRoles("admin", "ops"), (req: AuthedRequest, res) => {
  const body = z
    .object({
      investors: z
        .array(
          z.object({
            investorId: z.string(),
            name: z.string(),
            status: z.enum(["DRAFT", "PENDING", "ACTIVE", "FROZEN", "CLOSED"]).optional(),
            balance: z.number().optional(),
            available: z.number().optional(),
            margin: z.number().optional(),
            frozen: z.number().optional(),
            templateId: z.string().optional(),
          }),
        )
        .min(1),
    })
    .safeParse(req.body);

  if (!body.success) {
    return res.status(400).json({ code: "BAD_REQUEST", message: "JR/T 批次格式错误", details: body.error.flatten() });
  }

  const result = mutateStore((store) => {
    const jobId = `sync_${nanoid(8)}`;
    const createdAt = new Date().toISOString();
    let ok = 0;
    let fail = 0;
    let conflicts = 0;

    for (const row of body.data.investors) {
      try {
        let inv = store.investors.find((i) => i.investorId === row.investorId);
        const pendingCash = store.cashRequests.some(
          (c) => inv && c.investorId === inv.id && (c.status === "PENDING" || c.status === "DRAFT"),
        );

        if (inv && pendingCash && row.balance !== undefined) {
          const acc = store.fundAccounts.find((a) => a.investorId === inv!.id);
          if (acc && acc.balance !== row.balance) {
            store.syncConflicts.unshift({
              id: nanoid(10),
              jobId,
              investorId: inv.investorId,
              field: "balance",
              localValue: String(acc.balance),
              remoteValue: String(row.balance),
              reason: "本地存在未完成出入金，拒绝覆盖资金",
              status: "OPEN",
              createdAt,
            });
            conflicts += 1;
            // still update name/status mirror where safe
          }
        }

        if (!inv) {
          const t = createdAt;
          inv = {
            id: `inv_${nanoid(8)}`,
            investorId: row.investorId,
            name: row.name,
            status: row.status || "ACTIVE",
            source: "JRT",
            templateId: row.templateId || store.templates[0]?.id,
            freezeOpen: false,
            createdAt: t,
            updatedAt: t,
          } satisfies Investor;
          store.investors.unshift(inv);
          store.fundAccounts.push({
            investorId: inv.id,
            balance: row.balance ?? 0,
            available: row.available ?? row.balance ?? 0,
            margin: row.margin ?? 0,
            frozen: row.frozen ?? 0,
            updatedAt: t,
          });
          ok += 1;
          emit(store, "investor.synced", { investorId: inv.id, source: "JRT", status: inv.status });
          continue;
        }

        inv.name = row.name;
        if (row.status) inv.status = row.status;
        if (row.templateId) inv.templateId = row.templateId;
        inv.source = "JRT";
        inv.updatedAt = createdAt;

        const acc = store.fundAccounts.find((a) => a.investorId === inv!.id);
        const skipFund = pendingCash && row.balance !== undefined && acc && acc.balance !== row.balance;
        if (acc && !skipFund && row.balance !== undefined) {
          const prev = acc.balance;
          acc.balance = row.balance;
          acc.available = row.available ?? row.balance;
          acc.margin = row.margin ?? acc.margin;
          acc.frozen = row.frozen ?? acc.frozen;
          acc.updatedAt = createdAt;
          store.ledger.unshift({
            id: nanoid(10),
            investorId: inv.id,
            kind: "SYNC",
            amount: acc.balance - prev,
            balanceAfter: acc.balance,
            refType: "JrtSync",
            refId: jobId,
            createdAt,
          });
        }

        ok += 1;
        emit(store, "investor.synced", { investorId: inv.id, source: "JRT", status: inv.status });
      } catch {
        fail += 1;
      }
    }

    const job = {
      id: jobId,
      status: "FINISHED" as const,
      okCount: ok,
      failCount: fail,
      conflictCount: conflicts,
      createdAt,
      finishedAt: new Date().toISOString(),
      rawSummary: `ingested ${body.data.investors.length} rows`,
    };
    store.syncJobs.unshift(job);
    audit(store, req.user!, "sync.jrt.ingest", jobId, job.rawSummary);
    emit(store, "sync.job.finished", { jobId, ok, fail, conflicts });
    return job;
  });

  res.status(201).json(result);
});

syncRouter.post("/conflicts/:id/resolve", requireRoles("admin", "ops"), (req: AuthedRequest, res) => {
  try {
    const row = mutateStore((store) => {
      const c = store.syncConflicts.find((x) => x.id === req.params.id);
      if (!c) throw Object.assign(new Error("不存在"), { status: 404, code: "NOT_FOUND" });
      c.status = "RESOLVED";
      c.resolvedAt = new Date().toISOString();
      audit(store, req.user!, "sync.conflict.resolve", c.id);
      return c;
    });
    res.json(row);
  } catch (e) {
    const err = e as { status?: number; code?: string; message: string };
    res.status(err.status || 500).json({ code: err.code || "ERROR", message: err.message });
  }
});
