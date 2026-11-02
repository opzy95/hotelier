import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowDownUp, CalendarDays, Check, ChevronDown, Clock3, SlidersHorizontal, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { roomSuites } from '../data/roomSuites'

const filters = ['All Accommodations', 'Deluxe Rooms', 'Executive Suites', 'Presidential Sanctuary']

function dateInputValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function stayLength(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T00:00:00`)
  const end = new Date(`${checkOut}T00:00:00`)
  const nights = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000))
  return `${nights} Night${nights === 1 ? '' : 's'}`
}

function SearchPanel() {
  const today = new Date()
  const future = new Date()
  future.setDate(future.getDate() + 4)
  const [checkIn, setCheckIn] = useState(dateInputValue(today))
  const [checkOut, setCheckOut] = useState(dateInputValue(future))
  const [adults, setAdults] = useState('2')
  const [children, setChildren] = useState('0')
  const [searchApplied, setSearchApplied] = useState(false)

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSearchApplied(true)
  }

  return (
    <form onSubmit={submitSearch} className="border border-[#ece9e2] bg-white p-3 shadow-[0_8px_24px_rgba(16,30,22,0.04)] sm:p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.9fr_1.1fr_auto] lg:items-end lg:gap-0">
        <label className="border-[#ece9e2] px-2 sm:border-r sm:px-4">
          <span className="mb-1.5 block text-[8px] font-medium tracking-[0.12em] text-[#94713a]">CHECK-IN</span>
          <span className="flex items-center gap-1.5 text-[10px] text-ink">
            <CalendarDays aria-hidden="true" className="h-3 w-3 text-muted" />
            <input aria-label="Check-in date" type="date" min={dateInputValue(today)} value={checkIn} onChange={(event) => setCheckIn(event.target.value)} className="min-w-0 bg-transparent outline-none" />
          </span>
        </label>
        <label className="border-[#ece9e2] px-2 sm:border-r sm:px-4">
          <span className="mb-1.5 block text-[8px] font-medium tracking-[0.12em] text-[#94713a]">CHECK-OUT</span>
          <span className="flex items-center gap-1.5 text-[10px] text-ink">
            <CalendarDays aria-hidden="true" className="h-3 w-3 text-muted" />
            <input aria-label="Check-out date" type="date" min={checkIn} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="min-w-0 bg-transparent outline-none" />
          </span>
        </label>
        <div className="px-2 sm:px-4">
          <span className="mb-1.5 block text-[8px] font-medium tracking-[0.12em] text-[#94713a]">DURATION</span>
          <span className="flex items-center gap-1.5 text-[10px] text-ink"><Clock3 aria-hidden="true" className="h-3 w-3 text-muted" />{stayLength(checkIn, checkOut)}</span>
        </div>
        <div className="flex gap-4 border-[#ece9e2] px-2 sm:border-l sm:px-4">
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-[8px] font-medium tracking-[0.12em] text-[#94713a]">ADULTS</span>
            <span className="flex items-center gap-1.5 text-[10px] text-ink"><Users aria-hidden="true" className="h-3 w-3 shrink-0 text-muted" /><select aria-label="Adults" value={adults} onChange={(event) => setAdults(event.target.value)} className="w-full bg-transparent outline-none">{[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{count} Adult{count > 1 ? 's' : ''}</option>)}</select></span>
          </label>
          <label className="min-w-0 flex-1">
            <span className="mb-1.5 block text-[8px] font-medium tracking-[0.12em] text-[#94713a]">CHILDREN</span>
            <select aria-label="Children" value={children} onChange={(event) => setChildren(event.target.value)} className="w-full bg-transparent text-[10px] text-ink outline-none">{[0, 1, 2, 3, 4].map((count) => <option key={count} value={count}>{count} Children</option>)}</select>
          </label>
        </div>
        <button type="submit" className="flex min-h-10 items-center justify-center gap-2 border border-forest px-4 text-[9px] font-medium tracking-wide text-forest transition-colors hover:bg-forest hover:text-white">
          {searchApplied ? <Check aria-hidden="true" className="h-3 w-3" /> : <SlidersHorizontal aria-hidden="true" className="h-3 w-3" />}
          {searchApplied ? 'SEARCH UPDATED' : 'MODIFY SEARCH'}
        </button>
      </div>
    </form>
  )
}

function RoomListingCard({ room }: { room: (typeof roomSuites)[number] }) {
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <article className="grid overflow-hidden border border-[#eeece6] bg-white shadow-[0_8px_24px_rgba(16,30,22,0.035)] lg:grid-cols-[0.92fr_1.08fr]">
      <div className="relative min-h-[220px] overflow-hidden bg-[#e6e2d9] sm:min-h-[300px] lg:min-h-[350px]">
        <img src={room.image} alt={room.imageAlt} className="absolute inset-0 h-full w-full object-cover" />
        <span className="absolute left-3 top-3 bg-forest px-3 py-1.5 text-[8px] font-medium tracking-wide text-champagne">{room.category} · WATERFRONT VIEW</span>
      </div>
      <div className="flex min-w-0 flex-col p-4 sm:p-5 lg:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-[8px] font-medium tracking-[0.13em] text-[#94713a]">OPZY LUXURY HOTEL · ROOMS &amp; SUITES AVAILABILITY</p>
            <h2 className="font-display text-[24px] leading-tight text-ink sm:text-[27px]">{room.fullName}</h2>
          </div>
          <span className="bg-[#f0eee9] px-2.5 py-1 text-[8px] font-medium tracking-wide text-[#596158]">{room.badge}</span>
        </div>
        <p className="mt-2 text-[10px] leading-[1.7] text-muted">{room.description}</p>

        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 border-b border-[#eeece6] pb-3 sm:grid-cols-4">
          {room.details.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-[9px] text-[#596158]">
              <Icon aria-hidden="true" className="h-3 w-3 shrink-0 text-[#94713a]" strokeWidth={1.6} />{label}
            </span>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4">
          {room.amenities.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-[9px] text-[#74776f]">
              <Icon aria-hidden="true" className="h-3 w-3 shrink-0 text-[#9b927e]" strokeWidth={1.5} />{label}
            </span>
          ))}
        </div>

        {detailsOpen && (
          <div className="mt-4 border-l border-[#94713a] bg-[#f7f5f0] px-4 py-3 text-[10px] leading-[1.7] text-muted">
            Each stay includes daily breakfast, personalized turndown service, high-speed Wi-Fi, and access to the infinity pool and private fitness suite.
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 border-t border-[#eeece6] pt-4 sm:mt-5">
          <div>
            <p className="font-display text-[26px] leading-none text-ink">{room.price}<span className="ml-1 font-body text-[10px] text-muted">/ Night</span></p>
            <p className="mt-1 text-[8px] text-muted">Rates shown per night, excluding applicable taxes.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-expanded={detailsOpen} onClick={() => setDetailsOpen(!detailsOpen)} className="inline-flex min-h-9 items-center gap-1.5 border border-[#d9d8d2] px-3 text-[8px] font-medium tracking-wide text-ink transition-colors hover:border-forest">
              {detailsOpen ? 'HIDE DETAILS' : 'ROOM DETAILS'} <ChevronDown aria-hidden="true" className={`h-3 w-3 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
            </button>
            <Link to={`/book?room=${room.id}`} className="inline-flex min-h-9 items-center gap-1.5 bg-forest px-3 text-[8px] font-medium tracking-wide text-white transition-colors hover:bg-forest-deep">
              SELECT SANCTUARY <ArrowDownUp aria-hidden="true" className="h-3 w-3 rotate-90" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

export function RoomsPage() {
  const [activeFilter, setActiveFilter] = useState(filters[0])
  const [sortOrder, setSortOrder] = useState('recommended')
  const displayedRooms = useMemo(() => {
    const filteredRooms = activeFilter === filters[0]
      ? [...roomSuites]
      : roomSuites.filter((room) => room.tier === activeFilter)

    if (sortOrder === 'price-low') return filteredRooms.sort((first, second) => first.priceValue - second.priceValue)
    if (sortOrder === 'price-high') return filteredRooms.sort((first, second) => second.priceValue - first.priceValue)
    return filteredRooms
  }, [activeFilter, sortOrder])

  return (
    <>
      <section className="bg-paper px-5 pb-8 pt-10 sm:px-8 sm:pb-10 sm:pt-14 lg:px-10">
        <div className="mx-auto max-w-[1280px]">
          <p className="text-[9px] font-medium tracking-[0.14em] text-[#94713a]">ACCOMMODATION &amp; RESERVATIONS</p>
          <h1 className="mt-3 font-display text-[36px] leading-tight text-ink sm:text-[44px]">Find Your Perfect Stay</h1>
          <p className="mt-2 max-w-[620px] text-[11px] leading-[1.7] text-muted sm:text-[12px]">
            Curated enclaves sculpted for profound rest and discretion along the tranquil waters of Victoria Island. Select your private sanctuary below.
          </p>
          <div className="mt-6"><SearchPanel /></div>
        </div>
      </section>

      <section aria-label="Room listings" className="bg-[#f8f6f1] px-5 pb-12 sm:px-8 sm:pb-16 lg:px-10">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-5 flex flex-col gap-4 border-b border-[#e8e5de] pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map((filter) => {
                const count = filter === filters[0] ? roomSuites.length : roomSuites.filter((room) => room.tier === filter).length
                return (
                  <button
                    key={filter}
                    type="button"
                    aria-pressed={activeFilter === filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`shrink-0 px-3 py-2 text-[9px] font-medium transition-colors ${activeFilter === filter ? 'bg-forest text-white' : 'border border-transparent text-[#5e625b] hover:border-[#d8d4ca]'}`}
                  >
                    {filter} ({count})
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-[9px] text-muted lg:justify-end">
              <span>Showing {displayedRooms.length} Available Sanctuar{displayedRooms.length === 1 ? 'y' : 'ies'}</span>
              <label className="flex items-center gap-2">
                <span className="text-[8px] font-medium tracking-wide">SORT BY</span>
                <span className="relative">
                  <select aria-label="Sort rooms" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="appearance-none border border-[#e8e5de] bg-white py-2 pl-3 pr-7 text-[9px] text-ink outline-none focus:border-forest">
                    <option value="recommended">Curated / Recommended</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="price-high">Price: high to low</option>
                  </select>
                  <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" />
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-5">
            {displayedRooms.map((room) => <RoomListingCard key={room.id} room={room} />)}
          </div>
        </div>
      </section>
    </>
  )
}