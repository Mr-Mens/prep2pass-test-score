export const ACCOUNT_STATUSES = ["active", "paused"] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export function normalizeAccountStatus(value: string | null | undefined): AccountStatus {
  return value === "paused" ? "paused" : "active";
}

export function formatAccountStatusLabel(status: AccountStatus): string {
  return status === "paused" ? "Paused" : "Active";
}
