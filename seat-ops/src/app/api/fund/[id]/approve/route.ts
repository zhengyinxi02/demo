import { nanoid } from "nanoid";
import { audit } from "../../../../../lib/audit";
import { forbidIfNot, requireAppUser } from "../../../../../lib/auth";
import { sql } from "../../../../../lib/db";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;
  const denied = forbidIfNot(user, ["ops", "admin", "risk"]);
  if (denied) return denied;
  const { id } = await ctx.params;

  const rows = await sql<{
    investor_id: string;
    type: string;
    amount: number;
    status: string;
  }>("SELECT investor_id, type, amount, status FROM cash_requests WHERE id = $1", [id]);
  if (!rows[0]) return Response.json({ code: "NOT_FOUND", message: "不存在" }, { status: 404 });
  const c = rows[0];
  if (c.status !== "PENDING") {
    return Response.json({ code: "BAD_STATE", message: "仅待审可批准" }, { status: 400 });
  }

  const acc = await sql<{ balance: number; available: number }>(
    "SELECT balance, available FROM fund_accounts WHERE investor_id = $1",
    [c.investor_id],
  );
  if (!acc[0]) return Response.json({ code: "NO_ACCOUNT", message: "无资金账户" }, { status: 400 });
  if (c.type === "OUT" && Number(acc[0].available) < Number(c.amount)) {
    return Response.json({ code: "INSUFFICIENT", message: "可用资金不足" }, { status: 400 });
  }

  const delta = c.type === "IN" ? Number(c.amount) : -Number(c.amount);
  const now = new Date().toISOString();
  const balance = Number(acc[0].balance) + delta;
  const available = Number(acc[0].available) + delta;
  await sql(
    "UPDATE fund_accounts SET balance = $2, available = $3, updated_at = $4 WHERE investor_id = $1",
    [c.investor_id, balance, available, now],
  );
  await sql(
    "UPDATE cash_requests SET status = 'APPROVED', decided_at = $2, decided_by = $3 WHERE id = $1",
    [id, now, user.id],
  );
  await sql(
    `INSERT INTO ledger (id, investor_id, kind, amount, balance_after, ref_type, ref_id, created_at)
     VALUES ($1,$2,$3,$4,$5,'CashRequest',$6,$7)`,
    [nanoid(10), c.investor_id, c.type === "IN" ? "CASH_IN" : "CASH_OUT", delta, balance, id, now],
  );
  await audit(user, "cash.approve", id);
  return Response.json({ ok: true });
}
