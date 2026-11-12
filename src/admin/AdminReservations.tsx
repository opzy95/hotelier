import { useEffect, useMemo, useState } from 'react'
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
import { currencyMinorUnitScale, reservationBalanceDue, reservationPaidAmount } from './adminReservationsData'
import type { FolioStatus, PaymentStatus, Reservation } from './adminReservationsData'
import { createPaymentIdempotencyKey, createReservation as createReservationRequest, fetchReservationAvailability, fetchReservations, fetchReservationPayments, recordReservationPayment, updateReservationStatus } from './adminReservationsApi'
import type { PaymentMethod, ReservationAvailability, ReservationDraft, ReservationPayment, ReservationPaymentRecord } from './adminReservationsApi'
import type { Room, RoomType } from './adminRoomsData'

const folioOptions: FolioStatus[] = ['Confirmed', 'Checked In', 'Pending Payment', 'Cancelled', 'Checked Out', 'No Show']
const paymentOptions: PaymentStatus[] = ['Paid', 'Partially Paid', 'Pending', 'Refunded']
const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'other', label: 'Other' },
]
const today = new Date()
const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
const rowsPerPage = 5

function formatAmount(amount: number, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

function reservationStatusFilter(value: string) {
  const statuses: Record<string, string> = {
    Confirmed: 'confirmed',
    'Checked In': 'checked_in',
    Cancelled: 'cancelled',
    'Checked Out': 'checked_out',
    'No Show': 'no_show',
  }
  return statuses[value]
}

function checkInDateRange(value: string) {
  const monthOffset = value === 'Next month' ? 1 : 0
  const start = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  const end = new Date(today.getFullYear(), today.getMonth() + monthOffset + 1, 0)
  const dateValue = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return { checkInFrom: dateValue(start), checkInTo: dateValue(end) }
}

function isUpcomingReservation(reservation: Reservation) {
  return reservation.checkIn > todayKey && ['Confirmed', 'Pending Payment'].includes(reservation.folio)
}

function roomDisplayName(roomId: string | undefined, inventory: Room[], assignedRoomName?: string) {
  return inventory.find((room) => room.id === roomId)?.name ?? assignedRoomName ?? (roomId ? `Room ${roomId}` : 'Room not assigned')
}

function nightsBetween(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut) return 1
  const difference = new Date(`${checkOut}T12:00:00`).getTime() - new Date(`${checkIn}T12:00:00`).getTime()
  return Math.max(1, Math.ceil(difference / 86400000))
}

function shortDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function formatPaymentDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function paymentMethodLabel(method: PaymentMethod) {
  return paymentMethods.find((option) => option.value === method)?.label ?? method
}

