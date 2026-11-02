import type { FormEvent } from 'react'
import { ArrowRight, Baby, CalendarDays, Search, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import heroImage from '../img/Opzy Luxury Hotel infinity lagoon pool at twilight in Victoria Island.png'

function dateValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

function BookingBar() {
  const navigate = useNavigate()
  const checkIn = new Date()
  const checkOut = new Date()
  checkOut.setDate(checkOut.getDate() + 4)

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const params = new URLSearchParams()
    for (const [key, value] of formData.entries()) params.set(key, String(value))
    navigate(`/book?${params.toString()}`)
  }

  return (
    <form
      id="booking"
      onSubmit={handleSearch}
      className="absolute inset-x-5 bottom-0 z-10 mx-auto grid max-w-[1240px] translate-y-1/2 gap-2.5 bg-white p-3.5 shadow-[0_12px_35px_rgba(13,28,21,0.12)] sm:grid-cols-2 sm:p-4 lg:grid-cols-[1.2fr_1.2fr_1fr_1fr_1.05fr] lg:gap-3 lg:p-5"
    >
      <label className="flex min-h-[58px] flex-col justify-center border border-[#eeece6] px-3 py-2">
        <span className="mb-1 flex items-center gap-1.5 text-[9px] font-medium text-muted">
          <CalendarDays aria-hidden="true" className="h-3 w-3 text-[#a88242]" /> CHECK-IN DATE
        </span>
        <input aria-label="Check-in date" name="checkin" type="date" min={dateValue(new Date())} defaultValue={dateValue(checkIn)} className="w-full bg-transparent text-[11px] text-ink outline-none" />
      </label>
      <label className="flex min-h-[58px] flex-col justify-center border border-[#eeece6] px-3 py-2">
        <span className="mb-1 flex items-center gap-1.5 text-[9px] font-medium text-muted">
          <CalendarDays aria-hidden="true" className="h-3 w-3 text-[#a88242]" /> CHECK-OUT DATE
        </span>
        <input aria-label="Check-out date" name="checkout" type="date" min={dateValue(checkIn)} defaultValue={dateValue(checkOut)} className="w-full bg-transparent text-[11px] text-ink outline-none" />
      </label>
      <label className="flex min-h-[58px] flex-col justify-center border border-[#eeece6] px-3 py-2">
        <span className="mb-1 flex items-center gap-1.5 text-[9px] font-medium text-muted">
          <Users aria-hidden="true" className="h-3 w-3 text-[#a88242]" /> ADULTS
        </span>
        <select aria-label="Number of adults" name="adults" defaultValue="2" className="w-full appearance-none bg-transparent text-[11px] text-ink outline-none">
          {[1, 2, 3, 4, 5, 6].map((count) => <option key={count} value={count}>{String(count).padStart(2, '0')} Guests</option>)}
        </select>
      </label>
      <label className="flex min-h-[58px] flex-col justify-center border border-[#eeece6] px-3 py-2">
        <span className="mb-1 flex items-center gap-1.5 text-[9px] font-medium text-muted">
          <Baby aria-hidden="true" className="h-3 w-3 text-[#a88242]" /> CHILDREN
        </span>
        <select aria-label="Number of children" name="children" defaultValue="0" className="w-full appearance-none bg-transparent text-[11px] text-ink outline-none">
          {[0, 1, 2, 3, 4].map((count) => <option key={count} value={count}>{String(count).padStart(2, '0')} Children</option>)}
        </select>
      </label>
      <button type="submit" className="flex min-h-[58px] items-center justify-center gap-2 bg-forest px-4 text-[10px] font-medium text-champagne transition-colors hover:bg-forest-deep">
        <Search aria-hidden="true" className="h-3.5 w-3.5" /> FIND A ROOM
      </button>
    </form>
  )
}

export function HeroSection() {
  return (
    <section id="home" className="relative flex min-h-[590px] items-center bg-forest-deep pb-16 text-white sm:min-h-[620px] lg:min-h-[650px]">
      <img src={heroImage} alt="Twilight over Opzy Luxury Hotel's lagoon pool" className="absolute inset-0 h-full w-full object-cover object-center" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,20,14,0.88)_0%,rgba(7,23,17,0.68)_40%,rgba(7,23,17,0.16)_100%)]" />
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(0deg,rgba(5,20,14,0.42),transparent_48%)]" />

      <div className="relative z-10 mx-auto w-full max-w-[1440px] px-5 pb-12 pt-16 sm:px-8 lg:px-10">
        <div className="max-w-[620px]">
          <p className="mb-5 flex items-center gap-3 text-[9px] font-medium text-champagne">
            <span className="h-px w-8 bg-champagne" /> WELCOME TO EXCEPTIONAL HOSPITALITY
          </p>
          <h1 className="font-display text-[clamp(42px,6vw,68px)] leading-[1.04] text-white">
            Where Luxury<br />Meets <em className="font-normal text-champagne">Comfort.</em>
          </h1>
          <p className="mt-5 max-w-[500px] text-[13px] leading-6 text-white/75 sm:text-sm">
            Discover a world of refined comfort, exceptional service and unforgettable hospitality at Opzy Luxury Hotel, Victoria Island, Lagos.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href="#rooms" className="inline-flex min-h-11 items-center gap-2 bg-champagne px-6 text-[10px] font-semibold text-forest-deep transition-colors hover:bg-white">
              DISCOVER YOUR STAY <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
            <a href="#about" className="inline-flex min-h-11 items-center border border-white/40 px-6 text-[10px] font-semibold text-white transition-colors hover:border-champagne hover:text-champagne">
              EXPLORE OPZY
            </a>
          </div>
        </div>
      </div>

      <BookingBar />
    </section>
  )
}