import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Job = {
  id: string;
  status: string;
  okCount: number;
  failCount: number;
  conflictCount: number;
  createdAt: string;
  rawSummary?: string;
};

type Conflict = {
  id: string;
  jobId: string;
  investorId: string;
  field: string;
  localValue: string;
  remoteValue: string;
  reason: string;
  status: string;
};

const sampleBatch = `{
  "investors": [
    { "investorId": "100001", "name": "示例投资者甲", "status": "ACTIVE", "balance": 1200000, "available": 1000000, "margin": 150000, "frozen": 50000 },
    { "investorId": "100009", "name": "JR/T 新客户", "status": "ACTIVE", "balance": 500000, "available": 500000 }
  ]
}`;

export default function SyncPage() {
  const [raw, setRaw] = useState(sampleBatch);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const [j, c] = await Promise.all([
      api<{ items: Job[] }>("/api/sync/jobs"),
      api<{ items: Conflict[] }>("/api/sync/conflicts"),
    ]);
    setJobs(j.items);
    setConflicts(c.items);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function ingest() {
    setError("");
    setMsg("");
    try {
      const body = JSON.parse(raw);
      const job = await api<Job>("/api/sync/jrt/ingest", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setMsg(`同步完成 ${job.id}：ok=${job.okCount} conflict=${job.conflictCount}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "同步失败");
    }
  }

  async function resolve(id: string) {
    await api(`/api/sync/conflicts/${id}/resolve`, { method: "POST" });
    await load();
  }

  return (
    <div>
      <div className="panel">
        <h2>JR/T Mock 摄入</h2>
        <p className="hint" style={{ marginTop: 0 }}>
          粘贴权威/主席同步 JSON。若本地有未完成出入金且余额不一致，会生成冲突而不覆盖资金。
        </p>
        <textarea rows={12} value={raw} onChange={(e) => setRaw(e.target.value)} style={{ width: "100%" }} />
        <div className="row-actions" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={ingest}>
            执行同步
          </button>
        </div>
        {msg ? <div className="hint">{msg}</div> : null}
        {error ? <div className="error">{error}</div> : null}
      </div>

      <div className="two-col">
        <div className="panel">
          <h3>同步任务</h3>
          <table>
            <thead>
              <tr>
                <th>任务</th>
                <th>结果</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td>{j.id}</td>
                  <td>
                    ok {j.okCount} / fail {j.failCount} / conflict {j.conflictCount}
                  </td>
                  <td>{new Date(j.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>冲突</h3>
          <table>
            <thead>
              <tr>
                <th>投资者</th>
                <th>字段</th>
                <th>本地 / 远端</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {conflicts.map((c) => (
                <tr key={c.id}>
                  <td>{c.investorId}</td>
                  <td>
                    {c.field}
                    <div className="hint">{c.reason}</div>
                  </td>
                  <td>
                    {c.localValue} → {c.remoteValue}
                    <div>
                      <span className={`pill ${c.status}`}>{c.status}</span>
                    </div>
                  </td>
                  <td>
                    {c.status === "OPEN" ? (
                      <button className="btn" onClick={() => resolve(c.id)}>
                        标记已处理
                      </button>
                    ) : (
                      "—"
                    )}
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
