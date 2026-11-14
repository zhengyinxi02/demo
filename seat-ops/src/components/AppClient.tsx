"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Tab = "dash" | "investors" | "fund" | "sync" | "system";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `请求失败 ${res.status}`);
  return data as T;
}

export function AppClient() {
  const [tab, setTab] = useState<Tab>("dash");
  const [error, setError] = useState("");
  const [me, setMe] = useState<{ displayName: string; role: string; email: string } | null>(null);
  const [overview, setOverview] = useState<any>(null);
  const [investors, setInvestors] = useState<any>(null);
  const [fund, setFund] = useState<any>(null);
  const [sync, setSync] = useState<any>(null);
  const [system, setSystem] = useState<any>(null);

  const boot = useCallback(async () => {
    setError("");
    try {
      const user = await api<any>("/api/me");
      setMe(user);
      const ov = await api("/api/overview");
      setOverview(ov);
    } catch (e) {
      setMe(null);
      setError(e instanceof Error ? e.message : "加载失败");
    }
  }, []);

  useEffect(() => {
    boot();
  }, [boot]);

  async function loadTab(next: Tab) {
    setTab(next);
    setError("");
    try {
      if (next === "dash") setOverview(await api("/api/overview"));
      if (next === "investors") setInvestors(await api("/api/investors"));
      if (next === "fund") setFund(await api("/api/fund"));
      if (next === "sync") setSync(await api("/api/sync"));
      if (next === "system") setSystem(await api("/api/system"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    }
  }

  if (!me) {
    return (
      <div className="center">
        <div className="card">
          <h1>次席运营</h1>
          <p className="hint">云上优先：私有/团队应用由 Cursor 登录门禁保护。本地开发使用模拟身份（dev@example.com）。</p>
          {error ? <p className="error">{error}</p> : <p className="hint">正在识别登录身份…</p>}
          <button className="btn primary" onClick={boot}>
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>次席运营</strong>
          <span>云上原型 · Phase 0–1</span>
        </div>
        <nav className="nav">
          {(
            [
              ["dash", "工作台"],
              ["investors", "开户与权限"],
              ["fund", "资金"],
              ["sync", "JR/T 同步"],
              ["system", "系统"],
            ] as const
          ).map(([k, label]) => (
            <button key={k} className={tab === k ? "active" : ""} onClick={() => loadTab(k)}>
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="row-actions">
            <span className="badge cloud">Cloud / Mock</span>
            <span className="badge">样例数据</span>
          </div>
          <span className="badge">
            {me.displayName} · {me.role} · {me.email}
          </span>
        </header>
        <main className="content">
          {error ? <div className="error">{error}</div> : null}
          {tab === "dash" && overview ? <Dash data={overview} /> : null}
          {tab === "investors" && investors ? (
            <Investors data={investors} onChange={() => loadTab("investors")} setError={setError} />
          ) : null}
          {tab === "fund" && fund ? <Fund data={fund} investors={investors} onChange={async () => {
            setFund(await api("/api/fund"));
            if (!investors) setInvestors(await api("/api/investors"));
          }} setError={setError} ensureInvestors={async () => {
            if (!investors) setInvestors(await api("/api/investors"));
          }} /> : null}
          {tab === "sync" && sync ? <Sync data={sync} onChange={() => loadTab("sync")} setError={setError} /> : null}
          {tab === "system" && system ? <System data={system} /> : null}
        </main>
      </div>
    </div>
  );
}

function Dash({ data }: { data: any }) {
  return (
    <>
      <div className="panel">
        <h2>工作台</h2>
        <div className="grid-4">
          <div className="stat"><div className="label">开户待复核</div><div className="value">{data.todos.pendingInvestors}</div></div>
          <div className="stat"><div className="label">出入金待审</div><div className="value">{data.todos.pendingCash}</div></div>
          <div className="stat"><div className="label">JR/T 冲突</div><div className="value">{data.todos.openConflicts}</div></div>
          <div className="stat"><div className="label">同步健康</div><div className="value" style={{ fontSize: 22 }}><span className={`pill ${data.syncHealth.status}`}>{data.syncHealth.status}</span></div></div>
        </div>
      </div>
      <div className="two-col">
        <div className="panel">
          <h3>最近审计</h3>
          <table>
            <thead><tr><th>时间</th><th>操作者</th><th>动作</th></tr></thead>
            <tbody>
              {data.recentAudit.map((a: any) => (
                <tr key={a.id}>
                  <td>{new Date(a.createdAt).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}</td>
                  <td>{a.actorName}</td>
                  <td>{a.action} {a.target || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>通道</h3>
          <table>
            <thead><tr><th>名称</th><th>类型</th><th>状态</th></tr></thead>
            <tbody>
              {data.channels.map((c: any) => (
                <tr key={c.id}><td>{c.name}</td><td>{c.type}</td><td>{c.enabled ? "启用" : "停用"}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function Investors({ data, onChange, setError }: { data: any; onChange: () => void; setError: (s: string) => void }) {
  const [form, setForm] = useState({
    investorId: "",
    name: "",
    templateId: data.templates?.[0]?.id || "tpl_default",
    operatorId: data.operators?.[0]?.id || "",
  });

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      await api("/api/investors", { method: "POST", body: JSON.stringify(form) });
      setForm({ ...form, investorId: "", name: "" });
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "失败");
    }
  }

  return (
    <>
      <div className="panel">
        <h2>开户镜像</h2>
        <p className="hint">权威系统在外部；本页为次席镜像。云上首个登录用户自动成为 admin。</p>
        <form className="form-grid" onSubmit={create}>
          <label>投资者代码<input required value={form.investorId} onChange={(e) => setForm({ ...form, investorId: e.target.value })} /></label>
          <label>名称<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          <label>模板
            <select value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })}>
              {data.templates.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label>操作员
            <select value={form.operatorId} onChange={(e) => setForm({ ...form, operatorId: e.target.value })}>
              {data.operators.map((o: any) => <option key={o.id} value={o.id}>{o.code} · {o.name}</option>)}
            </select>
          </label>
          <button className="btn primary" type="submit">创建草稿</button>
        </form>
      </div>
      <div className="panel">
        <h3>列表</h3>
        <table>
          <thead><tr><th>代码</th><th>名称</th><th>状态</th><th>来源</th><th>可用</th><th>操作</th></tr></thead>
          <tbody>
            {data.items.map((i: any) => (
              <tr key={i.id}>
                <td>{i.investorId}</td>
                <td>{i.name}</td>
                <td><span className={`pill ${i.status}`}>{i.status}</span></td>
                <td>{i.source}</td>
                <td>{i.fund ? Number(i.fund.available).toLocaleString() : "—"}</td>
                <td className="row-actions">
                  {i.status === "DRAFT" ? (
                    <button className="btn" onClick={async () => { await api(`/api/investors/${i.id}/submit`, { method: "POST" }); onChange(); }}>提交复核</button>
                  ) : null}
                  {i.status === "PENDING" ? (
                    <button className="btn primary" onClick={async () => { await api(`/api/investors/${i.id}/approve`, { method: "POST" }); onChange(); }}>批准</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Fund({
  data,
  onChange,
  setError,
  ensureInvestors,
}: {
  data: any;
  investors: any;
  onChange: () => Promise<void>;
  setError: (s: string) => void;
  ensureInvestors: () => Promise<void>;
}) {
  const [investorId, setInvestorId] = useState(data.accounts?.[0]?.investorId || "");
  const [amount, setAmount] = useState("10000");
  const [type, setType] = useState("IN");

  useEffect(() => {
    ensureInvestors();
  }, [ensureInvestors]);

  async function create(e: FormEvent) {
    e.preventDefault();
    try {
      await api("/api/fund", {
        method: "POST",
        body: JSON.stringify({ investorId, type, amount: Number(amount) }),
      });
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "失败");
    }
  }

  return (
    <>
      <div className="panel">
        <h2>出入金</h2>
        <form className="form-grid" onSubmit={create}>
          <label>投资者
            <select value={investorId} onChange={(e) => setInvestorId(e.target.value)}>
              {data.accounts.map((a: any) => (
                <option key={a.investorId} value={a.investorId}>{a.investorCode} · {a.investorName}</option>
              ))}
            </select>
          </label>
          <label>类型
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="IN">入金</option>
              <option value="OUT">出金</option>
            </select>
          </label>
          <label>金额<input value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <button className="btn primary" type="submit">提交待审</button>
        </form>
      </div>
      <div className="panel">
        <h3>账户</h3>
        <table>
          <thead><tr><th>投资者</th><th>权益</th><th>可用</th><th>保证金</th></tr></thead>
          <tbody>
            {data.accounts.map((a: any) => (
              <tr key={a.investorId}>
                <td>{a.investorCode} · {a.investorName}</td>
                <td>{a.balance.toLocaleString()}</td>
                <td>{a.available.toLocaleString()}</td>
                <td>{a.margin.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel">
        <h3>申请单</h3>
        <table>
          <thead><tr><th>单号</th><th>投资者</th><th>类型</th><th>金额</th><th>状态</th><th></th></tr></thead>
          <tbody>
            {data.cash.map((c: any) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.investorCode}</td>
                <td>{c.type}</td>
                <td>{c.amount.toLocaleString()}</td>
                <td><span className={`pill ${c.status}`}>{c.status}</span></td>
                <td>
                  {c.status === "PENDING" ? (
                    <button className="btn primary" onClick={async () => {
                      await api(`/api/fund/${c.id}/approve`, { method: "POST" });
                      await onChange();
                    }}>通过</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Sync({ data, onChange, setError }: { data: any; onChange: () => void; setError: (s: string) => void }) {
  const [raw, setRaw] = useState(`{
  "investors": [
    { "investorId": "100001", "name": "示例投资者甲", "status": "ACTIVE", "balance": 1200000, "available": 1000000 },
    { "investorId": "100009", "name": "JR/T 新客户", "status": "ACTIVE", "balance": 500000, "available": 500000 }
  ]
}`);

  async function ingest() {
    try {
      await api("/api/sync", { method: "POST", body: raw });
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "同步失败");
    }
  }

  return (
    <>
      <div className="panel">
        <h2>JR/T Mock 摄入</h2>
        <textarea rows={10} value={raw} onChange={(e) => setRaw(e.target.value)} />
        <div className="row-actions" style={{ marginTop: 12 }}>
          <button className="btn primary" onClick={ingest}>执行同步</button>
        </div>
      </div>
      <div className="two-col">
        <div className="panel">
          <h3>任务</h3>
          <table>
            <thead><tr><th>ID</th><th>结果</th></tr></thead>
            <tbody>
              {data.jobs.map((j: any) => (
                <tr key={j.id}><td>{j.id}</td><td>ok {j.okCount} / conflict {j.conflictCount}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h3>冲突</h3>
          <table>
            <thead><tr><th>投资者</th><th>原因</th><th>状态</th></tr></thead>
            <tbody>
              {data.conflicts.map((c: any) => (
                <tr key={c.id}><td>{c.investorId}</td><td>{c.reason}</td><td>{c.status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function System({ data }: { data: any }) {
  return (
    <>
      <div className="panel">
        <h2>系统</h2>
        <p className="hint">{data.note}</p>
        <table>
          <thead><tr><th>通道</th><th>类型</th><th>说明</th><th>启用</th></tr></thead>
          <tbody>
            {data.channels.map((c: any) => (
              <tr key={c.id}><td>{c.name}</td><td>{c.type}</td><td>{c.note}</td><td>{c.enabled ? "是" : "否"}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel">
        <h3>风控规则（Phase 2 生效）</h3>
        <table>
          <thead><tr><th>名称</th><th>指标</th><th>阈值</th><th>动作</th></tr></thead>
          <tbody>
            {data.rules.map((r: any) => (
              <tr key={r.id}><td>{r.name}</td><td>{r.metric}</td><td>{r.threshold}</td><td>{r.action}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
