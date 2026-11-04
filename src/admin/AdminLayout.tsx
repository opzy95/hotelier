import { useState } from 'react'
import {
  BedDouble,
  Bell,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  CreditCard,
  DoorOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UsersRound,
  X,
} from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useParams } from 'react-router-dom'
import { AdminReservationsProvider } from './AdminReservationsContext'

const primaryNavigation = [
  { label: 'Overview', path: 'overview', icon: LayoutDashboard },
  { label: 'Reservations', path: 'reservations', icon: CalendarDays },
  { label: 'Rooms', path: 'rooms', icon: BedDouble, meta: '64 Total' },
  { label: 'Guests', path: 'guests', icon: UsersRound },
  { label: 'Check-in / Check-out', path: 'check-in', icon: DoorOpen, notification: true },
  { label: 'Payments', path: 'payments', icon: CreditCard },
  { label: 'Reports', path: 'reports', icon: ClipboardList },
  { label: 'Staff & Departments', path: 'staff', icon: UsersRound },
]

const secondaryNavigation = [
  { label: 'Settings', path: 'settings', icon: Settings },
]

const sectionTitles: Record<string, string> = {
  reservations: 'Reservations',
  rooms: 'Rooms',
  guests: 'Guests',
  'check-in': 'Check-in / Check-out',
  payments: 'Payments',
  reports: 'Reports',
  staff: 'Staff & Departments',
  settings: 'Settings',
}

