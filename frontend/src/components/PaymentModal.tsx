import { FormEvent, useState } from 'react';

interface PaymentModalProps {
  seatId: number;
  reservationId: string;
  onPay: (cardNumber: string) => Promise<{ success: boolean; reason?: string }>;
  onClose: () => void;
}

export function PaymentModal({ seatId, reservationId, onPay, onClose }: PaymentModalProps) {
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvc, setCvc] = useState('123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<'success' | 'failed' | null>(null);

  const formatCard = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await onPay(cardNumber);
      setResult(response.success ? 'success' : 'failed');
      if (!response.success && response.reason === 'SEAT_TAKEN') {
        setError('This seat was taken while processing payment.');
      } else if (!response.success) {
        setError('Payment failed. You can retry — the same request is idempotent.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment error');
      setResult('failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-6 shadow-2xl">
        {result === 'success' ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-linkz-green/20 text-linkz-green">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold">Reservation confirmed</h3>
            <p className="mt-2 text-sm text-muted">
              Seat A{seatId} is now reserved for you.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-linkz-green py-3 text-sm font-semibold hover:bg-linkz-green-hover"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Complete payment</h3>
                <p className="text-sm text-muted">Seat A{seatId} · Mock checkout</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-muted hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs text-muted">Card number</label>
                <input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCard(e.target.value))}
                  className="w-full rounded-lg border border-border bg-[#0d0d0d] px-3 py-2.5 text-sm outline-none focus:border-linkz-green"
                  placeholder="4242 4242 4242 4242"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-muted">Expiry</label>
                  <input
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full rounded-lg border border-border bg-[#0d0d0d] px-3 py-2.5 text-sm outline-none focus:border-linkz-green"
                    placeholder="MM/YY"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">CVC</label>
                  <input
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    className="w-full rounded-lg border border-border bg-[#0d0d0d] px-3 py-2.5 text-sm outline-none focus:border-linkz-green"
                    placeholder="123"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {error}
                </p>
              )}

              <p className="text-xs text-muted">
                Mock payment (~1s delay, ~5% random failure). Retries are safe.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-linkz-green py-3 text-sm font-semibold hover:bg-linkz-green-hover disabled:opacity-60"
              >
                {loading ? 'Processing…' : `Pay for seat A${seatId}`}
              </button>
            </form>

            <p className="mt-3 text-center text-[10px] text-muted/60">
              Ref: {reservationId.slice(0, 8)}…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
