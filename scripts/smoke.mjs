const API = process.env.API_URL || "http://127.0.0.1:8787";

async function req(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${data.message || ""}`);
  return data;
}

async function main() {
  const health = await req("/api/health");
  console.log("health", health);

  const login = await req("/api/auth/login", {
    method: "POST",
    body: { username: "ops", password: "ops123" },
  });
  const token = login.token;
  console.log("login ok", login.user.role);

  const overview = await req("/api/dashboard/overview", { token });
  console.log("overview todos", overview.todos);

  const created = await req("/api/investors", {
    method: "POST",
    token,
    body: { investorId: `9${Date.now().toString().slice(-5)}`, name: "冒烟投资者", templateId: "tpl_default" },
  });
  console.log("investor draft", created.investorId, created.status);

  await req(`/api/investors/${created.id}/submit`, { method: "POST", token });

  const adminLogin = await req("/api/auth/login", {
    method: "POST",
    body: { username: "admin", password: "admin123" },
  });
  await req(`/api/investors/${created.id}/approve`, { method: "POST", token: adminLogin.token });

  const cash = await req("/api/fund/cash-requests", {
    method: "POST",
    token,
    body: { investorId: created.id, type: "IN", amount: 25000, submit: true },
  });
  await req(`/api/fund/cash-requests/${cash.id}/approve`, { method: "POST", token });

  const sync = await req("/api/sync/jrt/ingest", {
    method: "POST",
    token: adminLogin.token,
    body: {
      investors: [{ investorId: created.investorId, name: "冒烟投资者", status: "ACTIVE", balance: 25000, available: 25000 }],
    },
  });
  console.log("sync", sync.id, "ok", sync.okCount, "conflicts", sync.conflictCount);
  console.log("SMOKE_OK");
}

main().catch((e) => {
  console.error("SMOKE_FAIL", e.message);
  process.exit(1);
});
