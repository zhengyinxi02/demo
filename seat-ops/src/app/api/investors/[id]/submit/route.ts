import { audit } from "../../../../../lib/audit";
import { forbidIfNot, requireAppUser } from "../../../../../lib/auth";
import { sql } from "../../../../../lib/db";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;
  const denied = forbidIfNot(user, ["ops", "admin"]);
  if (denied) return denied;
  const { id } = await ctx.params;
  const rows = await sql<{ status: string }>("SELECT status FROM investors WHERE id = $1", [id]);
  if (!rows[0]) return Response.json({ code: "NOT_FOUND", message: "不存在" }, { status: 404 });
  if (rows[0].status !== "DRAFT") {
    return Response.json({ code: "BAD_STATE", message: "仅草稿可提交" }, { status: 400 });
  }
  await sql("UPDATE investors SET status = 'PENDING', updated_at = $2 WHERE id = $1", [
    id,
    new Date().toISOString(),
  ]);
  await audit(user, "investor.submit", id);
  return Response.json({ ok: true, status: "PENDING" });
}
