import { nanoid } from "nanoid";
import { z } from "zod";
import { audit } from "../../../lib/audit";
import { forbidIfNot, requireAppUser } from "../../../lib/auth";
import { sql } from "../../../lib/db";

export async function GET(request: Request) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;

  const investors = await sql<{
    id: string;
    investor_code: string;
    name: string;
    status: string;
    source: string;
    template_id: string | null;
    available: number | null;
    balance: number | null;
    template_name: string | null;
  }>(
    `SELECT i.*, f.available, f.balance, t.name AS template_name
     FROM investors i
     LEFT JOIN fund_accounts f ON f.investor_id = i.id
     LEFT JOIN permission_templates t ON t.id = i.template_id
     ORDER BY i.created_at DESC`,
  );

  const templates = await sql("SELECT id, name FROM permission_templates ORDER BY name");
  const operators = await sql("SELECT id, code, name FROM operators ORDER BY code");

  return Response.json({
    items: investors.map((i) => ({
      id: i.id,
      investorId: i.investor_code,
      name: i.name,
      status: i.status,
      source: i.source,
      template: i.template_name ? { name: i.template_name } : null,
      fund: i.available == null ? null : { available: Number(i.available), balance: Number(i.balance) },
    })),
    templates,
    operators,
  });
}

export async function POST(request: Request) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;
  const denied = forbidIfNot(user, ["ops", "admin"]);
  if (denied) return denied;

  const body = z
    .object({
      investorId: z.string().min(1),
      name: z.string().min(1),
      templateId: z.string().optional(),
      operatorId: z.string().optional(),
    })
    .safeParse(await request.json());
  if (!body.success) return Response.json({ code: "BAD_REQUEST", message: "参数错误" }, { status: 400 });

  const dup = await sql("SELECT 1 FROM investors WHERE investor_code = $1", [body.data.investorId]);
  if (dup.length) return Response.json({ code: "DUPLICATE", message: "投资者代码已存在" }, { status: 409 });

  const id = `inv_${nanoid(8)}`;
  const now = new Date().toISOString();
  const templateId = body.data.templateId || "tpl_default";
  await sql(
    `INSERT INTO investors (id, investor_code, name, status, source, template_id, freeze_open, created_at, updated_at)
     VALUES ($1,$2,$3,'DRAFT','MANUAL',$4,false,$5,$6)`,
    [id, body.data.investorId, body.data.name, templateId, now, now],
  );
  await sql(
    "INSERT INTO fund_accounts (investor_id, balance, available, margin, frozen, updated_at) VALUES ($1,0,0,0,0,$2)",
    [id, now],
  );
  if (body.data.operatorId) {
    await sql("INSERT INTO grants (id, operator_id, investor_id) VALUES ($1,$2,$3)", [
      nanoid(8),
      body.data.operatorId,
      id,
    ]);
  }
  await audit(user, "investor.create", id, body.data.investorId);
  return Response.json({ id, investorId: body.data.investorId, status: "DRAFT" }, { status: 201 });
}
