import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  ConciergeBell,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
} from 'lucide-react'
import { roomSuites } from '../data/roomSuites'
import heroImage from '../img/Opzy Luxury Hotel infinity lagoon pool at twilight in Victoria Island.png'

const roomFilters = ['All Tiers', 'Lagoon', 'Penthouse']

function localDateValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`)
  date.setDate(date.getDate() + days)
  return localDateValue(date)
}

function numberOfNights(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T00:00:00`)
  const end = new Date(`${checkOut}T00:00:00`)
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000))
}

function displayDate(value: string) {
  if (!value) return 'Select date'
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00`))
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount)
}

function AvailabilitySearch({
  onSearch,
  initialCheckIn,
  initialCheckOut,
  initialAdults,
  initialChildren,
  initialRooms,
}: {
  onSearch: (values: { checkIn: string; checkOut: string; adults: number; children: number; rooms: number }) => void
  initialCheckIn: string
  initialCheckOut: string
  initialAdults: string
  initialChildren: string
  initialRooms: string
}) {
  const [checkIn, setCheckIn] = useState(initialCheckIn)
  const [checkOut, setCheckOut] = useState(initialCheckOut)
  const [adults, setAdults] = useState(initialAdults)
  const [children, setChildren] = useState(initialChildren)
  const [rooms, setRooms] = useState(initialRooms)
  const [dateError, setDateError] = useState('')

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (checkOut <= checkIn) {
      setDateError('Check-out must be at least one night after check-in.')
      return
    }
    setDateError('')
    onSearch({ checkIn, checkOut, adults: Number(adults), children: Number(children), rooms: Number(rooms) })
  }

  return (
    <form onSubmit={submitSearch} className="absolute inset-x-5 bottom-0 z-10 mx-auto max-w-[1280px] translate-y-1/2 border border-[#e9e6df] bg-white p-3 shadow-[0_12px_30px_rgba(8,24,16,0.12)] sm:inset-x-8 sm:p-4 lg:inset-x-10">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.15fr_0.85fr_auto] lg:items-end lg:gap-0">
        <label className="border-[#e8e5de] px-2 py-1 sm:px-3 lg:border-r">
          <span className="mb-1.5 block text-[8px] font-medium tracking-[0.12em] text-ink">CHECK-IN DATE</span>
          <span className="flex h-8 items-center gap-2 border border-[#dedbd3] px-2 text-[10px] text-ink focus-within:border-[#94713a]">
            <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#94713a]" />
            <input aria-label="Check-in date" required type="date" min={localDateValue(new Date())} value={checkIn} onChange={(event) => {
              const nextCheckIn = event.target.value
              setCheckIn(nextCheckIn)
              if (checkOut <= nextCheckIn) setCheckOut(addDays(nextCheckIn, 1))
            }} className="min-w-0 w-full bg-transparent text-[10px] outline-none" />
          </span>
          <span className="mt-1 block text-[8px] text-muted">Arrival from 15:00</span>
        </label>
        <label className="border-[#e8e5de] px-2 py-1 sm:px-3 lg:border-r">
          <span className="mb-1.5 block text-[8px] font-medium tracking-[0.12em] text-ink">CHECK-OUT DATE</span>
          <span className="flex h-8 items-center gap-2 border border-[#dedbd3] px-2 text-[10px] text-ink focus-within:border-[#94713a]">
            <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#94713a]" />
            <input aria-label="Check-out date" required type="date" min={addDays(checkIn, 1)} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="min-w-0 w-full bg-transparent text-[10px] outline-none" />
          </span>
          <span className="mt-1 block text-[8px] text-muted">{numberOfNights(checkIn, checkOut)} night stay</span>
        </label>
        <label className="px-2 py-1 sm:px-3 lg:border-r lg:border-[#e8e5de]">
          <span className="mb-1.5 block text-[8px] font-medium tracking-[0.12em] text-ink">GUESTS ALLOCATION</span>
          <span className="flex h-8 items-center gap-1.5 border border-[#dedbd3] px-2 text-[10px] text-ink focus-within:border-[#94713a]">
            <Users aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#94713a]" />
            <select aria-label="Adults" value={adults} onChange={(event) => setAdults(event.target.value)} className="min-w-0 flex-1 appearance-none bg-transparent outline-none">{[1, 2, 3, 4, 5, 6].map((count) => <option value={count} key={count}>{count} Adult{count > 1 ? 's' : ''}</option>)}</select>
            <select aria-label="Children" value={children} onChange={(event) => setChildren(event.target.value)} className="min-w-0 flex-1 appearance-none bg-transparent outline-none">{[0, 1, 2, 3, 4].map((count) => <option value={count} key={count}>{count} Child{count === 1 ? '' : 'ren'}</option>)}</select>
          </span>
          <span className="mt-1 block text-[8px] text-muted">Maximum occupancy varies by suite</span>
        </label>
        <label className="px-2 py-1 sm:px-3">
          <span className="mb-1.5 block text-[8px] font-medium tracking-[0.12em] text-ink">SANCTUARY COUNT</span>
          <span className="relative flex h-8 items-center border border-[#dedbd3] px-2 text-[10px] text-ink focus-within:border-[#94713a]">
            <BedDouble aria-hidden="true" className="mr-2 h-3.5 w-3.5 shrink-0 text-[#94713a]" />
            <select aria-label="Number of rooms" value={rooms} onChange={(event) => setRooms(event.target.value)} className="w-full appearance-none bg-transparent pr-4 outline-none">{[1, 2, 3, 4].map((count) => <option value={count} key={count}>{count} Sanctuary{count > 1 ? 's' : ''}</option>)}</select>
            <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 h-3 w-3 text-muted" />
          </span>
          <span className="mt-1 block text-[8px] text-muted">Private floor plan</span>
        </label>
        <div className="px-1 py-1 sm:col-span-2 lg:col-span-1 lg:px-3">
          <button type="submit" className="flex h-10 w-full items-center justify-center gap-2 bg-[#84652e] px-4 text-[8px] font-medium tracking-wide text-white transition-colors hover:bg-forest">
            <Search aria-hidden="true" className="h-3 w-3" /> CHECK AVAILABILITY
          </button>
          <span className="mt-1 block text-center text-[8px] text-[#718d77]">● Availability preview · rates are estimates</span>
        </div>
      </div>
      {dateError && <p role="alert" className="mt-2 text-[9px] text-red-700">{dateError}</p>}
    </form>
  )
}

function StayCard({ room, selected, onSelect }: {
  room: (typeof roomSuites)[number]
  selected: boolean
  onSelect: () => void
}) {
  return (
    <article className={`grid overflow-hidden border bg-white transition-colors sm:grid-cols-[0.82fr_1.18fr] ${selected ? 'border-[#957238] ring-1 ring-[#957238]' : 'border-[#e9e6df]'}`}>
      <div className="relative min-h-[190px] overflow-hidden bg-[#e6e2d9] sm:min-h-[235px]">
        <img src={room.image} alt={room.imageAlt} className="absolute inset-0 h-full w-full object-cover" />
        <span className="absolute left-2 top-2 bg-forest px-2 py-1 text-[7px] font-medium tracking-wide text-champagne">{room.category}</span>
        <span className="absolute bottom-2 left-2 bg-forest/90 px-2 py-1 text-[7px] text-white">{room.badge}</span>
      </div>
      <div className="flex min-w-0 flex-col p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            {selected && <p className="mb-1 text-[7px] font-medium tracking-wide text-[#94713a]">✓ CURRENTLY SELECTED</p>}
            <h3 className="font-display text-[18px] leading-tight text-ink">{room.fullName}</h3>
            <p className="mt-1 text-[9px] leading-[1.6] text-muted">{room.description}</p>
          </div>
          <p className="shrink-0 text-right font-display text-[16px] text-[#94713a]">{formatNaira(room.priceValue)}<span className="block font-body text-[8px] text-muted">per sanctuary / night</span></p>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2 border-b border-[#efede8] pb-3">
          {room.details.slice(0, 3).map(({ icon: Icon, label }) => <span key={label} className="flex items-center gap-1 text-[8px] text-ink/75"><Icon aria-hidden="true" className="h-3 w-3 text-[#94713a]" />{label}</span>)}
        </div>
        <ul className="mt-2 grid gap-1.5 text-[8px] text-[#697266] sm:grid-cols-2">
          {room.amenities.slice(0, 2).map(({ label }) => <li key={label} className="flex items-center gap-1.5"><Check aria-hidden="true" className="h-2.5 w-2.5 text-[#6b8a64]" />{label}</li>)}
        </ul>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
          <span className="text-[8px] text-[#8e6e36]">{selected ? 'Pre-allocated & locked for your dates' : 'Curated for your stay'}</span>
          <button type="button" aria-pressed={selected} onClick={onSelect} className={`min-h-8 px-3 text-[8px] font-medium tracking-wide transition-colors ${selected ? 'bg-[#84652e] text-white' : 'border border-forest text-forest hover:bg-forest hover:text-white'}`}>
            {selected ? <span className="inline-flex items-center gap-1"><Check aria-hidden="true" className="h-3 w-3" /> CONFIRMED CHOICE</span> : 'SELECT ROOM'}
          </button>
        </div>
      </div>
    </article>
  )
}

function BookingSummary({
  selectedRoom,
  checkIn,
  checkOut,
  nights,
  adults,
  children,
  roomsCount,
  onContinue,
}: {
  selectedRoom: (typeof roomSuites)[number] | undefined
  checkIn: string
  checkOut: string
  nights: number
  adults: number
  children: number
  roomsCount: number
  onContinue: () => void
}) {
  if (!selectedRoom) {
    return <aside className="border border-[#e9e6df] bg-white p-5 text-[10px] leading-[1.7] text-muted">Select a sanctuary to see your stay summary.</aside>
  }

  const subtotal = selectedRoom.priceValue * nights * roomsCount

  return (
    <aside className="border border-[#e5e2dc] bg-white shadow-[0_8px_24px_rgba(16,30,22,0.04)] lg:sticky lg:top-5">
      <div className="bg-forest px-4 py-3 text-white">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-[16px]">Your Stay Summary</h2>
          <span className="border border-champagne/40 px-2 py-1 text-[7px] text-champagne">RATE ESTIMATE</span>
        </div>
        <p className="mt-1 text-[8px] text-white/55">Direct Hotel Reservation</p>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 border-b border-[#eeece6] pb-3">
          <div><p className="text-[7px] tracking-wide text-muted">CHECK-IN</p><p className="mt-1 text-[9px] font-medium text-ink">{displayDate(checkIn)}</p><p className="mt-1 text-[7px] text-muted">From 15:00</p></div>
          <div className="text-right"><p className="text-[7px] tracking-wide text-muted">CHECK-OUT</p><p className="mt-1 text-[9px] font-medium text-ink">{displayDate(checkOut)}</p><p className="mt-1 text-[7px] text-muted">Until 12:00</p></div>
        </div>
        <dl className="space-y-2 border-b border-[#eeece6] py-3 text-[8px]">
          <div className="flex justify-between gap-3"><dt className="text-muted">Duration</dt><dd className="text-ink">{nights} Night{nights === 1 ? '' : 's'}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">Guests</dt><dd className="text-right text-ink">{adults} Adults, {children} Children</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">Sanctuary</dt><dd className="text-right text-ink">{selectedRoom.fullName} × {roomsCount}</dd></div>
          <div className="flex justify-between gap-3"><dt className="text-muted">Nightly rate</dt><dd className="text-ink">{formatNaira(selectedRoom.priceValue)}</dd></div>
        </dl>
        <div className="mt-3 bg-[#f5f3ee] p-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[7px] font-medium tracking-wide text-muted">ESTIMATED ACCOMMODATION TOTAL</span>
            <span className="font-display text-[20px] text-[#84652e]">{formatNaira(subtotal)}</span>
          </div>
          <p className="mt-1 text-[7px] text-muted">Taxes and service fees are confirmed with your reservation.</p>
        </div>
        <button type="button" onClick={onContinue} className="mt-3 flex min-h-10 w-full items-center justify-center gap-2 bg-forest px-3 text-[8px] font-medium tracking-wide text-white transition-colors hover:bg-forest-deep">
          CONTINUE TO GUEST DETAILS <ArrowRight aria-hidden="true" className="h-3 w-3" />
        </button>
        <p className="mt-2 text-center text-[7px] leading-[1.6] text-muted">No payment is taken at this step.</p>
        <ul className="mt-4 space-y-2.5 border-t border-[#eeece6] pt-3 text-[8px] leading-[1.5] text-muted">
          <li className="flex gap-2"><ShieldCheck aria-hidden="true" className="h-3 w-3 shrink-0 text-[#94713a]" /><span><strong className="text-ink">Flexible cancellation:</strong> Confirm terms before payment.</span></li>
          <li className="flex gap-2"><LockKeyhole aria-hidden="true" className="h-3 w-3 shrink-0 text-[#94713a]" /><span><strong className="text-ink">Secure booking:</strong> Guest details are collected in the next step.</span></li>
          <li className="flex gap-2"><ConciergeBell aria-hidden="true" className="h-3 w-3 shrink-0 text-[#94713a]" /><span><strong className="text-ink">Concierge support:</strong> Our team can assist throughout your stay.</span></li>
        </ul>
      </div>
    </aside>
  )
}

function GuestDetailsForm({ onDone }: { onDone: () => void }) {
  const [saved, setSaved] = useState(false)

  function submitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(true)
    onDone()
  }

  return (
    <form onSubmit={submitDetails} className="mt-4 border border-[#e9e6df] bg-white p-4 sm:p-5">
      <p className="text-[8px] font-medium tracking-[0.13em] text-[#94713a]">NEXT STEP · GUEST DETAILS</p>
      <h2 className="mt-1 font-display text-[21px] text-ink">Who is staying?</h2>
      <p className="mt-1 text-[9px] leading-[1.6] text-muted">Add the lead guest’s details for this reservation.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-[8px] font-medium text-ink">FULL NAME<input required autoComplete="name" className="mt-1 block h-9 w-full border border-[#dedbd3] bg-[#faf9f6] px-2 text-[10px] font-normal outline-none focus:border-[#94713a]" /></label>
        <label className="text-[8px] font-medium text-ink">EMAIL ADDRESS<input required type="email" autoComplete="email" className="mt-1 block h-9 w-full border border-[#dedbd3] bg-[#faf9f6] px-2 text-[10px] font-normal outline-none focus:border-[#94713a]" /></label>
        <label className="text-[8px] font-medium text-ink sm:col-span-2">PHONE NUMBER<input required type="tel" autoComplete="tel" className="mt-1 block h-9 w-full border border-[#dedbd3] bg-[#faf9f6] px-2 text-[10px] font-normal outline-none focus:border-[#94713a]" /></label>
      </div>
      <button type="submit" className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 bg-[#84652e] px-4 text-[8px] font-medium tracking-wide text-white hover:bg-forest">
        {saved ? 'GUEST DETAILS SAVED' : 'SAVE GUEST DETAILS'} <Check aria-hidden="true" className="h-3 w-3" />
      </button>
      {saved && <p role="status" className="mt-3 text-[9px] leading-[1.6] text-[#60745d]">Guest details are saved for this preview. Payment is the next step in the booking flow.</p>}
    </form>
  )
}

function PrivilegeStrip() {
  const benefits = [
    { icon: Waves, title: 'Private Lagoon Marina', detail: 'Charter private riverboats straight from our Victoria Island boardwalk.' },
    { icon: Sparkles, title: 'Sanctuary Hydro-Spa', detail: 'Nordic thermal pools, cedar sauna, and indigenous botanical therapies.' },
    { icon: ConciergeBell, title: 'Curated Dining', detail: 'Four distinct culinary sanctuaries overseen by international chefs.' },
    { icon: ShieldCheck, title: 'Absolute Discretion', detail: 'Private diplomatic security corridors and unmarked gates.' },
  ]

  return (
    <section className="bg-[#f3f1eb] px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-6 text-center">
          <p className="text-[8px] font-medium tracking-[0.14em] text-[#94713a]">UNCOMPROMISING LUXURY</p>
          <h2 className="mt-2 font-display text-[27px] leading-tight text-ink sm:text-[33px]">The Victoria Island Privilege</h2>
          <p className="mt-2 text-[9px] text-muted">Every reservation is accompanied by discreet hospitality and considered details.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, detail }) => <article key={title} className="bg-white p-4"><Icon aria-hidden="true" className="h-4 w-4 text-[#94713a]" /><h3 className="mt-3 font-display text-[16px] text-ink">{title}</h3><p className="mt-1 text-[8px] leading-[1.6] text-muted">{detail}</p></article>)}
        </div>
      </div>
    </section>
  )
}

export function BookYourStayPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const today = localDateValue(new Date())
  const defaultCheckIn = searchParams.get('checkin') || today
  const [checkIn, setCheckIn] = useState(defaultCheckIn)
  const [checkOut, setCheckOut] = useState(searchParams.get('checkout') || addDays(defaultCheckIn, 4))
  const initialAdults = Number(searchParams.get('adults') || 2)
  const initialChildren = Number(searchParams.get('children') || 0)
  const initialRoomsCount = Number(searchParams.get('rooms') || 1)
  const [adults, setAdults] = useState(initialAdults)
  const [children, setChildren] = useState(initialChildren)
  const [roomsCount, setRoomsCount] = useState(initialRoomsCount)
  const initialRoom = searchParams.get('room')
  const initialRoomDetails = roomSuites.find((room) => room.id === initialRoom)
  const initialGuestCount = initialAdults + initialChildren
  const [selectedRoomId, setSelectedRoomId] = useState(
    initialRoomDetails && initialGuestCount <= initialRoomDetails.maxGuests * initialRoomsCount ? initialRoomDetails.id : '',
  )
  const [hasSearched, setHasSearched] = useState(Boolean(initialRoom))
  const [activeFilter, setActiveFilter] = useState(roomFilters[0])
  const [showGuestDetails, setShowGuestDetails] = useState(false)
  const [guestDetailsSaved, setGuestDetailsSaved] = useState(false)
  const guestCount = adults + children
  const nights = numberOfNights(checkIn, checkOut)
  const selectedRoom = roomSuites.find((room) => room.id === selectedRoomId)
  const visibleRooms = useMemo(() => {
    return roomSuites.filter((room) => {
      const matchesTier = activeFilter === 'All Tiers'
        || (activeFilter === 'Lagoon' && room.id !== 'presidential')
        || (activeFilter === 'Penthouse' && room.id === 'presidential')
      return matchesTier && guestCount <= room.maxGuests * roomsCount
    })
  }, [activeFilter, guestCount, roomsCount])

  function handleSearch(values: { checkIn: string; checkOut: string; adults: number; children: number; rooms: number }) {
    setCheckIn(values.checkIn)
    setCheckOut(values.checkOut)
    setAdults(values.adults)
    setChildren(values.children)
    setRoomsCount(values.rooms)
    setHasSearched(true)
    setShowGuestDetails(false)
    setGuestDetailsSaved(false)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('checkin', values.checkIn)
    nextParams.set('checkout', values.checkOut)
    nextParams.set('adults', String(values.adults))
    nextParams.set('children', String(values.children))
    nextParams.set('rooms', String(values.rooms))
    if (selectedRoom && values.adults + values.children > selectedRoom.maxGuests * values.rooms) {
      setSelectedRoomId('')
      nextParams.delete('room')
    }
    setSearchParams(nextParams, { replace: true })
    requestAnimationFrame(() => document.getElementById('available-stays')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function selectRoom(roomId: string) {
    setSelectedRoomId(roomId)
    setGuestDetailsSaved(false)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('room', roomId)
    setSearchParams(nextParams, { replace: true })
  }

  return (
    <>
      <section className="relative flex min-h-[370px] items-start justify-center bg-forest-deep pb-24 pt-12 text-center text-white sm:min-h-[395px] sm:pt-14">
        <img src={heroImage} alt="The Opzy waterfront hotel at dusk" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,20,14,0.72),rgba(5,20,14,0.88)_62%,rgba(5,20,14,0.97))]" />
        <div className="relative z-10 mx-auto max-w-[720px] px-5">
          <p className="mx-auto inline-flex items-center gap-2 border border-champagne/30 bg-forest/50 px-3 py-1 text-[8px] font-medium tracking-[0.14em] text-champagne"><span aria-hidden="true">●</span> RESERVATIONS &amp; AVAILABILITY</p>
          <h1 className="mt-4 font-display text-[36px] leading-tight sm:text-[48px]">Reserve Your Stay</h1>
          <p className="mx-auto mt-2 max-w-[520px] text-[11px] leading-[1.7] text-white/75 sm:text-[12px]">Experience exceptional comfort and luxury at OPZY LUXURY HOTEL along the tranquil waters of Victoria Island.</p>
          {initialRoom && selectedRoom && (
            <p className="mt-4 inline-flex items-center gap-2 bg-forest/70 px-3 py-2 text-[8px] text-champagne"><Check aria-hidden="true" className="h-3 w-3" /> PRE-SELECTED FROM ROOMS PAGE · {selectedRoom.fullName}</p>
          )}
        </div>
        <AvailabilitySearch
          onSearch={handleSearch}
          initialCheckIn={checkIn}
          initialCheckOut={checkOut}
          initialAdults={String(adults)}
          initialChildren={String(children)}
          initialRooms={String(roomsCount)}
        />
      </section>

      {hasSearched ? (
        <section id="available-stays" className="scroll-mt-5 bg-paper px-5 pb-12 pt-24 sm:px-8 sm:pb-16 lg:px-10">
          <div className="mx-auto grid max-w-[1280px] items-start gap-5 lg:grid-cols-[minmax(0,1.8fr)_minmax(270px,0.85fr)]">
            <div className="min-w-0">
              {selectedRoom && (
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border border-[#31513e] bg-forest p-3 text-white sm:px-4">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[8px]">
                    <span className="bg-[#84652e] px-2 py-1 font-medium text-white">PRE-SELECTED FROM SUITES</span>
                    <span className="text-white/70">{selectedRoom.fullName} · {nights} night stay</span>
                  </div>
                  <button type="button" onClick={() => {
                    setSelectedRoomId('')
                    const nextParams = new URLSearchParams(searchParams)
                    nextParams.delete('room')
                    setSearchParams(nextParams, { replace: true })
                  }} className="text-[8px] font-medium tracking-wide text-champagne underline underline-offset-2">CHANGE SUITE</button>
                </div>
              )}

              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-display text-[22px] leading-tight text-ink">Available Sanctuaries &amp; Suites</h2>
                  <p className="mt-1 text-[8px] text-muted">Showing options for {displayDate(checkIn)} – {displayDate(checkOut)} ({nights} night{nights === 1 ? '' : 's'}) · {guestCount} guest{guestCount === 1 ? '' : 's'} across {roomsCount} room{roomsCount === 1 ? '' : 's'}</p>
                </div>
                <div className="flex flex-wrap gap-1.5" aria-label="Filter by room type">
                  {roomFilters.map((filter) => <button key={filter} type="button" aria-pressed={activeFilter === filter} onClick={() => setActiveFilter(filter)} className={`min-h-7 border px-2.5 text-[7px] font-medium tracking-wide ${activeFilter === filter ? 'border-[#94713a] bg-white text-[#795a27]' : 'border-[#e4e0d7] bg-transparent text-muted hover:bg-white'}`}>{filter.toUpperCase()}</button>)}
                </div>
              </div>

              <p className="mb-3 border-l-2 border-[#b39b6c] bg-[#f3f1eb] px-3 py-2 text-[8px] leading-[1.6] text-muted">
                Availability preview only. Live room inventory is not connected yet; the reservations team will confirm your selected stay.
              </p>

              <div className="space-y-3">
                {visibleRooms.length > 0 ? visibleRooms.map((room) => <StayCard key={room.id} room={room} selected={selectedRoomId === room.id} onSelect={() => selectRoom(room.id)} />) : (
                  <p role="status" className="border border-[#e9e6df] bg-white px-5 py-6 text-[10px] leading-[1.7] text-muted">
                    No sanctuaries fit {guestCount} guests across {roomsCount} room{roomsCount === 1 ? '' : 's'}. Increase the sanctuary count or adjust the guest allocation to see suitable options.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <BookingSummary selectedRoom={selectedRoom} checkIn={checkIn} checkOut={checkOut} nights={nights} adults={adults} children={children} roomsCount={roomsCount} onContinue={() => setShowGuestDetails(true)} />
              {showGuestDetails && <GuestDetailsForm onDone={() => setGuestDetailsSaved(true)} />}
              {guestDetailsSaved && <p role="status" className="border border-[#d6dfd1] bg-[#f1f5ef] px-4 py-3 text-[9px] leading-[1.6] text-[#54694f]">Guest details saved for this preview. The next step will connect secure payment and booking confirmation.</p>}
              <div className="flex items-start gap-3 border border-[#e9e6df] bg-[#f3f1eb] p-3.5">
                <ConciergeBell aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-[#94713a]" />
                <p className="text-[8px] leading-[1.6] text-muted"><strong className="text-ink">Bespoke suite inquiries?</strong><br />Speak directly to the Chief Butler at Victoria Island.<br /><a className="font-medium text-[#94713a]" href="tel:+23418906799">+234 (0) 1 890 OPZY</a></p>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="bg-paper px-5 pb-12 pt-24 sm:px-8 sm:pb-16 lg:px-10">
          <div className="mx-auto max-w-[1280px]">
            <div className="mx-auto max-w-[560px] text-center">
              <p className="inline-flex items-center gap-2 text-[8px] font-medium tracking-wide text-[#94713a]"><Clock3 aria-hidden="true" className="h-3 w-3" /> ARRIVAL FROM 15:00 · DEPARTURE BY 12:00</p>
              <h2 className="mt-3 font-display text-[25px] text-ink">Your waterfront escape starts here.</h2>
              <p className="mt-2 text-[9px] leading-[1.7] text-muted">Choose your stay dates above to view room options and an estimated accommodation total. No payment is taken to check availability.</p>
            </div>
          </div>
        </section>
      )}

      <PrivilegeStrip />
    </>
  )
}