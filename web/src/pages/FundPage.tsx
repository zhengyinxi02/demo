import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";

type Account = {
  investorId: string;
  investorCode?: string;
  investorName?: string;
  balance: number;
  available: number;
  margin: number;
  frozen: number;
};

type Cash = {
  id: string;
  investorId: string;
  investorCode?: string;
  investorName?: string;
  type: "IN" | "OUT";
  amount: number;
  status: string;
  remark?: string;
};

type Investor = { id: string; investorId: string; name: string; status: string };

export default function FundPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cash, setCash] = useState<Cash[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ investorId: "", type: "IN", amount: "10000", remark: "", submit: true });

  async function load() {
    const [a, c, inv] = await Promise.all([
      api<{ items: Account[] }>("/api/fund/accounts"),
      api<{ items: Cash[] }>("/api/fund/cash-requests"),
      api<{ items: Investor[] }>("/api/investors"),
    ]);
    setAccounts(a.items);
    setCash(c.items);
    setInvestors(inv.items);
    setForm((f) => ({ ...f, investorId: f.investorId || inv.items.find((x) => x.status === "ACTIVE")?.id || inv.items[0]?.id || "" }));
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/fund/cash-requests", {
        method: "POST",
        body: JSON.stringify({
          investorId: form.investorId,
          type: form.type,
          amount: Number(form.amount),
          remark: form.remark,
          submit: form.submit,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    }
  }

  async function approve(id: string) {
    try {
      await api(`/api/fund/cash-requests/${id}/approve`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "审批失败");
    }
  }

  async function reject(id: string) {
    await api(`/api/fund/cash-requests/${id}/reject`, { method: "POST" });
    await load();
  }

  return (
    <div>
      <div className="panel">
        <h2>出入金申请</h2>
        <form className="form-grid" onSubmit={create}>
          <label>
            投资者
            <select value={form.investorId} onChange={(e) => setForm({ ...form, investorId: e.target.value })}>
              {investors.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.investorId} · {i.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            类型
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="IN">入金</option>
              <option value="OUT">出金</option>
            </select>
          </label>
          <label>
            金额
            <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </label>
          <label>
            备注
            <input value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} />
          </label>
          <div className="row-actions">
            <button className="btn primary" type="submit">
              提交待审
            </button>
          </div>
        </form>
        {error ? <div className="error">{error}</div> : null}
      </div>

      <div className="panel">
        <h3>资金账户</h3>
        <table>
          <thead>
            <tr>
              <th>投资者</th>
              <th>权益</th>
              <th>可用</th>
              <th>保证金</th>
              <th>冻结</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.investorId}>
                <td>
                  {a.investorCode} · {a.investorName}
                </td>
                <td>{a.balance.toLocaleString()}</td>
                <td>{a.available.toLocaleString()}</td>
                <td>{a.margin.toLocaleString()}</td>
                <td>{a.frozen.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h3>申请单</h3>
        <table>
          <thead>
            <tr>
              <th>单号</th>
              <th>投资者</th>
              <th>类型</th>
              <th>金额</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {cash.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>
                  {c.investorCode} · {c.investorName}
                </td>
                <td>{c.type === "IN" ? "入金" : "出金"}</td>
                <td>{c.amount.toLocaleString()}</td>
                <td>
                  <span className={`pill ${c.status}`}>{c.status}</span>
                </td>
                <td className="row-actions">
                  {c.status === "PENDING" ? (
                    <>
                      <button className="btn primary" onClick={() => approve(c.id)}>
                        通过
                      </button>
                      <button className="btn danger" onClick={() => reject(c.id)}>
                        驳回
                      </button>
                    </>
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
