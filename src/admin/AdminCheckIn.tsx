import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  BedDouble,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  DoorOpen,
  KeyRound,
  Plus,
  Search,
  UsersRound,
  X,
} from 'lucide-react'
import { useAdminReservations } from './AdminReservationsContext'
import { formatReservationDate, reservationBalanceDue, reservationCurrency, reservationPaidAmount } from './adminReservationsData'
import type { Reservation } from './adminReservationsData'
import { getAvailableRoomsForStay } from './adminRoomsData'
import type { Room } from './adminRoomsData'

type OperationsTab = 'Arrivals' | 'Departures' | 'In-House Guests'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function formatLongDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function roomName(reservation: Reservation) {
  return reservation.assignedRoomId ? `Room ${reservation.assignedRoomId}` : reservation.room
}

function statusClass(status: Reservation['folio']) {
  if (status === 'Checked In') return 'bg-emerald-50 text-emerald-800'
  if (status === 'Pending Payment') return 'bg-amber-50 text-amber-900'
  if (status === 'Checked Out') return 'bg-stone-100 text-stone-600'
  return 'bg-forest/10 text-forest'
}

function WalkInDialog({ date, reservations, rooms, onClose, onCreate }: {
  date: string
  reservations: Reservation[]
  rooms: Room[]
  onClose: () => void
  onCreate: (reservation: Reservation, room: Room) => void
}) {
  const [guest, setGuest] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [checkIn, setCheckIn] = useState(date)
  const [checkOut, setCheckOut] = useState(() => {
    const tomorrow = new Date(`${date}T12:00:00`)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().slice(0, 10)
  })
  const [roomId, setRoomId] = useState('')
  const [adults, setAdults] = useState('1')
  const [children, setChildren] = useState('0')
  const [amountReceived, setAmountReceived] = useState('0')
  const [error, setError] = useState('')
  const guestCount = (Number(adults) || 0) + (Number(children) || 0)
  const nights = Math.max(1, Math.ceil((new Date(`${checkOut}T12:00:00`).getTime() - new Date(`${checkIn}T12:00:00`).getTime()) / 86400000))
  const stayIsValid = Boolean(checkIn && checkOut > checkIn && guestCount > 0)
  const availableRooms = stayIsValid
    ? getAvailableRoomsForStay(rooms, reservations, checkIn, checkOut, guestCount)
    : []
  const selectedRoom = availableRooms.find((room) => room.id === roomId)
  const amount = (selectedRoom?.rate ?? 0) * nights
  const paidAmount = Math.min(amount, Math.max(0, Number(amountReceived) || 0))
  const payment: Reservation['payment'] = paidAmount === 0 ? 'Pending' : paidAmount >= amount ? 'Paid' : 'Partially Paid'
  const fieldClass = 'mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-xs text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10'

  function submitWalkIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedRoom) {
      setError('Choose an available room for this stay.')
      return
    }
    if (checkOut <= checkIn) {
      setError('Check-out must be after check-in.')
      return
    }
    if (Number(adults) < 1 || guestCount > 10) {
      setError('Enter a valid party size of 1 to 10 guests.')
      return
    }
    if (Number(amountReceived) > amount) {
      setError('Amount received cannot exceed the stay total.')
      return
    }
    const reservation: Reservation = {
      reference: `OPZY-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
      guest: guest.trim(),
      email: email.trim(),
      phone: phone.trim(),
      tier: 'Walk-in',
      room: selectedRoom.type,
      assignedRoomId: selectedRoom.id,
      registeredAt: checkIn,
      checkIn,
      checkOut,
      adults: Number(adults),
      children: Number(children),
      amount,
      paidAmount,
      nightlyRate: selectedRoom.rate,
      payment,
      folio: 'Checked In',
    }
    onCreate(reservation, selectedRoom)
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/55" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="walk-in-title" className="flex h-full w-full max-w-[470px] flex-col bg-paper shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div><p className="text-[9px] font-semibold tracking-[0.15em] text-amber-800">FRONT DESK · WALK-IN</p><h2 id="walk-in-title" className="mt-1 font-display text-xl text-ink">Add Check In</h2><p className="mt-1 text-[10px] text-muted">Register the guest and assign a room ready for immediate occupancy.</p></div>
          <button type="button" onClick={onClose} aria-label="Close walk-in check-in" className="grid size-8 place-items-center text-muted hover:bg-stone-100 hover:text-ink"><X aria-hidden="true" className="size-4" /></button>
        </header>
        <form onSubmit={submitWalkIn} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <section className="space-y-3 border border-stone-200 bg-white p-3">
              <h3 className="text-[10px] font-semibold tracking-wide text-ink">STAY DATES &amp; PARTY</h3>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[10px] font-semibold tracking-wide text-ink">CHECK-IN *<input className={fieldClass} type="date" value={checkIn} onChange={(event) => setCheckIn(event.target.value)} required /></label>
                <label className="block text-[10px] font-semibold tracking-wide text-ink">CHECK-OUT *<input className={fieldClass} type="date" value={checkOut} min={checkIn} onChange={(event) => setCheckOut(event.target.value)} required /></label>
                <label className="block text-[10px] font-semibold tracking-wide text-ink">ADULTS *<input className={fieldClass} type="number" min="1" max="10" value={adults} onChange={(event) => setAdults(event.target.value)} required /></label>
                <label className="block text-[10px] font-semibold tracking-wide text-ink">CHILDREN<input className={fieldClass} type="number" min="0" max="10" value={children} onChange={(event) => setChildren(event.target.value)} /></label>
              </div>
            </section>
            <label className="block text-[10px] font-semibold tracking-wide text-ink">AVAILABLE ROOM *
              <select className={fieldClass} value={roomId} onChange={(event) => setRoomId(event.target.value)} required disabled={!stayIsValid}>
                <option value="">{stayIsValid ? 'Select a room matching this stay' : 'Enter dates and party size first'}</option>
                {availableRooms.map((room) => <option key={room.id} value={room.id}>{room.name} · {room.type} · Up to {room.guests} guests · {reservationCurrency.format(room.rate)}/night</option>)}
              </select>
              {stayIsValid && !availableRooms.length && <span className="mt-1 block font-normal text-rose-700">No rooms fit this party and stay. Try different dates or guest numbers.</span>}
            </label>
            <label className="block text-[10px] font-semibold tracking-wide text-ink">GUEST FULL NAME *<input className={fieldClass} autoComplete="name" value={guest} onChange={(event) => setGuest(event.target.value)} required /></label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-[10px] font-semibold tracking-wide text-ink">TELEPHONE *<input className={fieldClass} type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} required /></label>
              <label className="block text-[10px] font-semibold tracking-wide text-ink">EMAIL<input className={fieldClass} type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            </div>
            <section className="space-y-2 border border-stone-200 bg-white p-3">
              <h3 className="text-[10px] font-semibold tracking-wide text-ink">PAYMENT RECEIVED</h3>
              <label className="block text-[10px] text-muted">Amount received (₦)<input className={fieldClass} type="number" min="0" max={amount} step="1" value={amountReceived} onChange={(event) => setAmountReceived(event.target.value)} /></label>
              <div className="flex justify-between gap-3 text-[11px]"><span className="text-muted">Stay total · {nights} {nights === 1 ? 'night' : 'nights'}</span><strong className="text-ink">{reservationCurrency.format(amount)}</strong></div>
              <div className="flex justify-between gap-3 text-[11px]"><span className="text-muted">Balance due</span><strong className="text-amber-900">{reservationCurrency.format(Math.max(0, amount - paidAmount))}</strong></div>
            </section>
            {error && <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-medium text-rose-800">{error}</p>}
          </div>
          <footer className="flex items-center justify-between gap-3 border-t border-stone-200 bg-white px-5 py-4">
            <button type="button" onClick={onClose} className="px-3 py-2 text-[10px] font-semibold text-muted hover:bg-stone-100">Cancel</button>
            <button type="submit" disabled={!availableRooms.length} className="inline-flex items-center gap-2 bg-amber-800 px-4 py-2.5 text-[10px] font-semibold tracking-wide text-white hover:bg-amber-900 disabled:cursor-not-allowed disabled:bg-stone-300"><Check aria-hidden="true" className="size-3.5" /> ADD &amp; CHECK IN</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

export function AdminCheckIn() {
  const { reservations, setReservations, rooms, setRooms } = useAdminReservations()
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [activeTab, setActiveTab] = useState<OperationsTab>('Arrivals')
  const [search, setSearch] = useState('')
  const [selectedReference, setSelectedReference] = useState('')
  const [showWalkIn, setShowWalkIn] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const query = search.trim().toLowerCase()

  const arrivals = useMemo(() => reservations.filter((reservation) => (
    reservation.checkIn <= selectedDate
    && reservation.checkOut > selectedDate
    && ['Confirmed', 'Pending Payment'].includes(reservation.folio)
  )), [reservations, selectedDate])
  const departures = useMemo(() => reservations.filter((reservation) => (
    reservation.checkOut === selectedDate && reservation.folio === 'Checked In'
  )), [reservations, selectedDate])
  const inHouse = useMemo(() => reservations.filter((reservation) => (
    reservation.folio === 'Checked In'
    && reservation.checkIn <= selectedDate
    && reservation.checkOut > selectedDate
  )), [reservations, selectedDate])

  const rows = activeTab === 'Arrivals' ? arrivals : activeTab === 'Departures' ? departures : inHouse
  const filteredRows = useMemo(() => rows.filter((reservation) => (
    `${reservation.guest} ${reservation.reference} ${reservation.room} ${reservation.assignedRoomId ?? ''} ${reservation.tier}`
      .toLowerCase()
      .includes(query)
  )), [query, rows])
  const selectedReservation = reservations.find((reservation) => reservation.reference === selectedReference)
    ?? filteredRows[0]
  const checkedInToday = reservations.filter((reservation) => reservation.folio === 'Checked In' && reservation.checkIn === selectedDate).length
  const stayingCount = reservations.filter((reservation) => (
    reservation.folio === 'Checked In' && reservation.checkIn <= selectedDate && reservation.checkOut > selectedDate
  )).length

  function shiftDate(days: number) {
    const date = new Date(`${selectedDate}T12:00:00`)
    date.setDate(date.getDate() + days)
    setSelectedDate(date.toISOString().slice(0, 10))
  }

  function updateCheckIn(reservation: Reservation) {
    setReservations((current) => current.map((item) => item.reference === reservation.reference
      ? { ...item, folio: 'Checked In' }
      : item))
    if (reservation.assignedRoomId) {
      setRooms((current) => current.map((room) => room.id === reservation.assignedRoomId
        ? { ...room, status: 'Occupied', guest: reservation.guest, note: reservation.reference }
        : room))
    }
    setActiveTab('In-House Guests')
  }

  function updateCheckOut(reservation: Reservation) {
    setReservations((current) => current.map((item) => item.reference === reservation.reference
      ? { ...item, folio: 'Checked Out' }
      : item))
    if (reservation.assignedRoomId) {
      setRooms((current) => current.map((room) => room.id === reservation.assignedRoomId
        ? { ...room, status: 'Cleaning', guest: undefined, note: 'CHECK-OUT · TURNAROUND REQUIRED' }
        : room))
    }
    setActiveTab('Departures')
  }

  function createWalkIn(reservation: Reservation, room: Room) {
    setReservations((current) => [reservation, ...current])
    setRooms((current) => current.map((item) => item.id === room.id
      ? { ...item, status: 'Occupied', guest: reservation.guest, note: reservation.reference }
      : item))
    setSelectedReference(reservation.reference)
    setShowWalkIn(false)
    setActiveTab('In-House Guests')
  }

  function recordPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedReservation) return

    const amountReceived = Number(paymentAmount)
    const balanceDue = reservationBalanceDue(selectedReservation)
    if (!Number.isFinite(amountReceived) || amountReceived <= 0 || amountReceived > balanceDue) {
      setPaymentError(`Enter an amount between ₦1 and ${reservationCurrency.format(balanceDue)}.`)
      return
    }

    const paidAmount = reservationPaidAmount(selectedReservation) + amountReceived
    const payment: Reservation['payment'] = paidAmount >= selectedReservation.amount
      ? 'Paid'
      : 'Partially Paid'
    setReservations((current) => current.map((reservation) => reservation.reference === selectedReservation.reference
      ? { ...reservation, paidAmount, payment }
      : reservation))
    setPaymentAmount('')
    setPaymentError('')
    setShowPaymentForm(false)
  }

  const tabs: { label: OperationsTab; count: number }[] = [
    { label: 'Arrivals', count: arrivals.length },
    { label: 'Departures', count: departures.length },
    { label: 'In-House Guests', count: inHouse.length },
  ]

  return (
    <section className="mx-auto max-w-[1600px]">
      <header className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.17em] text-amber-800">VICTORIA ISLAND SANCTUARY</p>
          <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Check-in / Check-out</h1>
          <p className="mt-1 max-w-2xl text-[11px] text-muted sm:text-[13px]">Manage guest arrivals, departures, in-house stays, and front desk settlements across Victoria Island wings.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-9 items-center border border-stone-200 bg-white">
            <button type="button" onClick={() => shiftDate(-1)} aria-label="Previous day" className="grid size-8 place-items-center text-muted hover:bg-stone-50 hover:text-ink"><ChevronLeft aria-hidden="true" className="size-4" /></button>
            <label className="flex items-center gap-2 border-x border-stone-200 px-2 text-[10px] font-semibold text-ink">
              <CalendarDays aria-hidden="true" className="size-3.5 text-amber-900" />
              <span className="sr-only">Operations date</span>
              <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="w-[118px] bg-transparent outline-none" />
            </label>
            <button type="button" onClick={() => shiftDate(1)} aria-label="Next day" className="grid size-8 place-items-center text-muted hover:bg-stone-50 hover:text-ink"><ChevronRight aria-hidden="true" className="size-4" /></button>
          </div>
          <button type="button" onClick={() => setSelectedDate(todayKey())} className="h-9 border border-stone-300 bg-white px-3 text-[10px] font-semibold text-ink hover:bg-stone-50">Today</button>
          <button type="button" onClick={() => setShowWalkIn(true)} className="inline-flex h-9 items-center gap-1.5 bg-amber-900 px-3 text-[10px] font-semibold text-white hover:bg-amber-950"><Plus aria-hidden="true" className="size-3.5" /> Add Check In</button>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
        {[
          { label: 'EXPECTED ARRIVALS', value: arrivals.length, note: 'Guests scheduled to arrive', icon: DoorOpen },
          { label: 'CHECKED IN TODAY', value: checkedInToday, note: 'Arrivals completed', icon: KeyRound },
          { label: 'EXPECTED DEPARTURES', value: departures.length, note: 'In-house guests checking out', icon: CalendarDays },
          { label: 'CURRENTLY STAYING', value: stayingCount, note: 'Active in-house folios', icon: BedDouble },
        ].map(({ label, value, note, icon: Icon }) => (
          <article key={label} className="border border-stone-200/80 bg-white p-3.5 shadow-sm sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[9px] font-semibold tracking-[0.12em] text-muted">{label}</span>
              <span className="grid size-8 place-items-center bg-paper text-forest"><Icon aria-hidden="true" className="size-4" /></span>
            </div>
            <strong className="mt-1 block font-display text-2xl text-ink">{value}</strong>
            <p className="mt-1 text-[9px] text-muted">{note}</p>
          </article>
        ))}
      </div>

      <div className="mb-2 flex flex-wrap items-end justify-between gap-3 border-b border-stone-200">
        <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Guest operations">
          {tabs.map(({ label, count }) => (
            <button key={label} type="button" role="tab" aria-selected={activeTab === label} onClick={() => setActiveTab(label)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[10px] ${activeTab === label ? 'border-forest font-semibold text-ink' : 'border-transparent text-muted hover:text-ink'}`}>
              {label}<span className={`grid size-4 place-items-center rounded-full text-[8px] ${activeTab === label ? 'bg-forest text-white' : 'bg-stone-100 text-muted'}`}>{count}</span>
            </button>
          ))}
        </div>
        <span className="pb-2 text-[9px] text-muted">{formatLongDate(selectedDate)}</span>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(290px,.75fr)]">
        <section className="min-w-0 overflow-hidden border border-stone-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-stone-100 p-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex h-9 min-w-0 items-center gap-2 border border-stone-200 bg-stone-50 px-2 sm:max-w-sm sm:flex-1">
              <Search aria-hidden="true" className="size-3.5 shrink-0 text-muted" />
              <span className="sr-only">Search guest operations</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search guest, folio or room..." className="min-w-0 flex-1 bg-transparent text-[10px] outline-none placeholder:text-muted/70" />
            </label>
            <span className="text-[9px] text-muted">{filteredRows.length} {activeTab.toLowerCase()}</span>
          </div>
          {filteredRows.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[790px] border-collapse text-left">
                <thead className="bg-stone-50 text-[8px] font-semibold tracking-[0.1em] text-muted">
                  <tr><th className="px-3 py-3">GUEST &amp; VIP TIER</th><th className="px-3 py-3">SUITE / LOCATION</th><th className="px-3 py-3">STAY</th><th className="px-3 py-3">PARTY</th><th className="px-3 py-3">FOLIO STATUS</th><th className="px-3 py-3">ACTION</th></tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredRows.map((reservation) => (
                    <tr key={reservation.reference} onClick={() => setSelectedReference(reservation.reference)} className={`cursor-pointer text-[10px] transition-colors hover:bg-amber-50/50 ${selectedReservation?.reference === reservation.reference ? 'bg-amber-50/60' : ''}`}>
                      <td className="px-3 py-3.5">
                        <strong className="block font-medium text-ink">{reservation.guest}</strong>
                        <span className="mt-1 block text-[9px] text-muted">{reservation.tier || 'Standard'} · {reservation.reference}</span>
                      </td>
                      <td className="px-3 py-3.5"><strong className="block font-medium text-ink">{reservation.room}</strong><span className="mt-1 block text-[9px] text-muted">{roomName(reservation)}</span></td>
                      <td className="px-3 py-3.5 whitespace-nowrap text-ink">{formatReservationDate(reservation.checkIn)} – {formatReservationDate(reservation.checkOut)}<span className="mt-1 block text-[9px] text-muted">{Math.max(1, Math.round((new Date(`${reservation.checkOut}T12:00:00`).getTime() - new Date(`${reservation.checkIn}T12:00:00`).getTime()) / 86400000))} nights</span></td>
                      <td className="px-3 py-3.5 whitespace-nowrap text-ink">{reservation.adults + reservation.children}<span className="mt-1 block text-[9px] text-muted">{reservation.adults} Adults · {reservation.children} Children</span></td>
                      <td className="px-3 py-3.5"><span className={`inline-flex whitespace-nowrap px-2 py-1 text-[8px] font-semibold ${statusClass(reservation.folio)}`}>{reservation.folio}</span><span className="mt-1 block text-[9px] text-muted">{reservation.payment}</span></td>
                      <td className="px-3 py-3.5" onClick={(event) => event.stopPropagation()}>
                        {reservation.folio === 'Checked In' && <button type="button" onClick={() => updateCheckOut(reservation)} className="whitespace-nowrap border border-forest px-2.5 py-1.5 text-[9px] font-semibold text-forest hover:bg-forest hover:text-white">Check Out</button>}
                        {['Confirmed', 'Pending Payment'].includes(reservation.folio) && <button type="button" onClick={() => updateCheckIn(reservation)} disabled={reservation.checkIn > selectedDate} className="whitespace-nowrap border border-amber-800 px-2.5 py-1.5 text-[9px] font-semibold text-amber-900 hover:bg-amber-900 hover:text-white disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-400">Check In</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center px-6 py-10 text-center">
              <div><CalendarDays aria-hidden="true" className="mx-auto size-6 text-stone-400" /><h2 className="mt-2 font-display text-base text-ink">No {activeTab.toLowerCase()}</h2><p className="mt-1 text-[10px] text-muted">There are no matching guest folios for {formatReservationDate(selectedDate)}.</p></div>
            </div>
          )}
          <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 bg-stone-50/70 px-3 py-2.5 text-[9px] text-muted"><span>Front desk operations · {formatReservationDate(selectedDate)}</span><span className="inline-flex items-center gap-1"><CircleCheck aria-hidden="true" className="size-3 text-emerald-700" /> Folios synced with room inventory</span></footer>
        </section>

        <aside className="overflow-hidden border border-stone-300 bg-white shadow-sm">
          {selectedReservation ? (
            <>
              <header className="bg-forest px-4 py-4 text-white">
                <p className="flex items-center gap-1.5 text-[8px] font-semibold tracking-[0.14em] text-champagne"><KeyRound aria-hidden="true" className="size-3" /> FRONT DESK GUEST FOLIO</p>
                <h2 className="mt-2 font-display text-xl">{selectedReservation.guest}</h2>
                <p className="mt-1 break-all text-[9px] text-white/55">{selectedReservation.reference}</p>
              </header>
              <div className="space-y-4 p-4">
                <section>
                  <h3 className="text-[9px] font-semibold tracking-[0.12em] text-amber-900">GUEST &amp; RESERVATION</h3>
                  <dl className="mt-2 divide-y divide-stone-100 border-y border-stone-100">
                    <div className="flex justify-between gap-3 py-2.5 text-[10px]"><dt className="text-muted">Suite / room</dt><dd className="text-right font-medium text-ink">{selectedReservation.room}<br /><span className="font-normal text-muted">{roomName(selectedReservation)}</span></dd></div>
                    <div className="flex justify-between gap-3 py-2.5 text-[10px]"><dt className="text-muted">Stay dates</dt><dd className="text-right font-medium text-ink">{formatReservationDate(selectedReservation.checkIn)} – {formatReservationDate(selectedReservation.checkOut)}</dd></div>
                    <div className="flex justify-between gap-3 py-2.5 text-[10px]"><dt className="text-muted">Guests</dt><dd className="text-right font-medium text-ink">{selectedReservation.adults} adults · {selectedReservation.children} children</dd></div>
                    <div className="flex justify-between gap-3 py-2.5 text-[10px]"><dt className="text-muted">Telephone</dt><dd className="text-right font-medium text-ink">{selectedReservation.phone}</dd></div>
                    <div className="flex justify-between gap-3 py-2.5 text-[10px]"><dt className="text-muted">Email</dt><dd className="max-w-[65%] break-all text-right font-medium text-ink">{selectedReservation.email}</dd></div>
                  </dl>
                </section>
                <section className="border border-stone-200 bg-paper/60 p-3">
                  <div className="flex items-center justify-between gap-2"><h3 className="text-[9px] font-semibold tracking-[0.12em] text-ink">PAYMENT &amp; FOLIO</h3><span className={`px-2 py-1 text-[8px] font-semibold ${statusClass(selectedReservation.folio)}`}>{selectedReservation.folio}</span></div>
                  <div className="mt-3 flex justify-between gap-3 text-[10px]"><span className="text-muted">Total stay</span><strong className="text-ink">{reservationCurrency.format(selectedReservation.amount)}</strong></div>
                  <div className="mt-2 flex justify-between gap-3 text-[10px]"><span className="text-muted">Paid</span><strong className="text-emerald-800">{reservationCurrency.format(reservationPaidAmount(selectedReservation))}</strong></div>
                  <div className="mt-2 flex justify-between gap-3 border-t border-stone-200 pt-2 text-[10px]"><span className="text-muted">Balance due</span><strong className={reservationBalanceDue(selectedReservation) ? 'text-amber-900' : 'text-ink'}>{reservationCurrency.format(reservationBalanceDue(selectedReservation))}</strong></div>
                  {reservationBalanceDue(selectedReservation) > 0 && <p className="mt-2 flex items-center gap-1 text-[9px] text-amber-900"><Clock3 aria-hidden="true" className="size-3 shrink-0" /> Outstanding balance to settle at front desk.</p>}
                  {reservationBalanceDue(selectedReservation) > 0 && selectedReservation.folio !== 'Cancelled' && (
                    showPaymentForm ? (
                      <form onSubmit={recordPayment} className="mt-3 space-y-2 border-t border-stone-200 pt-3">
                        <label className="block text-[9px] font-semibold text-ink">AMOUNT RECEIVED (₦)
                          <input autoFocus className="mt-1 w-full border border-stone-200 bg-white px-2.5 py-2 text-[11px] text-ink outline-none focus:border-amber-800" type="number" min="1" max={reservationBalanceDue(selectedReservation)} step="1" value={paymentAmount} onChange={(event) => setPaymentAmount(event.target.value)} required />
                        </label>
                        {paymentError && <p role="alert" className="text-[9px] text-rose-700">{paymentError}</p>}
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => { setShowPaymentForm(false); setPaymentError('') }} className="border border-stone-300 px-2.5 py-1.5 text-[9px] font-semibold text-muted hover:bg-stone-50">Cancel</button>
                          <button type="submit" className="bg-forest px-2.5 py-1.5 text-[9px] font-semibold text-white hover:bg-forest-deep">Save Payment</button>
                        </div>
                      </form>
                    ) : (
                      <button type="button" onClick={() => { setPaymentAmount(''); setPaymentError(''); setShowPaymentForm(true) }} className="mt-3 w-full border border-forest px-3 py-2 text-[9px] font-semibold text-forest hover:bg-forest hover:text-white">Record Payment</button>
                    )
                  )}
                </section>
                <div className="grid grid-cols-2 gap-2">
                  {selectedReservation.folio === 'Checked In' ? (
                    <button type="button" onClick={() => updateCheckOut(selectedReservation)} className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 bg-forest px-3 py-2 text-[10px] font-semibold text-white hover:bg-forest-deep"><DoorOpen aria-hidden="true" className="size-3.5" /> Complete Check-out</button>
                  ) : ['Confirmed', 'Pending Payment'].includes(selectedReservation.folio) ? (
                    <button type="button" onClick={() => updateCheckIn(selectedReservation)} disabled={selectedReservation.checkIn > selectedDate} className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 bg-amber-900 px-3 py-2 text-[10px] font-semibold text-white hover:bg-amber-950 disabled:cursor-not-allowed disabled:bg-stone-300"><Check aria-hidden="true" className="size-3.5" /> Confirm &amp; Complete Check-in</button>
                  ) : (
                    <span className="col-span-2 py-2 text-center text-[9px] text-muted">This folio has no pending front desk action.</span>
                  )}
                  {selectedReservation.assignedRoomId && <span className="col-span-2 text-center text-[8px] text-muted">Assigned key · {rooms.find((room) => room.id === selectedReservation.assignedRoomId)?.name ?? roomName(selectedReservation)}</span>}
                </div>
              </div>
            </>
          ) : (
            <div className="grid min-h-64 place-items-center px-6 py-10 text-center"><div><UsersRound aria-hidden="true" className="mx-auto size-6 text-stone-400" /><h2 className="mt-2 font-display text-base text-ink">Select a guest folio</h2><p className="mt-1 text-[10px] text-muted">Guest and settlement details will appear here.</p></div></div>
          )}
        </aside>
      </div>
      {showWalkIn && <WalkInDialog date={selectedDate} reservations={reservations} rooms={rooms} onClose={() => setShowWalkIn(false)} onCreate={createWalkIn} />}
    </section>
  )
}