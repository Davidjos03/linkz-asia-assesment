import { useState, useCallback } from 'react';
import { api, type Seat, type Reservation } from '../api';

export function useReservation() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);

  const fetchSeats = useCallback(async () => {
    setLoading(true);
    try {
      const { seats: data } = await api.getSeats();
      setSeats(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectSeat = async (seatId: number) => {
    const { reservation } = await api.startReservation(seatId);
    setActiveReservation(reservation);
    return reservation;
  };

  const pollReservation = async (id: string, maxAttempts = 30): Promise<Reservation> => {
    for (let i = 0; i < maxAttempts; i++) {
      const { reservation } = await api.getReservation(id);
      if (reservation.status !== 'pending_payment') {
        setActiveReservation(reservation);
        return reservation;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error('Payment status polling timed out');
  };

  const pay = async (reservationId: string, cardNumber: string) => {
    const result = await api.mockPayment(reservationId, cardNumber.replace(/\s/g, ''));
    if (result.reservation) {
      setActiveReservation(result.reservation);
    }
    await fetchSeats();
    return result;
  };

  return {
    seats,
    loading,
    activeReservation,
    fetchSeats,
    selectSeat,
    pollReservation,
    pay,
    setActiveReservation,
  };
}
