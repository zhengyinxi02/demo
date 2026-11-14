import { nanoid } from "nanoid";
import type { AppUser } from "./auth";
import { sql } from "./db";

export async function audit(user: AppUser | null, action: string, target?: string, detail?: string) {
  await sql(
    "INSERT INTO audit_logs (id, actor_id, actor_name, action, target, detail, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [
      nanoid(10),
      user?.id || "anonymous",
      user?.displayName || "anonymous",
      action,
      target || null,
      detail || null,
      new Date().toISOString(),
    ],
  );
}
