import { nanoid } from "nanoid";
import type { StoreData } from "./types.js";

export function audit(
  store: StoreData,
  actor: { id: string; displayName: string } | null,
  action: string,
  target?: string,
  detail?: string,
) {
  store.auditLogs.unshift({
    id: nanoid(10),
    actorId: actor?.id ?? "anonymous",
    actorName: actor?.displayName ?? "anonymous",
    action,
    target,
    detail,
    createdAt: new Date().toISOString(),
  });
  if (store.auditLogs.length > 500) store.auditLogs.length = 500;
}

export function emit(store: StoreData, type: string, payload: unknown) {
  store.outbox.unshift({
    id: nanoid(12),
    type,
    payload,
    createdAt: new Date().toISOString(),
    published: true,
  });
  if (store.outbox.length > 300) store.outbox.length = 300;
}
