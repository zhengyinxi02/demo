import { nanoid } from "nanoid";
import { getIdentity } from "../../cursor/identity";
import { sql } from "./db";
import { ensureSeeded } from "./seed";

export type AppUser = {
  id: string;
  subject: string;
  email: string;
  displayName: string;
  role: "ops" | "risk" | "admin";
};

type VerifiedIdentity = Awaited<ReturnType<typeof getIdentity>> & { verified: true };

export async function requireAppUser(request: Request): Promise<AppUser | Response> {
  await ensureSeeded();
  const identity = await getIdentity(request);
  if (!identity.verified) {
    return Response.json(
      { code: "UNAUTHORIZED", message: "需要 Cursor 登录（云上私有/团队应用）或本地 identity 模拟" },
      { status: 401 },
    );
  }
  return upsertFromIdentity(identity);
}

async function upsertFromIdentity(identity: VerifiedIdentity): Promise<AppUser> {
  const subject = identity.sub;
  const email = identity.kind === "person" ? identity.email || `${subject}@users.cursor` : "service@cursor";
  const displayName =
    identity.kind === "person" ? identity.name || identity.email || "Cursor User" : "Service Key";

  const rows = await sql<{
    id: string;
    subject: string;
    email: string;
    display_name: string;
    role: AppUser["role"];
  }>("SELECT * FROM app_users WHERE subject = $1 LIMIT 1", [subject]);

  if (rows[0]) {
    return {
      id: rows[0].id,
      subject: rows[0].subject,
      email: rows[0].email,
      displayName: rows[0].display_name,
      role: rows[0].role,
    };
  }

  const count = await sql<{ c: string }>("SELECT COUNT(*)::text AS c FROM app_users");
  const role: AppUser["role"] = Number(count[0]?.c || 0) === 0 ? "admin" : "ops";
  const id = `u_${nanoid(8)}`;
  await sql(
    "INSERT INTO app_users (id, subject, email, display_name, role) VALUES ($1,$2,$3,$4,$5)",
    [id, subject, email, displayName, role],
  );
  return { id, subject, email, displayName, role };
}

export function forbidIfNot(user: AppUser, roles: AppUser["role"][]): Response | null {
  if (!roles.includes(user.role)) {
    return Response.json({ code: "FORBIDDEN", message: "权限不足" }, { status: 403 });
  }
  return null;
}
