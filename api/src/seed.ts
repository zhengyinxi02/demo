import { nanoid } from "nanoid";
import type { StoreData } from "./types.js";

const now = () => new Date().toISOString();

export function buildSeed(): StoreData {
  const t = now();
  const templateId = "tpl_default";
  const opId = "op_seat01";
  const inv1 = "inv_demo001";
  const inv2 = "inv_demo002";

  return {
    users: [
      { id: "u_ops", username: "ops", password: "ops123", displayName: "运营小王", role: "ops" },
      { id: "u_risk", username: "risk", password: "risk123", displayName: "风控老李", role: "risk" },
      { id: "u_admin", username: "admin", password: "admin123", displayName: "管理员", role: "admin" },
    ],
    channels: [
      { id: "ch_mock", type: "MOCK", name: "Mock Adapter", enabled: true, note: "本地默认" },
      { id: "ch_sim", type: "TRADER", name: "SimNow Trader", enabled: true, front: "tcp://simnow:10201", brokerId: "9999", note: "Phase4 真连" },
      { id: "ch_relay", type: "RELAY", name: "中继测试", enabled: false, note: "配置位" },
      { id: "ch_userapi", type: "USER_API", name: "UserAPI (Fake)", enabled: false, note: "契约+Mock" },
    ],
    riskRules: [
      {
        id: "rr_qty",
        name: "单笔数量上限",
        scope: "GLOBAL",
        metric: "order_volume",
        threshold: 50,
        action: "BLOCK",
        version: 1,
        enabled: true,
      },
      {
        id: "rr_cash",
        name: "可用资金不足拦截",
        scope: "GLOBAL",
        metric: "available_funds",
        threshold: 0,
        action: "BLOCK",
        version: 1,
        enabled: true,
      },
    ],
    templates: [
      {
        id: templateId,
        name: "标准投机",
        allowOpen: true,
        allowClose: true,
        productGroups: ["金属", "能源", "农产品"],
        note: "默认模板",
      },
      {
        id: "tpl_hedge",
        name: "套保受限",
        allowOpen: true,
        allowClose: true,
        productGroups: ["金属"],
        note: "仅金属",
      },
    ],
    operators: [{ id: opId, code: "seat01", name: "次席操作员01" }],
    investors: [
      {
        id: inv1,
        investorId: "100001",
        name: "示例投资者甲",
        status: "ACTIVE",
        source: "JRT",
        templateId,
        freezeOpen: false,
        createdAt: t,
        updatedAt: t,
      },
      {
        id: inv2,
        investorId: "100002",
        name: "示例投资者乙",
        status: "PENDING",
        source: "MANUAL",
        templateId,
        freezeOpen: false,
        createdAt: t,
        updatedAt: t,
      },
    ],
    grants: [{ id: nanoid(8), operatorId: opId, investorId: inv1 }],
    fundAccounts: [
      { investorId: inv1, balance: 1_000_000, available: 850_000, margin: 120_000, frozen: 30_000, updatedAt: t },
      { investorId: inv2, balance: 0, available: 0, margin: 0, frozen: 0, updatedAt: t },
    ],
    cashRequests: [],
    ledger: [
      {
        id: nanoid(10),
        investorId: inv1,
        kind: "SYNC",
        amount: 1_000_000,
        balanceAfter: 1_000_000,
        refType: "seed",
        createdAt: t,
      },
    ],
    syncJobs: [],
    syncConflicts: [],
    auditLogs: [
      {
        id: nanoid(10),
        actorId: "system",
        actorName: "system",
        action: "seed",
        detail: "Phase0/1 demo seed",
        createdAt: t,
      },
    ],
    outbox: [],
    sessions: {},
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // allow `npm run seed`
}
