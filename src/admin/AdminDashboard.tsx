import { useMemo, useState } from 'react'
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Search,
  Sparkles,
  TrendingUp,
  UsersRound,
  Wallet,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import { useAdminReservations } from './AdminReservationsContext'
import { formatReservationDate, reservationBalanceDue, reservationCurrency, reservationPaidAmount } from './adminReservationsData'

type RevenuePeriod = 'This Week' | 'This Month' | 'This Year'
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

const revenueData: Record<RevenuePeriod, { label: string; revenue: number; prior: number }[]> = {
  'This Week': [
    { label: 'Mon', revenue: 4.2, prior: 3.8 },
    { label: 'Tue', revenue: 5.1, prior: 4.1 },
    { label: 'Wed', revenue: 7.8, prior: 5.2 },
    { label: 'Thu', revenue: 9.1, prior: 6.1 },
    { label: 'Fri', revenue: 8.8, prior: 7.3 },
    { label: 'Sat', revenue: 11.4, prior: 8.1 },
    { label: 'Sun', revenue: 12.2, prior: 9.2 },
  ],
  'This Month': [
    { label: 'Week 1', revenue: 5.2, prior: 4.1 },
    { label: 'Week 2', revenue: 10.1, prior: 5.4 },
    { label: 'Week 3', revenue: 13.2, prior: 7.1 },
    { label: 'Week 4', revenue: 13, prior: 9 },
    { label: 'Week 5', revenue: 18.5, prior: 11.8 },
  ],
  'This Year': [
    { label: 'Jan', revenue: 8.2, prior: 6.2 },
    { label: 'Mar', revenue: 9.3, prior: 7 },
    { label: 'May', revenue: 11.5, prior: 8.2 },
    { label: 'Jul', revenue: 14, prior: 9.4 },
    { label: 'Sep', revenue: 16.3, prior: 11.1 },
    { label: 'Oct', revenue: 18.5, prior: 12.6 },
  ],
}

const roomStatuses = [
  { label: 'Available', count: 12, dot: 'bg-emerald-500', bar: 'bg-emerald-500' },
  { label: 'Occupied', count: 48, dot: 'bg-amber-800', bar: 'bg-amber-800' },
  { label: 'Reserved', count: 4, dot: 'bg-sky-500', bar: 'bg-sky-500' },
  { label: 'Cleaning', count: 6, dot: 'bg-amber-400', bar: 'bg-amber-400' },
  { label: 'Maintenance / Inspection', count: 2, dot: 'bg-rose-500', bar: 'bg-rose-500' },
]

const departments = [
  { name: 'Front Office & Concierge Desk', count: 14, icon: '♧' },
  { name: 'Housekeeping & Laundry Sanctuary', count: 26, icon: '♙' },
  { name: 'Food & Beverage / Private Dining', count: 22, icon: '♜' },
  { name: 'Security & Pier Marine Operations', count: 10, icon: '♢' },
  { name: 'Maintenance & Marine Engineering', count: 7, icon: '⌘' },
  { name: 'Executive Administration & Audit', count: 6, icon: '♧' },
]

const initialOperations: Operation[] = [
  { guest: 'Chief A. Adeleke', room: 'Executive Lagoon Suite · Room 402', tier: 'VIP BUTLER', time: '14:00 WAT', service: 'Lagoon Jetty Shuttle', status: 'Check In' },
  { guest: 'Lady K. Danjuma', room: 'Presidential Sanctuary · Penthouse A', tier: 'PRESIDENTIAL', time: '15:30 WAT', service: 'Private Yacht Charter', status: 'Check In' },
  { guest: 'Folake Solanke-Bello', room: 'Waterfront Haven Villa · Villa 08', tier: '', time: '16:45 WAT', service: 'Private Sedan Escort', status: 'Pre-Assigned' },
  { guest: 'Dr. Obinna Okonkwo', room: 'Deluxe Lagoon Room · Room 216', tier: 'CORPORATE', time: '11:00 WAT', service: 'Airport Transfer', status: 'Check Out' },
  { guest: 'Ambassador G. Moreau', room: 'Executive Lagoon Suite · Room 518', tier: 'DIPLOMATIC', time: '12:00 WAT', service: 'Private Sedan Escort', status: 'Check Out' },
]

function RevenueTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-md border border-stone-200 bg-white p-3 text-xs shadow-lg">
      <strong className="text-ink">{label}</strong>
      {payload.map((item) => (
        <p key={item.name} className="mt-1 flex justify-between gap-5" style={{ color: item.color }}>
          <span>{item.name}</span>
          <b>₦{item.value.toFixed(1)}M</b>
        </p>
      ))}
    </div>
  )
}

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
  const { reservations } = useAdminReservations()
  const [period, setPeriod] = useState<RevenuePeriod>('This Month')
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
        <MetricCard label="TOTAL REVENUE" value="₦18,500,000" note="Revenue this month · Above target" icon={Wallet} />
        <MetricCard label="OCCUPANCY RATE" value="75%" note="Current room occupancy · 48 / 64 suites" icon={BedDouble} change="+4.0%" />
        <MetricCard label="TOTAL STAFF" value="85" note="Active hotel employees · 6 departments" icon={UsersRound} change="100% active" />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 2xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
        <div className="grid min-w-0 gap-4">
          <article className="overflow-hidden rounded-sm border border-stone-200/80 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[9px] font-semibold tracking-[0.15em] text-amber-800">FINANCIAL PERFORMANCE</p>
                <h2 className="mt-1 font-display text-xl text-ink">Revenue Analytics</h2>
              </div>
              <div className="flex rounded-sm bg-stone-100 p-1" role="group" aria-label="Revenue chart period">
                {(['This Week', 'This Month', 'This Year'] as const).map((option) => (
                  <button
                    type="button"
                    key={option}
                    aria-pressed={period === option}
                    onClick={() => setPeriod(option)}
                    className={`rounded-sm px-2 py-1.5 text-[10px] transition-colors ${
                      period === option ? 'bg-forest text-white shadow-sm' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <strong className="font-display text-2xl text-ink">₦18.5M <small className="font-body text-xs text-muted">NGN</small></strong>
                <p className="mt-1 text-[10px] text-muted">Gross collections recorded through Lagoon Folio &amp; Suites</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-50 px-2 py-1.5 text-[10px] text-emerald-800">
                <TrendingUp aria-hidden="true" className="size-3" /> +14.6% vs previous cycle
              </span>
            </div>
            <div className="mt-4 h-[230px] min-w-0 sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData[period]} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9b7a3d" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#9b7a3d" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#efeee9" strokeDasharray="2 4" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#8a8e87', fontSize: 10 }} />
                  <YAxis tickLine={false} axisLine={false} width={42} tick={{ fill: '#8a8e87', fontSize: 10 }} tickFormatter={(value: number) => `₦${value}M`} domain={[0, 20]} />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area type="monotone" dataKey="prior" name="Previous cycle" stroke="#c6b184" strokeDasharray="4 4" strokeWidth={1.5} fill="transparent" />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#80622e" strokeWidth={2} fill="url(#adminRevenueFill)" activeDot={{ r: 4, fill: '#80622e', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-col gap-2 border-t border-stone-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="flex items-center gap-2 text-[10px] text-muted"><Sparkles aria-hidden="true" className="size-3.5 text-amber-800" />Peak revenue: <strong className="font-medium text-ink">Presidential Waterfront Villas &amp; Private Lagoon Charters</strong></span>
              <b className="text-[9px] tracking-wide text-amber-800">68% OF REVENUE</b>
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
              <span className="rounded-sm bg-stone-100 px-2 py-1 text-[9px] font-semibold text-ink">64 TOTAL SUITES</span>
            </div>
            <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-stone-100" aria-label="Room status distribution">
              {roomStatuses.map((status) => <span key={status.label} className={`${status.bar} h-full`} style={{ width: `${(status.count / 72) * 100}%` }} title={`${status.label}: ${status.count}`} />)}
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
              <span className="text-[9px] font-semibold text-emerald-800">85 PERSONNEL</span>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-muted">6 operational divisions stationed across mainland &amp; waterfront wings:</p>
            <ul className="mt-3 grid gap-2">
              {departments.map((department) => (
                <li key={department.name} className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="flex min-w-0 items-center gap-2 text-muted"><span className="w-4 shrink-0 text-center text-amber-900">{department.icon}</span><span>{department.name}</span></span>
                  <strong className="shrink-0 rounded-sm bg-stone-100 px-2 py-1 text-[9px] text-ink">{department.count} on duty</strong>
                </li>
              ))}
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
