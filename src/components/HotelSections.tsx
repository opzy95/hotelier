import {
  ArrowRight,
  BedDouble,
  ConciergeBell,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Waves,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { roomSuites } from '../data/roomSuites'
import { hotelExperiences } from '../data/hotelExperiences'
import aboutImage from '../img/AB6AXuBe8EhD1inxGmAh2_NKj2w7A48dC5btf3k750N3sfk9OydZCMCAXiGF0GMrhZfIUJoP1fze5ldUbUvZzFVh_eynNobr0FJBcrxKNh5LKgXA7_DsEyPHPWt6T4X-lzj4qsWdE8ESBwt53I87Y2-ztPi-bffZqHxT1iQIXmC5osOFe-vR-Xvs7xckZW_nnOlTR4lVxCMGLKpjnPKy.png'

const sectionEyebrow = 'mb-4 flex items-center gap-3 text-[9px] font-medium text-[#94713a]'
const eyebrowLine = 'h-px w-5 bg-[#94713a]'

export function AboutSection() {
  return (
    <section id="about" className="bg-paper px-5 pb-16 pt-28 sm:px-8 sm:pb-20 sm:pt-32 lg:px-10 lg:pb-24">
      <div className="mx-auto grid max-w-[1280px] items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        <div className="relative min-h-[300px] sm:min-h-[400px]">
          <img src={aboutImage} alt="A quiet, refined gathering space overlooking the lagoon" className="absolute inset-0 h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-forest-deep/10" />
          <div className="absolute -bottom-4 right-0 max-w-[330px] bg-forest px-5 py-4 text-white shadow-xl sm:right-[-18px] sm:px-6 sm:py-5">
            <p className="mb-1 text-[9px] font-medium text-champagne">OPZY LAGOS</p>
            <h3 className="font-display text-[20px] leading-tight">Sanctuary of Quiet Luxury</h3>
            <p className="mt-1.5 text-[10px] leading-4 text-white/65">Elegance shaped by discretion, privacy and bespoke lagoon care.</p>
          </div>
        </div>

        <div className="lg:py-8">
          <p className={sectionEyebrow}><span className={eyebrowLine} /> DISCOVER OPZY</p>
          <h2 className="max-w-[490px] font-display text-[34px] leading-[1.16] text-ink sm:text-[40px]">
            A sanctuary of elegance and comfort.
          </h2>
          <p className="mt-5 text-[12px] leading-[1.8] text-muted">
            Set along the waterfront of Victoria Island, Opzy pairs thoughtful design with personal hospitality. Discover a discreet Lagos sanctuary shaped by calm, comfort, and the lagoon.
          </p>
          <Link to="/about" className="mt-6 inline-flex min-h-10 items-center gap-2 border-b border-[#a58b5c] pb-1.5 text-[9px] font-semibold text-ink transition-colors hover:text-[#94713a]">
            SEE MORE ABOUT OPZY <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

const features = [
  { icon: BedDouble, title: 'Elegant Rooms', detail: 'Bespoke artisanal furnishings, soundproof floor-to-ceiling glass, and tranquil Lagos lagoon panoramas.' },
  { icon: ConciergeBell, title: 'Personal Service', detail: 'Dedicated 24/7 personal butler assistance, private lagoon unpacking, and bespoke reservations tailored to you.' },
  { icon: Waves, title: 'Guest Comfort', detail: 'Hypoallergenic organic sleep systems, custom Egyptian cotton linens, and nocturnal in-suite aromatherapy.' },
  { icon: Sparkles, title: 'Modern Amenities', detail: 'Private marina yacht slips, temperature-controlled infinity edge pool, and high-speed satellite connectivity.' },
]

export function FeaturesSection() {
  return (
    <section className="bg-forest px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
      <div className="mx-auto grid max-w-[1280px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, detail }) => (
          <article key={title} className="border border-white/[0.07] bg-forest-deep/45 px-5 py-5 transition-colors hover:border-champagne/30">
            <div className="mb-4 grid h-10 w-10 place-items-center border border-champagne/25 text-champagne">
              <Icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.4} />
            </div>
            <h3 className="font-display text-[20px] text-white">{title}</h3>
            <p className="mt-2 text-[10px] leading-[1.7] text-white/50">{detail}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function RoomCard({ room }: { room: (typeof roomSuites)[number] }) {
  return (
    <article className="group bg-white">
      <a href="#booking" className="relative block aspect-[1.55] overflow-hidden">
        <img src={room.image} alt={`${room.name} at Opzy Luxury Hotel`} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
        <span className="absolute left-3 top-3 bg-forest px-3 py-1.5 text-[8px] font-medium text-champagne">{room.category}</span>
      </a>
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-[20px] text-ink">{room.name}</h3>
          <p className="text-[10px] text-[#92713e]"><span className="font-semibold">{room.price}</span><span className="ml-1 text-muted">/ Night</span></p>
        </div>
        <p className="mt-2 min-h-[42px] text-[10px] leading-[1.65] text-muted">{room.description}</p>
        <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-2 border-y border-[#eeece6] py-3">
          {room.details.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-1.5 text-[9px] text-ink/80">
              <Icon aria-hidden="true" className="h-3 w-3 shrink-0 text-[#9b7b48]" strokeWidth={1.6} />{label}
            </span>
          ))}
        </div>
        <a href="#booking" className="mt-3 flex items-center justify-between text-[9px] font-medium text-ink transition-colors hover:text-[#94713a]">
          EXPLORE SUITE <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  )
}

export function RoomsSection() {
  return (
    <section id="rooms" className="bg-[#f3f1eb] px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto mb-10 max-w-[560px] text-center">
          <p className="text-[9px] font-medium text-[#94713a]">STAY IN STYLE</p>
          <h2 className="mt-3 font-display text-[34px] leading-tight text-ink sm:text-[40px]">Rooms &amp; Suites</h2>
          <p className="mt-2 text-[11px] leading-[1.7] text-muted">Each private enclave is designed as a sanctuary of restrained elegance, featuring natural raw woods, Italian marble, and panoramic waterfront views.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {roomSuites.map((room) => <RoomCard key={room.id} room={room} />)}
        </div>
        <div className="mt-8 text-center">
          <Link to="/rooms" className="inline-flex min-h-11 items-center gap-2 border border-forest px-6 text-[9px] font-semibold text-forest transition-colors hover:bg-forest hover:text-white">
            VIEW ALL ROOMS &amp; SUITES <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

function ExperienceCard({ experience }: { experience: (typeof hotelExperiences)[number] }) {
  return (
    <article>
      <a href="#booking" className="mb-4 block aspect-[1.55] overflow-hidden bg-[#e6e2d9]">
        <img src={experience.image} alt={experience.alt} className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.04]" />
      </a>
      <p className="text-[8px] font-medium text-[#94713a]">{experience.category}</p>
      <h3 className="mt-1 font-display text-[20px] text-ink">{experience.title}</h3>
      <p className="mt-2 text-[10px] leading-[1.7] text-muted">{experience.description}</p>
    </article>
  )
}

export function ExperiencesSection() {
  return (
    <section id="experiences" className="bg-paper px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-8 grid items-end gap-4 sm:grid-cols-[1fr_0.65fr] sm:gap-8">
          <div>
            <p className="text-[9px] font-medium text-[#94713a]">CURATED LIFE</p>
            <h2 className="mt-3 max-w-[440px] font-display text-[33px] leading-[1.18] text-ink sm:text-[38px]">Experience the Art of Living Well.</h2>
          </div>
          <p className="max-w-[400px] text-[10px] leading-[1.7] text-muted sm:justify-self-end">Unscripted sensory experiences curated daily by our cultural ambassadors, culinary directors, and private fleet navigators.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {hotelExperiences.map((experience) => <ExperienceCard key={experience.id} experience={experience} />)}
        </div>
        <div className="mt-8 text-center">
          <Link to="/experiences" className="inline-flex min-h-11 items-center gap-2 border border-forest px-6 text-[9px] font-semibold text-forest transition-colors hover:bg-forest hover:text-white">
            VIEW ALL EXPERIENCES <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

export function ReservationSection() {
  return (
    <section className="bg-forest px-5 py-16 text-center text-white sm:px-8 sm:py-20">
      <p className="text-[9px] font-medium text-champagne">EXCLUSIVE RESERVATIONS</p>
      <h2 className="mx-auto mt-4 max-w-[700px] font-display text-[32px] leading-tight sm:text-[40px]">Your next exceptional stay awaits.</h2>
      <p className="mx-auto mt-3 max-w-[520px] text-[10px] leading-[1.8] text-white/60">Discover the comfort, elegance and hospitality of Opzy Luxury Hotel. Reserve direct to unlock tailored arrivals and preferential suite allocations.</p>
      <a href="#booking" className="mt-6 inline-flex min-h-11 items-center gap-2 bg-champagne px-6 text-[9px] font-semibold text-forest-deep transition-colors hover:bg-white">
        RESERVE YOUR STAY <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
      </a>
    </section>
  )
}

export function SiteFooter() {
  return (
    <footer id="contact" className="border-t-[5px] border-[#e7e1d5] bg-forest-deep px-5 pb-5 pt-10 text-white sm:px-8 sm:pt-12 lg:px-10">
      <div className="mx-auto grid max-w-[1280px] gap-9 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1fr] lg:gap-16">
        <div>
          <a href="#home" className="font-display text-[22px]">OPZY LUXURY HOTEL</a>
          <p className="mt-3 max-w-[360px] text-[10px] leading-[1.8] text-white/45">An architectural waterfront sanctuary situated on Victoria Island, Lagos. Guided by discretion, bespoke concierge excellence, and effortless hospitality.</p>
          <div className="mt-4 flex gap-4 text-[9px] font-medium text-white/70">
            <a href="#contact" className="hover:text-champagne">IG</a><span>/</span><a href="#contact" className="hover:text-champagne">LN</a><span>/</span><a href="#contact" className="hover:text-champagne">FB</a>
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-[9px] font-medium text-white">DISCOVER</h2>
          <ul className="space-y-2 text-[10px] text-white/45">
            <li><a href="#rooms" className="hover:text-champagne">Suites &amp; Residences</a></li>
            <li><a href="#experiences" className="hover:text-champagne">Private Lagoon Charters</a></li>
            <li><a href="#experiences" className="hover:text-champagne">Curated Dining</a></li>
            <li><a href="#experiences" className="hover:text-champagne">Spa Sanctuary</a></li>
            <li><a href="#about" className="hover:text-champagne">Editorial Journal</a></li>
            <li><a href="#booking" className="hover:text-champagne">Private Events</a></li>
            <li><a href="#about" className="hover:text-champagne">Sustainability</a></li>
            <li><a href="#contact" className="hover:text-champagne">Terms &amp; Discretion</a></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-[9px] font-medium text-white">CONCIERGE &amp; ACCESS</h2>
          <ul className="space-y-3 text-[10px] leading-[1.7] text-white/45">
            <li className="flex gap-2"><MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-champagne" /><span>Plot 140 Walter Carrington Drive,<br />Victoria Island, Lagos, Nigeria.</span></li>
            <li className="flex items-center gap-2"><Mail aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-champagne" /><a href="mailto:concierge@opzyluxury.com" className="hover:text-champagne">concierge@opzyluxury.com</a></li>
            <li className="flex items-center gap-2"><Phone aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-champagne" /><a href="tel:+23418006799" className="hover:text-champagne">+234 1 800 OPZY</a></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-[1280px] flex-col gap-3 border-t border-white/10 pt-4 text-[9px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2025 OPZY LUXURY HOTEL. Victoria Island, Lagos. All Rights Reserved.</p>
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <a href="#contact" className="hover:text-champagne">Privacy Policy</a><span>•</span><a href="#contact" className="hover:text-champagne">Discreet Hospitality Charter</a><span>•</span><span className="text-champagne">Member of The Leading Hotels of the World</span>
        </div>
      </div>
    </footer>
  )
}