import type { NextFunction, Request, Response } from "express";
import { getStore } from "../store.js";
import type { AdminUser, Role } from "../types.js";

export type AuthedRequest = Request & { user?: AdminUser };

export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ code: "UNAUTHORIZED", message: "请先登录" });
  const store = getStore();
  const session = store.sessions[token];
  if (!session) return res.status(401).json({ code: "UNAUTHORIZED", message: "会话无效" });
  const user = store.users.find((u) => u.id === session.userId);
  if (!user) return res.status(401).json({ code: "UNAUTHORIZED", message: "用户不存在" });
  req.user = user;
  next();
}

export function requireRoles(...roles: Role[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ code: "UNAUTHORIZED", message: "请先登录" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: "FORBIDDEN", message: "权限不足" });
    }
    next();
  };
}
