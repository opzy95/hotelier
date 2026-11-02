import { ArrowRight, Clock3, Mail, MapPin, PhoneCall, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import heroImage from '../img/Opzy Luxury Hotel infinity lagoon pool at twilight in Victoria Island.png'

const contactOptions = [
  {
    icon: PhoneCall,
    label: 'SPEAK WITH US',
    title: 'Concierge Desk',
    detail: 'For reservations, itinerary planning, and immediate assistance.',
    action: '+234 (0) 1 890 OPZY',
    href: 'tel:+23418906799',
  },
  {
    icon: Mail,
    label: 'WRITE TO US',
    title: 'Reservations Desk',
    detail: 'For private stays, villa charters, corporate bookings, and events.',
    action: 'reservations@opzyluxury.com',
    href: 'mailto:reservations@opzyluxury.com',
  },
  {
    icon: MapPin,
    label: 'FIND THE SANCTUARY',
    title: 'Victoria Island, Lagos',
    detail: 'Plot 12, Waterfront Esplanade, Victoria Island, Lagos, Nigeria.',
    action: 'OPEN ACCESS MAP',
    href: 'https://maps.google.com/?q=Victoria+Island+Lagos+Nigeria',
  },
]

export function ContactPage() {
  return (
    <>
      <section className="relative isolate flex min-h-[330px] items-center overflow-hidden bg-forest-deep px-5 py-16 text-white sm:min-h-[390px] sm:px-8 lg:px-10">
        <img src={heroImage} alt="The Opzy waterfront at dusk" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,20,14,0.86),rgba(5,20,14,0.52)_58%,rgba(5,20,14,0.2))]" />
        <div className="mx-auto w-full max-w-[1280px]">
          <p className="mb-4 flex items-center gap-3 text-[8px] font-medium tracking-[0.16em] text-champagne"><span className="h-px w-6 bg-champagne" /> CONCIERGE &amp; ACCESS</p>
          <h1 className="max-w-[650px] font-display text-[38px] leading-[1.1] sm:text-[50px]">A personal welcome, <em className="font-normal text-champagne">always.</em></h1>
          <p className="mt-4 max-w-[500px] text-[11px] leading-[1.8] text-white/75 sm:text-[12px]">From the first question to your journey home, our team is here to make every detail feel effortless.</p>
          <a href="#contact-options" className="mt-6 inline-flex min-h-10 items-center gap-2 border border-white/50 px-5 text-[8px] font-medium tracking-wide text-white transition-colors hover:border-champagne hover:text-champagne">
            CONNECT WITH OPZY <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>

      <section id="contact-options" className="bg-paper px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-8 grid gap-3 sm:grid-cols-[1fr_0.7fr] sm:items-end sm:gap-8">
            <div>
              <p className="text-[8px] font-medium tracking-[0.14em] text-[#94713a]">WE’RE HERE TO HELP</p>
              <h2 className="mt-2 font-display text-[30px] leading-tight text-ink sm:text-[36px]">Reach our concierge</h2>
            </div>
            <p className="max-w-[420px] text-[10px] leading-[1.7] text-muted sm:justify-self-end">Choose the contact that suits you. Our guest services team is available around the clock for current and future stays.</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {contactOptions.map(({ icon: Icon, label, title, detail, action, href }) => {
              const isExternal = href.startsWith('http')
              return (
                <article key={title} className="border border-[#ece9e2] bg-white p-5 sm:p-6">
                  <span className="grid h-10 w-10 place-items-center bg-forest text-champagne">
                    <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <p className="mt-4 text-[8px] font-medium tracking-[0.12em] text-[#94713a]">{label}</p>
                  <h3 className="mt-1 font-display text-[20px] text-ink">{title}</h3>
                  <p className="mt-2 min-h-[40px] text-[10px] leading-[1.7] text-muted">{detail}</p>
                  <a href={href} target={isExternal ? '_blank' : undefined} rel={isExternal ? 'noreferrer' : undefined} className="mt-4 inline-flex items-center gap-2 text-[9px] font-medium text-ink transition-colors hover:text-[#94713a]">
                    {action} <ArrowRight aria-hidden="true" className="h-3 w-3" />
                  </a>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f3f1eb] px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
        <div className="mx-auto grid max-w-[1280px] gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-[8px] font-medium tracking-[0.14em] text-[#94713a]">PERSONAL SERVICE</p>
            <h2 className="mt-2 font-display text-[29px] leading-tight text-ink sm:text-[34px]">Consider every detail handled.</h2>
            <p className="mt-3 text-[10px] leading-[1.8] text-muted">Our concierge team can coordinate airport transfers, private dining, lagoon charters, and tailored itineraries before you arrive.</p>
            <Link to="/bookings" className="mt-5 inline-flex items-center gap-2 border-b border-[#a58b5c] pb-1.5 text-[8px] font-semibold text-ink hover:text-[#94713a]">
              MANAGE A BOOKING <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="border border-[#e6e2d9] bg-paper p-5">
              <Clock3 aria-hidden="true" className="h-5 w-5 text-[#94713a]" />
              <h3 className="mt-3 font-display text-[18px] text-ink">Always available</h3>
              <p className="mt-2 text-[10px] leading-[1.7] text-muted">Our concierge desk is available 24 hours a day, every day.</p>
            </article>
            <article className="border border-[#e6e2d9] bg-paper p-5">
              <ShieldCheck aria-hidden="true" className="h-5 w-5 text-[#94713a]" />
              <h3 className="mt-3 font-display text-[18px] text-ink">Handled discreetly</h3>
              <p className="mt-2 text-[10px] leading-[1.7] text-muted">Your plans and personal requests are treated with care and privacy.</p>
            </article>
          </div>
        </div>
      </section>
    </>
  )
}