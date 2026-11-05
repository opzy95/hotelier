export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Pending' | 'Refunded'
export type FolioStatus = 'Confirmed' | 'Checked In' | 'Pending Payment' | 'Cancelled' | 'Checked Out'

export type Reservation = {
  reference: string
  guest: string
  email: string
  phone: string
  tier: string
  room: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  amount: number
  paidAmount?: number
  nightlyRate?: number
  payment: PaymentStatus
  folio: FolioStatus
}

export const initialReservations: Reservation[] = [
  { reference: 'OPZY-2026-00128', guest: 'Chief Adeboye Adebayo', email: 'adeboye.adebayo@example.com', phone: '+234 802 123 4567', tier: 'VIP Butler', room: 'Executive Lagoon Suite', checkIn: '2026-11-04', checkOut: '2026-11-08', adults: 2, children: 0, amount: 2480000, payment: 'Paid', folio: 'Confirmed' },
  { reference: 'OPZY-2026-00126', guest: 'Dr. Folashade Akinja', email: 'folashade.akinja@example.com', phone: '+234 809 234 5678', tier: 'Titanium', room: 'Presidential Sanctuary Penthouse', checkIn: '2026-11-05', checkOut: '2026-11-10', adults: 3, children: 1, amount: 5800000, payment: 'Paid', folio: 'Checked In' },
  { reference: 'OPZY-2026-00117', guest: 'Lord Stephen Kensington', email: 's.kensington@example.co.uk', phone: '+44 20 7946 0101', tier: '', room: 'Deluxe Lagoon Room', checkIn: '2026-11-06', checkOut: '2026-11-09', adults: 1, children: 0, amount: 1520000, payment: 'Pending', folio: 'Pending Payment' },
  { reference: 'OPZY-2026-00111', guest: 'Ambassador Kweku Mensah', email: 'k.mensah@example.com', phone: '+233 24 123 4567', tier: 'VIP Butler', room: 'Waterfront Villa', checkIn: '2026-11-07', checkOut: '2026-11-12', adults: 4, children: 2, amount: 8940000, payment: 'Paid', folio: 'Confirmed' },
  { reference: 'OPZY-2026-00129', guest: 'Oluwaseun Daramola', email: 'seun.daramola@example.com', phone: '+234 818 900 1205', tier: '', room: 'Deluxe Lagoon Room', checkIn: '2026-11-08', checkOut: '2026-11-10', adults: 2, children: 0, amount: 1120000, payment: 'Paid', folio: 'Checked Out' },
  { reference: 'OPZY-2026-00130', guest: 'Marcella Van Der Bilt', email: 'm.vanderbilt@example.com', phone: '+1 212 555 0145', tier: '', room: 'Executive Lagoon Suite', checkIn: '2026-11-08', checkOut: '2026-11-11', adults: 1, children: 0, amount: 1860000, payment: 'Refunded', folio: 'Cancelled' },
  { reference: 'OPZY-2026-00131', guest: 'Alhaji Sanusi Dantata', email: 's.dantata@example.com', phone: '+234 803 810 8899', tier: 'VIP Butler', room: 'Presidential Sanctuary Penthouse', checkIn: '2026-11-09', checkOut: '2026-11-13', adults: 2, children: 0, amount: 6960000, payment: 'Paid', folio: 'Confirmed' },
  { reference: 'OPZY-2026-00132', guest: 'Amara Okafor', email: 'amara.okafor@example.com', phone: '+234 701 456 7890', tier: '', room: 'Waterfront Villa', checkIn: '2026-11-12', checkOut: '2026-11-15', adults: 2, children: 1, amount: 5340000, payment: 'Paid', folio: 'Confirmed' },
]

export const reservationCurrency = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

export function reservationPaidAmount(reservation: Reservation) {
  return reservation.paidAmount ?? (reservation.payment === 'Paid' ? reservation.amount : 0)
}

export function reservationBalanceDue(reservation: Reservation) {
  return Math.max(0, reservation.amount - reservationPaidAmount(reservation))
}

export function formatReservationDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  })
}
