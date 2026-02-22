export type UserRole = "admin" | "user" | "viewer";

export interface DomainWithExpiry {
  id: number;
  userId: string | null;
  domain: string;
  registrar: string | null;
  creationDate: string | null;
  expiryDate: string | null;
  lastChecked: string | null;
  status: "active" | "expiring_soon" | "expired" | "unknown" | "error";
  notes: string | null;
  ownerAccount: string | null;
  paymentMethod: string | null;
  paymentMethodExpiry: string | null;
  passboltUrl: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  daysUntilExpiry: number | null;
  permission?: "read" | "edit" | "full_control";
  isOwner?: boolean;
}

export interface NotificationLogEntry {
  id: number;
  domainId: number;
  channel: "email" | "telegram";
  thresholdDays: number;
  message: string;
  sentAt: string;
  success: boolean;
  error: string | null;
}

export interface DomainShare {
  id: number;
  domainId: number;
  sharedWithUserId: string;
  sharedWithEmail?: string;
  sharedWithName?: string;
  permission: "read" | "edit" | "full_control";
  createdAt: string;
}

export interface AppSettings {
  notification_thresholds: string;
  smtp_host: string;
  smtp_port: string;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  email_recipients: string;
  email_enabled: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
  telegram_enabled: string;
  check_cron_schedule: string;
  [key: string]: string;
}