function statusStyle(status: FolioStatus | PaymentStatus) {
  const styles: Record<FolioStatus | PaymentStatus, string> = {
    Confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    'Checked In': 'border-forest/20 bg-forest/10 text-forest',
    'Pending Payment': 'border-amber-200 bg-amber-50 text-amber-800',
    Cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
    'Checked Out': 'border-stone-200 bg-stone-100 text-stone-600',
    'No Show': 'border-rose-200 bg-rose-50 text-rose-700',
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

function ReservationDialog({ onClose, onCreate, hotelId, inventory, roomTypes, roomLoading, roomError }: {
  onClose: () => void
  onCreate: (reservation: ReservationDraft, initialPayment?: ReservationPayment) => Promise<Reservation>
  hotelId: string
  inventory: Room[]
  roomTypes: RoomType[]
  roomLoading: boolean
  roomError: string
}) {
  const [step, setStep] = useState(0)
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [assignedRoomId, setAssignedRoomId] = useState('')
  const [formError, setFormError] = useState('')
  const [adults, setAdults] = useState('2')
  const [children, setChildren] = useState('0')
  const [guestName, setGuestName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [initialPaymentAmount, setInitialPaymentAmount] = useState('')
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<PaymentMethod>('cash')
  const [initialPaymentIdempotencyKey, setInitialPaymentIdempotencyKey] = useState(createPaymentIdempotencyKey)
  const [saving, setSaving] = useState(false)
  const [availabilityState, setAvailabilityState] = useState<{
    queryKey: string
    result?: ReservationAvailability
    error?: string
  }>({ queryKey: '' })
  const nights = nightsBetween(checkIn, checkOut)
  const activeRoomTypes = roomTypes.filter((roomType) => roomType.active)
  const selectedRoomType = activeRoomTypes.find((roomType) => roomType.id === selectedRoomTypeId) ?? activeRoomTypes[0]
  const hasValidStay = Boolean(checkIn && checkOut > checkIn)
  const roomTypeId = selectedRoomType?.id ?? ''
  const availabilityQueryKey = [hotelId, checkIn, checkOut, roomTypeId, adults, children].join('|')
  const hasCurrentAvailability = availabilityState.queryKey === availabilityQueryKey
  const availability = hasCurrentAvailability ? availabilityState.result : undefined
  const availabilityError = hasCurrentAvailability
    ? availabilityState.error ?? ''
    : hasValidStay && !hotelId ? 'Select a hotel to check room availability.' : ''
  const availabilityLoading = hasValidStay && Boolean(roomTypeId) && !availabilityError && !availability
  const availableRooms = availability?.availableRooms ?? []
  const selectedRoom = availableRooms.find((availableRoom) => availableRoom.id === assignedRoomId)
  const selectedRoomInventory = inventory.find((room) => room.id === assignedRoomId)
  const currency = availability?.pricing.currency ?? selectedRoomInventory?.currency ?? selectedRoomType?.currency ?? 'NGN'
  const minorUnitScale = currencyMinorUnitScale(currency)
  const nightlyRate = availability ? availability.pricing.rateMinorPerNight / minorUnitScale : 0
  const totalAmount = availability ? availability.pricing.totalMinor / minorUnitScale : 0

  useEffect(() => {
    if (!hotelId || !roomTypeId || !hasValidStay) return

    let cancelled = false
    void fetchReservationAvailability(hotelId, {
      checkIn,
      checkOut,
      roomTypeId,
      adults: Number(adults),
      children: Number(children),
    })
      .then((result) => {
        if (!cancelled) setAvailabilityState({ queryKey: availabilityQueryKey, result })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setAvailabilityState({
            queryKey: availabilityQueryKey,
            error: error instanceof Error ? error.message : 'Could not check room availability.',
          })
        }
      })

    return () => { cancelled = true }
  }, [adults, availabilityQueryKey, checkIn, checkOut, children, hasValidStay, hotelId, roomTypeId])

  async function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if ((step === 0 || step === 2) && (!checkIn || !checkOut || checkOut <= checkIn)) {
      setFormError('Choose a valid check-in and check-out date. Check-out must be after check-in.')
      return
    }
    if ((step === 0 || step === 2) && (!selectedRoomType || !availableRooms.some((availableRoom) => availableRoom.id === assignedRoomId))) {
      setFormError('Choose a room type and an available room for the selected guest count.')
      return
    }
    if (step === 2 && initialPaymentAmount) {
      const amount = Number(initialPaymentAmount)
      if (!Number.isFinite(amount) || amount <= 0 || amount > totalAmount) {
        setFormError(`Enter an initial payment greater than zero and no more than the estimated total of ${formatAmount(totalAmount, currency)}.`)
        return
      }
    }
    if (step < 2) {
      setFormError('')
      setStep((current) => current + 1)
      return
    }

    if (!roomTypeId) {
      setFormError('The selected sanctuary is missing its room type ID. Refresh room inventory and try again.')
      return
    }

    setSaving(true)
    setFormError('')
    try {
      const initialPayment = initialPaymentAmount
        ? {
          amountMinor: Math.round(Number(initialPaymentAmount) * minorUnitScale),
          method: initialPaymentMethod,
          idempotencyKey: initialPaymentIdempotencyKey,
        }
        : undefined
      await onCreate({
        checkIn,
        checkOut,
        roomTypeId,
        ...(assignedRoomId ? { assignedRoomId } : {}),
        guestName: guestName.trim(),
        guestEmail: email.trim(),
        guestPhone: phone.trim(),
        adults: Number(adults),
        children: Number(children),
      }, initialPayment)
      onClose()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not create the reservation.')
    } finally {
      setSaving(false)
    }
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
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-[10px] font-semibold tracking-wide text-ink">CHECK-IN DATE <span className="text-rose-600">*</span>
                    <input className={fieldClass} type="date" value={checkIn} min={today.toISOString().slice(0, 10)} onChange={(event) => { setCheckIn(event.target.value); setAssignedRoomId(''); setFormError('') }} required />
                  </label>
                  <label className="text-[10px] font-semibold tracking-wide text-ink">CHECK-OUT DATE <span className="text-rose-600">*</span>
                    <input className={fieldClass} type="date" value={checkOut} min={checkIn || today.toISOString().slice(0, 10)} onChange={(event) => { setCheckOut(event.target.value); setAssignedRoomId(''); setFormError('') }} required />
                  </label>
                  <label className="text-[10px] font-semibold tracking-wide text-ink">ADULTS
                    <input className={fieldClass} type="number" min="1" max="10" value={adults} onChange={(event) => { setAdults(event.target.value); setAssignedRoomId('') }} required />
                  </label>
                  <label className="text-[10px] font-semibold tracking-wide text-ink">CHILDREN
                    <input className={fieldClass} type="number" min="0" max="10" value={children} onChange={(event) => { setChildren(event.target.value); setAssignedRoomId('') }} />
                  </label>
                </div>
                <label className="block text-[10px] font-semibold tracking-wide text-ink">
                  ROOM CATEGORY <span className="text-rose-600">*</span>
                  <span className="relative block">
                    <select className={fieldClass} value={selectedRoomType?.id ?? ''} disabled={roomLoading || activeRoomTypes.length === 0} onChange={(event) => { setSelectedRoomTypeId(event.target.value); setAssignedRoomId(''); setFormError('') }} required>
                      {roomLoading && <option value="">Loading room categories…</option>}
                      {!roomLoading && activeRoomTypes.length === 0 && <option value="">No active room categories</option>}
                      {activeRoomTypes.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                    </select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                  </span>
                </label>
                <label className="block text-[10px] font-semibold tracking-wide text-ink">
                  ROOM <span className="text-rose-600">*</span>
                  <span className="relative block">
                    <select className={fieldClass} value={assignedRoomId} disabled={roomLoading || availabilityLoading || !hasValidStay || Boolean(availabilityError) || availableRooms.length === 0} onChange={(event) => { setAssignedRoomId(event.target.value); setFormError('') }} required>
                      <option value="">
                        {roomLoading ? 'Loading rooms…'
                          : !hasValidStay ? 'Choose dates to check availability'
                            : availabilityLoading ? 'Checking availability…'
                              : availabilityError ? 'Availability could not be checked'
                                : availableRooms.length ? 'Select an available room' : 'No rooms available for these dates'}
                      </option>
                      {availableRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {inventory.find((item) => item.id === room.id)?.name ?? room.code}
                        </option>
                      ))}
                    </select>
                    <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
                  </span>
                  <span className="mt-1 block text-[9px] font-normal normal-case tracking-normal text-muted">
                    {roomError || availabilityError || (availabilityLoading
                      ? 'Checking the database for rooms available for these dates…'
                      : availability
                        ? `${availableRooms.length} room${availableRooms.length === 1 ? '' : 's'} available for these dates. The server checks availability again when you save.`
                        : 'Choose the stay dates and guest count to check database availability.')}
                  </span>
                </label>
                {(roomError || availabilityError) && <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] text-rose-800">{roomError || availabilityError}</p>}
                {selectedRoom && availability && (
                  <section className="space-y-2 border border-stone-200 bg-white p-3">
                    <h3 className="text-[10px] font-semibold tracking-wide text-ink">ROOM PRICE</h3>
                    <div className="flex justify-between gap-3 text-[11px]">
                      <span className="text-muted">Nightly rate</span>
                      <strong className="text-ink">{formatAmount(nightlyRate, currency)} / night</strong>
                    </div>
                    <div className="flex justify-between gap-3 border-t border-stone-100 pt-2 text-[11px]">
                      <span className="text-muted">Estimated total · {nights} {nights === 1 ? 'night' : 'nights'}</span>
                      <strong className="text-ink">{formatAmount(totalAmount, currency)}</strong>
                    </div>
                  </section>
                )}
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
                  <div className="flex justify-between gap-4 py-3 text-xs"><dt className="text-muted">Sanctuary</dt><dd className="text-right font-medium text-ink">{selectedRoomType?.name ?? 'No category selected'}</dd></div>
                  <div className="flex justify-between gap-4 py-3 text-xs"><dt className="text-muted">Assigned room</dt><dd className="text-right font-medium text-ink">{selectedRoomInventory?.name ?? selectedRoom?.code ?? roomDisplayName(assignedRoomId, inventory)}</dd></div>
                  <div className="flex justify-between gap-4 py-3 text-xs"><dt className="text-muted">Stay dates</dt><dd className="text-right font-medium text-ink">{shortDate(checkIn)} – {shortDate(checkOut)} · {nights} {nights === 1 ? 'night' : 'nights'}</dd></div>
                  <div className="flex justify-between gap-4 py-3 text-xs"><dt className="text-muted">Party</dt><dd className="text-right font-medium text-ink">{adults} adults, {children} children</dd></div>
                  <div className="flex justify-between gap-4 py-3 text-xs"><dt className="text-muted">Primary guest</dt><dd className="text-right font-medium text-ink">{guestName}</dd></div>
                  <div className="flex justify-between gap-4 py-3 text-xs"><dt className="text-muted">Email / telephone</dt><dd className="text-right font-medium text-ink">{email}<br />{phone}</dd></div>
                </dl>
                <section className="space-y-2 rounded-sm border border-stone-200 bg-white p-3">
                  <h3 className="text-[10px] font-semibold tracking-wide text-ink">ESTIMATED PRICE</h3>
                  <div className="flex justify-between gap-3 text-[11px]"><span className="text-muted">Estimated total</span><strong className="text-ink">{formatAmount(totalAmount, currency)}</strong></div>
                  <p className="text-[9px] text-muted">The server confirms availability and calculates the saved reservation price.</p>
                </section>
                <section className="space-y-3 rounded-sm border border-stone-200 bg-white p-3">
                  <div>
                    <h3 className="text-[10px] font-semibold tracking-wide text-ink">PAYMENT · OPTIONAL</h3>
                    <p className="mt-1 text-[9px] text-muted">Record a full or partial payment now, or leave the amount blank to collect it later.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-[10px] font-semibold tracking-wide text-ink">AMOUNT RECEIVED
                      <input className={fieldClass} type="number" min="0" max={totalAmount} step={1 / minorUnitScale} value={initialPaymentAmount} onChange={(event) => { setInitialPaymentAmount(event.target.value); setInitialPaymentIdempotencyKey(createPaymentIdempotencyKey()); setFormError('') }} placeholder="0" />
                    </label>
                    <label className="text-[10px] font-semibold tracking-wide text-ink">METHOD
                      <select className={fieldClass} value={initialPaymentMethod} onChange={(event) => { setInitialPaymentMethod(event.target.value as PaymentMethod); setInitialPaymentIdempotencyKey(createPaymentIdempotencyKey()) }}>
                        {paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="flex justify-between gap-3 border-t border-stone-100 pt-2 text-[11px]">
                    <span className="text-muted">Estimated balance due</span>
                    <strong className="text-amber-900">{formatAmount(Math.max(0, totalAmount - (Number(initialPaymentAmount) || 0)), currency)}</strong>
                  </div>
                </section>
              </>
            )}
            {formError && <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">{formError}</p>}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-stone-200 bg-white px-5 py-4">
            {step > 0
              ? <button type="button" onClick={() => setStep((current) => current - 1)} className="inline-flex items-center gap-1.5 rounded-sm px-3 py-2 text-[10px] font-semibold text-muted hover:bg-stone-100"><ArrowLeft aria-hidden="true" className="size-3.5" /> Back</button>
              : <button type="button" onClick={onClose} className="rounded-sm px-3 py-2 text-[10px] font-semibold text-muted hover:bg-stone-100">Cancel</button>}
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-sm bg-amber-800 px-4 py-2.5 text-[10px] font-semibold tracking-wide text-white transition-colors hover:bg-amber-900 disabled:cursor-wait disabled:opacity-60">
              {saving ? 'SAVING…' : step === 2 ? 'CREATE RESERVATION' : 'CONTINUE'} {!saving && <ArrowRight aria-hidden="true" className="size-3.5" />}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function ReservationDetails({ reservation, inventory, hotelId, onClose, onRecordPayment, pendingPayment }: {
  reservation: Reservation
  inventory: Room[]
  hotelId: string
  onClose: () => void
  onRecordPayment: (payment: ReservationPayment) => Promise<void>
  pendingPayment?: ReservationPayment
}) {
  const currency = reservation.currency ?? 'NGN'
  const minorUnitScale = currencyMinorUnitScale(currency)
  const [paymentAmount, setPaymentAmount] = useState(pendingPayment ? String(pendingPayment.amountMinor / minorUnitScale) : '')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(pendingPayment?.method ?? 'cash')
  const [paymentIdempotencyKey, setPaymentIdempotencyKey] = useState(pendingPayment?.idempotencyKey ?? createPaymentIdempotencyKey)
  const [paymentError, setPaymentError] = useState('')
  const [savingPayment, setSavingPayment] = useState(false)
  const [paymentHistoryReload, setPaymentHistoryReload] = useState(0)
  const [paymentHistoryState, setPaymentHistoryState] = useState<{
    queryKey: string
    payments?: ReservationPaymentRecord[]
    error?: string
  }>({ queryKey: '' })
  const paymentHistoryQueryKey = [hotelId, reservation.id ?? '', paymentHistoryReload].join('|')
  const hasCurrentPaymentHistory = paymentHistoryState.queryKey === paymentHistoryQueryKey
  const paymentHistory = hasCurrentPaymentHistory ? paymentHistoryState.payments : undefined
  const paymentHistoryLoading = Boolean(reservation.id && hotelId && !hasCurrentPaymentHistory)
  const paymentHistoryError = hasCurrentPaymentHistory
    ? paymentHistoryState.error ?? ''
    : !reservation.id ? 'This reservation has no database ID.' : !hotelId ? 'Select a hotel to load its payment history.' : ''

  useEffect(() => {
    if (!reservation.id || !hotelId) return

    let cancelled = false
    void fetchReservationPayments(hotelId, reservation.id)
      .then((payments) => {
        if (!cancelled) setPaymentHistoryState({ queryKey: paymentHistoryQueryKey, payments })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setPaymentHistoryState({
            queryKey: paymentHistoryQueryKey,
            error: error instanceof Error ? error.message : 'Could not load payment history.',
          })
        }
      })

    return () => { cancelled = true }
  }, [hotelId, paymentHistoryQueryKey, reservation.id])
  const balance = reservationBalanceDue(reservation)

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const amount = Number(paymentAmount)
    if (!Number.isFinite(amount) || amount <= 0 || amount > balance) {
      setPaymentError(`Enter an amount greater than zero and no more than the remaining balance of ${formatAmount(balance, currency)}.`)
      return
    }

    setSavingPayment(true)
    setPaymentError('')
    try {
      await onRecordPayment({
        amountMinor: Math.round(amount * minorUnitScale),
        method: paymentMethod,
        idempotencyKey: paymentIdempotencyKey,
      })
      setPaymentAmount('')
      setPaymentIdempotencyKey(createPaymentIdempotencyKey())
      setPaymentHistoryReload((current) => current + 1)
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : 'Could not record this payment.')
    } finally {
      setSavingPayment(false)
    }
  }

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
          <div className="py-3"><dt className="text-[10px] text-muted">Sanctuary / assigned room</dt><dd className="mt-1 text-xs text-ink">{reservation.room} · {roomDisplayName(reservation.assignedRoomId, inventory, reservation.assignedRoomName)}</dd></div>
          <div className="py-3"><dt className="text-[10px] text-muted">Stay dates</dt><dd className="mt-1 text-xs text-ink">{shortDate(reservation.checkIn)} – {shortDate(reservation.checkOut)}</dd></div>
          <div className="py-3"><dt className="text-[10px] text-muted">Party</dt><dd className="mt-1 text-xs text-ink">{reservation.adults} adults, {reservation.children} children</dd></div>
          <div className="py-3"><dt className="text-[10px] text-muted">Room rate per night</dt><dd className="mt-1 text-xs text-ink">{formatAmount(reservation.nightlyRate ?? Math.round(reservation.amount / nightsBetween(reservation.checkIn, reservation.checkOut)), reservation.currency)} / night</dd></div>
          <div className="py-3"><dt className="text-[10px] text-muted">Total stay · {nightsBetween(reservation.checkIn, reservation.checkOut)} {nightsBetween(reservation.checkIn, reservation.checkOut) === 1 ? 'night' : 'nights'}</dt><dd className="mt-1 text-xs font-semibold text-ink">{formatAmount(reservation.amount, reservation.currency)}</dd></div>
          <div className="py-3"><dt className="text-[10px] text-muted">Amount paid</dt><dd className="mt-1 text-xs text-emerald-800">{formatAmount(reservationPaidAmount(reservation), reservation.currency)}</dd></div>
          <div className="py-3"><dt className="text-[10px] text-muted">Remaining balance</dt><dd className={`mt-1 text-xs font-bold ${reservationBalanceDue(reservation) ? 'text-amber-900' : 'text-ink'}`}>{formatAmount(reservationBalanceDue(reservation), reservation.currency)}</dd></div>
          <div className="py-3 sm:col-span-2"><dt className="text-[10px] text-muted">Payment / folio</dt><dd className="mt-1 text-xs text-ink">{reservation.payment} / {reservation.folio}</dd></div>
        </dl>
        <section className="mt-4 border border-stone-200 bg-white p-3">
          <h3 className="text-[10px] font-semibold tracking-wide text-ink">PAYMENT HISTORY</h3>
          {paymentHistoryLoading && <p className="mt-2 text-[10px] text-muted">Loading payment history…</p>}
          {paymentHistoryError && <p role="alert" className="mt-2 text-[10px] text-rose-800">{paymentHistoryError}</p>}
          {!paymentHistoryLoading && !paymentHistoryError && paymentHistory?.length === 0 && (
            <p className="mt-2 text-[10px] text-muted">No payments have been recorded.</p>
          )}
          {paymentHistory && paymentHistory.length > 0 && (
            <ul className="mt-2 divide-y divide-stone-100">
              {paymentHistory.map((payment) => (
                <li key={payment.id} className="flex items-start justify-between gap-3 py-2 text-[10px]">
                  <div>
                    <strong className="block font-semibold text-ink">{paymentMethodLabel(payment.method)}</strong>
                    <span className="mt-0.5 block text-muted">{formatPaymentDate(payment.receivedAt)}{payment.note ? ` · ${payment.note}` : ''}</span>
                  </div>
                  <strong className="whitespace-nowrap text-emerald-800">{formatAmount(payment.amount, payment.currency)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
        {balance > 0 && reservation.folio !== 'Cancelled' && reservation.folio !== 'No Show' && reservation.payment !== 'Refunded' && (
          <form onSubmit={submitPayment} className="mt-4 space-y-3 border border-stone-200 bg-paper p-3">
            <div>
              <h3 className="text-[10px] font-semibold tracking-wide text-ink">PAYMENT</h3>
              <p className="mt-1 text-[9px] text-muted">Record another full or partial payment against this reservation.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-[10px] font-semibold tracking-wide text-ink">AMOUNT RECEIVED
                <input className="mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-xs text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10" type="number" min="0" max={balance} step={1 / minorUnitScale} value={paymentAmount} onChange={(event) => { setPaymentAmount(event.target.value); setPaymentIdempotencyKey(createPaymentIdempotencyKey()); setPaymentError('') }} required />
              </label>
              <label className="text-[10px] font-semibold tracking-wide text-ink">METHOD
                <select className="mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-xs text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10" value={paymentMethod} onChange={(event) => { setPaymentMethod(event.target.value as PaymentMethod); setPaymentIdempotencyKey(createPaymentIdempotencyKey()) }}>
                  {paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
                </select>
              </label>
            </div>
            <p className="text-[10px] text-muted">Balance after payment: <strong className="text-amber-900">{formatAmount(Math.max(0, balance - (Number(paymentAmount) || 0)), currency)}</strong></p>
            {paymentError && <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-[10px] text-rose-800">{paymentError}</p>}
            <div className="flex justify-end">
              <button type="submit" disabled={savingPayment} className="bg-forest px-3 py-2 text-[10px] font-semibold text-white hover:bg-forest-deep disabled:cursor-wait disabled:opacity-60">{savingPayment ? 'SAVING…' : 'RECORD PAYMENT'}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

function CancelReservationDialog({ reservation, onClose, onConfirm, saving }: {
  reservation: Reservation
  onClose: () => void
  onConfirm: () => void
  saving: boolean
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="cancel-reservation-title" className="w-full max-w-sm border border-stone-200 bg-white p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <CircleAlert aria-hidden="true" className="size-6 text-amber-800" />
        <h2 id="cancel-reservation-title" className="mt-3 font-display text-xl text-ink">Cancel reservation?</h2>
        <p className="mt-2 text-xs leading-5 text-muted">Cancel {reservation.guest}&apos;s reservation for {shortDate(reservation.checkIn)} – {shortDate(reservation.checkOut)}. The room will be released if no other active folio uses it. Any refund should be recorded separately.</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="border border-stone-300 px-3 py-2 text-[10px] font-semibold text-ink hover:bg-stone-50 disabled:opacity-60">Keep Reservation</button>
          <button type="button" onClick={onConfirm} disabled={saving} className="bg-rose-700 px-3 py-2 text-[10px] font-semibold text-white hover:bg-rose-800 disabled:cursor-wait disabled:opacity-60">{saving ? 'Cancelling…' : 'Cancel Reservation'}</button>
        </div>
      </section>
    </div>
  )
}

export function AdminReservations() {
  const { rooms, roomTypes, roomLoading, roomError } = useAdminReservations()
  const [hotelId] = useState(() => sessionStorage.getItem('selectedHotelId') ?? '')
  const [rows, setRows] = useState<Reservation[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: rowsPerPage, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [cancelling, setCancelling] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [folioFilter, setFolioFilter] = useState('All folio statuses')
  const [paymentFilter, setPaymentFilter] = useState('All payment statuses')
  const [dateFilter, setDateFilter] = useState('Any check-in date')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null)
  const [pendingPayments, setPendingPayments] = useState<Record<string, ReservationPayment>>({})

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!hotelId) {
      setLoading(false)
      setLoadError('Select a hotel to load its reservations.')
      return
    }

    let cancelled = false
    setLoading(true)
    setLoadError('')
    setRows([])
    const dateRange: { checkInFrom?: string; checkInTo?: string } = dateFilter === 'Any check-in date' ? {} : checkInDateRange(dateFilter)
    const upcoming = folioFilter === 'Upcoming'
    if (upcoming) {
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowKey = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
      dateRange.checkInFrom = dateRange.checkInFrom && dateRange.checkInFrom > tomorrowKey
        ? dateRange.checkInFrom
        : tomorrowKey
    }
    void fetchReservations(hotelId, {
      page,
      limit: rowsPerPage,
      search: debouncedSearch || undefined,
      status: upcoming || folioFilter === 'Pending Payment' ? 'confirmed' : reservationStatusFilter(folioFilter),
      ...dateRange,
    })
      .then((result) => {
        if (cancelled) return
        setRows(result.reservations)
        setPagination(result.pagination)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setLoadError(error instanceof Error ? error.message : 'Could not load reservations.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [dateFilter, debouncedSearch, folioFilter, hotelId, page, reloadKey])

  const filteredRows = useMemo(() => {
    return rows.filter((reservation) => {
      const matchesFolio = folioFilter === 'All folio statuses'
        || (folioFilter === 'Upcoming'
          ? isUpcomingReservation(reservation)
          : folioFilter === 'Pending Payment'
            ? reservation.payment === 'Pending' && reservation.folio !== 'Cancelled'
            : reservation.folio === folioFilter)
      const matchesPayment = paymentFilter === 'All payment statuses' || reservation.payment === paymentFilter
      return matchesFolio && matchesPayment
    })
  }, [folioFilter, paymentFilter, rows])

  const totalPages = Math.max(1, pagination.pages)
  const currentPage = Math.min(page, totalPages)
  const visibleRows = filteredRows
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

  async function createReservation(draft: ReservationDraft, initialPayment?: ReservationPayment) {
    if (!hotelId) throw new Error('Select a hotel before creating a reservation.')
    setActionError('')
    let reservation = await createReservationRequest(hotelId, draft)
    setRows((current) => page === 1 ? [reservation, ...current].slice(0, rowsPerPage) : current)
    setPagination((current) => ({ ...current, total: current.total + 1 }))
    setPage(1)
    setSearch('')
    setDebouncedSearch('')
    setFolioFilter('All folio statuses')
    setPaymentFilter('All payment statuses')
    setDateFilter('Any check-in date')

    if (initialPayment) {
      if (!reservation.id) {
        setActionError('The reservation was created, but its database ID is missing, so the initial payment could not be recorded.')
        return reservation
      }

      try {
        const paymentSummary = await recordReservationPayment(hotelId, reservation.id, initialPayment, reservation.currency ?? 'NGN')
        reservation = {
          ...reservation,
          paidAmount: paymentSummary.paidAmount,
          balanceDue: paymentSummary.balanceDue,
          payment: paymentSummary.balanceDue === 0
            ? 'Paid'
            : paymentSummary.paidAmount > 0
              ? 'Partially Paid'
              : 'Pending',
        }
        setRows((current) => current.map((row) => row.id === reservation.id ? reservation : row))
      } catch (error) {
        setPendingPayments((current) => ({ ...current, [reservation.id!]: initialPayment }))
        const reason = error instanceof Error ? error.message : 'The payment could not be recorded.'
        setActionError(`Reservation ${reservation.reference} was created, but the initial payment could not be recorded: ${reason}`)
      }
    }

    return reservation
  }

  async function recordPayment(reservation: Reservation, payment: ReservationPayment) {
    if (!reservation.id) throw new Error('This reservation is missing its database ID and cannot accept a payment.')
    if (!hotelId) throw new Error('Select a hotel before recording a payment.')

    const paymentSummary = await recordReservationPayment(hotelId, reservation.id, payment, reservation.currency ?? 'NGN')
    const updated: Reservation = {
      ...reservation,
      paidAmount: paymentSummary.paidAmount,
      balanceDue: paymentSummary.balanceDue,
      payment: paymentSummary.balanceDue === 0
        ? 'Paid'
        : paymentSummary.paidAmount > 0
          ? 'Partially Paid'
          : 'Pending',
    }
    setRows((current) => current.map((row) => row.id === updated.id ? updated : row))
    setPendingPayments((current) => {
      const next = { ...current }
      delete next[updated.id!]
      return next
    })
    setSelectedReservation(updated)
  }

  async function cancelReservation() {
    if (!reservationToCancel) return
    if (!reservationToCancel.id) {
      setActionError('This reservation is missing its database ID and cannot be cancelled.')
      return
    }
    if (!hotelId) {
      setActionError('Select a hotel before updating a reservation.')
      return
    }
    setActionError('')
    setCancelling(true)
    try {
      const updated = await updateReservationStatus(hotelId, reservationToCancel.id, 'cancelled')
      setRows((current) => current.map((reservation) => reservation.id === updated.id ? updated : reservation))
      setReloadKey((current) => current + 1)
      setSelectedReservation(null)
      setReservationToCancel(null)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not cancel the reservation.')
    } finally {
      setCancelling(false)
    }
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

      {(loadError || actionError) && <p role="alert" className="mb-4 border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800">{loadError || actionError}</p>}

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <article className="relative rounded-sm border border-stone-200/80 bg-white p-4 shadow-sm">
          <span className="text-[9px] font-semibold tracking-[0.12em] text-muted">TOTAL RESERVATIONS</span>
          <CalendarDays aria-hidden="true" className="absolute right-4 top-4 size-8 rounded-sm bg-paper p-2 text-muted" />
          <strong className="mt-2 block font-display text-2xl text-ink">{pagination.total}</strong>
          <p className="mt-1 text-[10px] text-muted">Reservations currently available</p>
        </article>
        <article className="relative rounded-sm border border-stone-200/80 bg-white p-4 shadow-sm">
          <span className="text-[9px] font-semibold tracking-[0.12em] text-muted">UPCOMING ON PAGE</span>
          <CircleCheck aria-hidden="true" className="absolute right-4 top-4 size-8 rounded-sm bg-emerald-50 p-2 text-emerald-700" />
          <strong className="mt-2 block font-display text-2xl text-ink">{upcomingCount}</strong>
          <p className="mt-1 text-[10px] text-muted">Confirmed stays on this page</p>
        </article>
        <article className="relative rounded-sm border border-stone-200/80 bg-white p-4 shadow-sm">
          <span className="text-[9px] font-semibold tracking-[0.12em] text-muted">PENDING ON PAGE</span>
          <CircleAlert aria-hidden="true" className="absolute right-4 top-4 size-8 rounded-sm bg-amber-50 p-2 text-amber-700" />
          <strong className="mt-2 block font-display text-2xl text-ink">{pendingReservations.length}</strong>
          <p className="mt-1 text-[10px] text-muted"><b className="font-semibold text-amber-800">{formatAmount(pendingAmount)}</b> outstanding on this page</p>
        </article>
        <article className="relative rounded-sm border border-stone-200/80 bg-white p-4 shadow-sm">
          <span className="text-[9px] font-semibold tracking-[0.12em] text-muted">CANCELLED ON PAGE</span>
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
            <span className="sr-only">Filter payment status on this page</span>
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
              {loading && <tr><td className="px-4 py-10 text-center text-xs text-muted" colSpan={9}>Loading reservations…</td></tr>}
              {!loading && visibleRows.map((reservation) => (
                <tr key={reservation.id ?? reservation.reference} className="align-top text-muted hover:bg-paper/60">
                  <td className="px-3 py-3"><strong className="block whitespace-nowrap text-[11px] text-ink">{reservation.reference}</strong><small className="mt-1 block text-[10px]">{reservation.source ?? 'Admin'}</small></td>
                  <td className="px-3 py-3"><strong className="block whitespace-nowrap font-medium text-ink">{reservation.guest}</strong><small className="mt-1 block text-[10px]">{reservation.email}</small>{reservation.tier && <span className="mt-1 inline-block rounded-sm bg-champagne/40 px-1.5 py-0.5 text-[9px] font-semibold text-amber-950">{reservation.tier}</span>}</td>
                  <td className="px-3 py-3"><span className="block max-w-[145px] text-ink">{reservation.room}</span><small className="mt-1 block text-[10px]">{roomDisplayName(reservation.assignedRoomId, rooms, reservation.assignedRoomName)}</small></td>
                  <td className="whitespace-nowrap px-3 py-3"><strong className="font-medium text-ink">{shortDate(reservation.checkIn)} – {shortDate(reservation.checkOut)}</strong>{isUpcomingReservation(reservation) && <span className="mt-1 block w-fit border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[9px] font-semibold text-sky-800">Upcoming</span>}<small className="mt-1 block text-[10px]">{nightsBetween(reservation.checkIn, reservation.checkOut)} nights</small></td>
                  <td className="whitespace-nowrap px-3 py-3"><strong className="block font-medium text-ink">{reservation.adults} {reservation.adults === 1 ? 'Adult' : 'Adults'}</strong><small className="mt-1 block text-[10px]">{reservation.children} {reservation.children === 1 ? 'Child' : 'Children'}</small></td>
                  <td className="whitespace-nowrap px-3 py-3"><strong className="font-medium text-ink">{formatAmount(reservation.amount, reservation.currency)}</strong><small className="mt-1 block text-[10px]">{reservation.payment === 'Pending' ? 'Awaiting payment' : reservation.payment === 'Partially Paid' ? `Paid ${formatAmount(reservationPaidAmount(reservation), reservation.currency)} · Due ${formatAmount(reservationBalanceDue(reservation), reservation.currency)}` : 'Settlement recorded'}</small></td>
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
              {!loading && visibleRows.length === 0 && <tr><td className="px-4 py-10 text-center text-xs text-muted" colSpan={9}>{loadError ? 'Reservations could not be loaded.' : 'No reservations match these filters. Try changing your search or clearing the filters.'}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-stone-100 px-4 py-3 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p><strong className="text-ink">{visibleRows.length}</strong> matching reservations on page <strong className="text-ink">{currentPage}</strong> of <strong className="text-ink">{totalPages}</strong> · {pagination.total} total</p>
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
      {createOpen && <ReservationDialog
        onClose={() => setCreateOpen(false)}
        onCreate={createReservation}
        hotelId={hotelId}
        inventory={rooms}
        roomTypes={roomTypes}
        roomLoading={roomLoading}
        roomError={roomError}
      />}
      {selectedReservation && <ReservationDetails
        reservation={selectedReservation}
        inventory={rooms}
        hotelId={hotelId}
        onClose={() => setSelectedReservation(null)}
        onRecordPayment={(payment) => recordPayment(selectedReservation, payment)}
        pendingPayment={selectedReservation.id ? pendingPayments[selectedReservation.id] : undefined}
      />}
      {reservationToCancel && <CancelReservationDialog reservation={reservationToCancel} onClose={() => setReservationToCancel(null)} onConfirm={cancelReservation} saving={cancelling} />}
    </section>
  )
}
