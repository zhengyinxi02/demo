export type Role = "ops" | "risk" | "admin";
export type ChannelType = "MOCK" | "TRADER" | "RELAY" | "USER_API";
export type InvestorStatus = "DRAFT" | "PENDING" | "ACTIVE" | "FROZEN" | "CLOSED";
export type InvestorSource = "AUTHORITY" | "JRT" | "MANUAL";
export type CashType = "IN" | "OUT";
export type CashStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
export type SyncJobStatus = "RUNNING" | "FINISHED" | "FAILED";
export type ConflictStatus = "OPEN" | "RESOLVED";

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: Role;
}

export interface ChannelConfig {
  id: string;
  type: ChannelType;
  name: string;
  enabled: boolean;
  front?: string;
  brokerId?: string;
  note?: string;
}

export interface RiskRule {
  id: string;
  name: string;
  scope: "GLOBAL" | "TEMPLATE" | "INVESTOR";
  scopeRef?: string;
  metric: string;
  threshold: number;
  action: "WARN" | "BLOCK" | "FREEZE_OPEN";
  version: number;
  enabled: boolean;
}

export interface PermissionTemplate {
  id: string;
  name: string;
  allowOpen: boolean;
  allowClose: boolean;
  productGroups: string[];
  note?: string;
}

export interface Operator {
  id: string;
  code: string;
  name: string;
}

export interface Investor {
  id: string;
  investorId: string;
  name: string;
  status: InvestorStatus;
  source: InvestorSource;
  templateId?: string;
  freezeOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OperatorInvestorGrant {
  id: string;
  operatorId: string;
  investorId: string;
}

export interface FundAccount {
  investorId: string;
  balance: number;
  available: number;
  margin: number;
  frozen: number;
  updatedAt: string;
}

export interface CashRequest {
  id: string;
  investorId: string;
  type: CashType;
  amount: number;
  status: CashStatus;
  remark?: string;
  createdBy: string;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}

export interface FundLedgerEntry {
  id: string;
  investorId: string;
  kind: "CASH_IN" | "CASH_OUT" | "ADJUST" | "SYNC";
  amount: number;
  balanceAfter: number;
  refType?: string;
  refId?: string;
  createdAt: string;
}

export interface SyncJob {
  id: string;
  status: SyncJobStatus;
  okCount: number;
  failCount: number;
  conflictCount: number;
  createdAt: string;
  finishedAt?: string;
  rawSummary?: string;
}

export interface SyncConflict {
  id: string;
  jobId: string;
  investorId: string;
  field: string;
  localValue: string;
  remoteValue: string;
  reason: string;
  status: ConflictStatus;
  createdAt: string;
  resolvedAt?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  target?: string;
  detail?: string;
  createdAt: string;
}

export interface OutboxEvent {
  id: string;
  type: string;
  payload: unknown;
  createdAt: string;
  published: boolean;
}

export interface StoreData {
  users: AdminUser[];
  channels: ChannelConfig[];
  riskRules: RiskRule[];
  templates: PermissionTemplate[];
  operators: Operator[];
  investors: Investor[];
  grants: OperatorInvestorGrant[];
  fundAccounts: FundAccount[];
  cashRequests: CashRequest[];
  ledger: FundLedgerEntry[];
  syncJobs: SyncJob[];
  syncConflicts: SyncConflict[];
  auditLogs: AuditLog[];
  outbox: OutboxEvent[];
  sessions: Record<string, { userId: string; createdAt: string }>;
}
