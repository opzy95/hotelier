import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleX,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { useAdminReservations } from './AdminReservationsContext'
import { reservationBalanceDue, reservationCurrency, reservationPaidAmount } from './adminReservationsData'
import type { FolioStatus, PaymentStatus, Reservation } from './adminReservationsData'
import { getAvailableRoomsForStay } from './adminRoomsData'
import type { Room } from './adminRoomsData'

const folioOptions: FolioStatus[] = ['Confirmed', 'Checked In', 'Pending Payment', 'Cancelled', 'Checked Out']
const paymentOptions: PaymentStatus[] = ['Paid', 'Partially Paid', 'Pending', 'Refunded']
const defaultRoomOptions = ['Executive Lagoon Suite', 'Presidential Sanctuary Penthouse', 'Deluxe Lagoon Room', 'Waterfront Villa']
const today = new Date()
const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

function isUpcomingReservation(reservation: Reservation) {
  return reservation.checkIn > todayKey && ['Confirmed', 'Pending Payment'].includes(reservation.folio)
}

function inventoryTypeMatches(room: Room, roomType: string) {
  if (roomType === 'Presidential Sanctuary Penthouse') return room.type.toLowerCase().includes('presidential')
  if (roomType === 'Waterfront Villa') return room.type.toLowerCase().includes('villa')
  return room.type === roomType
}

function roomDisplayName(roomId: string | undefined, inventory: Room[]) {
  return inventory.find((room) => room.id === roomId)?.name ?? (roomId ? `Room ${roomId}` : 'Room not assigned')
}

function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 1
  const difference = new Date(`${checkOut}T12:00:00`).getTime() - new Date(`${checkIn}T12:00:00`).getTime()
  return Math.max(1, Math.ceil(difference / 86400000))
}

function shortDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function statusStyle(status: FolioStatus | PaymentStatus) {
  const styles: Record<FolioStatus | PaymentStatus, string> = {
    Confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    'Checked In': 'border-forest/20 bg-forest/10 text-forest',
    'Pending Payment': 'border-amber-200 bg-amber-50 text-amber-800',
    Cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
    'Checked Out': 'border-stone-200 bg-stone-100 text-stone-600',
    Paid: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    'Partially Paid': 'border-amber-200 bg-amber-50 text-amber-900',
    Pending: 'border-amber-200 bg-amber-50 text-amber-800',
    Refunded: 'border-stone-200 bg-stone-100 text-stone-600',
  }
  return styles[status]
}

