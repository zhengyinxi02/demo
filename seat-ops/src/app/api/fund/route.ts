import { nanoid } from "nanoid";
import { z } from "zod";
import { audit } from "../../../lib/audit";
import { forbidIfNot, requireAppUser } from "../../../lib/auth";
import { sql } from "../../../lib/db";

export async function GET(request: Request) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;

  const accounts = await sql<{
    investor_id: string;
    balance: number;
    available: number;
    margin: number;
    frozen: number;
    investor_code: string;
    name: string;
  }>(
    `SELECT f.*, i.investor_code, i.name
     FROM fund_accounts f JOIN investors i ON i.id = f.investor_id
     ORDER BY i.investor_code`,
  );
  const cash = await sql<{
    id: string;
    investor_id: string;
    type: string;
    amount: number;
    status: string;
    remark: string | null;
    investor_code: string;
    name: string;
  }>(
    `SELECT c.*, i.investor_code, i.name
     FROM cash_requests c JOIN investors i ON i.id = c.investor_id
     ORDER BY c.created_at DESC`,
  );

  return Response.json({
    accounts: accounts.map((a) => ({
      investorId: a.investor_id,
      investorCode: a.investor_code,
      investorName: a.name,
      balance: Number(a.balance),
      available: Number(a.available),
      margin: Number(a.margin),
      frozen: Number(a.frozen),
    })),
    cash: cash.map((c) => ({
      id: c.id,
      investorId: c.investor_id,
      investorCode: c.investor_code,
      investorName: c.name,
      type: c.type,
      amount: Number(c.amount),
      status: c.status,
      remark: c.remark,
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;
  const denied = forbidIfNot(user, ["ops", "admin"]);
  if (denied) return denied;

  const body = z
    .object({
      investorId: z.string(),
      type: z.enum(["IN", "OUT"]),
      amount: z.number().positive(),
      remark: z.string().optional(),
    })
    .safeParse(await request.json());
  if (!body.success) return Response.json({ code: "BAD_REQUEST", message: "参数错误" }, { status: 400 });

  const inv = await sql("SELECT id FROM investors WHERE id = $1", [body.data.investorId]);
  if (!inv.length) return Response.json({ code: "NOT_FOUND", message: "投资者不存在" }, { status: 404 });

  const id = `cash_${nanoid(8)}`;
  await sql(
    `INSERT INTO cash_requests (id, investor_id, type, amount, status, remark, created_by, created_at)
     VALUES ($1,$2,$3,$4,'PENDING',$5,$6,$7)`,
    [
      id,
      body.data.investorId,
      body.data.type,
      body.data.amount,
      body.data.remark || null,
      user.id,
      new Date().toISOString(),
    ],
  );
  await audit(user, "cash.create", id, `${body.data.type} ${body.data.amount}`);
  return Response.json({ id, status: "PENDING" }, { status: 201 });
}
