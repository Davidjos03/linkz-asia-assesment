import { useEffect, useState, type ReactNode } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useReservation } from './hooks/useReservation';
import { Login } from './components/Login';
import { SeatMap } from './components/SeatMap';
import { PaymentModal } from './components/PaymentModal';
import { LinkzLogo } from './components/LinkzLogo';

function Dashboard() {
  const { user, logout } = useAuth();
  const { seats, loading, fetchSeats, selectSeat, pay, activeReservation, setActiveReservation } =
    useReservation();
  const [paymentSeatId, setPaymentSeatId] = useState<number | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchSeats();
    const interval = setInterval(fetchSeats, 5000);
    return () => clearInterval(interval);
  }, [fetchSeats]);

  const handleSelectSeat = async (seatId: number) => {
    setActionError('');
    try {
      const reservation = await selectSeat(seatId);
      setPaymentSeatId(seatId);
      setReservationId(reservation.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not reserve seat');
      fetchSeats();
    }
  };

  const handlePay = async (cardNumber: string) => {
    if (!reservationId) throw new Error('No reservation');
    return pay(reservationId, cardNumber);
  };

  const closePayment = () => {
    setPaymentSeatId(null);
    setReservationId(null);
    setActiveReservation(null);
    fetchSeats();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <LinkzLogo size="sm" />
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted sm:inline">{user?.email}</span>
            <button
              type="button"
              onClick={() => logout()}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:border-linkz-green/50 hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {actionError && (
          <p className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {actionError}
          </p>
        )}

        <SeatMap
          seats={seats}
          loading={loading}
          onSelectSeat={handleSelectSeat}
          disabled={!!paymentSeatId}
        />

        {activeReservation && activeReservation.status === 'confirmed' && !paymentSeatId && (
          <div className="mt-6 rounded-lg border border-linkz-green/30 bg-linkz-green/10 px-4 py-3 text-sm">
            You have a confirmed reservation for seat A{activeReservation.seatId}.
          </div>
        )}
      </main>

      {paymentSeatId && reservationId && (
        <PaymentModal
          seatId={paymentSeatId}
          reservationId={reservationId}
          onPay={handlePay}
          onClose={closePayment}
        />
      )}
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-muted">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
    navigate('/seats');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-muted">
        Loading…
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/seats" replace /> : <Login onLogin={handleLogin} />}
      />
      <Route
        path="/seats"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={user ? '/seats' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
