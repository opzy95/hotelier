import { useEffect, useMemo, useState } from 'react'
import type { PlatformHotel as ApiHotel } from '../api'
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CirclePause,
  Ellipsis,
  Eye,
  Globe2,
  LayoutDashboard,
  MapPin,
  Menu,
  Play,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { ApiError, apiRequest, clearAccessToken } from '../api'
import type { PlatformHotelsResponse, PlatformProfileResponse } from '../api'

type HotelStatus = 'Active' | 'Onboarding' | 'Paused'
type HotelFilter = 'All hotels' | HotelStatus
type Hotel = Omit<ApiHotel, 'id' | '_id'> & { id: string }

const pageSize = 25

function normalizeHotel(hotel: ApiHotel): Hotel {
  const id = hotel.id ?? hotel._id
  if (!id) throw new Error('The hotel API returned a hotel without an ID.')
  return { ...hotel, id }
}

function displayStatus(hotel: ApiHotel): HotelStatus {
  if (hotel.status === 'suspended') return 'Paused'
  if (hotel.status === 'active' || hotel.subscription?.status === 'active' || hotel.subscription?.status === 'trialing') return 'Active'
  return 'Onboarding'
}

const statusStyles: Record<HotelStatus, string> = {
  Active: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  Onboarding: 'border-amber-200 bg-amber-50 text-amber-900',
  Paused: 'border-stone-200 bg-stone-100 text-stone-600',
}

function StatusBadge({ status }: { status: HotelStatus }) {
  const dotClass = status === 'Active' ? 'bg-emerald-500' : status === 'Onboarding' ? 'bg-amber-500' : 'bg-stone-400'
  return <span className={`inline-flex items-center gap-1.5 border px-2 py-1 text-[9px] font-semibold ${statusStyles[status]}`}><span className={`size-1.5 rounded-full ${dotClass}`} />{status}</span>
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The request could not be completed. Please try again.'
}

