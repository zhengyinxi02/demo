import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";

type Investor = {
  id: string;
  investorId: string;
  name: string;
  status: string;
  source: string;
  template?: { name: string };
  fund?: { available: number; balance: number };
};

type Template = { id: string; name: string };
type Operator = { id: string; code: string; name: string };

export default function InvestorsPage() {
  const [items, setItems] = useState<Investor[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ investorId: "", name: "", templateId: "", operatorId: "" });

  async function load() {
    const [inv, tpl, ops] = await Promise.all([
      api<{ items: Investor[] }>("/api/investors"),
      api<{ items: Template[] }>("/api/investors/templates"),
      api<{ items: Operator[] }>("/api/investors/operators"),
    ]);
    setItems(inv.items);
    setTemplates(tpl.items);
    setOperators(ops.items);
    setForm((f) => ({
      ...f,
      templateId: f.templateId || tpl.items[0]?.id || "",
      operatorId: f.operatorId || ops.items[0]?.id || "",
    }));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/investors", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setForm((f) => ({ ...f, investorId: "", name: "" }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    }
  }

  async function submit(id: string) {
    await api(`/api/investors/${id}/submit`, { method: "POST" });
    await load();
  }

  async function approve(id: string) {
    await api(`/api/investors/${id}/approve`, { method: "POST" });
    await load();
  }

  return (
    <div>
      <div className="panel">
        <h2>开户镜像</h2>
        <p className="hint" style={{ marginTop: 0 }}>
          权威系统在外部；此处为次席镜像。手动录入 source=MANUAL，JR/T 同步为 JRT。
        </p>
        <form className="form-grid" onSubmit={create}>
          <label>
            投资者代码
            <input
              required
              value={form.investorId}
              onChange={(e) => setForm({ ...form, investorId: e.target.value })}
              placeholder="如 100003"
            />
          </label>
          <label>
            名称
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label>
            权限模板
            <select value={form.templateId} onChange={(e) => setForm({ ...form, templateId: e.target.value })}>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            绑定操作员
            <select value={form.operatorId} onChange={(e) => setForm({ ...form, operatorId: e.target.value })}>
              {operators.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code} · {o.name}
                </option>
              ))}
            </select>
          </label>
          <div className="row-actions">
            <button className="btn primary" type="submit">
              创建草稿
            </button>
          </div>
        </form>
        {error ? <div className="error">{error}</div> : null}
      </div>

      <div className="panel">
        <h3>投资者列表</h3>
        <table>
          <thead>
            <tr>
              <th>代码</th>
              <th>名称</th>
              <th>状态</th>
              <th>来源</th>
              <th>模板</th>
              <th>可用资金</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.investorId}</td>
                <td>{i.name}</td>
                <td>
                  <span className={`pill ${i.status}`}>{i.status}</span>
                </td>
                <td>{i.source}</td>
                <td>{i.template?.name || "—"}</td>
                <td>{i.fund ? i.fund.available.toLocaleString() : "—"}</td>
                <td className="row-actions">
                  {i.status === "DRAFT" ? (
                    <button className="btn" onClick={() => submit(i.id)}>
                      提交复核
                    </button>
                  ) : null}
                  {i.status === "PENDING" ? (
                    <button className="btn primary" onClick={() => approve(i.id)}>
                      批准开户
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
