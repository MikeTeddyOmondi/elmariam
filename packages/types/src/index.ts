// ── User & Auth ───────────────────────────────────────────────

export type UserType = 'admin' | 'staff' | 'customer';

export interface User {
  id: string;
  username: string;
  email: string;
  userType: UserType;
  id_number: string;
  createdAt: Date;
}

export interface TokenPayload {
  id: string;
  email: string;
  userType: UserType;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// ── Hotel / Booking ───────────────────────────────────────────

export interface BookingRequest {
  customerId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  specialRequests?: string;
}

export interface Customer {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  id_number: string;
}

// ── Bar ───────────────────────────────────────────────────────

export interface BarOrderItem {
  itemId: string;
  quantity: number;
}

export interface BarOrder {
  items: BarOrderItem[];
  tableNumber?: number;
  staffId: string;
}

// ── API response envelopes ────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  status: number;
  data: T;
}

export interface ApiError {
  success: false;
  status: number;
  data: {
    message: string;
    stack?: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ── Messaging / Queue ─────────────────────────────────────────

export interface SmsPayload {
  to: string;
  message: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}