export function SuperAdminDashboard() {
  const [currentYear] = useState(() => new Date().getFullYear())
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [profile, setProfile] = useState<PlatformProfileResponse['user'] | null>(null)
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [totalHotels, setTotalHotels] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<HotelFilter>('All hotels')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingHotelId, setUpdatingHotelId] = useState<string | null>(null)
  const [statusError, setStatusError] = useState('')
  const [openActionMenuHotelId, setOpenActionMenuHotelId] = useState<string | null>(null)
  const [actionMenuPosition, setActionMenuPosition] = useState<{ top: number; left: number } | null>(null)
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadPortfolio() {
      setIsLoading(true)
      setError('')
      try {
        const account = await apiRequest<PlatformProfileResponse>('/auth/me')
        if (!account.isPlatformOperator) {
          clearAccessToken()
          if (!cancelled) setIsAuthenticated(false)
          return
        }
        if (!cancelled) setIsAuthenticated(true)
        const result = await apiRequest<PlatformHotelsResponse>(`/platform/hotels?page=${page}&limit=${pageSize}`)
        if (cancelled) return
        setProfile(account.user)
        setHotels(result.data.map(normalizeHotel))
        setTotalHotels(result.pagination.total)
      } catch (requestError) {
        if (cancelled) return
        if (requestError instanceof ApiError && (requestError.status === 401 || requestError.status === 403)) {
          clearAccessToken()
          setIsAuthenticated(false)
          return
        }
        setError(errorMessage(requestError))
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadPortfolio()
    return () => { cancelled = true }
  }, [page, reloadKey])

  useEffect(() => {
    if (!openActionMenuHotelId) return

    function dismissActionMenu(event: Event) {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return
      if (event.type === 'pointerdown') {
        const target = event.target
        if (target instanceof Element && (target.closest('[data-hotel-action-trigger]') || target.closest('[data-hotel-action-menu]'))) return
      }
      setOpenActionMenuHotelId(null)
      setActionMenuPosition(null)
    }

    document.addEventListener('pointerdown', dismissActionMenu)
    document.addEventListener('keydown', dismissActionMenu)
    window.addEventListener('resize', dismissActionMenu)
    window.addEventListener('scroll', dismissActionMenu, true)
    return () => {
      document.removeEventListener('pointerdown', dismissActionMenu)
      document.removeEventListener('keydown', dismissActionMenu)
      window.removeEventListener('resize', dismissActionMenu)
      window.removeEventListener('scroll', dismissActionMenu, true)
    }
  }, [openActionMenuHotelId])

  const query = search.trim().toLowerCase()
  const filteredHotels = useMemo(() => hotels.filter((hotel) => {
    const status = displayStatus(hotel)
    const matchesSearch = !query || `${hotel.name} ${hotel.slug} ${hotel.address?.city ?? ''} ${hotel.address?.country ?? ''} ${hotel.email}`.toLowerCase().includes(query)
    return matchesSearch && (filter === 'All hotels' || status === filter)
  }), [filter, hotels, query])

  const activeCount = hotels.filter((hotel) => displayStatus(hotel) === 'Active').length
  const onboardingCount = hotels.filter((hotel) => displayStatus(hotel) === 'Onboarding').length
  const pausedCount = hotels.filter((hotel) => displayStatus(hotel) === 'Paused').length
  const totalPages = Math.max(1, Math.ceil(totalHotels / pageSize))
  const userName = profile?.name || 'Platform Admin'
  const userInitials = userName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'SA'

  async function toggleHotelStatus(hotel: Hotel) {
    if (!isAuthenticated || updatingHotelId) return
    const nextStatus = displayStatus(hotel) === 'Active' ? 'suspended' : 'active'
    setUpdatingHotelId(hotel.id)
    setStatusError('')
    try {
      const result = await apiRequest<{ hotel: ApiHotel }>(`/platform/hotels/${encodeURIComponent(hotel.id)}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      })
      const updatedHotel = normalizeHotel(result.hotel)
      setHotels((current) => current.map((item) => item.id === hotel.id ? updatedHotel : item))
    } catch (requestError) {
      setStatusError(`${hotel.name}: ${errorMessage(requestError)}`)
    } finally {
      setUpdatingHotelId(null)
    }
  }

  async function signOut() {
    if (isSigningOut) return
    setIsSigningOut(true)
    try {
      await apiRequest('/auth/logout', { method: 'POST' })
    } catch {} finally {
      clearAccessToken()
      sessionStorage.removeItem('selectedHotelId')
      setIsAuthenticated(false)
    }
  }

  if (!isAuthenticated) return isLoading ? <div className="grid min-h-screen place-items-center text-sm text-muted">Checking platform session…</div> : <Navigate to="/platform/login" replace />

  return (
    <div className="min-h-screen bg-[#f6f7f5] font-body text-ink">
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-[#10251d] text-white transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} aria-label="Platform navigation">
        <Link to="/super-admin" onClick={() => setSidebarOpen(false)} className="flex min-h-[78px] items-center gap-3 border-b border-white/10 px-5 no-underline">
          <span className="grid size-9 place-items-center rounded-sm bg-champagne text-forest-deep"><Building2 aria-hidden="true" className="size-5" /></span>
          <span><strong className="block font-display text-sm tracking-wide">OPZY</strong><small className="text-[9px] tracking-[0.16em] text-white/50">PLATFORM CONSOLE</small></span>
        </Link>
        <div className="px-3 py-5">
          <p className="mb-2 px-3 text-[9px] font-semibold tracking-[0.16em] text-white/40">PLATFORM</p>
          <div className="flex min-h-10 items-center gap-3 border-l-2 border-champagne bg-white/10 px-3 text-xs text-champagne"><LayoutDashboard aria-hidden="true" className="size-4" />Overview</div>
          <div className="mt-1 flex min-h-10 items-center gap-3 border-l-2 border-transparent px-3 text-xs text-white/70"><Building2 aria-hidden="true" className="size-4" />Hotel directory<span className="ml-auto text-[9px] text-white/40">{totalHotels}</span></div>
        </div>
        <div className="mx-4 mt-2 border border-white/10 bg-white/[0.04] p-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-white/80"><ShieldCheck aria-hidden="true" className="size-3.5 text-champagne" />PLATFORM STATUS</div>
          <div className="mt-3 flex items-center justify-between text-[9px] text-white/50"><span>Hotel accounts</span><span className="text-white/80">{totalHotels}</span></div>
          <div className="mt-2 flex items-center justify-between text-[9px] text-white/50"><span>Active on this page</span><span className="text-white/80">{activeCount}</span></div>
        </div>
        <div className="mt-auto border-t border-white/10 p-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-full bg-champagne/15 text-[10px] font-semibold text-champagne">{userInitials}</span>
            <span className="min-w-0 flex-1"><strong className="block truncate text-[10px] font-medium">{userName}</strong><small className="text-[8px] tracking-wide text-white/45">SUPER ADMIN</small></span>
            <button type="button" onClick={() => { void signOut() }} disabled={isSigningOut} className="text-[9px] text-white/55 hover:text-white disabled:opacity-40">{isSigningOut ? 'Signing out…' : 'Sign out'}</button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <button type="button" className="fixed inset-0 z-40 bg-black/50 lg:hidden" aria-label="Close platform navigation" onClick={() => setSidebarOpen(false)} />}

      <header className="fixed inset-x-0 top-0 z-30 flex h-[68px] items-center gap-3 border-b border-stone-200 bg-white px-4 lg:left-[248px] lg:px-7">
        <button type="button" className="grid size-9 shrink-0 place-items-center text-ink hover:bg-stone-100 lg:hidden" aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((open) => !open)}>{sidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[9px] font-semibold tracking-[0.12em] text-muted"><span className="hidden sm:inline">PLATFORM CONSOLE</span><span aria-hidden="true" className="hidden sm:inline">›</span><strong className="truncate text-ink">HOTEL MANAGEMENT</strong></div>
          <p className="mt-1 truncate text-[10px] text-muted">Manage properties across the Opzy platform</p>
        </div>
        <button type="button" aria-label="Help and support" className="grid size-9 place-items-center text-muted hover:bg-stone-100"><CircleHelp aria-hidden="true" className="size-4" /></button>
        <span className="hidden h-8 border-l border-stone-200 sm:block" />
        <div className="hidden items-center gap-2 text-left sm:flex">
          <span className="grid size-8 place-items-center rounded-full bg-forest text-[9px] font-semibold text-white">{userInitials}</span>
          <span><strong className="block text-[9px] text-ink">{userName}</strong><small className="text-[8px] text-muted">{profile?.email}</small></span>
          <ChevronDown aria-hidden="true" className="size-3 text-muted" />
        </div>
      </header>

      <main className="min-h-screen pt-[68px] lg:ml-[248px]">
        <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[9px] font-semibold tracking-[0.17em] text-amber-800">SUPER ADMINISTRATION</p>
              <h1 className="mt-1 font-display text-2xl text-ink sm:text-3xl">Hotel portfolio</h1>
              <p className="mt-1 max-w-2xl text-[11px] leading-5 text-muted">A single place to oversee every hotel on your platform.</p>
            </div>
            <button type="button" onClick={() => setReloadKey((current) => current + 1)} disabled={isLoading} className="inline-flex h-9 items-center justify-center gap-2 border border-stone-300 bg-white px-3 text-[10px] font-semibold text-ink transition-colors hover:border-forest hover:text-forest disabled:opacity-50">Refresh directory</button>
          </div>

          {(error || statusError) && <div role="alert" className="mb-4 flex items-start justify-between gap-3 border border-rose-200 bg-rose-50 px-3 py-2.5 text-[10px] leading-5 text-rose-900"><p>{statusError || error}</p>{error && <button type="button" onClick={() => setReloadKey((current) => current + 1)} className="shrink-0 font-semibold underline">Retry</button>}</div>}

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {[
              { label: 'TOTAL HOTELS', value: totalHotels, note: 'Registered properties', icon: Building2, detail: 'Platform directory' },
              { label: 'ACTIVE HOTELS', value: activeCount, note: 'On this page', icon: CheckCircle2, detail: 'Live properties' },
              { label: 'ONBOARDING', value: onboardingCount, note: 'On this page', icon: Globe2, detail: 'Pending approval' },
              { label: 'SUSPENDED', value: pausedCount, note: 'On this page', icon: CirclePause, detail: 'Paused properties' },
            ].map(({ label, value, note, icon: Icon, detail }) => (
              <article key={label} className="border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center justify-between gap-2"><span className="text-[9px] font-semibold tracking-[0.13em] text-muted">{label}</span><span className="grid size-8 place-items-center bg-[#f3f5f2] text-forest"><Icon aria-hidden="true" className="size-4" /></span></div>
                <strong className="mt-3 block font-display text-2xl text-ink sm:text-[28px]">{isLoading ? '—' : value}</strong>
                <p className="mt-1 text-[10px] text-muted">{note}</p>
                <p className="mt-3 border-t border-stone-100 pt-2 text-[9px] text-muted">{detail}</p>
              </article>
            ))}
          </div>

          <section className="overflow-hidden border border-stone-200 bg-white shadow-sm">
            <div className="border-b border-stone-100 p-3 sm:p-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div><p className="text-[9px] font-semibold tracking-[0.15em] text-amber-800">PROPERTY REGISTRY</p><h2 className="mt-1 font-display text-xl text-ink">Hotels <span className="font-body text-[11px] text-muted">({isLoading ? '…' : totalHotels})</span></h2></div>
                <label className="flex h-9 min-w-0 items-center gap-2 border border-stone-200 bg-stone-50 px-2.5 xl:w-72">
                  <Search aria-hidden="true" className="size-3.5 shrink-0 text-muted" /><span className="sr-only">Search hotels</span>
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search hotel, location, or email..." className="min-w-0 flex-1 bg-transparent text-[10px] outline-none placeholder:text-muted/70" />
                </label>
              </div>
              <div className="mt-3 flex gap-1 overflow-x-auto" role="tablist" aria-label="Filter hotels by status">
                {([
                  { label: 'All hotels' as const, count: hotels.length },
                  { label: 'Active' as const, count: activeCount },
                  { label: 'Onboarding' as const, count: onboardingCount },
                  { label: 'Paused' as const, count: pausedCount },
                ]).map(({ label, count }) => <button key={label} type="button" role="tab" aria-selected={filter === label} onClick={() => setFilter(label)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-[10px] transition-colors ${filter === label ? 'border-forest font-semibold text-ink' : 'border-transparent text-muted hover:text-ink'}`}>{label}<span className="text-[9px]">{count}</span></button>)}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[790px] border-collapse text-left">
                <thead className="bg-stone-50 text-[9px] font-semibold tracking-[0.1em] text-muted"><tr><th className="px-4 py-3">HOTEL</th><th className="px-4 py-3">LOCATION</th><th className="px-4 py-3">CONTACT</th><th className="px-4 py-3">STATUS</th><th className="px-4 py-3">ACTION</th></tr></thead>
                <tbody className="divide-y divide-stone-100">
                  {isLoading && <tr><td colSpan={5} className="px-4 py-12 text-center text-[10px] text-muted">Loading hotels from the backend…</td></tr>}
                  {!isLoading && filteredHotels.map((hotel) => {
                    const status = displayStatus(hotel)
                    return (
                      <tr key={hotel.id} className="text-[10px] hover:bg-[#fbfcfa]">
                        <td className="px-4 py-3.5"><div className="flex items-center gap-2.5"><span className="grid size-9 shrink-0 place-items-center border border-stone-200 bg-[#f5f6f3] text-forest"><Building2 aria-hidden="true" className="size-4" /></span><span className="min-w-0"><strong className="block truncate font-semibold text-ink">{hotel.name}</strong><span className="mt-1 block text-[9px] text-muted">Slug: {hotel.slug}</span></span></div></td>
                        <td className="px-4 py-3.5"><span className="flex items-center gap-1.5 text-ink"><MapPin aria-hidden="true" className="size-3 shrink-0 text-muted" />{hotel.address?.city ? `${hotel.address.city}, ` : ''}{hotel.address?.country || '—'}</span></td>
                        <td className="px-4 py-3.5"><strong className="block font-medium text-ink">{hotel.email}</strong><span className="mt-1 block text-[9px] text-muted">{hotel.phone}</span></td>
                        <td className="px-4 py-3.5"><StatusBadge status={status} /></td>
                        <td className="px-4 py-3.5">
                          <div className="relative">
                            <button
                              type="button"
                              aria-label={`Actions for ${hotel.name}`}
                              aria-haspopup="menu"
                              aria-expanded={openActionMenuHotelId === hotel.id}
                              data-hotel-action-trigger
                              onClick={(event) => {
                                if (openActionMenuHotelId === hotel.id) {
                                  setOpenActionMenuHotelId(null)
                                  setActionMenuPosition(null)
                                  return
                                }
                                const bounds = event.currentTarget.getBoundingClientRect()
                                const menuWidth = 176
                                const menuHeight = 92
                                const top = bounds.bottom + menuHeight + 8 <= window.innerHeight
                                  ? bounds.bottom + 4
                                  : Math.max(8, bounds.top - menuHeight - 4)
                                setActionMenuPosition({
                                  top,
                                  left: Math.max(8, Math.min(bounds.right - menuWidth, window.innerWidth - menuWidth - 8)),
                                })
                                setOpenActionMenuHotelId(hotel.id)
                              }}
                              className="grid size-8 place-items-center border border-stone-200 text-ink hover:border-forest hover:text-forest"
                            >
                              <Ellipsis aria-hidden="true" className="size-4" />
                            </button>
                            {openActionMenuHotelId === hotel.id && actionMenuPosition && createPortal(
                              <div role="menu" aria-label={`${hotel.name} actions`} data-hotel-action-menu className="fixed z-[80] w-44 border border-stone-200 bg-white p-1 shadow-xl" style={actionMenuPosition}>
                                <button
                                  type="button"
                                  role="menuitem"
                                  onClick={() => { setSelectedHotel(hotel); setOpenActionMenuHotelId(null) }}
                                  className="flex min-h-9 w-full items-center gap-2 px-2 text-left text-[10px] text-ink hover:bg-stone-50"
                                >
                                  <Eye aria-hidden="true" className="size-3.5 text-muted" /> View profile
                                </button>
                                {status !== 'Onboarding' ? (
                                  <button
                                    type="button"
                                    role="menuitem"
                                    disabled={updatingHotelId !== null}
                                    onClick={() => { setOpenActionMenuHotelId(null); void toggleHotelStatus(hotel) }}
                                    className="flex min-h-9 w-full items-center gap-2 px-2 text-left text-[10px] text-ink hover:bg-stone-50 disabled:opacity-50"
                                  >
                                    {status === 'Paused'
                                      ? <><Play aria-hidden="true" className="size-3.5 text-emerald-700" /> Activate</>
                                      : <><CirclePause aria-hidden="true" className="size-3.5 text-rose-700" />{updatingHotelId === hotel.id ? 'Suspending…' : 'Suspend'}</>}
                                  </button>
                                ) : (
                                  <span role="menuitem" aria-disabled="true" className="flex min-h-9 items-center gap-2 px-2 text-[10px] text-muted">
                                    <CirclePause aria-hidden="true" className="size-3.5" /> Status action unavailable
                                  </span>
                                )}
                              </div>,
                              document.body,
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!isLoading && !filteredHotels.length && <tr><td colSpan={5} className="px-4 py-12 text-center"><Search aria-hidden="true" className="mx-auto size-5 text-stone-400" /><p className="mt-2 text-[11px] font-medium text-ink">{hotels.length ? 'No hotels found' : 'No hotels have registered yet'}</p><p className="mt-1 text-[10px] text-muted">{hotels.length ? 'Try another search or choose a different status filter.' : 'Registered hotel accounts will appear here.'}</p></td></tr>}
                </tbody>
              </table>
            </div>
            <footer className="flex flex-col gap-2 border-t border-stone-100 bg-stone-50/70 px-4 py-3 text-[9px] text-muted sm:flex-row sm:items-center sm:justify-between">
              <span>Showing {hotels.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, totalHotels)} of {totalHotels} properties</span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck aria-hidden="true" className="size-3 text-emerald-700" /> Backend-protected directory</span>
                <button type="button" aria-label="Previous page" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="grid size-7 place-items-center border border-stone-200 bg-white disabled:opacity-40"><ChevronLeft aria-hidden="true" className="size-3.5" /></button>
                <span>{page} / {totalPages}</span>
                <button type="button" aria-label="Next page" disabled={page >= totalPages || isLoading} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="grid size-7 place-items-center border border-stone-200 bg-white disabled:opacity-40"><ChevronRight aria-hidden="true" className="size-3.5" /></button>
              </div>
            </footer>
          </section>
          <footer className="mt-5 flex flex-col gap-2 text-[9px] text-muted sm:flex-row sm:items-center sm:justify-between"><span>© {currentYear} OPZY PLATFORM · SUPER ADMIN</span><Link to="/" className="inline-flex items-center gap-1 text-forest hover:underline"><Globe2 aria-hidden="true" className="size-3" /> View public hotel site</Link></footer>
        </div>
      </main>
      {selectedHotel && (
        <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-ink/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedHotel(null)
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="hotel-profile-title" className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-stone-200 bg-white shadow-xl">
            <header className="flex items-start justify-between gap-4 border-b border-stone-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[9px] font-semibold tracking-[0.15em] text-amber-800">HOTEL PROFILE</p>
                <h2 id="hotel-profile-title" className="mt-1 font-display text-2xl text-ink">{selectedHotel.name}</h2>
                <p className="mt-1 text-[10px] text-muted">{selectedHotel.slug}</p>
              </div>
              <button type="button" aria-label="Close hotel profile" onClick={() => setSelectedHotel(null)} className="grid size-8 shrink-0 place-items-center text-muted hover:bg-stone-100 hover:text-ink"><X aria-hidden="true" className="size-4" /></button>
            </header>
            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <section className="space-y-3">
                <h3 className="text-[9px] font-semibold tracking-[0.12em] text-muted">CONTACT & LOCATION</h3>
                <dl className="space-y-2 text-[11px]">
                  <div><dt className="text-[9px] text-muted">Email</dt><dd className="break-all text-ink">{selectedHotel.email}</dd></div>
                  <div><dt className="text-[9px] text-muted">Phone</dt><dd className="text-ink">{selectedHotel.phone || '—'}</dd></div>
                  {selectedHotel.manager && <div><dt className="text-[9px] text-muted">Manager</dt><dd className="text-ink">{selectedHotel.manager.name || selectedHotel.manager.email || '—'}</dd></div>}
                  <div><dt className="text-[9px] text-muted">Address</dt><dd className="text-ink">{[selectedHotel.address.line1, selectedHotel.address.line2, selectedHotel.address.city, selectedHotel.address.region, selectedHotel.address.postalCode, selectedHotel.address.country].filter(Boolean).join(', ') || '—'}</dd></div>
                </dl>
              </section>
              <section className="space-y-3">
                <h3 className="text-[9px] font-semibold tracking-[0.12em] text-muted">ACCOUNT</h3>
                <dl className="space-y-2 text-[11px]">
                  <div><dt className="text-[9px] text-muted">Status</dt><dd className="mt-1"><StatusBadge status={displayStatus(selectedHotel)} /></dd></div>
                  <div><dt className="text-[9px] text-muted">Subscription</dt><dd className="text-ink">{selectedHotel.subscription?.plan?.name ?? selectedHotel.subscription?.plan?.code ?? 'No plan'}{selectedHotel.subscription?.status ? ` · ${selectedHotel.subscription.status}` : ''}</dd></div>
                  {selectedHotel.subscription?.trialEndsAt && <div><dt className="text-[9px] text-muted">Trial ends</dt><dd className="text-ink">{new Date(selectedHotel.subscription.trialEndsAt).toLocaleDateString()}</dd></div>}
                  <div><dt className="text-[9px] text-muted">Property type</dt><dd className="capitalize text-ink">{selectedHotel.type || '—'}</dd></div>
                  <div><dt className="text-[9px] text-muted">Rooms</dt><dd className="text-ink">{selectedHotel.roomCount ?? '—'}</dd></div>
                  {selectedHotel.createdAt && <div><dt className="text-[9px] text-muted">Registered</dt><dd className="text-ink">{new Date(selectedHotel.createdAt).toLocaleDateString()}</dd></div>}
                </dl>
              </section>
              {selectedHotel.settings && (
                <section className="sm:col-span-2">
                  <h3 className="mb-3 text-[9px] font-semibold tracking-[0.12em] text-muted">HOTEL SETTINGS</h3>
                  <dl className="grid grid-cols-2 gap-3 border border-stone-100 bg-stone-50/60 p-3 text-[11px] sm:grid-cols-3">
                    <div><dt className="text-[9px] text-muted">Timezone</dt><dd className="text-ink">{selectedHotel.settings.timezone || '—'}</dd></div>
                    <div><dt className="text-[9px] text-muted">Language</dt><dd className="text-ink">{selectedHotel.settings.locale || '—'}</dd></div>
                    <div><dt className="text-[9px] text-muted">Currency</dt><dd className="text-ink">{selectedHotel.settings.currency || '—'}</dd></div>
                    <div><dt className="text-[9px] text-muted">Check-in</dt><dd className="text-ink">{selectedHotel.settings.checkInTime || '—'}</dd></div>
                    <div><dt className="text-[9px] text-muted">Check-out</dt><dd className="text-ink">{selectedHotel.settings.checkOutTime || '—'}</dd></div>
                  </dl>
                </section>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
