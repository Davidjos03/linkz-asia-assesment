import type { Seat } from '../api';

interface SeatMapProps {
  seats: Seat[];
  loading: boolean;
  onSelectSeat: (seatId: number) => void;
  disabled?: boolean;
}

const statusStyles: Record<Seat['status'], string> = {
  available:
    'border-linkz-green/50 bg-linkz-green/10 hover:bg-linkz-green/20 hover:border-linkz-green cursor-pointer',
  reserved: 'border-red-500/40 bg-red-500/10 cursor-not-allowed opacity-60',
  pending: 'border-amber-500/40 bg-amber-500/10 cursor-not-allowed opacity-70',
};

const statusLabels: Record<Seat['status'], string> = {
  available: 'Available',
  reserved: 'Reserved',
  pending: 'Pending payment',
};

export function SeatMap({ seats, loading, onSelectSeat, disabled }: SeatMapProps) {
  if (loading && seats.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-muted animate-pulse-soft">
        Loading seats…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Select a seat</h2>
        <p className="mt-1 text-sm text-muted">Three seats available — choose one to reserve.</p>
      </div>

      <div className="rounded-xl border border-border bg-surface-elevated p-8">
        <div className="mb-6 text-center text-xs uppercase tracking-widest text-muted">
          Row A — Front
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {seats.map((seat) => (
            <button
              key={seat.id}
              type="button"
              disabled={disabled || seat.status !== 'available'}
              onClick={() => onSelectSeat(seat.id)}
              className={`flex h-24 w-24 flex-col items-center justify-center rounded-xl border-2 transition ${statusStyles[seat.status]} disabled:cursor-not-allowed`}
            >
              <span className="text-lg font-bold">A{seat.col}</span>
              <span className="mt-1 text-[10px] uppercase tracking-wide text-muted">
                {statusLabels[seat.status]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border-2 border-linkz-green/50 bg-linkz-green/10" />
          Available
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border-2 border-amber-500/40 bg-amber-500/10" />
          Pending
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border-2 border-red-500/40 bg-red-500/10" />
          Reserved
        </span>
      </div>
    </div>
  );
}
