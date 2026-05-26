const API_BASE = '';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = typeof data.error === 'string' ? data.error : 'Request failed';
    const error = new Error(message) as Error & { status: number; code?: string };
    error.status = res.status;
    error.code = data.code;
    throw error;
  }

  return data as T;
}

export interface User {
  id: string;
  email: string;
}

export interface Seat {
  id: number;
  row: number;
  col: number;
  status: 'available' | 'reserved' | 'pending';
}

export interface Reservation {
  id: string;
  seatId: number;
  status: string;
  expiresAt?: string;
  paymentIntentId?: string;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  me: () => request<{ user: User }>('/api/auth/me'),

  getSeats: () => request<{ seats: Seat[] }>('/api/seats'),

  startReservation: (seatId: number) =>
    request<{ reservation: Reservation }>('/api/reservations/start', {
      method: 'POST',
      body: JSON.stringify({ seatId }),
    }),

  getReservation: (id: string) =>
    request<{ reservation: Reservation }>(`/api/reservations/${id}`),

  mockPayment: (reservationId: string, paymentMethodId?: string) =>
    request<{
      success: boolean;
      idempotent: boolean;
      reason?: string;
      reservation: Reservation | null;
    }>('/api/payments/mock', {
      method: 'POST',
      body: JSON.stringify({ reservationId, paymentMethodId }),
    }),
};
