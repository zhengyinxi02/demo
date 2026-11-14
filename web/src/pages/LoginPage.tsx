import { FormEvent, useState } from "react";

export default function LoginPage({
  onLogin,
}: {
  onLogin: (username: string, password: string) => Promise<void>;
}) {
  const [username, setUsername] = useState("ops");
  const [password, setPassword] = useState("ops123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onLogin(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card stack" onSubmit={submit}>
        <div>
          <h1>次席运营</h1>
          <p>本地可调试原型 · 开户镜像 / 资金 / JR/T Mock</p>
        </div>
        <label>
          用户名
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </label>
        <label>
          密码
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <div className="error">{error}</div> : null}
        <button className="btn primary" disabled={loading}>
          {loading ? "登录中…" : "进入后台"}
        </button>
        <div className="hint">
          演示账号：ops/ops123（运营）、risk/risk123（风控）、admin/admin123（管理员）
          <br />
          启动：在仓库根目录执行 <code>npm install && npm run dev</code>，浏览器打开
          http://127.0.0.1:5173
        </div>
      </form>
    </div>
  );
}
