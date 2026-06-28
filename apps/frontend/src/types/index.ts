// ─── Branded types ────────────────────────────────────────────────────────────

type Brand<K, T> = K & { readonly __brand: T };

export type UserId = Brand<string, 'UserId'>;

// ─── User domain ──────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'user' | 'viewer';

export interface User {
  id: UserId;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string; // ISO 8601
  avatarUrl?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: UserRole;
  active?: boolean;
}

export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Auth domain ──────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface RefreshResponse {
  token: string;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface ApiErrorData {
  message?: string;
  error?: string;
  errors?: Array<{ message: string }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  pageSize?: number;
}

// ─── UI ───────────────────────────────────────────────────────────────────────

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  duration: number;
}

export type Theme = 'light' | 'dark';

// ─── Utility types ────────────────────────────────────────────────────────────

export type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

// ─── CRM — Branded IDs ────────────────────────────────────────────────────────

export type ConversationId = Brand<string, 'ConversationId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type AppointmentId = Brand<string, 'AppointmentId'>;
export type ClientId = Brand<string, 'ClientId'>;

// ─── CRM — Conversation ───────────────────────────────────────────────────────

export type ConversationStatus = 'open' | 'waiting_agent' | 'closed';

export interface Conversation {
  id: ConversationId;
  client_id: ClientId;
  client_name: string;
  client_phone: string;
  last_message: string;
  last_message_at: string; // ISO 8601
  unread: number;
  status: ConversationStatus;
}

// direction mirrors backend: 'in' = client sent, 'out' = agent/bot sent
export type MessageDirection = 'in' | 'out';

export interface Message {
  id: MessageId;
  conversation_id: ConversationId;
  direction: MessageDirection;
  content: string;
  type: string;
  wa_message_id?: string;
  status: string;
  timestamp: string; // ISO 8601
}

export interface SendMessageInput {
  content: string;
}

// ─── CRM — Appointment ────────────────────────────────────────────────────────

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Appointment {
  id: AppointmentId;
  client_id?: ClientId;
  client_name: string;
  service: string;
  scheduled_at: string; // ISO 8601
  status: AppointmentStatus;
}

export interface CreateAppointmentInput {
  client_id: ClientId;
  service: string;
  scheduled_at: string; // ISO 8601
}

export interface UpdateAppointmentInput {
  status?: AppointmentStatus;
  service?: string;
  scheduled_at?: string;
}

// ─── CRM — Client ─────────────────────────────────────────────────────────────

export interface Client {
  id: ClientId;
  branch_id?: number;
  name: string;
  phone: string;
  tags: string[];
  created_at: string; // ISO 8601
  conversation_id?: ConversationId;
}

export interface UpdateClientInput {
  tags?: string[];
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

export type WsEventType =
  | 'new_message'
  | 'new_appointment'
  | 'status_updated';

export interface WsEvent<T = unknown> {
  type: WsEventType;
  payload: T;
}

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error';