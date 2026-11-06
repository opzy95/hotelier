import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Search,
  UsersRound,
  Wallet,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAdminReservations } from './AdminReservationsContext'
import {
  formatReservationDate,
  reservationBalanceDue,
  reservationCollectedAmount,
  reservationCurrency,
  reservationOutstandingAmount,
  reservationPaidAmount,
} from './adminReservationsData'
import { getOperationalRooms, getRoomStatusCounts } from './adminRoomsData'
import { useAdminStaff } from './AdminStaffContext'

type OperationTab = 'Arrivals' | 'Departures'
type OperationStatus = 'Check In' | 'Checked In' | 'Pre-Assigned' | 'Check Out' | 'Checked Out'

type Operation = {
  guest: string
  room: string
  tier: string
  time: string
  service: string
  status: OperationStatus
}

const initialOperations: Operation[] = [
  { guest: 'Chief A. Adeleke', room: 'Executive Lagoon Suite · Room 402', tier: 'VIP BUTLER', time: '14:00 WAT', service: 'Lagoon Jetty Shuttle', status: 'Check In' },
  { guest: 'Lady K. Danjuma', room: 'Presidential Sanctuary · Penthouse A', tier: 'PRESIDENTIAL', time: '15:30 WAT', service: 'Private Yacht Charter', status: 'Check In' },
  { guest: 'Folake Solanke-Bello', room: 'Waterfront Haven Villa · Villa 08', tier: '', time: '16:45 WAT', service: 'Private Sedan Escort', status: 'Pre-Assigned' },
  { guest: 'Dr. Obinna Okonkwo', room: 'Deluxe Lagoon Room · Room 216', tier: 'CORPORATE', time: '11:00 WAT', service: 'Airport Transfer', status: 'Check Out' },
  { guest: 'Ambassador G. Moreau', room: 'Executive Lagoon Suite · Room 518', tier: 'DIPLOMATIC', time: '12:00 WAT', service: 'Private Sedan Escort', status: 'Check Out' },
]

function reservationStatusClass(status: string) {
  if (status === 'Confirmed') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (status === 'Checked In') return 'border-forest/20 bg-forest/10 text-forest'
  if (status === 'Pending' || status === 'Pending Payment') return 'border-amber-200 bg-amber-50 text-amber-800'
  if (status === 'Cancelled') return 'border-rose-200 bg-rose-50 text-rose-700'
  return 'border-stone-200 bg-stone-100 text-stone-600'
}

function MetricCard({ label, value, note, icon: Icon, change }: {
  label: string
  value: string
  note: string
  icon: typeof CalendarDays
  change?: string
}) {
  return (
    <article className="rounded-sm border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] font-semibold tracking-[0.13em] text-muted">{label}</span>
        <span className="grid size-8 place-items-center rounded-sm bg-paper text-amber-800"><Icon aria-hidden="true" className="size-4" /></span>
      </div>
      <strong className="mt-3 block font-display text-2xl text-ink sm:text-[28px]">{value}</strong>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted">
        {change && <span className="rounded-sm bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-800">{change}</span>}
        {note}
      </p>
    </article>
  )
}

