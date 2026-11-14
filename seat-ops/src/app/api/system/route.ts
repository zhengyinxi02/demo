import { requireAppUser } from "../../../lib/auth";
import { sql } from "../../../lib/db";

export async function GET(request: Request) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;
  const channels = await sql("SELECT id, type, name, enabled, note FROM channels ORDER BY id");
  const rules = await sql(
    "SELECT id, name, metric, threshold, action, enabled FROM risk_rules ORDER BY id",
  );
  const audit = await sql(
    "SELECT id, actor_name, action, target, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 30",
  );
  return Response.json({
    channels,
    rules,
    audit: audit.map((a) => ({
      id: a.id,
      actorName: a.actor_name,
      action: a.action,
      target: a.target,
      createdAt: a.created_at,
    })),
    note: "云上部署优先：Cursor 私有/团队登录；数据为样例种子 + Postgres/PGlite",
  });
}
