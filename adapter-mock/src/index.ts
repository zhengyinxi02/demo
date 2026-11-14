import cors from "cors";
import express from "express";

/**
 * Phase 0–1: lightweight Mock CounterGateway stub.
 * Real order/trade flows land in Phase 2; this process proves the boundary is runnable locally.
 */
const app = express();
const PORT = Number(process.env.ADAPTER_PORT || 8790);

app.use(cors());
app.use(express.json());

let session = {
  state: "CONNECTED" as "CONNECTED" | "DISCONNECTED",
  channel: "MOCK",
  tradingDay: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
  frontId: 1,
  sessionId: 10001,
};

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "adapter-mock", session });
});

app.get("/session", (_req, res) => res.json(session));

app.post("/session/connect", (_req, res) => {
  session = { ...session, state: "CONNECTED" };
  res.json(session);
});

app.post("/session/disconnect", (_req, res) => {
  session = { ...session, state: "DISCONNECTED" };
  res.json(session);
});

app.post("/query/account", (req, res) => {
  res.json({
    investorId: req.body?.investorId || "unknown",
    balance: 0,
    available: 0,
    source: "MOCK",
    note: "Phase1 uses local Fund ledger; counter query wired in Phase2+",
  });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`[adapter-mock] http://127.0.0.1:${PORT}`);
});
