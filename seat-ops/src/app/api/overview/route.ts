import { requireAppUser } from "../../../lib/auth";
import { sql } from "../../../lib/db";

export async function GET(request: Request) {
  const user = await requireAppUser(request);
  if (user instanceof Response) return user;

  const pendingInvestors = await sql<{ c: string }>(
    "SELECT COUNT(*)::text AS c FROM investors WHERE status = 'PENDING'",
  );
  const pendingCash = await sql<{ c: string }>(
    "SELECT COUNT(*)::text AS c FROM cash_requests WHERE status = 'PENDING'",
  );
  const openConflicts = await sql<{ c: string }>(
    "SELECT COUNT(*)::text AS c FROM sync_conflicts WHERE status = 'OPEN'",
  );
  const lastJob = await sql<{
    id: string;
    ok_count: number;
    conflict_count: number;
    status: string;
  }>("SELECT id, ok_count, conflict_count, status FROM sync_jobs ORDER BY created_at DESC LIMIT 1");
  const channels = await sql<{ id: string; type: string; name: string; enabled: boolean }>(
    "SELECT id, type, name, enabled FROM channels ORDER BY id",
  );
  const recentAudit = await sql<{
    id: string;
    actor_name: string;
    action: string;
    target: string | null;
    created_at: string;
  }>("SELECT id, actor_name, action, target, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 20");

  const conflicts = Number(openConflicts[0]?.c || 0);
  return Response.json({
    user,
    todos: {
      pendingInvestors: Number(pendingInvestors[0]?.c || 0),
      pendingCash: Number(pendingCash[0]?.c || 0),
      openConflicts: conflicts,
      riskHits: 0,
    },
    syncHealth: {
      status: conflicts > 0 ? "DEGRADED" : lastJob[0] ? "OK" : "IDLE",
      openConflicts: conflicts,
      lastJob: lastJob[0]
        ? { id: lastJob[0].id, okCount: lastJob[0].ok_count, conflictCount: lastJob[0].conflict_count }
        : null,
    },
    channels,
    recentAudit: recentAudit.map((a) => ({
      id: a.id,
      actorName: a.actor_name,
      action: a.action,
      target: a.target,
      createdAt: a.created_at,
    })),
    envBadge: "Cloud/Mock",
  });
}
