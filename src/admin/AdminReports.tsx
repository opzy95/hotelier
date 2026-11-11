import { useMemo, useState } from 'react'
import { BedDouble, CalendarDays, CircleCheck, Download, Search, Wallet } from 'lucide-react'
import { useAdminReservations } from './AdminReservationsContext'
import {
  formatReservationDate,
  reservationBalanceDue,
  reservationCollectedAmount,
  reservationCurrency,
  reservationOutstandingAmount,
  reservationPaidAmount,
} from './adminReservationsData'
import { getRoomStatusCounts } from './adminRoomsData'
import type { Reservation } from './adminReservationsData'

type StayPeriod = 'All Stays' | 'This Month' | 'Next 30 Days' | 'Past Stays'

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function exportReport(rows: Reservation[]) {
  const columns = ['reference', 'guest', 'room', 'assignedRoomId', 'checkIn', 'checkOut', 'adults', 'children', 'amount', 'paidAmount', 'balanceDue', 'payment', 'folio']
  const escapeValue = (value: string | number | undefined) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const content = [
    columns.join(','),
    ...rows.map((reservation) => [
      reservation.reference,
      reservation.guest,
      reservation.room,
      reservation.assignedRoomId,
      reservation.checkIn,
      reservation.checkOut,
      reservation.adults,
      reservation.children,
      reservation.amount,
      reservationPaidAmount(reservation),
      reservationBalanceDue(reservation),
      reservation.payment,
      reservation.folio,
    ].map(escapeValue).join(',')),
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'opzy-stay-report.csv'
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function AdminReports() {
  const { reservations, rooms } = useAdminReservations()
  const [period, setPeriod] = useState<StayPeriod>('All Stays')
  const [search, setSearch] = useState('')
  const today = dateKey(new Date())
  const endOfNext30Days = new Date()
  endOfNext30Days.setDate(endOfNext30Days.getDate() + 30)
  const next30DayKey = dateKey(endOfNext30Days)

  const periodReservations = useMemo(() => reservations.filter((reservation) => {
    if (period === 'All Stays') return true
    if (period === 'This Month') {
      const stayDate = new Date(`${reservation.checkIn}T12:00:00`)
      const currentDate = new Date(`${today}T12:00:00`)
      return stayDate.getMonth() === currentDate.getMonth() && stayDate.getFullYear() === currentDate.getFullYear()
    }
    if (period === 'Next 30 Days') return reservation.checkIn >= today && reservation.checkIn <= next30DayKey
    return reservation.checkOut <= today
  }), [next30DayKey, period, reservations, today])

  const query = search.trim().toLowerCase()
  const filteredReservations = useMemo(() => periodReservations.filter((reservation) => (
    !query || `${reservation.reference} ${reservation.guest} ${reservation.room} ${reservation.assignedRoomId ?? ''}`.toLowerCase().includes(query)
  )), [periodReservations, query])

  const operationalRooms = rooms.filter((room) => room.active)
  const roomCounts = getRoomStatusCounts(operationalRooms)
  const currentlyStaying = reservations.filter((reservation) => reservation.folio === 'Checked In').length
  const upcoming = periodReservations.filter((reservation) => (
    reservation.checkIn > today && ['Confirmed', 'Pending Payment'].includes(reservation.folio)
  )).length
  const collectedAmount = reservationCollectedAmount(periodReservations)
  const outstandingAmount = reservationOutstandingAmount(periodReservations)
  const roomStatusRows = [
    { label: 'Available', count: roomCounts.Available, color: 'bg-emerald-600', text: 'text-emerald-800' },
    { label: 'Occupied', count: roomCounts.Occupied, color: 'bg-sky-700', text: 'text-sky-800' },
    { label: 'Reserved', count: roomCounts.Reserved, color: 'bg-amber-700', text: 'text-amber-900' },
  ]
  const totalRooms = operationalRooms.length

  return (
    <section className="mx-auto max-w-[1600px]">
      <header className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.17em] text-amber-800">PROPERTY PERFORMANCE</p>
          <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Reports</h1>
          <p className="mt-1 max-w-2xl text-[11px] text-muted sm:text-[13px]">Reservation, collection, and room inventory activity from the shared hotel records.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex h-9 items-center gap-2 border border-stone-200 bg-white px-2.5 text-[10px] font-medium text-ink">
            <CalendarDays aria-hidden="true" className="size-3.5 text-amber-900" />
            <span className="sr-only">Stay reporting period</span>
            <select value={period} onChange={(event) => setPeriod(event.target.value as StayPeriod)} className="bg-transparent outline-none">
              {(['All Stays', 'This Month', 'Next 30 Days', 'Past Stays'] as StayPeriod[]).map((option) => <option key={option}>{option}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => exportReport(filteredReservations)} className="inline-flex h-9 items-center gap-1.5 border border-stone-300 bg-white px-3 text-[10px] font-semibold text-ink hover:bg-stone-50"><Download aria-hidden="true" className="size-3.5" /> Export CSV</button>
        </div>
      </header>

      <div className="mb-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
        <article className="border border-stone-200 bg-white p-3.5 shadow-sm sm:p-4">
          <div className="flex items-center justify-between gap-2"><span className="text-[9px] font-semibold tracking-[0.12em] text-muted">RESERVATIONS</span><CalendarDays aria-hidden="true" className="size-4 text-forest" /></div>
          <strong className="mt-2 block font-display text-2xl text-ink">{periodReservations.length}</strong>
          <p className="mt-1 text-[9px] text-muted">{upcoming} upcoming stays in this period</p>
        </article>
        <article className="border border-stone-200 bg-white p-3.5 shadow-sm sm:p-4">
          <div className="flex items-center justify-between gap-2"><span className="text-[9px] font-semibold tracking-[0.12em] text-muted">PAYMENTS RECEIVED</span><Wallet aria-hidden="true" className="size-4 text-forest" /></div>
          <strong className="mt-2 block font-display text-xl text-ink sm:text-2xl">{reservationCurrency.format(collectedAmount)}</strong>
          <p className="mt-1 text-[9px] text-muted">For folios with check-in dates in this period</p>
        </article>
        <article className="border border-stone-200 bg-white p-3.5 shadow-sm sm:p-4">
          <div className="flex items-center justify-between gap-2"><span className="text-[9px] font-semibold tracking-[0.12em] text-muted">OUTSTANDING BALANCE</span><Wallet aria-hidden="true" className="size-4 text-amber-800" /></div>
          <strong className="mt-2 block font-display text-xl text-amber-900 sm:text-2xl">{reservationCurrency.format(outstandingAmount)}</strong>
          <p className="mt-1 text-[9px] text-muted">Due across active folios in this period</p>
        </article>
        <article className="border border-stone-200 bg-white p-3.5 shadow-sm sm:p-4">
          <div className="flex items-center justify-between gap-2"><span className="text-[9px] font-semibold tracking-[0.12em] text-muted">CURRENTLY STAYING</span><BedDouble aria-hidden="true" className="size-4 text-forest" /></div>
          <strong className="mt-2 block font-display text-2xl text-ink">{currentlyStaying}</strong>
          <p className="mt-1 text-[9px] text-muted">Checked-in folios across the property</p>
        </article>
      </div>

      <section className="mb-4 border border-stone-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div><p className="text-[9px] font-semibold tracking-[0.13em] text-amber-800">LIVE INVENTORY</p><h2 className="mt-1 font-display text-lg text-ink">Room Status Summary</h2></div>
          <span className="text-[9px] text-muted">{totalRooms} total rooms</span>
        </div>
        <div className="mt-3 flex h-2 overflow-hidden bg-stone-100" role="img" aria-label={`${totalRooms} rooms by current status`}>
          {roomStatusRows.map(({ label, count, color }) => <span key={label} className={`${color} h-full`} style={{ width: `${totalRooms ? (count / totalRooms) * 100 : 0}%` }} title={`${label}: ${count}`} />)}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-5">
          {roomStatusRows.map(({ label, count, color, text }) => <div key={label} className="flex items-center gap-2 text-[10px]"><i className={`size-2 shrink-0 ${color}`} /><span className="text-muted">{label}</span><strong className={`ml-auto ${text}`}>{count}</strong></div>)}
        </div>
      </section>

      <section className="overflow-hidden border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-stone-100 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-[9px] font-semibold tracking-[0.13em] text-amber-800">FOLIO DETAIL</p><h2 className="mt-1 font-display text-lg text-ink">Reservation Report</h2></div>
          <label className="flex h-9 min-w-0 items-center gap-2 border border-stone-200 bg-stone-50 px-2 sm:w-72">
            <Search aria-hidden="true" className="size-3.5 shrink-0 text-muted" />
            <span className="sr-only">Search reservation report</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search guest, folio or room..." className="min-w-0 flex-1 bg-transparent text-[10px] outline-none placeholder:text-muted/70" />
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[970px] border-collapse text-left">
            <thead className="bg-stone-50 text-[9px] font-semibold tracking-[0.1em] text-muted">
              <tr><th className="px-3 py-3">GUEST / FOLIO</th><th className="px-3 py-3">ROOM</th><th className="px-3 py-3">STAY</th><th className="px-3 py-3">PARTY</th><th className="px-3 py-3">TOTAL</th><th className="px-3 py-3">PAID / BALANCE</th><th className="px-3 py-3">STATUS</th></tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredReservations.map((reservation) => (
                <tr key={reservation.reference} className="text-[10px] hover:bg-paper/60">
                  <td className="px-3 py-3"><strong className="block font-medium text-ink">{reservation.guest}</strong><span className="mt-1 block text-[9px] text-muted">{reservation.reference}</span></td>
                  <td className="px-3 py-3"><strong className="block font-medium text-ink">{reservation.room}</strong><span className="mt-1 block text-[9px] text-muted">{reservation.assignedRoomId ? `Room ${reservation.assignedRoomId}` : 'Unassigned'}</span></td>
                  <td className="whitespace-nowrap px-3 py-3 text-ink">{formatReservationDate(reservation.checkIn)} – {formatReservationDate(reservation.checkOut)}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-ink">{reservation.adults} adults · {reservation.children} children</td>
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-ink">{reservationCurrency.format(reservation.amount)}</td>
                  <td className="whitespace-nowrap px-3 py-3"><strong className="block font-medium text-emerald-800">{reservationCurrency.format(reservationPaidAmount(reservation))}</strong><span className="mt-1 block text-[9px] text-muted">Due {reservationCurrency.format(reservationBalanceDue(reservation))}</span></td>
                  <td className="px-3 py-3"><span className="inline-flex border border-stone-200 bg-stone-50 px-2 py-1 text-[8px] font-semibold text-ink">{reservation.folio}</span><span className="mt-1 block text-[9px] text-muted">{reservation.payment}</span></td>
                </tr>
              ))}
              {!filteredReservations.length && <tr><td colSpan={7} className="px-4 py-12 text-center"><CircleCheck aria-hidden="true" className="mx-auto size-5 text-stone-400" /><p className="mt-2 font-display text-base text-ink">No matching reservations</p><p className="mt-1 text-[10px] text-muted">Change the period or search term and try again.</p></td></tr>}
            </tbody>
          </table>
        </div>
        <footer className="flex flex-wrap justify-between gap-2 border-t border-stone-100 bg-stone-50/70 px-3 py-2.5 text-[9px] text-muted"><span>{filteredReservations.length} folios shown · Payments grouped by stay check-in date</span><span>{period}</span></footer>
      </section>
    </section>
  )
}