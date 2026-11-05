import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  ArrowDownToLine,
  BedDouble,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Clock3,
  Crown,
  FileText,
  Globe2,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAdminReservations } from './AdminReservationsContext'
import {
  formatReservationDate,
  reservationBalanceDue,
  reservationCurrency,
  reservationPaidAmount,
} from './adminReservationsData'
import type { Reservation } from './adminReservationsData'
import type { Room } from './adminRoomsData'

type GuestTier = 'VIP Butler' | 'VIP Titanium' | 'VIP Guest' | 'Standard Folio' | 'Suites Member'

type Guest = {
  id: string
  name: string
  email: string
  phone: string
  country: string
  countryCode: string
  tier: GuestTier
  memberSince: string
  returning: boolean
}

type GuestDraft = Pick<Guest, 'name' | 'email' | 'phone' | 'country' | 'tier'>

const guestMetadata: { country: string; countryCode: string; tier: GuestTier; memberSince: string; returning: boolean }[] = [
  { country: 'Nigeria', countryCode: 'NG', tier: 'VIP Butler', memberSince: '2023-01-14', returning: true },
  { country: 'Nigeria', countryCode: 'NG', tier: 'VIP Titanium', memberSince: '2024-06-02', returning: true },
  { country: 'United Kingdom', countryCode: 'GB', tier: 'Standard Folio', memberSince: '2025-03-19', returning: false },
  { country: 'Ghana', countryCode: 'GH', tier: 'VIP Guest', memberSince: '2024-10-10', returning: true },
  { country: 'Nigeria', countryCode: 'NG', tier: 'Standard Folio', memberSince: '2025-08-03', returning: false },
  { country: 'Switzerland', countryCode: 'CH', tier: 'Suites Member', memberSince: '2025-01-24', returning: false },
  { country: 'Nigeria', countryCode: 'NG', tier: 'VIP Butler', memberSince: '2022-11-06', returning: true },
  { country: 'Nigeria', countryCode: 'NG', tier: 'VIP Guest', memberSince: '2025-07-12', returning: false },
]

function createGuests(reservations: Reservation[]): Guest[] {
  const seenEmails = new Set<string>()
  return reservations.flatMap((reservation, index) => {
    const email = reservation.email.toLowerCase()
    if (seenEmails.has(email)) return []
    seenEmails.add(email)
    const metadata = guestMetadata[index % guestMetadata.length]
    return [{
      id: `OPZY-GST-${reservation.reference.slice(-4)}`,
      name: reservation.guest,
      email: reservation.email,
      phone: reservation.phone,
      ...metadata,
      memberSince: reservation.registeredAt ?? metadata.memberSince,
    }]
  })
}

const pageSize = 8
const guestTiers: GuestTier[] = ['VIP Butler', 'VIP Titanium', 'VIP Guest', 'Standard Folio', 'Suites Member']
const countries = ['Nigeria', 'United Kingdom', 'Ghana', 'Switzerland']
const guestStatus = (reservations: Reservation[]) => reservations.some((reservation) => reservation.folio === 'Checked In')
  ? 'In-House'
  : reservations.some((reservation) => reservation.folio === 'Confirmed' || reservation.folio === 'Pending Payment')
    ? 'Upcoming'
    : 'Past Guest'

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase()
}

function countryFlag(code: string) {
  const flags: Record<string, string> = { NG: '🇳🇬', GB: '🇬🇧', GH: '🇬🇭', CH: '🇨🇭' }
  return flags[code] ?? '🌍'
}

function guestStatusClass(status: string) {
  if (status === 'In-House') return 'border-amber-200 bg-amber-50 text-amber-900'
  if (status === 'Upcoming') return 'border-sky-200 bg-sky-50 text-sky-800'
  return 'border-stone-200 bg-stone-100 text-stone-600'
}

function reservationNights(reservation: Reservation) {
  const checkIn = new Date(`${reservation.checkIn}T12:00:00`).getTime()
  const checkOut = new Date(`${reservation.checkOut}T12:00:00`).getTime()
  return Math.max(1, Math.ceil((checkOut - checkIn) / 86400000))
}

function roomDisplayName(roomId: string | undefined, inventory: Room[]) {
  return inventory.find((room) => room.id === roomId)?.name ?? (roomId ? `Room ${roomId}` : 'Room not assigned')
}

