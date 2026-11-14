import { nanoid } from "nanoid";
import { z } from "zod";
import { audit } from "../../../lib/audit";
import { forbidIfNot, requireAppUser } from "../../../lib/auth";
import { sql } from "../../../lib/db";

export async function GET(request: Request) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;
  const jobs = await sql(
    "SELECT id, status, ok_count, fail_count, conflict_count, created_at, raw_summary FROM sync_jobs ORDER BY created_at DESC LIMIT 50",
  );
  const conflicts = await sql(
    "SELECT id, job_id, investor_code, field, local_value, remote_value, reason, status, created_at FROM sync_conflicts ORDER BY created_at DESC LIMIT 100",
  );
  return Response.json({
    jobs: jobs.map((j) => ({
      id: j.id,
      status: j.status,
      okCount: j.ok_count,
      failCount: j.fail_count,
      conflictCount: j.conflict_count,
      createdAt: j.created_at,
      rawSummary: j.raw_summary,
    })),
    conflicts: conflicts.map((c) => ({
      id: c.id,
      jobId: c.job_id,
      investorId: c.investor_code,
      field: c.field,
      localValue: c.local_value,
      remoteValue: c.remote_value,
      reason: c.reason,
      status: c.status,
      createdAt: c.created_at,
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;
  const denied = forbidIfNot(user, ["admin", "ops"]);
  if (denied) return denied;

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
    .safeParse(await request.json());
  if (!body.success) {
    return Response.json({ code: "BAD_REQUEST", message: "JR/T 批次格式错误" }, { status: 400 });
  }

  const jobId = `sync_${nanoid(8)}`;
  const createdAt = new Date().toISOString();
  let ok = 0;
  let fail = 0;
  let conflicts = 0;

  for (const row of body.data.investors) {
    try {
      const existing = await sql<{ id: string }>("SELECT id FROM investors WHERE investor_code = $1", [
        row.investorId,
      ]);
      if (!existing[0]) {
        const id = `inv_${nanoid(8)}`;
        await sql(
          `INSERT INTO investors (id, investor_code, name, status, source, template_id, freeze_open, created_at, updated_at)
           VALUES ($1,$2,$3,$4,'JRT',$5,false,$6,$7)`,
          [id, row.investorId, row.name, row.status || "ACTIVE", row.templateId || "tpl_default", createdAt, createdAt],
        );
        await sql(
          "INSERT INTO fund_accounts (investor_id, balance, available, margin, frozen, updated_at) VALUES ($1,$2,$3,$4,$5,$6)",
          [
            id,
            row.balance ?? 0,
            row.available ?? row.balance ?? 0,
            row.margin ?? 0,
            row.frozen ?? 0,
            createdAt,
          ],
        );
        ok += 1;
        continue;
      }

      const invId = existing[0].id;
      const pending = await sql(
        "SELECT 1 FROM cash_requests WHERE investor_id = $1 AND status IN ('PENDING','DRAFT') LIMIT 1",
        [invId],
      );
      const acc = await sql<{ balance: number }>("SELECT balance FROM fund_accounts WHERE investor_id = $1", [invId]);
      if (pending.length && row.balance !== undefined && acc[0] && Number(acc[0].balance) !== row.balance) {
        await sql(
          `INSERT INTO sync_conflicts (id, job_id, investor_code, field, local_value, remote_value, reason, status, created_at)
           VALUES ($1,$2,$3,'balance',$4,$5,$6,'OPEN',$7)`,
          [
            nanoid(10),
            jobId,
            row.investorId,
            String(acc[0].balance),
            String(row.balance),
            "本地存在未完成出入金，拒绝覆盖资金",
            createdAt,
          ],
        );
        conflicts += 1;
      }

      await sql(
        "UPDATE investors SET name = $2, status = COALESCE($3, status), source = 'JRT', template_id = COALESCE($4, template_id), updated_at = $5 WHERE id = $1",
        [invId, row.name, row.status || null, row.templateId || null, createdAt],
      );

      const skipFund = pending.length > 0 && row.balance !== undefined && acc[0] && Number(acc[0].balance) !== row.balance;
      if (!skipFund && row.balance !== undefined && acc[0]) {
        const prev = Number(acc[0].balance);
        const balance = row.balance;
        const available = row.available ?? row.balance;
        await sql(
          "UPDATE fund_accounts SET balance = $2, available = $3, margin = COALESCE($4, margin), frozen = COALESCE($5, frozen), updated_at = $6 WHERE investor_id = $1",
          [invId, balance, available, row.margin ?? null, row.frozen ?? null, createdAt],
        );
        await sql(
          `INSERT INTO ledger (id, investor_id, kind, amount, balance_after, ref_type, ref_id, created_at)
           VALUES ($1,$2,'SYNC',$3,$4,'JrtSync',$5,$6)`,
          [nanoid(10), invId, balance - prev, balance, jobId, createdAt],
        );
      }
      ok += 1;
    } catch {
      fail += 1;
    }
  }

  const finishedAt = new Date().toISOString();
  await sql(
    `INSERT INTO sync_jobs (id, status, ok_count, fail_count, conflict_count, created_at, finished_at, raw_summary)
     VALUES ($1,'FINISHED',$2,$3,$4,$5,$6,$7)`,
    [jobId, ok, fail, conflicts, createdAt, finishedAt, `ingested ${body.data.investors.length} rows`],
  );
  await audit(user, "sync.jrt.ingest", jobId);
  return Response.json({ id: jobId, okCount: ok, failCount: fail, conflictCount: conflicts }, { status: 201 });
}