function exportReservations(rows: Reservation[]) {
  const columns: (keyof Reservation)[] = ['reference', 'guest', 'email', 'phone', 'room', 'assignedRoomId', 'checkIn', 'checkOut', 'adults', 'children', 'amount', 'paidAmount', 'nightlyRate', 'payment', 'folio']
  const escapeValue = (value: string | number | undefined) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const content = [
    columns.join(','),
    ...rows.map((reservation) => columns.map((column) => escapeValue(reservation[column])).join(',')),
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'opzy-reservations.csv'
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function ReservationDialog({ onClose, onCreate, reservations, inventory }: {
  onClose: () => void
  onCreate: (reservation: Reservation) => void
  reservations: Reservation[]
  inventory: Room[]
}) {
  const [step, setStep] = useState(0)
  const [roomOptions] = useState(() => [...new Set([...defaultRoomOptions, ...inventory.map((item) => item.type)])])
  const [room, setRoom] = useState('Deluxe Lagoon Room')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [assignedRoomId, setAssignedRoomId] = useState('')
  const [formError, setFormError] = useState('')
  const [amountReceived, setAmountReceived] = useState('0')
  const [adults, setAdults] = useState('2')
  const [children, setChildren] = useState('0')
  const [guestName, setGuestName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const nights = nightsBetween(checkIn, checkOut)
  const availableRooms = getAvailableRoomsForStay(
    inventory,
    reservations,
    checkIn,
    checkOut,
    Number(adults) + Number(children),
    (roomItem) => inventoryTypeMatches(roomItem, room),
  )
  const selectedRoom = availableRooms.find((availableRoom) => availableRoom.id === assignedRoomId)
  const nightlyRate = selectedRoom?.rate ?? inventory.find((availableRoom) => inventoryTypeMatches(availableRoom, room))?.rate ?? 0
  const totalAmount = nightlyRate * nights
  const paidAmount = Math.min(totalAmount, Math.max(0, Number(amountReceived) || 0))
  const balanceDue = totalAmount - paidAmount
  const payment: PaymentStatus = paidAmount === 0 ? 'Pending' : paidAmount >= totalAmount ? 'Paid' : 'Partially Paid'

  function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if ((step === 0 || step === 2) && (!checkIn || !checkOut || checkOut <= checkIn)) {
      setFormError('Choose a valid check-in and check-out date. Check-out must be after check-in.')
      return
    }
    if ((step === 0 || step === 2) && !availableRooms.some((availableRoom) => availableRoom.id === assignedRoomId)) {
      setFormError('Choose an available room for the selected dates before continuing.')
      return
    }
    if (step === 2 && Number(amountReceived) > totalAmount) {
      setFormError('The amount received cannot be greater than the reservation total.')
      return
    }
    if (step < 2) {
      setFormError('')
      setStep((current) => current + 1)
      return
    }

    onCreate({
      reference: `OPZY-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      guest: guestName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      tier: '',
      room,
      assignedRoomId,
      registeredAt: new Date().toISOString().slice(0, 10),
      checkIn,
      checkOut,
      adults: Number(adults),
      children: Number(children),
      amount: totalAmount,
      paidAmount,
      nightlyRate,
      payment,
      folio: payment === 'Pending' ? 'Pending Payment' : 'Confirmed',
    })
  }

  const fieldClass = 'mt-1.5 w-full rounded-sm border border-stone-200 bg-white px-3 py-2.5 text-xs text-ink outline-none transition focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10'
  const steps = ['Stay details', 'Guest details', 'Review & confirm']

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/55" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-reservation-title"
        className="flex h-full w-full max-w-[470px] flex-col bg-paper shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div>
            <p className="text-[9px] font-semibold tracking-[0.15em] text-amber-800">NEW FOLIO REGISTRATION</p>
            <h2 id="create-reservation-title" className="mt-1 font-display text-xl text-ink">Create Reservation</h2>
            <p className="mt-1 text-[10px] text-muted">Create a new guest reservation and sanctuary allocation.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close reservation form" className="grid size-8 place-items-center rounded-sm text-muted hover:bg-stone-100 hover:text-ink">
            <X aria-hidden="true" className="size-4" />
          </button>
        </header>

        <div className="grid grid-cols-3 border-b border-stone-200 bg-white px-4 py-3">
          {steps.map((label, index) => (
            <div key={label} className={`flex items-center gap-1.5 text-[9px] ${index === step ? 'font-semibold text-amber-900' : index < step ? 'text-emerald-700' : 'text-muted'}`}>
              <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${index === step ? 'border-amber-800 bg-amber-800 text-white' : index < step ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-stone-300 bg-white'}`}>
                {index < step ? <Check aria-hidden="true" className="size-3" /> : index + 1}
              </span>
              <span className="leading-tight">{label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={submitReservation} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {step === 0 && (
              <>
                <label className="block text-[10px] font-semibold tracking-wide text-ink">
                  SELECT SANCTUARY / SUITE <span className="text-rose-600">*</span>
                  <span className="relative block">
                    <select className={fieldClass} value={room} onChange={(event) => { setRoom(event.target.value); setAssignedRoomId(''); setFormError('') }} required>
                      {roomOptions.map((option) => <option key={option}>{option}</option>)}
                    </select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                  </span>
                </label>
                <label className="block text-[10px] font-semibold tracking-wide text-ink">
                  ASSIGN ROOM <span className="text-rose-600">*</span>
                  <span className="relative block">
                    <select className={fieldClass} value={assignedRoomId} onChange={(event) => { setAssignedRoomId(event.target.value); setFormError('') }} required>
                      <option value="">Select an available room</option>
                      {availableRooms.map((availableRoom) => <option key={availableRoom.id} value={availableRoom.id}>{availableRoom.name} · Floor {availableRoom.floor}</option>)}
                    </select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                  </span>
                  <span className="mt-1 block text-[9px] font-normal normal-case tracking-normal text-muted">
                    {availableRooms.length ? `${availableRooms.length} available for these dates` : 'No rooms available for this type and date range.'}
                  </span>
                </label>
                {selectedRoom && checkIn && checkOut > checkIn && (
                  <section className="space-y-2 border border-stone-200 bg-white p-3">
                    <h3 className="text-[10px] font-semibold tracking-wide text-ink">ROOM PRICE</h3>
                    <div className="flex justify-between gap-3 text-[11px]">
                      <span className="text-muted">Nightly rate</span>
                      <strong className="text-ink">{reservationCurrency.format(selectedRoom.rate)} / night</strong>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-stone-100 pt-2 text-[11px]">
                      <span className="text-muted">Total stay · {nights} {nights === 1 ? 'night' : 'nights'}</span>
                      <strong className="text-ink">{reservationCurrency.format(selectedRoom.rate * nights)}</strong>
                    </div>
                  </section>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[10px] font-semibold tracking-wide text-ink">CHECK-IN DATE <span className="text-rose-600">*</span>
                    <input className={fieldClass} type="date" value={checkIn} min={today.toISOString().slice(0, 10)} onChange={(event) => { setCheckIn(event.target.value); setFormError('') }} required />
                  </label>
                  <label className="text-[10px] font-semibold tracking-wide text-ink">CHECK-OUT DATE <span className="text-rose-600">*</span>
                    <input className={fieldClass} type="date" value={checkOut} min={checkIn || today.toISOString().slice(0, 10)} onChange={(event) => { setCheckOut(event.target.value); setFormError('') }} required />
                  </label>
                  <label className="text-[10px] font-semibold tracking-wide text-ink">ADULTS
                    <input className={fieldClass} type="number" min="1" max="10" value={adults} onChange={(event) => setAdults(event.target.value)} required />
                  </label>
                  <label className="text-[10px] font-semibold tracking-wide text-ink">CHILDREN
                    <input className={fieldClass} type="number" min="0" max="10" value={children} onChange={(event) => setChildren(event.target.value)} />
                  </label>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <p className="text-[9px] font-semibold tracking-[0.13em] text-amber-800">PRIMARY GUEST INFORMATION</p>
                  <p className="mt-1 text-[10px] leading-5 text-muted">Add the lead guest for this reservation. Additional guests can be managed from the folio.</p>
                </div>
                <label className="block text-[10px] font-semibold tracking-wide text-ink">GUEST FULL NAME <span className="text-rose-600">*</span>
                  <input className={fieldClass} autoComplete="name" value={guestName} onChange={(event) => setGuestName(event.target.value)} required />
                </label>
                <label className="block text-[10px] font-semibold tracking-wide text-ink">TELEPHONE NUMBER <span className="text-rose-600">*</span>
                  <input className={fieldClass} type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required />
                </label>
                <label className="block text-[10px] font-semibold tracking-wide text-ink">EMAIL ADDRESS <span className="text-rose-600">*</span>
                  <input className={fieldClass} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </label>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <p className="text-[9px] font-semibold tracking-[0.13em] text-amber-800">RESERVATION SUMMARY</p>
                  <p className="mt-1 text-[10px] leading-5 text-muted">Review the stay and guest details before creating this reservation.</p>
                </div>
                <dl className="divide-y divide-stone-200 rounded-sm border border-stone-200 bg-white px-4">
                  <div className="flex justify-between gap-4 py-3 text-xs"><dt className="text-muted">Sanctuary</dt><dd className="text-right font-medium text-ink">{room}</dd></div>
                  <div className="flex justify-between gap-4 py-3 text-xs"><dt className="text-muted">Assigned room</dt><dd className="text-right font-medium text-ink">{selectedRoom?.name ?? roomDisplayName(assignedRoomId, inventory)}</dd></div>
                  <div className="flex justify-between gap-4 py-3 text-xs"><dt className="text-muted">Stay dates</dt><dd className="text-right font-medium text-ink">{shortDate(checkIn)} – {shortDate(checkOut)} · {nights} {nights === 1 ? 'night' : 'nights'}</dd></div>
                  <div className="flex justify-between gap-4 py-3 text-xs"><dt className="text-muted">Party</dt><dd className="text-right font-medium text-ink">{adults} adults, {children} children</dd></div>
                  <div className="flex justify-between gap-4 py-3 text-xs"><dt className="text-muted">Primary guest</dt><dd className="text-right font-medium text-ink">{guestName}</dd></div>
                  <div className="flex justify-between gap-4 py-3 text-xs"><dt className="text-muted">Email / telephone</dt><dd className="text-right font-medium text-ink">{email}<br />{phone}</dd></div>
                </dl>
                <section className="space-y-2 rounded-sm border border-stone-200 bg-white p-3">
                  <h3 className="text-[10px] font-semibold tracking-wide text-ink">PAYMENT RECEIVED</h3>
                  <label className="block text-[10px] text-muted">
                    Amount received (₦)
                    <input className={fieldClass} type="number" min="0" max={totalAmount} step="1" value={amountReceived} aria-invalid={Number(amountReceived) > totalAmount} onChange={(event) => { setAmountReceived(event.target.value); setFormError('') }} />
                    {Number(amountReceived) > totalAmount && <span className="mt-1 block text-[10px] font-medium text-rose-700">Amount received cannot exceed the reservation total.</span>}
                  </label>
                  <div className="flex justify-between gap-3 text-[11px]"><span className="text-muted">Total amount</span><strong className="text-ink">{reservationCurrency.format(totalAmount)}</strong></div>
                  <div className="flex justify-between gap-3 text-[11px]"><span className="text-muted">Balance due</span><strong className={`font-bold ${balanceDue ? 'text-amber-900' : 'text-emerald-800'}`}>{reservationCurrency.format(balanceDue)}</strong></div>
                  <p className="text-[9px] text-muted">Payment status: <strong className="text-ink">{payment}</strong></p>
                </section>
              </>
            )}
            {formError && <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">{formError}</p>}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-stone-200 bg-white px-5 py-4">
            {step > 0
              ? <button type="button" onClick={() => setStep((current) => current - 1)} className="inline-flex items-center gap-1.5 rounded-sm px-3 py-2 text-[10px] font-semibold text-muted hover:bg-stone-100"><ArrowLeft aria-hidden="true" className="size-3.5" /> Back</button>
              : <button type="button" onClick={onClose} className="rounded-sm px-3 py-2 text-[10px] font-semibold text-muted hover:bg-stone-100">Cancel</button>}
            <button type="submit" className="inline-flex items-center gap-2 rounded-sm bg-amber-800 px-4 py-2.5 text-[10px] font-semibold tracking-wide text-white transition-colors hover:bg-amber-900">
              {step === 2 ? 'CREATE RESERVATION' : 'CONTINUE'} <ArrowRight aria-hidden="true" className="size-3.5" />
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function ReservationDetails({ reservation, inventory, onClose }: { reservation: Reservation; inventory: Room[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="reservation-details-title" className="w-full max-w-lg rounded-sm bg-white p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-semibold tracking-[0.15em] text-amber-800">RESERVATION DETAILS</p>
            <h2 id="reservation-details-title" className="mt-1 font-display text-xl text-ink">{reservation.guest}</h2>
            <p className="mt-1 text-[10px] text-muted">{reservation.reference}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close reservation details" className="grid size-8 place-items-center rounded-sm text-muted hover:bg-stone-100"><X aria-hidden="true" className="size-4" /></button>
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-x-5 divide-y divide-stone-100 border-y border-stone-100 sm:grid-cols-2 sm:divide-y-0">
          <div className="py-3"><dt className="text-[10px] text-muted">Email</dt><dd className="mt-1 break-all text-xs text-ink">{reservation.email}</dd></div>
          <div className="py-3"><dt className="text-[10px] text-muted">Telephone</dt><dd className="mt-1 text-xs text-ink">{reservation.phone}</dd></div>
          <div className="py-3"><dt className="text-[10px] text-muted">Sanctuary / assigned room</dt><dd className="mt-1 text-xs text-ink">{reservation.room} · {roomDisplayName(reservation.assignedRoomId, inventory)}</dd></div>
          <div className="py-3"><dt className="text-[10px] text-muted">Stay dates</dt><dd className="mt-1 text-xs text-ink">{shortDate(reservation.checkIn)} – {shortDate(reservation.checkOut)}</dd></div>
          <div className="py-3"><dt className="text-[10px] text-muted">Party</dt><dd className="mt-1 text-xs text-ink">{reservation.adults} adults, {reservation.children} children</dd></div>
          <div className="py-3"><dt className="text-[10px] text-muted">Room rate per night</dt><dd className="mt-1 text-xs text-ink">{reservationCurrency.format(reservation.nightlyRate ?? Math.round(reservation.amount / nightsBetween(reservation.checkIn, reservation.checkOut)))} / night</dd></div>
          <div className="py-3"><dt className="text-[10px] text-muted">Total stay · {nightsBetween(reservation.checkIn, reservation.checkOut)} {nightsBetween(reservation.checkIn, reservation.checkOut) === 1 ? 'night' : 'nights'}</dt><dd className="mt-1 text-xs font-semibold text-ink">{reservationCurrency.format(reservation.amount)}</dd></div>
          <div className="py-3"><dt className="text-[10px] text-muted">Amount paid</dt><dd className="mt-1 text-xs text-emerald-800">{reservationCurrency.format(reservationPaidAmount(reservation))}</dd></div>
          <div className="py-3"><dt className="text-[10px] text-muted">Remaining balance</dt><dd className={`mt-1 text-xs font-bold ${reservationBalanceDue(reservation) ? 'text-amber-900' : 'text-ink'}`}>{reservationCurrency.format(reservationBalanceDue(reservation))}</dd></div>
          <div className="py-3 sm:col-span-2"><dt className="text-[10px] text-muted">Payment / folio</dt><dd className="mt-1 text-xs text-ink">{reservation.payment} / {reservation.folio}</dd></div>
        </dl>
      </section>
    </div>
  )
}

function CancelReservationDialog({ reservation, onClose, onConfirm }: {
  reservation: Reservation
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="cancel-reservation-title" className="w-full max-w-sm border border-stone-200 bg-white p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <CircleAlert aria-hidden="true" className="size-6 text-amber-800" />
        <h2 id="cancel-reservation-title" className="mt-3 font-display text-xl text-ink">Cancel reservation?</h2>
        <p className="mt-2 text-xs leading-5 text-muted">Cancel {reservation.guest}&apos;s reservation for {shortDate(reservation.checkIn)} – {shortDate(reservation.checkOut)}. The room will be released if no other active folio uses it. Any refund should be recorded separately.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="border border-stone-300 px-3 py-2 text-[10px] font-semibold text-ink hover:bg-stone-50">Keep Reservation</button>
          <button type="button" onClick={onConfirm} className="bg-rose-700 px-3 py-2 text-[10px] font-semibold text-white hover:bg-rose-800">Cancel Reservation</button>
        </div>
      </section>
    </div>
  )
}

export function AdminReservations() {
  const { reservations: rows, setReservations, rooms, setRooms } = useAdminReservations()
  const [search, setSearch] = useState('')
  const [folioFilter, setFolioFilter] = useState('All folio statuses')
  const [paymentFilter, setPaymentFilter] = useState('All payment statuses')
  const [dateFilter, setDateFilter] = useState('Any check-in date')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null)
  const rowsPerPage = 5

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter((reservation) => {
      const matchesQuery = !query || [reservation.reference, reservation.guest, reservation.email, reservation.room]
        .some((value) => value.toLowerCase().includes(query))
      const matchesFolio = folioFilter === 'All folio statuses'
        || (folioFilter === 'Upcoming' ? isUpcomingReservation(reservation) : reservation.folio === folioFilter)
      const matchesPayment = paymentFilter === 'All payment statuses' || reservation.payment === paymentFilter
      const date = new Date(`${reservation.checkIn}T12:00:00`)
      const matchesDate = dateFilter === 'Any check-in date'
        || (dateFilter === 'This month' && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear())
        || (dateFilter === 'Next month' && date.getMonth() === (today.getMonth() + 1) % 12 && date.getFullYear() === today.getFullYear() + (today.getMonth() === 11 ? 1 : 0))
      return matchesQuery && matchesFolio && matchesPayment && matchesDate
    })
  }, [dateFilter, folioFilter, paymentFilter, rows, search])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const visibleRows = filteredRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const upcomingCount = rows.filter(isUpcomingReservation).length
  const pendingReservations = rows.filter((row) => row.payment === 'Pending' || row.payment === 'Partially Paid')
  const cancelledCount = rows.filter((row) => row.folio === 'Cancelled').length
  const checkedInCount = rows.filter((row) => row.folio === 'Checked In').length
  const pendingAmount = pendingReservations.reduce((total, row) => total + reservationBalanceDue(row), 0)
  const cancelledPercentage = rows.length ? ((cancelledCount / rows.length) * 100).toFixed(1) : '0.0'
  function clearFilters() {
    setSearch('')
    setFolioFilter('All folio statuses')
    setPaymentFilter('All payment statuses')
    setDateFilter('Any check-in date')
    setPage(1)
  }

  function createReservation(reservation: Reservation) {
    setReservations((current) => [reservation, ...current])
    setPage(1)
    setSearch('')
    setCreateOpen(false)
  }

  function cancelReservation() {
    if (!reservationToCancel) return
    const cancelled = reservationToCancel
    const remainingRoomReservations = rows.filter((reservation) => (
      reservation.reference !== cancelled.reference
      && reservation.assignedRoomId === cancelled.assignedRoomId
      && !['Cancelled', 'Checked Out'].includes(reservation.folio)
    ))
    const linkedReservation = remainingRoomReservations.find((reservation) => reservation.folio === 'Checked In')
      ?? remainingRoomReservations[0]

    setReservations((current) => current.map((reservation) => reservation.reference === cancelled.reference
      ? { ...reservation, folio: 'Cancelled' }
      : reservation))
    if (cancelled.assignedRoomId) {
      setRooms((current) => current.map((room) => {
        if (room.id !== cancelled.assignedRoomId) return room
        const status = linkedReservation
          ? linkedReservation.folio === 'Checked In' ? 'Occupied' : 'Reserved'
          : ['Cleaning', 'Maintenance'].includes(room.status) ? room.status : 'Available'
        return { ...room, status, guest: linkedReservation?.guest, note: linkedReservation?.reference }
      }))
    }
    setSelectedReservation(null)
    setReservationToCancel(null)
  }

  const selectClass = 'w-full appearance-none rounded-sm border border-stone-200 bg-white py-2.5 pl-3 pr-8 text-[10px] text-ink outline-none focus:border-amber-800'

  return (
    <section className="mx-auto max-w-[1600px]">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <p className="text-[9px] font-semibold tracking-[0.15em] text-amber-800">FOLIO REGISTRY &amp; CONCIERGE AUDIT</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => exportReservations(filteredRows)} className="inline-flex items-center justify-center gap-2 rounded-sm border border-stone-300 bg-white px-3 py-2 text-[10px] font-semibold tracking-wide text-ink hover:bg-stone-50">
            <ArrowDownToLine aria-hidden="true" className="size-3.5" /> EXPORT FOLIO (CSV)
          </button>
          <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-sm bg-forest px-3 py-2 text-[10px] font-semibold tracking-wide text-white hover:bg-forest-deep">
            <Plus aria-hidden="true" className="size-3.5" /> CREATE RESERVATION
          </button>
        </div>
      </div>

      <header className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink sm:text-3xl">Reservations</h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">Manage, monitor and update all hotel reservations across Lagoon suites and waterfront sanctuaries.</p>
        </div>
        <span className="inline-flex items-center gap-2 self-start rounded-sm border border-stone-200 bg-white px-3 py-2 text-[10px] text-muted lg:self-auto"><i className="size-1.5 rounded-full bg-emerald-500" /> <strong className="text-ink">84.6%</strong> Occupancy</span>
      </header>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <article className="relative rounded-sm border border-stone-200/80 bg-white p-4 shadow-sm">
          <span className="text-[9px] font-semibold tracking-[0.12em] text-muted">TOTAL RESERVATIONS</span>
          <CalendarDays aria-hidden="true" className="absolute right-4 top-4 size-8 rounded-sm bg-paper p-2 text-muted" />
          <strong className="mt-2 block font-display text-2xl text-ink">{rows.length}</strong>
          <p className="mt-1 text-[10px] text-muted">Reservations currently available</p>
        </article>
        <article className="relative rounded-sm border border-stone-200/80 bg-white p-4 shadow-sm">
          <span className="text-[9px] font-semibold tracking-[0.12em] text-muted">CONFIRMED</span>
          <CircleCheck aria-hidden="true" className="absolute right-4 top-4 size-8 rounded-sm bg-emerald-50 p-2 text-emerald-700" />
          <strong className="mt-2 block font-display text-2xl text-ink">{upcomingCount}</strong>
          <p className="mt-1 text-[10px] text-muted">Confirmed stays with future check-in dates</p>
        </article>
        <article className="relative rounded-sm border border-stone-200/80 bg-white p-4 shadow-sm">
          <span className="text-[9px] font-semibold tracking-[0.12em] text-muted">PENDING PAYMENT</span>
          <CircleAlert aria-hidden="true" className="absolute right-4 top-4 size-8 rounded-sm bg-amber-50 p-2 text-amber-700" />
          <strong className="mt-2 block font-display text-2xl text-ink">{pendingReservations.length}</strong>
          <p className="mt-1 text-[10px] text-muted"><b className="font-semibold text-amber-800">{reservationCurrency.format(pendingAmount)}</b> outstanding balance</p>
        </article>
        <article className="relative rounded-sm border border-stone-200/80 bg-white p-4 shadow-sm">
          <span className="text-[9px] font-semibold tracking-[0.12em] text-muted">CANCELLED</span>
          <CircleX aria-hidden="true" className="absolute right-4 top-4 size-8 rounded-sm bg-rose-50 p-2 text-rose-700" />
          <strong className="mt-2 block font-display text-2xl text-ink">{cancelledCount} <small className="font-body text-xs text-rose-700">{cancelledPercentage}%</small></strong>
          <p className="mt-1 text-[10px] text-muted">{checkedInCount} guests currently checked in</p>
        </article>
      </div>

      <section aria-label="Filter reservations" className="mb-4 rounded-sm border border-stone-200/80 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(190px,1.4fr)_repeat(3,minmax(145px,1fr))_auto]">
          <label className="flex items-center gap-2 rounded-sm border border-stone-200 px-3">
            <Search aria-hidden="true" className="size-3.5 shrink-0 text-muted" />
            <span className="sr-only">Search reservations</span>
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search by booking, guest or room" className="min-w-0 flex-1 py-2.5 text-[10px] outline-none placeholder:text-muted/70" />
          </label>
          <label className="relative">
            <span className="sr-only">Filter by folio status</span>
            <select className={selectClass} value={folioFilter} onChange={(event) => { setFolioFilter(event.target.value); setPage(1) }}>
              <option>All folio statuses</option><option>Upcoming</option>{folioOptions.map((status) => <option key={status}>{status}</option>)}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 text-muted" />
          </label>
          <label className="relative">
            <span className="sr-only">Filter by payment status</span>
            <select className={selectClass} value={paymentFilter} onChange={(event) => { setPaymentFilter(event.target.value); setPage(1) }}>
              <option>All payment statuses</option>{paymentOptions.map((status) => <option key={status}>{status}</option>)}
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 text-muted" />
          </label>
          <label className="relative">
            <span className="sr-only">Filter check-in date</span>
            <select className={selectClass} value={dateFilter} onChange={(event) => { setDateFilter(event.target.value); setPage(1) }}>
              <option>Any check-in date</option><option>This month</option><option>Next month</option>
            </select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 text-muted" />
          </label>
          <button type="button" onClick={clearFilters} className="inline-flex items-center justify-center gap-1.5 rounded-sm px-3 py-2 text-[9px] font-semibold tracking-wide text-muted hover:bg-stone-50 hover:text-ink">
            <SlidersHorizontal aria-hidden="true" className="size-3.5" /> CLEAR FILTERS
          </button>
        </div>
      </section>

      <div className="overflow-hidden rounded-sm border border-stone-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left text-[12px]">
            <thead className="bg-stone-50 text-[11px] tracking-wide text-muted">
              <tr>
                <th scope="col" className="px-3 py-3 font-semibold">BOOKING REFERENCE</th>
                <th scope="col" className="px-3 py-3 font-semibold">GUEST &amp; DETAILS</th>
                <th scope="col" className="px-3 py-3 font-semibold">SANCTUARY</th>
                <th scope="col" className="px-3 py-3 font-semibold">DATES &amp; NIGHTS</th>
                <th scope="col" className="px-3 py-3 font-semibold">PARTY</th>
                <th scope="col" className="px-3 py-3 font-semibold">TOTAL AMOUNT</th>
                <th scope="col" className="px-3 py-3 font-semibold">PAYMENT</th>
                <th scope="col" className="px-3 py-3 font-semibold">FOLIO STATUS</th>
                <th scope="col" className="px-3 py-3 font-semibold">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {visibleRows.map((reservation) => (
                <tr key={reservation.reference} className="align-top text-muted hover:bg-paper/60">
                  <td className="px-3 py-3"><strong className="block whitespace-nowrap text-[11px] text-ink">{reservation.reference}</strong><small className="mt-1 block text-[10px]">Direct · Web channel</small></td>
                  <td className="px-3 py-3"><strong className="block whitespace-nowrap font-medium text-ink">{reservation.guest}</strong><small className="mt-1 block text-[10px]">{reservation.email}</small>{reservation.tier && <span className="mt-1 inline-block rounded-sm bg-champagne/40 px-1.5 py-0.5 text-[9px] font-semibold text-amber-950">{reservation.tier}</span>}</td>
                  <td className="px-3 py-3"><span className="block max-w-[145px] text-ink">{reservation.room}</span><small className="mt-1 block text-[10px]">{roomDisplayName(reservation.assignedRoomId, rooms)}</small></td>
                  <td className="whitespace-nowrap px-3 py-3"><strong className="font-medium text-ink">{shortDate(reservation.checkIn)} – {shortDate(reservation.checkOut)}</strong>{isUpcomingReservation(reservation) && <span className="mt-1 block w-fit border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[9px] font-semibold text-sky-800">Upcoming</span>}<small className="mt-1 block text-[10px]">{nightsBetween(reservation.checkIn, reservation.checkOut)} nights</small></td>
                  <td className="whitespace-nowrap px-3 py-3"><strong className="block font-medium text-ink">{reservation.adults} {reservation.adults === 1 ? 'Adult' : 'Adults'}</strong><small className="mt-1 block text-[10px]">{reservation.children} {reservation.children === 1 ? 'Child' : 'Children'}</small></td>
                  <td className="whitespace-nowrap px-3 py-3"><strong className="font-medium text-ink">{reservationCurrency.format(reservation.amount)}</strong><small className="mt-1 block text-[10px]">{reservation.payment === 'Pending' ? 'Awaiting payment' : reservation.payment === 'Partially Paid' ? `Paid ${reservationCurrency.format(reservationPaidAmount(reservation))} · Due ${reservationCurrency.format(reservationBalanceDue(reservation))}` : 'Settlement recorded'}</small></td>
                  <td className="px-3 py-3"><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium ${statusStyle(reservation.payment)}`}>{reservation.payment}</span></td>
                  <td className="px-3 py-3"><span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium ${statusStyle(reservation.folio)}`}>{reservation.folio}</span></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => setSelectedReservation(reservation)} className="rounded-sm border border-stone-200 px-2 py-1 text-[10px] font-medium text-ink hover:border-forest hover:text-forest">View</button>
                      {['Confirmed', 'Pending Payment'].includes(reservation.folio) && <button type="button" onClick={() => setReservationToCancel(reservation)} className="rounded-sm border border-rose-200 px-2 py-1 text-[10px] font-medium text-rose-700 hover:bg-rose-50">Cancel</button>}
                    </div>
                  </td>
                </tr>
              ))}
              {visibleRows.length === 0 && <tr><td className="px-4 py-10 text-center text-xs text-muted" colSpan={9}>No reservations match these filters. Try changing your search or clearing the filters.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-stone-100 px-4 py-3 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Showing <strong className="text-ink">{filteredRows.length ? (currentPage - 1) * rowsPerPage + 1 : 0}–{Math.min(currentPage * rowsPerPage, filteredRows.length)}</strong> of <strong className="text-ink">{filteredRows.length}</strong> reservations</p>
          <nav aria-label="Reservation pages" className="flex items-center gap-1">
            <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Previous page" className="grid size-7 place-items-center rounded-sm border border-stone-200 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"><ArrowLeft aria-hidden="true" className="size-3.5" /></button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} aria-current={pageNumber === currentPage ? 'page' : undefined} className={`grid size-7 place-items-center rounded-sm text-[10px] ${pageNumber === currentPage ? 'bg-forest text-white' : 'border border-stone-200 hover:bg-stone-50'}`}>{pageNumber}</button>
            ))}
            <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Next page" className="grid size-7 place-items-center rounded-sm border border-stone-200 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"><ArrowRight aria-hidden="true" className="size-3.5" /></button>
          </nav>
        </div>
      </div>

      <div className="sr-only" aria-live="polite">Showing {visibleRows.length} reservations</div>
      {createOpen && <ReservationDialog onClose={() => setCreateOpen(false)} onCreate={createReservation} reservations={rows} inventory={rooms} />}
      {selectedReservation && <ReservationDetails reservation={selectedReservation} inventory={rooms} onClose={() => setSelectedReservation(null)} />}
      {reservationToCancel && <CancelReservationDialog reservation={reservationToCancel} onClose={() => setReservationToCancel(null)} onConfirm={cancelReservation} />}
    </section>
  )
}
