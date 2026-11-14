import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Channel = { id: string; type: string; name: string; enabled: boolean; note?: string };
type Rule = { id: string; name: string; metric: string; threshold: number; action: string; enabled: boolean };
type Audit = { id: string; actorName: string; action: string; target?: string; createdAt: string };

export default function SystemPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const [c, r, a] = await Promise.all([
      api<{ items: Channel[] }>("/api/system/channels"),
      api<{ items: Rule[] }>("/api/system/risk-rules"),
      api<{ items: Audit[] }>("/api/system/audit"),
    ]);
    setChannels(c.items);
    setRules(r.items);
    setAudit(a.items);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function toggle(id: string, enabled: boolean) {
    try {
      await api(`/api/system/channels/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ enabled }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "需要 admin 账号");
    }
  }

  async function resetDemo() {
    setMsg("");
    try {
      await api("/api/system/reset-demo", { method: "POST" });
      setMsg("已重置演示数据");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "重置失败（需 admin）");
    }
  }

  return (
    <div>
      <div className="panel">
        <h2>通道与骨架配置</h2>
        <p className="hint" style={{ marginTop: 0 }}>
          Phase 0：登录 / RBAC / 通道角标 / 审计 / RiskRule schema。下单引擎在 Phase 2。
        </p>
        {error ? <div className="error">{error}</div> : null}
        {msg ? <div className="hint">{msg}</div> : null}
        <table>
          <thead>
            <tr>
              <th>通道</th>
              <th>类型</th>
              <th>说明</th>
              <th>启用</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.type}</td>
                <td>{c.note || "—"}</td>
                <td>
                  <button className="btn" onClick={() => toggle(c.id, !c.enabled)}>
                    {c.enabled ? "停用" : "启用"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="row-actions" style={{ marginTop: 12 }}>
          <button className="btn danger" onClick={resetDemo}>
            重置演示数据（admin）
          </button>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <h3>风控规则（预置，Phase 2 生效）</h3>
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>指标</th>
                <th>阈值</th>
                <th>动作</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.metric}</td>
                  <td>{r.threshold}</td>
                  <td>{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>审计日志</h3>
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>谁</th>
                <th>做了什么</th>
              </tr>
            </thead>
            <tbody>
              {audit.slice(0, 15).map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</td>
                  <td>{a.actorName}</td>
                  <td>
                    {a.action} {a.target || ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
