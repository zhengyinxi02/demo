import { nanoid } from "nanoid";
import { sql } from "./db";

let seeded = false;

export async function ensureSeeded() {
  if (seeded) return;
  const meta = await sql<{ value: string }>("SELECT value FROM meta WHERE key = $1", ["seeded"]);
  if (meta[0]?.value === "1") {
    seeded = true;
    return;
  }

  await sql(
    "INSERT INTO channels (id, type, name, enabled, note) VALUES ($1,$2,$3,$4,$5),($6,$7,$8,$9,$10),($11,$12,$13,$14,$15),($16,$17,$18,$19,$20)",
    [
      "ch_mock", "MOCK", "Mock Adapter", true, "本地/云上默认演示",
      "ch_sim", "TRADER", "SimNow Trader", true, "Phase4 真连",
      "ch_relay", "RELAY", "中继测试", false, "配置位",
      "ch_userapi", "USER_API", "UserAPI (Fake)", false, "契约+Mock",
    ],
  );

  await sql(
    "INSERT INTO risk_rules (id, name, scope, metric, threshold, action, version, enabled) VALUES ($1,$2,$3,$4,$5,$6,$7,$8),($9,$10,$11,$12,$13,$14,$15,$16)",
    [
      "rr_qty", "单笔数量上限", "GLOBAL", "order_volume", 50, "BLOCK", 1, true,
      "rr_cash", "可用资金不足拦截", "GLOBAL", "available_funds", 0, "BLOCK", 1, true,
    ],
  );

  await sql(
    "INSERT INTO permission_templates (id, name, allow_open, allow_close, product_groups, note) VALUES ($1,$2,$3,$4,$5,$6),($7,$8,$9,$10,$11,$12)",
    [
      "tpl_default", "标准投机", true, true, JSON.stringify(["金属", "能源", "农产品"]), "默认模板",
      "tpl_hedge", "套保受限", true, true, JSON.stringify(["金属"]), "仅金属",
    ],
  );

  await sql("INSERT INTO operators (id, code, name) VALUES ($1,$2,$3)", ["op_seat01", "seat01", "次席操作员01"]);

  const inv1 = "inv_demo001";
  const inv2 = "inv_demo002";
  const now = new Date().toISOString();
  await sql(
    `INSERT INTO investors (id, investor_code, name, status, source, template_id, freeze_open, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9),($10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [
      inv1, "100001", "示例投资者甲", "ACTIVE", "JRT", "tpl_default", false, now, now,
      inv2, "100002", "示例投资者乙", "PENDING", "MANUAL", "tpl_default", false, now, now,
    ],
  );
  await sql("INSERT INTO grants (id, operator_id, investor_id) VALUES ($1,$2,$3)", [nanoid(8), "op_seat01", inv1]);
  await sql(
    `INSERT INTO fund_accounts (investor_id, balance, available, margin, frozen, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6),($7,$8,$9,$10,$11,$12)`,
    [inv1, 1_000_000, 850_000, 120_000, 30_000, now, inv2, 0, 0, 0, 0, now],
  );
  await sql(
    "INSERT INTO ledger (id, investor_id, kind, amount, balance_after, ref_type, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)",
    [nanoid(10), inv1, "SYNC", 1_000_000, 1_000_000, "seed", now],
  );
  await sql(
    "INSERT INTO audit_logs (id, actor_id, actor_name, action, detail, created_at) VALUES ($1,$2,$3,$4,$5,$6)",
    [nanoid(10), "system", "system", "seed", "Cloud-ready Phase0/1 seed", now],
  );
  await sql("INSERT INTO meta (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value", [
    "seeded",
    "1",
  ]);
  seeded = true;
}
