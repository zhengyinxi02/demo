import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, getToken, setToken } from "./lib/api";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import InvestorsPage from "./pages/InvestorsPage";
import FundPage from "./pages/FundPage";
import SyncPage from "./pages/SyncPage";
import SystemPage from "./pages/SystemPage";

type User = { id: string; username: string; displayName: string; role: string };

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [envBadge, setEnvBadge] = useState("Mock");
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setBooting(false);
      return;
    }
    api<User>("/api/auth/me")
      .then((u) => setUser(u))
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    api<{ envBadge: string }>("/api/dashboard/overview")
      .then((d) => setEnvBadge(d.envBadge))
      .catch(() => undefined);
  }, [user]);

  async function onLogin(username: string, password: string) {
    const res = await api<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(res.token);
    setUser(res.user);
    navigate("/");
  }

  async function onLogout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
    navigate("/login");
  }

  if (booting) {
    return <div className="login-page">加载中…</div>;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={onLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>次席运营</strong>
          <span>期货次席管理系统 · Phase 0–1</span>
        </div>
        <nav className="nav">
          <NavLink to="/" end>
            工作台
          </NavLink>
          <NavLink to="/investors">开户与权限</NavLink>
          <NavLink to="/fund">资金与保证金</NavLink>
          <NavLink to="/sync">JR/T 同步</NavLink>
          <NavLink to="/system">系统</NavLink>
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <div className="badges">
            <span className="badge mock">{envBadge}</span>
            <span className="badge">本地调试</span>
            <span className="badge ok">API :8787</span>
          </div>
          <div className="row-actions">
            <span className="badge">
              {user.displayName} · {user.role}
            </span>
            <button className="btn" onClick={onLogout}>
              退出
            </button>
          </div>
        </header>
        <main className="content">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/investors" element={<InvestorsPage />} />
            <Route path="/fund" element={<FundPage />} />
            <Route path="/sync" element={<SyncPage />} />
            <Route path="/system" element={<SystemPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