function addNightsToDate(date: string, nights: number) {
  const result = new Date(`${date}T12:00:00`)
  result.setDate(result.getDate() + nights)
  return result.toISOString().slice(0, 10)
}

function exportGuests(guests: Guest[]) {
  const columns: (keyof Guest)[] = ['id', 'name', 'email', 'phone', 'country', 'tier', 'memberSince']
  const escapeValue = (value: string | boolean) => `"${String(value).replaceAll('"', '""')}"`
  const content = [
    columns.join(','),
    ...guests.map((guest) => columns.map((column) => escapeValue(guest[column])).join(',')),
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'opzy-guest-registry.csv'
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

function GuestDialog({ guest, onClose, onSave }: {
  guest?: Guest
  onClose: () => void
  onSave: (draft: GuestDraft) => void
}) {
  const [name, setName] = useState(guest?.name ?? '')
  const [email, setEmail] = useState(guest?.email ?? '')
  const [phone, setPhone] = useState(guest?.phone ?? '')
  const [country, setCountry] = useState(guest?.country ?? 'Nigeria')
  const [tier, setTier] = useState<GuestTier>(guest?.tier ?? 'Standard Folio')
  const fieldClass = 'mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-[13px] text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10'

  function submitGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({ name: name.trim(), email: email.trim(), phone: phone.trim(), country, tier })
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/50" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="guest-dialog-title" className="flex h-full w-full max-w-[440px] flex-col bg-paper shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.15em] text-amber-800">GUEST DIRECTORY</p>
            <h2 id="guest-dialog-title" className="mt-1 font-display text-xl text-ink">{guest ? 'Edit Guest Profile' : 'Add New Guest'}</h2>
            <p className="mt-1 text-[12px] text-muted">{guest ? 'Update contact details and guest classification.' : 'Register a guest in the OPZY hospitality registry.'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close guest form" className="grid size-8 place-items-center text-muted hover:bg-stone-100"><X aria-hidden="true" className="size-4" /></button>
        </header>
        <form onSubmit={submitGuest} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <label className="block text-[12px] font-semibold tracking-wide text-ink">GUEST NAME
              <input className={fieldClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" required />
            </label>
            <label className="block text-[12px] font-semibold tracking-wide text-ink">EMAIL ADDRESS
              <input className={fieldClass} type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="guest@example.com" required />
            </label>
            <label className="block text-[12px] font-semibold tracking-wide text-ink">PHONE NUMBER
              <input className={fieldClass} type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+234 800 000 0000" required />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[12px] font-semibold tracking-wide text-ink">COUNTRY
                <select className={fieldClass} value={country} onChange={(event) => setCountry(event.target.value)}>
                  {countries.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="block text-[12px] font-semibold tracking-wide text-ink">GUEST TIER
                <select className={fieldClass} value={tier} onChange={(event) => setTier(event.target.value as GuestTier)}>
                  {guestTiers.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>
          </div>
          <footer className="flex justify-end gap-2 border-t border-stone-200 bg-white p-4">
            <button type="button" onClick={onClose} className="border border-stone-300 px-4 py-2.5 text-[12px] font-semibold text-ink hover:bg-stone-50">Cancel</button>
            <button type="submit" className="inline-flex items-center gap-2 bg-forest px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-forest-deep"><Check aria-hidden="true" className="size-3.5" /> Save Guest</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function ExtendStayDialog({ reservation, onClose, onSave }: {
  reservation: Reservation
  onClose: () => void
  onSave: (updatedReservation: Reservation) => void
}) {
  const [extraNights, setExtraNights] = useState('1')
  const nightsToAdd = Math.max(1, Number(extraNights) || 1)
  const nightlyRate = reservation.nightlyRate ?? Math.ceil(reservation.amount / reservationNights(reservation))
  const extensionCost = nightlyRate * nightsToAdd
  const paidAmount = reservationPaidAmount(reservation)
  const newTotal = reservation.amount + extensionCost
  const newBalance = newTotal - paidAmount
  const newCheckOut = addNightsToDate(reservation.checkOut, nightsToAdd)
  const fieldClass = 'mt-1.5 w-full border border-stone-200 bg-white px-3 py-2.5 text-[13px] text-ink outline-none focus:border-amber-800 focus:ring-2 focus:ring-amber-800/10'

  function submitExtension(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({
      ...reservation,
      checkOut: newCheckOut,
      amount: newTotal,
      paidAmount,
      nightlyRate,
      payment: 'Partially Paid',
    })
  }

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/50" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="extend-stay-title" className="flex h-full w-full max-w-[440px] flex-col bg-paper shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between border-b border-stone-200 bg-white px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.15em] text-amber-800">IN-HOUSE RESERVATION</p>
            <h2 id="extend-stay-title" className="mt-1 font-display text-xl text-ink">Edit / Extend Stay</h2>
            <p className="mt-1 text-[12px] text-muted">{reservation.guest} · {reservation.room}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close stay editor" className="grid size-8 place-items-center text-muted hover:bg-stone-100"><X aria-hidden="true" className="size-4" /></button>
        </header>
        <form onSubmit={submitExtension} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[12px] font-semibold tracking-wide text-ink">CURRENT CHECK-OUT
                <input className={fieldClass} type="date" value={reservation.checkOut} readOnly />
              </label>
              <label className="block text-[12px] font-semibold tracking-wide text-ink">ADD NIGHTS
                <input className={fieldClass} type="number" min="1" max="30" value={extraNights} onChange={(event) => setExtraNights(event.target.value)} required />
              </label>
            </div>
            <div className="border border-amber-200 bg-amber-50/70 p-3">
              <p className="text-[11px] font-semibold tracking-wide text-amber-950">UPDATED STAY</p>
              <div className="mt-2 flex items-center justify-between gap-3 text-[12px]">
                <span className="text-muted">New check-out date</span>
                <strong className="font-semibold text-ink">{formatReservationDate(newCheckOut)} {newCheckOut.slice(0, 4)}</strong>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3 text-[12px]">
                <span className="text-muted">Additional nights</span>
                <strong className="font-semibold text-ink">{nightsToAdd}</strong>
              </div>
            </div>
            <section className="space-y-2 border border-stone-200 bg-white p-3">
              <h3 className="text-[11px] font-semibold tracking-wide text-ink">FOLIO BALANCE</h3>
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <span className="text-muted">Amount already paid</span>
                <strong className="font-semibold text-emerald-800">{reservationCurrency.format(paidAmount)}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 text-[12px]">
                <span className="text-muted">Added nights ({reservationCurrency.format(nightlyRate)} × {nightsToAdd})</span>
                <strong className="font-semibold text-ink">{reservationCurrency.format(extensionCost)}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-amber-200 bg-amber-50 px-2.5 py-2 text-[13px]">
                <span className="font-bold text-ink">Remaining balance due</span>
                <strong className="text-base font-bold text-amber-950">{reservationCurrency.format(newBalance)}</strong>
              </div>
              <p className="text-[10px] text-muted">The extension adds to the existing folio; the original paid amount is kept unchanged.</p>
            </section>
          </div>
          <footer className="flex justify-end gap-2 border-t border-stone-200 bg-white p-4">
            <button type="button" onClick={onClose} className="border border-stone-300 px-4 py-2.5 text-[12px] font-semibold text-ink hover:bg-stone-50">Cancel</button>
            <button type="submit" className="inline-flex items-center gap-2 bg-forest px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-forest-deep"><Check aria-hidden="true" className="size-3.5" /> Save Stay Extension</button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function GuestInspector({ guest, reservations, inventory, onEdit, onClose, onExtendStay }: {
  guest: Guest
  reservations: Reservation[]
  inventory: Room[]
  onEdit: () => void
  onClose: () => void
  onExtendStay: () => void
}) {
  const guestReservations = reservations.filter((reservation) => reservation.email.toLowerCase() === guest.email.toLowerCase())
  const completedStays = guestReservations.filter((reservation) => reservation.folio === 'Checked Out')
  const cancelledStays = guestReservations.filter((reservation) => reservation.folio === 'Cancelled')
  const lifetimeRevenue = guestReservations.reduce((total, reservation) => total + reservationPaidAmount(reservation), 0)
  const nextReservation = guestReservations.find((reservation) => ['Confirmed', 'Pending Payment'].includes(reservation.folio))
  const activeReservation = guestReservations.find((reservation) => reservation.folio === 'Checked In')

  return (
    <aside className="flex max-h-[calc(100vh-118px)] min-h-0 flex-col border border-stone-200 bg-white shadow-sm xl:sticky xl:top-[84px]">
      <div className="flex items-center justify-between border-b border-stone-100 px-3 py-2.5">
        <h2 className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wide text-amber-900"><FileText aria-hidden="true" className="size-3" /> GUEST PROFILE &amp; FOLIO HISTORY</h2>
        <button type="button" onClick={onClose} aria-label="Close guest profile" className="text-muted hover:text-ink"><X aria-hidden="true" className="size-3.5" /></button>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        <section>
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 shrink-0 place-items-center bg-forest font-display text-base text-champagne">{initials(guest.name)}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-base leading-tight text-ink">{guest.name}</h3>
              <p className="mt-1 truncate text-[9px] text-muted">{guest.id}</p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="border border-stone-200 bg-stone-50 px-1.5 py-1 text-[9px] text-stone-700">{guest.id}</span>
            {activeReservation && <span className="bg-amber-100 px-1.5 py-1 text-[9px] font-semibold text-amber-950">In-House · {activeReservation.room} · {roomDisplayName(activeReservation.assignedRoomId, inventory)}</span>}
            {!activeReservation && nextReservation && <span className="bg-sky-50 px-1.5 py-1 text-[9px] font-semibold text-sky-900">Upcoming Stay</span>}
            <span className="inline-flex items-center gap-1 bg-amber-50 px-1.5 py-1 text-[9px] text-amber-950"><Crown aria-hidden="true" className="size-2.5" />{guest.tier} Service</span>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-x-3 gap-y-2 border border-stone-100 bg-stone-50/70 p-2.5 text-[9px]">
          <div className="min-w-0"><span className="text-muted">EMAIL ADDRESS</span><strong className="mt-0.5 block truncate font-medium text-ink">{guest.email}</strong></div>
          <div><span className="text-muted">PHONE NUMBER</span><strong className="mt-0.5 block font-medium text-ink">{guest.phone}</strong></div>
          <div><span className="text-muted">ORIGIN / RESIDENCE</span><strong className="mt-0.5 block font-medium text-ink">{guest.country}</strong></div>
          <div><span className="text-muted">REGISTERED MEMBER SINCE</span><strong className="mt-0.5 block font-medium text-ink">{formatReservationDate(guest.memberSince)} {guest.memberSince.slice(0, 4)}</strong></div>
        </section>

        <section>
          <h3 className="mb-1.5 text-[10px] font-semibold tracking-wide text-muted">GUEST FOLIO STATISTICS</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'TOTAL RESERVATIONS', value: guestReservations.length },
              { label: 'COMPLETED STAYS', value: completedStays.length },
              { label: 'CANCELLED', value: cancelledStays.length },
            ].map((stat) => (
              <div key={stat.label} className="border border-stone-100 bg-paper p-2">
                <span className="block text-[9px] leading-3 text-muted">{stat.label}</span>
                <strong className="mt-1 block font-display text-base text-ink">{stat.value}</strong>
              </div>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            <div className="bg-forest p-2.5 text-white">
              <span className="text-[9px] tracking-wide text-white/60">LIFETIME REVENUE (NGN)</span>
              <strong className="mt-1 block font-display text-sm text-champagne">{reservationCurrency.format(lifetimeRevenue)}</strong>
              <span className="text-[9px] text-white/60">Paid guest folios</span>
            </div>
            <div className="border border-stone-100 bg-paper p-2.5">
              <span className="text-[9px] tracking-wide text-muted">NEXT RESERVATION</span>
              {nextReservation ? (
                <>
                  <strong className="mt-1 block text-[10px] font-medium text-ink">{formatReservationDate(nextReservation.checkIn)} – {formatReservationDate(nextReservation.checkOut)}</strong>
                  <span className="mt-1 block truncate text-[9px] text-muted">{nextReservation.room} · {roomDisplayName(nextReservation.assignedRoomId, inventory)}</span>
                </>
              ) : <span className="mt-1 block text-[9px] text-muted">No upcoming stay</span>}
            </div>
          </div>
        </section>

        <section>
          <div className="mb-1.5 flex items-center justify-between">
            <h3 className="text-[10px] font-semibold tracking-wide text-ink">RESERVATION HISTORY</h3>
            <Link to="/dashboard/reservations" className="text-[10px] text-amber-800 hover:underline">Full Folio</Link>
          </div>
          {guestReservations.length ? (
            <div className="space-y-1.5">
              {guestReservations.map((reservation) => (
                <article key={reservation.reference} className="border border-stone-100 bg-white p-2">
                  <div className="flex items-start justify-between gap-2">
                    <strong className="text-[10px] font-semibold text-ink">{reservation.reference}</strong>
                    <span className={`shrink-0 px-1.5 py-0.5 text-[9px] ${reservation.folio === 'Checked In' ? 'bg-amber-50 text-amber-900' : reservation.folio === 'Cancelled' ? 'bg-rose-50 text-rose-800' : 'bg-stone-100 text-stone-600'}`}>{reservation.folio}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-ink">{reservation.room} · {roomDisplayName(reservation.assignedRoomId, inventory)} · {formatReservationDate(reservation.checkIn)} – {formatReservationDate(reservation.checkOut)}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[9px]">
                    <span>Paid {reservationCurrency.format(reservationPaidAmount(reservation))}</span>
                    <span className="border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-950">Remaining balance: {reservationCurrency.format(reservationBalanceDue(reservation))}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : <p className="border border-dashed border-stone-200 p-3 text-center text-[9px] text-muted">No reservation history yet.</p>}
        </section>
      </div>
      <footer className="grid grid-cols-2 gap-1.5 border-t border-stone-100 bg-paper p-2.5">
        <button type="button" onClick={onEdit} className="inline-flex items-center justify-center gap-1.5 bg-amber-900 px-2 py-2.5 text-[9px] font-semibold text-white hover:bg-amber-950"><Pencil aria-hidden="true" className="size-3" /> Edit Guest Profile</button>
        {activeReservation ? (
          <button type="button" onClick={onExtendStay} className="inline-flex items-center justify-center gap-1.5 border border-stone-300 bg-white px-2 py-2.5 text-[9px] font-semibold text-ink hover:bg-stone-50"><CalendarDays aria-hidden="true" className="size-3" /> Edit / Extend Stay</button>
        ) : nextReservation ? (
          <Link to="/dashboard/reservations" className="inline-flex items-center justify-center gap-1.5 border border-stone-300 bg-white px-2 py-2.5 text-[9px] font-semibold text-ink hover:bg-stone-50"><CalendarDays aria-hidden="true" className="size-3" /> View Reservation</Link>
        ) : (
          <Link to="/dashboard/reservations" className="inline-flex items-center justify-center gap-1.5 border border-stone-300 bg-white px-2 py-2.5 text-[9px] font-semibold text-ink hover:bg-stone-50"><CalendarDays aria-hidden="true" className="size-3" /> Create Reservation</Link>
        )}
      </footer>
    </aside>
  )
}

export function AdminGuests() {
  const { reservations, setReservations, rooms } = useAdminReservations()
  const [currentMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [guests, setGuests] = useState(() => createGuests(reservations))
  const [selectedId, setSelectedId] = useState(guests[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [tierFilter, setTierFilter] = useState('All Guest Types')
  const [countryFilter, setCountryFilter] = useState('All Countries')
  const [dateFilter, setDateFilter] = useState('All Dates')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<'add' | 'edit' | 'extend' | null>(null)

  const registeredGuests = useMemo(() => {
    const reservationGuests = createGuests(reservations)
    const emails = new Set(guests.map((guest) => guest.email.toLowerCase()))
    const additions = reservationGuests.filter((guest) => !emails.has(guest.email.toLowerCase()))
    return additions.length ? [...guests, ...additions] : guests
  }, [guests, reservations])

  const selectedGuest = registeredGuests.find((guest) => guest.id === selectedId)
  const selectedInHouseReservation = selectedGuest
    ? reservations.find((reservation) => reservation.email.toLowerCase() === selectedGuest.email.toLowerCase() && reservation.folio === 'Checked In')
    : undefined
  const returningCount = registeredGuests.filter((guest) => guest.returning).length
  const inHouseCount = registeredGuests.filter((guest) => guestStatus(reservations.filter((reservation) => reservation.email.toLowerCase() === guest.email.toLowerCase())) === 'In-House').length
  const newThisMonth = registeredGuests.filter((guest) => guest.memberSince.slice(0, 7) === currentMonth).length

  const filteredGuests = useMemo(() => registeredGuests.filter((guest) => {
    const relatedReservations = reservations.filter((reservation) => reservation.email.toLowerCase() === guest.email.toLowerCase())
    const status = guestStatus(relatedReservations)
    const searchValue = `${guest.id} ${guest.name} ${guest.email} ${guest.phone}`.toLowerCase()
    return (!query.trim() || searchValue.includes(query.trim().toLowerCase()))
      && (tierFilter === 'All Guest Types' || guest.tier === tierFilter)
      && (countryFilter === 'All Countries' || guest.country === countryFilter)
      && (dateFilter === 'All Dates' || guest.memberSince.slice(0, 7) === currentMonth)
      && (statusFilter === 'All Statuses' || status === statusFilter)
  }), [countryFilter, currentMonth, dateFilter, registeredGuests, query, reservations, statusFilter, tierFilter])

  const totalPages = Math.max(1, Math.ceil(filteredGuests.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleGuests = filteredGuests.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value)
    setPage(1)
  }

  function saveGuest(draft: GuestDraft) {
    if (dialog === 'edit' && selectedGuest) {
      setGuests((current) => current.map((guest) => guest.id === selectedGuest.id
        ? { ...guest, ...draft, countryCode: countryCodeFor(draft.country) }
        : guest))
    } else {
      const newGuest: Guest = {
        ...draft,
        id: `OPZY-GST-${String(Date.now()).slice(-4)}`,
        countryCode: countryCodeFor(draft.country),
        memberSince: new Date().toISOString().slice(0, 10),
        returning: false,
      }
      setGuests((current) => [newGuest, ...current])
      setSelectedId(newGuest.id)
      setPage(1)
    }
    setDialog(null)
  }

  function saveStayExtension(updatedReservation: Reservation) {
    setReservations((current) => current.map((reservation) => (
      reservation.reference === updatedReservation.reference ? updatedReservation : reservation
    )))
    setDialog(null)
  }

  function clearFilters() {
    setQuery('')
    setTierFilter('All Guest Types')
    setCountryFilter('All Countries')
    setDateFilter('All Dates')
    setStatusFilter('All Statuses')
    setPage(1)
  }

  const selectClass = 'h-9 min-w-0 appearance-none border border-stone-200 bg-stone-50 px-2 pr-7 text-[10px] text-ink outline-none focus:border-amber-800'

  return (
    <section className="mx-auto max-w-[1600px]">
      <header className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.17em] text-amber-800">GUEST DIRECTORY &amp; CRM</p>
          <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Guests Management</h1>
          <p className="mt-1 max-w-2xl text-[12px] text-muted sm:text-[13px]">View guest profiles, manage guest information, and monitor reservation history across Victoria Island wings.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => exportGuests(filteredGuests)} className="inline-flex items-center justify-center gap-2 border border-stone-300 bg-white px-3 py-2.5 text-[11px] font-semibold text-ink hover:bg-stone-50"><ArrowDownToLine aria-hidden="true" className="size-3.5" /> Export Guest Registry (.CSV)</button>
          <button type="button" onClick={() => setDialog('add')} className="inline-flex items-center justify-center gap-2 bg-amber-900 px-3 py-2.5 text-[11px] font-semibold text-white hover:bg-amber-950"><CirclePlus aria-hidden="true" className="size-3.5" /> Add New Guest</button>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'TOTAL GUESTS', value: registeredGuests.length.toLocaleString(), note: 'Registered guest profiles across all wings', icon: UsersRound },
          { label: 'RETURNING GUESTS', value: returningCount.toLocaleString(), note: `${registeredGuests.length ? Math.round(returningCount / registeredGuests.length * 100) : 0}% guest retention rate`, icon: RefreshCw, change: '+4.2% MoM' },
          { label: 'NEW GUESTS THIS MONTH', value: newThisMonth.toLocaleString(), note: 'Joined the OPZY guest registry', icon: UserRound },
          { label: 'CURRENTLY STAYING', value: inHouseCount.toLocaleString(), note: 'Active in-house guests in suites & villas', icon: BedDouble },
        ].map(({ label, value, note, icon: Icon, change }) => (
          <article key={label} className="border border-stone-200/80 bg-white p-3.5 shadow-sm sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold tracking-[0.12em] text-muted">{label}</span>
              <span className="grid size-8 place-items-center bg-paper text-forest"><Icon aria-hidden="true" className="size-4" /></span>
            </div>
            <strong className="mt-1 block font-display text-2xl text-ink">{value}</strong>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted">
              {change && <span className="bg-amber-50 px-1 py-0.5 font-semibold text-amber-900">{change}</span>}{note}
            </p>
          </article>
        ))}
      </div>

      <section className="mb-4 border border-stone-200 bg-white p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(190px,1.3fr)_repeat(4,minmax(120px,.8fr))_auto]">
          <label className="flex h-9 min-w-0 items-center gap-2 border border-stone-200 bg-stone-50 px-2">
            <Search aria-hidden="true" className="size-3.5 shrink-0 text-muted" />
            <span className="sr-only">Search guests</span>
            <input value={query} onChange={(event) => updateFilter(setQuery, event.target.value)} placeholder="Search guest, email, phone or ID..." className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-muted/70" />
          </label>
          <SelectFilter label="Guest type" value={tierFilter} options={['All Guest Types', ...guestTiers]} onChange={(value) => updateFilter(setTierFilter, value)} className={selectClass} />
          <SelectFilter label="Country" value={countryFilter} options={['All Countries', ...countries]} onChange={(value) => updateFilter(setCountryFilter, value)} className={selectClass} />
          <SelectFilter label="Registration date" value={dateFilter} options={['All Dates', 'This Month']} onChange={(value) => updateFilter(setDateFilter, value)} className={selectClass} />
          <SelectFilter label="Guest status" value={statusFilter} options={['All Statuses', 'In-House', 'Upcoming', 'Past Guest']} onChange={(value) => updateFilter(setStatusFilter, value)} className={selectClass} />
          <button type="button" onClick={clearFilters} className="inline-flex h-9 items-center justify-center gap-1 border border-stone-200 px-2 text-[10px] text-muted hover:bg-stone-50 hover:text-ink"><X aria-hidden="true" className="size-3" /> Clear Filters</button>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[9px] text-muted">
          <span className="inline-flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-amber-800" /> Showing {filteredGuests.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filteredGuests.length)} of {filteredGuests.length} guests</span>
          <span className="inline-flex items-center gap-1"><Clock3 aria-hidden="true" className="size-3" /> Guest registry synced with reservation folios</span>
        </div>
      </section>

      <div className={`grid items-start gap-4 ${selectedGuest ? 'xl:grid-cols-[minmax(0,1.45fr)_minmax(285px,.9fr)]' : 'grid-cols-1'}`}>
        <section className="min-w-0 overflow-hidden border border-stone-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] table-fixed border-collapse text-left">
              <thead className="bg-stone-100 text-[11px] font-semibold tracking-wide text-stone-600">
                <tr>
                  <th className="w-[18%] px-3 py-2.5">GUEST ID</th>
                  <th className="w-[28%] px-3 py-2.5">GUEST NAME</th>
                  <th className="w-[37%] px-3 py-2.5">CONTACT</th>
                  <th className="w-[17%] px-3 py-2.5">COUNTRY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {visibleGuests.map((guest) => {
                  const relatedReservations = reservations.filter((reservation) => reservation.email.toLowerCase() === guest.email.toLowerCase())
                  const status = guestStatus(relatedReservations)
                  const active = selectedId === guest.id
                  const currentStay = relatedReservations.find((reservation) => reservation.folio === 'Checked In')
                    ?? relatedReservations.find((reservation) => ['Confirmed', 'Pending Payment'].includes(reservation.folio))
                  return (
                    <tr key={guest.id} onClick={() => setSelectedId(guest.id)} className={`cursor-pointer transition-colors hover:bg-amber-50/40 ${active ? 'bg-amber-50/50' : 'bg-white'}`}>
                      <td className={`border-l-2 px-3 py-2.5 align-top text-[11px] text-stone-600 ${active ? 'border-amber-800' : 'border-transparent'}`}>
                        <span className="font-mono">{guest.id}</span>
                        <span className={`mt-1 block w-fit border px-1.5 py-0.5 ${guestStatusClass(status)}`}>{status}</span>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <span className="flex items-center gap-2">
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-stone-100 text-[10px] font-semibold text-forest">{initials(guest.name)}</span>
                          <span className="min-w-0">
                            <strong className="block text-[12px] font-medium leading-tight text-ink">{guest.name}</strong>
                            <small className="mt-0.5 block truncate text-[10px] text-muted">{guest.tier}</small>
                            {currentStay && <small className="mt-0.5 block truncate text-[10px] text-muted">{roomDisplayName(currentStay.assignedRoomId, rooms)}</small>}
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 align-top text-[11px] text-muted">
                        <span className="flex min-w-0 items-center gap-1"><Mail aria-hidden="true" className="size-2.5 shrink-0 text-amber-800" /><span className="truncate">{guest.email}</span></span>
                        <span className="mt-1 flex items-center gap-1"><Phone aria-hidden="true" className="size-2.5 shrink-0 text-muted" />{guest.phone}</span>
                      </td>
                      <td className="px-3 py-2.5 align-top text-[11px] text-ink"><span className="mr-1">{countryFlag(guest.countryCode)}</span>{guest.country}</td>
                    </tr>
                  )
                })}
                {visibleGuests.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-12 text-center">
                    <UsersRound aria-hidden="true" className="mx-auto size-6 text-muted" />
                    <p className="mt-2 font-display text-lg text-ink">No guests found</p>
                    <p className="mt-1 text-[11px] text-muted">Try adjusting your filters or add a new guest.</p>
                    <button type="button" onClick={() => setDialog('add')} className="mt-3 inline-flex items-center gap-1.5 bg-forest px-3 py-2 text-[10px] font-semibold text-white"><Plus aria-hidden="true" className="size-3" /> Add Guest</button>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          <footer className="flex flex-col gap-2 border-t border-stone-200 bg-white px-3 py-2.5 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
            <span>Showing {filteredGuests.length ? (currentPage - 1) * pageSize + 1 : 0} to {Math.min(currentPage * pageSize, filteredGuests.length)} of {filteredGuests.length} guests</span>
            <div className="flex items-center gap-1.5">
              <span className="mr-1">Rows per page: {pageSize}</span>
              <button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Previous page" className="grid size-7 place-items-center border border-stone-200 disabled:opacity-40"><ChevronLeft aria-hidden="true" className="size-3.5" /></button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button type="button" key={pageNumber} aria-current={currentPage === pageNumber ? 'page' : undefined} onClick={() => setPage(pageNumber)} className={`grid size-7 place-items-center border text-[10px] ${currentPage === pageNumber ? 'border-forest bg-forest font-semibold text-white' : 'border-stone-200 hover:bg-stone-50'}`}>{pageNumber}</button>
              ))}
              <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} aria-label="Next page" className="grid size-7 place-items-center border border-stone-200 disabled:opacity-40"><ChevronRight aria-hidden="true" className="size-3.5" /></button>
            </div>
          </footer>
        </section>
        {selectedGuest && <GuestInspector guest={selectedGuest} reservations={reservations} inventory={rooms} onEdit={() => setDialog('edit')} onExtendStay={() => setDialog('extend')} onClose={() => setSelectedId('')} />}
      </div>

      <footer className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-stone-200 py-3 text-[9px] text-muted">
        <span className="text-forest">✥ OPZY Luxury Hotel &amp; Suites — Lagos Operations</span>
        <span aria-hidden="true">|</span>
        <span>Victoria Island, Lagos, Nigeria</span>
        <span className="ml-auto hidden items-center gap-1 font-mono sm:inline-flex"><Globe2 aria-hidden="true" className="size-3" /> SYSTEM SECURE · ENCRYPTED AUDIT FOLIO V4.1</span>
      </footer>

      {(dialog === 'add' || dialog === 'edit') && (
        <GuestDialog
          guest={dialog === 'edit' ? selectedGuest : undefined}
          onClose={() => setDialog(null)}
          onSave={saveGuest}
        />
      )}
      {dialog === 'extend' && selectedInHouseReservation && (
        <ExtendStayDialog reservation={selectedInHouseReservation} onClose={() => setDialog(null)} onSave={saveStayExtension} />
      )}
    </section>
  )
}

function SelectFilter({ label, value, options, onChange, className }: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
  className: string
}) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select className={`${className} w-full`} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-3 size-3 text-muted" />
    </label>
  )
}

function countryCodeFor(country: string) {
  const codes: Record<string, string> = { Nigeria: 'NG', 'United Kingdom': 'GB', Ghana: 'GH', Switzerland: 'CH' }
  return codes[country] ?? ''
}