export function AdminDashboard() {
  const { reservations, rooms } = useAdminReservations()
  const { staff, departments } = useAdminStaff()
  const [operationTab, setOperationTab] = useState<OperationTab>('Arrivals')
  const [operations, setOperations] = useState(initialOperations)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const rowsPerPage = 5

  const filteredReservations = useMemo(() => {
    const query = search.trim().toLowerCase()
    return reservations.filter((reservation) => (
      !query
      || reservation.reference.toLowerCase().includes(query)
      || reservation.guest.toLowerCase().includes(query)
      || reservation.room.toLowerCase().includes(query)
      || reservation.email.toLowerCase().includes(query)
    ))
  }, [reservations, search])
  const totalPages = Math.max(1, Math.ceil(filteredReservations.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const visibleReservations = filteredReservations.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const activeOperations = operations.filter((operation) => (
    operationTab === 'Arrivals'
      ? operation.status === 'Check In' || operation.status === 'Checked In' || operation.status === 'Pre-Assigned'
      : operation.status === 'Check Out' || operation.status === 'Checked Out'
  ))
  const operationalRooms = useMemo(() => getOperationalRooms(rooms, reservations), [reservations, rooms])
  const roomCounts = getRoomStatusCounts(operationalRooms)
  const onDutyStaff = staff.filter((member) => member.status === 'On Duty').length
  const roomStatuses = [
    { label: 'Available', count: roomCounts.Available, dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
    { label: 'Occupied', count: roomCounts.Occupied, dot: 'bg-amber-800', bar: 'bg-amber-800' },
    { label: 'Reserved', count: roomCounts.Reserved, dot: 'bg-sky-500', bar: 'bg-sky-500' },
    { label: 'Cleaning', count: roomCounts.Cleaning, dot: 'bg-amber-400', bar: 'bg-amber-400' },
    { label: 'Maintenance / Inspection', count: roomCounts.Maintenance, dot: 'bg-rose-500', bar: 'bg-rose-500' },
  ]
  const collectedAmount = reservationCollectedAmount(reservations)
  const outstandingAmount = reservationOutstandingAmount(reservations)
  const paymentPositionTotal = collectedAmount + outstandingAmount
  const collectedShare = paymentPositionTotal ? (collectedAmount / paymentPositionTotal) * 100 : 0

  function updateOperationStatus(operation: Operation) {
    setOperations((current) => current.map((item) => (
      item === operation
        ? { ...item, status: operationTab === 'Arrivals' ? 'Checked In' : 'Checked Out' }
        : item
    )))
  }

  return (
    <section className="mx-auto max-w-[1600px]">
      <header className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-[9px] font-semibold tracking-[0.17em] text-amber-800">EXECUTIVE OPERATIONS</p>
          <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Dashboard Overview</h1>
          <p className="mt-1 text-xs text-muted">Welcome back, General Manager <span className="mx-1">·</span> Friday, 24 October 2025 <span className="mx-1">·</span> Victoria Island Lagoon Front</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="flex min-w-0 items-center gap-2 rounded-sm border border-stone-200 bg-white px-3 py-2 sm:w-64">
            <Search aria-hidden="true" className="size-4 shrink-0 text-muted" />
            <span className="sr-only">Search reservations, guests, or folios</span>
            <input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1) }}
              placeholder="Search reservations, guests, or folios"
              className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-muted/70"
            />
          </label>
          <Link to="/dashboard/reservations" className="inline-flex items-center justify-center gap-2 rounded-sm bg-forest px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-forest-deep">
            <span aria-hidden="true">+</span> Quick Action
          </Link>
        </div>
      </header>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        <MetricCard label="TOTAL RESERVATIONS" value={String(reservations.length)} note="Reservations currently available" icon={CalendarDays} />
        <MetricCard label="PAYMENTS RECEIVED" value={reservationCurrency.format(collectedAmount)} note="Across all reservation folios" icon={Wallet} />
        <MetricCard label="OCCUPANCY RATE" value={`${rooms.length ? Math.round((roomCounts.Occupied / rooms.length) * 100) : 0}%`} note={`Current room occupancy · ${roomCounts.Occupied} / ${rooms.length} rooms`} icon={BedDouble} />
        <MetricCard label="TOTAL STAFF" value={String(staff.length)} note={`${onDutyStaff} on duty · ${departments.length} departments`} icon={UsersRound} />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 2xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
        <div className="grid min-w-0 gap-4">
          <article className="overflow-hidden rounded-sm border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[9px] font-semibold tracking-[0.15em] text-amber-800">LIVE FOLIO SETTLEMENTS</p>
                <h2 className="mt-1 font-display text-xl text-ink">Payment Position</h2>
              </div>
              <Link to="/dashboard/payments" className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-900 hover:underline">Open Payments <ArrowRight aria-hidden="true" className="size-3" /></Link>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-[9px] font-semibold tracking-[0.12em] text-muted">PAYMENTS RECEIVED</p>
                <strong className="mt-1 block font-display text-2xl text-ink">{reservationCurrency.format(collectedAmount)}</strong>
                <p className="mt-1 text-[10px] text-muted">Across all reservation folios</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold tracking-[0.12em] text-muted">OUTSTANDING BALANCE</p>
                <strong className="mt-1 block font-display text-2xl text-amber-900">{reservationCurrency.format(outstandingAmount)}</strong>
                <p className="mt-1 text-[10px] text-muted">Still due on active folios</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="h-2 overflow-hidden bg-amber-100" role="img" aria-label={`${collectedShare.toFixed(0)} percent of recorded active folio value collected`}>
                <div className="h-full bg-forest transition-[width]" style={{ width: `${collectedShare}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap justify-between gap-2 text-[9px] text-muted">
                <span>Collected · {collectedShare.toFixed(0)}%</span>
                <span>Outstanding · {(100 - collectedShare).toFixed(0)}%</span>
              </div>
            </div>
          </article>

          <article className="min-w-0 overflow-hidden rounded-sm border border-stone-200/80 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <p className="text-[9px] font-semibold tracking-[0.15em] text-amber-800">LIVE FOLIO REGISTRY</p>
                <h2 className="mt-1 font-display text-xl text-ink">Recent Reservations</h2>
              </div>
              <Link to="/dashboard/reservations" className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-900 hover:underline">
                View All Reservations <ArrowRight aria-hidden="true" className="size-3" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-[10px]">
                <thead className="bg-stone-50 text-[9px] tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">BOOKING REF</th>
                    <th className="px-4 py-3 font-semibold">GUEST NAME</th>
                    <th className="px-4 py-3 font-semibold">ROOM TYPE</th>
                    <th className="px-4 py-3 font-semibold">DATES</th>
                    <th className="px-4 py-3 font-semibold">AMOUNT (₦)</th>
                    <th className="px-4 py-3 font-semibold">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {visibleReservations.map((reservation) => (
                    <tr key={reservation.reference} className="text-muted hover:bg-paper/60">
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-forest">{reservation.reference}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink">{reservation.guest}<small className="mt-1 block text-[9px] text-muted">{reservation.tier}</small></td>
                      <td className="whitespace-nowrap px-4 py-3">{reservation.room}</td>
                      <td className="whitespace-nowrap px-4 py-3">{formatReservationDate(reservation.checkIn)} – {formatReservationDate(reservation.checkOut)}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">
                        {reservationCurrency.format(reservation.amount)}
                        {reservation.payment === 'Partially Paid' && (
                          <small className="mt-1 block font-normal text-amber-900">
                            Paid {reservationCurrency.format(reservationPaidAmount(reservation))} · Due {reservationCurrency.format(reservationBalanceDue(reservation))}
                          </small>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-medium ${reservationStatusClass(reservation.folio)}`}>{reservation.folio}</span>
                      </td>
                    </tr>
                  ))}
                  {visibleReservations.length === 0 && (
                    <tr><td className="px-4 py-8 text-center text-muted" colSpan={6}>No reservations match your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-stone-100 px-4 py-3 text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between">
              <span>Showing {visibleReservations.length ? (currentPage - 1) * rowsPerPage + 1 : 0}–{Math.min(currentPage * rowsPerPage, filteredReservations.length)} of {filteredReservations.length} active folios</span>
              <div className="flex items-center gap-1" aria-label="Reservation pagination">
                <button type="button" aria-label="Previous reservations page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="grid size-7 place-items-center rounded border border-stone-200 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronLeft aria-hidden="true" className="size-3.5" />
                </button>
                <span className="grid size-7 place-items-center rounded bg-paper text-ink">{currentPage}</span>
                <span className="px-1">of {totalPages}</span>
                <button type="button" aria-label="Next reservations page" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} className="grid size-7 place-items-center rounded border border-stone-200 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronRight aria-hidden="true" className="size-3.5" />
                </button>
              </div>
            </div>
          </article>
        </div>

        <div className="grid min-w-0 gap-4">
          <article className="rounded-sm border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold tracking-[0.15em] text-amber-800">INVENTORY HEALTH</p>
                <h2 className="mt-1 font-display text-xl text-ink">Room Status Overview</h2>
              </div>
              <span className="rounded-sm bg-stone-100 px-2 py-1 text-[9px] font-semibold text-ink">{rooms.length} TOTAL ROOMS</span>
            </div>
            <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-stone-100" aria-label="Room status distribution">
              {roomStatuses.map((status) => <span key={status.label} className={`${status.bar} h-full`} style={{ width: `${rooms.length ? (status.count / rooms.length) * 100 : 0}%` }} title={`${status.label}: ${status.count}`} />)}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {roomStatuses.map((status) => (
                <div key={status.label} className="flex min-w-0 items-center justify-between gap-2 rounded-sm bg-paper px-2.5 py-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-[10px] text-muted"><i className={`size-1.5 shrink-0 rounded-full ${status.dot}`} /><span className="truncate">{status.label}</span></span>
                  <strong className="text-[10px] text-ink">{status.count}</strong>
                </div>
              ))}
            </div>
            <p className="mt-4 flex flex-col gap-1 border-t border-stone-100 pt-3 text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between">
              <span>Housekeeping turnaround · ~38 mins</span>
              <Link to="/dashboard/rooms" className="font-medium text-amber-900 hover:underline">Manage Housekeeping →</Link>
            </p>
          </article>

          <article className="rounded-sm border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 border-b border-stone-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[9px] font-semibold tracking-[0.15em] text-amber-800">FLOOR DISPATCH</p>
                <h2 className="mt-1 font-display text-xl text-ink">Today’s Operations</h2>
              </div>
              <div className="flex rounded-sm bg-stone-100 p-1" role="group" aria-label="Guest operations">
                {(['Arrivals', 'Departures'] as const).map((tab) => {
                  const count = operations.filter((item) => tab === 'Arrivals'
                    ? item.status === 'Check In' || item.status === 'Checked In' || item.status === 'Pre-Assigned'
                    : item.status === 'Check Out' || item.status === 'Checked Out').length
                  return (
                    <button
                      type="button"
                      key={tab}
                      aria-pressed={operationTab === tab}
                      onClick={() => setOperationTab(tab)}
                      className={`rounded-sm px-2 py-1.5 text-[9px] ${operationTab === tab ? 'bg-forest text-white' : 'text-muted hover:text-ink'}`}
                    >
                      {tab} ({count})
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="mt-3 grid gap-2">
              {activeOperations.length ? activeOperations.map((operation) => {
                const complete = operation.status === 'Checked In' || operation.status === 'Checked Out'
                const preAssigned = operation.status === 'Pre-Assigned'
                return (
                  <article key={operation.guest} className="rounded-sm bg-paper p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <strong className="block text-xs text-ink">{operation.guest}</strong>
                        <span className="mt-1 block text-[10px] text-muted">{operation.room}</span>
                      </div>
                      {operation.tier && <span className="shrink-0 rounded-sm bg-champagne/50 px-1.5 py-1 text-[8px] font-semibold text-amber-950">{operation.tier}</span>}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1 text-[9px] text-muted"><Clock3 aria-hidden="true" className="size-3 shrink-0" />{operation.time} · {operation.service}</span>
                      <button
                        type="button"
                        disabled={complete || preAssigned}
                        onClick={() => updateOperationStatus(operation)}
                        className={`shrink-0 rounded-sm px-2 py-1.5 text-[9px] font-medium transition-colors disabled:cursor-default ${
                          complete ? 'bg-emerald-100 text-emerald-800'
                            : preAssigned ? 'bg-stone-200 text-stone-600'
                              : 'bg-forest text-white hover:bg-forest-deep'
                        }`}
                      >
                        {operation.status}
                      </button>
                    </div>
                  </article>
                )
              }) : <p className="py-6 text-center text-xs text-muted">No operations in this list.</p>}
            </div>
            <p className="mt-3 flex items-center justify-between border-t border-stone-100 pt-3 text-[10px] text-muted">
              <span>Today’s dispatch schedule</span>
              <Link to="/dashboard/check-in" className="font-medium text-amber-900 hover:underline">View operations →</Link>
            </p>
          </article>

          <article className="rounded-sm border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-semibold tracking-[0.15em] text-amber-800">STAFFING HIERARCHY</p>
                <h2 className="mt-1 font-display text-xl text-ink">Department Overview</h2>
              </div>
                <span className="text-[9px] font-semibold text-emerald-800">{staff.length} PERSONNEL</span>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-muted">{departments.length} operational divisions across the property:</p>
            <ul className="mt-3 grid gap-2">
              {departments.map((department) => {
                const departmentStaff = staff.filter((member) => member.departmentId === department.id)
                const onDuty = departmentStaff.filter((member) => member.status === 'On Duty').length
                return (
                <li key={department.id} className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="flex min-w-0 items-center gap-2 text-muted"><span className="grid size-5 shrink-0 place-items-center bg-paper text-[8px] font-bold text-amber-900">{department.shortName}</span><span>{department.name}</span></span>
                  <strong className="shrink-0 rounded-sm bg-stone-100 px-2 py-1 text-[9px] text-ink">{onDuty} on duty</strong>
                </li>
                )
              })}
            </ul>
            <p className="mt-3 border-t border-stone-100 pt-3 text-right">
              <Link to="/dashboard/staff" className="text-[10px] font-medium text-amber-900 hover:underline">Manage Staff &amp; Roster →</Link>
            </p>
          </article>
        </div>
      </div>

      <div className="sr-only" aria-live="polite">
        <span>{filteredReservations.length} reservations found.</span>
      </div>
    </section>
  )
}
