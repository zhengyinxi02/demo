import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { audit } from "../audit.js";
import { mutateStore } from "../store.js";
import { authRequired, type AuthedRequest } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/login", (req, res) => {
  const body = z.object({ username: z.string(), password: z.string() }).safeParse(req.body);
  if (!body.success) return res.status(400).json({ code: "BAD_REQUEST", message: "参数错误" });

  const result = mutateStore((store) => {
    const user = store.users.find(
      (u) => u.username === body.data.username && u.password === body.data.password,
    );
    if (!user) return null;
    const token = nanoid(24);
    store.sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
    audit(store, user, "auth.login");
    return {
      token,
      user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role },
    };
  });

  if (!result) return res.status(401).json({ code: "LOGIN_FAILED", message: "用户名或密码错误" });
  res.json(result);
});

authRouter.post("/logout", authRequired, (req: AuthedRequest, res) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  mutateStore((store) => {
    delete store.sessions[token];
    audit(store, req.user!, "auth.logout");
  });
  res.json({ ok: true });
});

authRouter.get("/me", authRequired, (req: AuthedRequest, res) => {
  const u = req.user!;
  res.json({ id: u.id, username: u.username, displayName: u.displayName, role: u.role });
});