function NavigationLinks({ onNavigate }: { onNavigate: () => void }) {
  return (
    <>
      {primaryNavigation.map(({ label, path, icon: Icon, meta, notification }) => (
        <NavLink
          key={path}
          to={`/dashboard/${path}`}
          onClick={onNavigate}
          className={({ isActive }) => `group flex min-h-10 items-center gap-3 border-l-2 px-3 text-xs transition-colors ${
            isActive
              ? 'border-champagne bg-white/10 text-champagne'
              : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.7} />
          <span className="min-w-0 flex-1">{label}</span>
          {meta && <span className="text-[10px] text-white/45">{meta}</span>}
          {notification && <span className="size-1.5 rounded-full bg-champagne" />}
        </NavLink>
      ))}
      <p className="mb-2 mt-7 px-3 text-[9px] font-semibold tracking-[0.16em] text-white/40">SYSTEM SANCTUARY</p>
      {secondaryNavigation.map(({ label, path, icon: Icon }) => (
        <NavLink
          key={path}
          to={`/dashboard/${path}`}
          onClick={onNavigate}
          className={({ isActive }) => `group flex min-h-10 items-center gap-3 border-l-2 px-3 text-xs transition-colors ${
            isActive
              ? 'border-champagne bg-white/10 text-champagne'
              : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.7} />
          <span>{label}</span>
        </NavLink>
      ))}
    </>
  )
}

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [now] = useState(() => new Date())
  const location = useLocation()
  const pageName = location.pathname.split('/').pop()?.replaceAll('-', ' ') ?? 'overview'
  const title = pageName.replace(/\b\w/g, (letter) => letter.toUpperCase())
  const portalDate = now.toLocaleDateString('en-GB', {
    timeZone: 'Africa/Lagos',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).toUpperCase()
  const portalTime = now.toLocaleTimeString('en-GB', {
    timeZone: 'Africa/Lagos',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).toUpperCase()

  function closeSidebar() {
    setSidebarOpen(false)
  }

  return (
    <AdminReservationsProvider>
    <div className="min-h-screen bg-paper font-body text-ink">
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[238px] flex-col bg-forest text-white shadow-xl transition-transform duration-200 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`} aria-label="Admin navigation">
        <Link
          to="/dashboard/overview"
          onClick={closeSidebar}
          className="flex min-h-[92px] flex-col justify-center gap-2 border-b border-white/10 px-5 no-underline"
        >
          <span className="font-display text-sm tracking-wide text-white">✥ OPZY LUXURY HOTEL</span>
          <span className="flex gap-2 text-[8px] font-semibold tracking-[0.12em] text-white/45">
            <span className="border border-champagne/50 px-1 py-0.5 text-champagne">MANAGER PORTAL</span>
            <span>VICTORIA ISLAND</span>
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <p className="mb-2 px-3 text-[9px] font-semibold tracking-[0.16em] text-white/40">EXECUTIVE OPERATIONS</p>
          <NavigationLinks onNavigate={closeSidebar} />
        </nav>

        <div className="flex min-h-[62px] items-center gap-2 border-t border-white/10 px-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-champagne/70 bg-champagne/10 text-xs font-semibold text-champagne">TA</span>
          <span className="grid min-w-0 flex-1 gap-0.5">
            <strong className="truncate text-[11px] font-medium">Tariq Adeleke</strong>
            <small className="text-[8px] tracking-wide text-white/50">GENERAL MANAGER</small>
          </span>
          <LogOut aria-hidden="true" className="size-3.5 text-white/50" />
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-label="Close navigation menu"
          onClick={closeSidebar}
        />
      )}

      <header className="fixed inset-x-0 top-0 z-30 flex h-[68px] items-center gap-3 border-b border-stone-200 bg-white px-4 shadow-sm lg:left-[238px] lg:px-6">
        <button
          type="button"
          className="grid size-9 shrink-0 place-items-center rounded-md text-ink hover:bg-stone-100 lg:hidden"
          aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={sidebarOpen}
          onClick={() => setSidebarOpen((open) => !open)}
        >
          {sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 truncate text-[9px] font-semibold tracking-[0.12em] text-muted">
            <span className="hidden sm:inline">MANAGER PORTAL</span>
            <span aria-hidden="true" className="hidden sm:inline">›</span>
            <span className="hidden md:inline">OPERATIONAL FOLIO</span>
            <span aria-hidden="true" className="hidden md:inline">›</span>
            <strong className="truncate text-ink">{title.toUpperCase()}</strong>
          </div>
          <p className="mt-1 truncate text-[10px] text-muted">Victoria Island Lagoon Front · Welcome back, General Manager</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <span className="hidden items-center gap-2 text-[10px] text-muted xl:flex">
            <i className="size-1.5 rounded-full bg-emerald-500" />
            Property Occupancy: <strong className="text-ink">84.6%</strong>
          </span>
          <button type="button" className="relative grid size-8 place-items-center rounded-md text-ink hover:bg-stone-100" aria-label="Notifications">
            <Bell aria-hidden="true" className="size-4" />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-amber-500" />
          </button>
          <button type="button" className="hidden items-center gap-2 text-left sm:flex">
            <span>
              <strong className="block text-[9px] tracking-wide text-ink">LAGOS | WAT, UTC+1</strong>
              <small className="block text-[9px] text-muted">{portalDate} · {portalTime}</small>
            </span>
            <ChevronDown aria-hidden="true" className="size-3 text-muted" />
          </button>
        </div>
      </header>

      <main className="min-h-screen pt-[68px] lg:ml-[238px]">
        <div className="min-h-[calc(100vh-68px)] px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </div>
        <footer className="flex flex-col gap-2 border-t border-stone-200 bg-forest-deep px-5 py-5 text-[10px] text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© {now.getFullYear()} OPZY LUXURY HOTEL · VICTORIA ISLAND, LAGOS</span>
          <span>Internal management portal · Confidential</span>
        </footer>
      </main>
    </div>
    </AdminReservationsProvider>
  )
}

export function AdminSectionPlaceholder() {
  const { section = '' } = useParams()
  const title = sectionTitles[section] ?? 'Dashboard'

  return (
    <section className="mx-auto max-w-5xl py-10">
      <p className="text-[10px] font-semibold tracking-[0.16em] text-amber-800">MANAGER PORTAL</p>
      <h1 className="mt-2 font-display text-3xl text-ink">{title}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted">This section is ready for its dashboard page.</p>
    </section>
  )
}
