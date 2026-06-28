// ─── Branded types ────────────────────────────────────────────────────────────
// Prevents mixing domain primitives at compile time.

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

export type ConversaId = Brand<string, 'ConversaId'>;
export type MensagemId = Brand<string, 'MensagemId'>;
export type AgendamentoId = Brand<string, 'AgendamentoId'>;
export type client_id = Brand<string, 'client_id'>;

// ─── CRM — Conversa ───────────────────────────────────────────────────────────

export type ConversaStatus = 'aberta' | 'aguardando' | 'fechada';

export interface Conversa {
  id: ConversaId;
  client_id: client_id;
  client_name: string;
  client_phone: string;
  last_message: string;
  last_message_at: string; // ISO 8601
  unread: number;
  status: ConversaStatus;
}

export interface Mensagem {
  id: MensagemId;
  conversaId: ConversaId;
  conteudo: string;
  criadaEm: string; // ISO 8601
  origem: 'cliente' | 'bot' | 'atendente';
}

export interface EnviarMensagemInput {
  conteudo: string;
}

// ─── CRM — Agendamento ────────────────────────────────────────────────────────

export type AgendamentoStatus = 'pendente' | 'confirmado' | 'cancelado';

export interface Agendamento {
  id: AgendamentoId;
  client_id: client_id;
  client_name: string;
  servico: string;
  dataHora: string; // ISO 8601
  status: AgendamentoStatus;
}

export interface CriarAgendamentoInput {
  client_id: client_id;
  servico: string;
  dataHora: string;
}

export interface AtualizarAgendamentoInput {
  status?: AgendamentoStatus;
  servico?: string;
  dataHora?: string;
}

// ─── CRM — Cliente ────────────────────────────────────────────────────────────

export interface Cliente {
  id: client_id;
  nome: string;
  telefone: string;
  criadoEm: string; // ISO 8601
  tags: string[];
  conversaId?: ConversaId;
}

export interface AtualizarClienteInput {
  tags?: string[];
}

// ─── WebSocket ────────────────────────────────────────────────────────────────

export type WsEventType =
  | 'nova_mensagem'
  | 'novo_agendamento'
  | 'status_atualizado';

export interface WsEvent<T = unknown> {
  tipo: WsEventType;
  payload: T;
}

export type WsStatus = 'conectando' | 'conectado' | 'desconectado' | 'erro';

