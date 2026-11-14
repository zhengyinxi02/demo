import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Overview = {
  todos: {
    pendingInvestors: number;
    pendingCash: number;
    openConflicts: number;
    riskHits: number;
  };
  syncHealth: { status: string; openConflicts: number; lastJob: { id: string; okCount: number; conflictCount: number } | null };
  channels: { id: string; type: string; name: string; enabled: boolean }[];
  recentAudit: { id: string; actorName: string; action: string; createdAt: string; target?: string }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      setData(await api<Overview>("/api/dashboard/overview"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div>加载工作台…</div>;

  return (
    <div>
      <div className="panel">
        <h2>工作台</h2>
        <div className="grid-4">
          <div className="stat">
            <div className="label">开户待复核</div>
            <div className="value">{data.todos.pendingInvestors}</div>
          </div>
          <div className="stat">
            <div className="label">出入金待审</div>
            <div className="value">{data.todos.pendingCash}</div>
          </div>
          <div className="stat">
            <div className="label">JR/T 冲突</div>
            <div className="value">{data.todos.openConflicts}</div>
          </div>
          <div className="stat">
            <div className="label">同步健康</div>
            <div className="value" style={{ fontSize: 22 }}>
              <span className={`pill ${data.syncHealth.status}`}>{data.syncHealth.status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <h3>最近审计</h3>
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>操作者</th>
                <th>动作</th>
                <th>对象</th>
              </tr>
            </thead>
            <tbody>
              {data.recentAudit.map((a) => (
                <tr key={a.id}>
                  <td>{new Date(a.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</td>
                  <td>{a.actorName}</td>
                  <td>{a.action}</td>
                  <td>{a.target || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>通道</h3>
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>类型</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {data.channels.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.type}</td>
                  <td>{c.enabled ? "启用" : "停用"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="hint">
            最近同步：
            {data.syncHealth.lastJob
              ? `${data.syncHealth.lastJob.id} · ok ${data.syncHealth.lastJob.okCount} · conflict ${data.syncHealth.lastJob.conflictCount}`
              : "尚未执行"}
          </p>
        </div>
      </div>
    </div>
  );
}
