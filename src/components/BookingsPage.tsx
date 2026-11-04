import { useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, KeyRound, LockKeyhole, Mail, PhoneCall, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import heroImage from '../img/Opzy Luxury Hotel infinity lagoon pool at twilight in Victoria Island.png'

function BookingLookup() {
  const [lookupAttempted, setLookupAttempted] = useState(false)
  function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLookupAttempted(true)
  }

  return (
    <section className="relative z-10 mx-auto -mt-8 w-[calc(100%-2.5rem)] max-w-[670px] border border-[#eeece6] bg-white px-5 py-7 shadow-[0_12px_35px_rgba(13,28,21,0.08)] sm:-mt-10 sm:px-9 sm:py-9">
      <div className="text-center">
        <p className="text-[8px] font-medium tracking-[0.14em] text-[#94713a]">RESERVATION LOOKUP</p>
        <h2 className="mt-2 font-display text-[25px] leading-tight text-ink">Find Your Booking</h2>
        <p className="mt-2 text-[10px] leading-[1.7] text-muted">Enter the details associated with your reservation to retrieve your booking.</p>
      </div>

      <form onSubmit={handleLookup} className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[8px] font-medium tracking-wide text-ink">RESERVATION EMAIL ADDRESS</span>
          <span className="flex h-10 items-center gap-2 border border-[#deddd7] bg-[#faf9f6] px-3 focus-within:border-[#94713a]">
            <Mail aria-hidden="true" className="h-3 w-3 shrink-0 text-muted" />
            <input required name="email" type="email" autoComplete="email" placeholder="you@example.com" className="h-full w-full bg-transparent text-[10px] text-ink outline-none placeholder:text-[#b4b5af]" />
          </span>
        </label>
        <button type="submit" className="flex h-10 w-full items-center justify-center gap-2 bg-forest text-[8px] font-medium tracking-wide text-white transition-colors hover:bg-forest-deep">
          FIND MY BOOKING <ArrowRight aria-hidden="true" className="h-3 w-3" />
        </button>
      </form>

      {lookupAttempted && (
        <p role="status" className="mt-4 border border-[#e7e1d5] bg-[#f7f5f0] px-3 py-2.5 text-center text-[10px] leading-[1.6] text-muted">
          Online reservation lookup is not connected yet. Contact our reservations desk and we’ll be happy to help locate your stay.
        </p>
      )}

    </section>
  )
}

function ConciergeCards() {
  const contacts = [
    {
      icon: PhoneCall,
      eyebrow: 'DIRECT TELEPHONY',
      title: '24/7 VIP Concierge Desk',
      detail: 'Immediate connection for reservation modifications and urgent itinerary requests.',
      action: '+234 (0) 1 890 OPZY',
      href: 'tel:+23418906799',
    },
    {
      icon: Mail,
      eyebrow: 'DISCREET INQUIRIES',
      title: 'Reservations Desk',
      detail: 'Direct written correspondence for private villa charters, corporate bookings, and events.',
      action: 'reservations@opzyluxury.com',
      href: 'mailto:reservations@opzyluxury.com',
    },
    {
      icon: KeyRound,
      eyebrow: 'PHYSICAL ESTATE',
      title: 'Victoria Island Enclave',
      detail: 'Plot 12, Waterfront Esplanade, Victoria Island, Lagos, Nigeria. Private heliport on estate grounds.',
      action: 'DISCOVER ACCESS MAP',
      href: 'https://maps.google.com/?q=Victoria+Island+Lagos+Nigeria',
    },
  ]

  return (
    <section className="bg-[#f3f1eb] px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto mb-7 max-w-[600px] text-center">
          <p className="text-[8px] font-medium tracking-[0.14em] text-[#94713a]">PERSONAL SERVICE</p>
          <h2 className="mt-2 font-display text-[27px] leading-tight text-ink sm:text-[34px]">Dedicated Concierge Assistance</h2>
          <p className="mt-2 text-[10px] leading-[1.7] text-muted">Our residential concierge and private reservation desk stand ready to assist with custom itineraries, airport transfers, and confidential inquiries.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {contacts.map(({ icon: Icon, eyebrow, title, detail, action, href }) => (
            <article key={title} className="bg-white px-5 py-5 shadow-[0_8px_24px_rgba(16,30,22,0.035)] sm:px-6">
              <span className="grid h-9 w-9 place-items-center bg-forest text-champagne">
                <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <p className="mt-4 text-[8px] font-medium tracking-wide text-[#94713a]">{eyebrow}</p>
              <h3 className="mt-1 font-display text-[18px] text-ink">{title}</h3>
              <p className="mt-1.5 min-h-[38px] text-[9px] leading-[1.7] text-muted">{detail}</p>
              <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} className="mt-3 inline-flex items-center gap-1.5 text-[8px] font-medium tracking-wide text-ink transition-colors hover:text-[#94713a]">
                {action} <ArrowRight aria-hidden="true" className="h-3 w-3" />
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function BookingsPage() {
  return (
    <>
      <section className="relative isolate flex min-h-[280px] items-center justify-center overflow-hidden bg-forest-deep px-5 py-14 text-center text-white sm:min-h-[330px]">
        <img src={heroImage} alt="A quiet lagoon-side evening at Opzy" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(5,20,14,0.72),rgba(5,20,14,0.94))]" />
        <div className="max-w-[620px]">
          <p className="mb-3 text-[8px] font-medium tracking-[0.15em] text-champagne">GUEST SERVICES</p>
          <h1 className="font-display text-[36px] leading-tight sm:text-[46px]">Manage Your Stay</h1>
          <p className="mx-auto mt-3 max-w-[470px] text-[11px] leading-[1.7] text-white/70 sm:text-[12px]">Your reservation, just a few details away. Access your booking information whenever you need it.</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[8px] text-white/55">
            <span className="inline-flex items-center gap-1.5"><LockKeyhole aria-hidden="true" className="h-3 w-3 text-champagne" /> Encrypted Discretion</span>
            <span aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck aria-hidden="true" className="h-3 w-3 text-champagne" /> 24/7 Dedicated Concierge</span>
          </div>
        </div>
      </section>
      <div className="bg-paper pb-12 sm:pb-16"><BookingLookup /></div>
      <ConciergeCards />
      <div className="bg-paper py-6 text-center">
        <Link to="/rooms" className="inline-flex items-center gap-2 text-[9px] font-semibold text-ink hover:text-[#94713a]">
          EXPLORE ROOMS &amp; SUITES <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>
    </>
  )
}