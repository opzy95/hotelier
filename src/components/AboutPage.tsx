import {
  ArrowRight,
  BadgeCheck,
  ConciergeBell,
  KeyRound,
  Waves,
} from 'lucide-react'
import aboutImage from '../img/AB6AXuBe8EhD1inxGmAh2_NKj2w7A48dC5btf3k750N3sfk9OydZCMCAXiGF0GMrhZfIUJoP1fze5ldUbUvZzFVh_eynNobr0FJBcrxKNh5LKgXA7_DsEyPHPWt6T4X-lzj4qsWdE8ESBwt53I87Y2-ztPi-bffZqHxT1iQIXmC5osOFe-vR-Xvs7xckZW_nnOlTR4lVxCMGLKpjnPKy.png'
import heroImage from '../img/Opzy Luxury Hotel infinity lagoon pool at twilight in Victoria Island.png'
import roomImage from '../img/Background (16).png'
import diningImage from '../img/Container (6).png'
import wellnessImage from '../img/Container (7).png'
import { ReservationSection } from './HotelSections'

const pillars = [
  {
    icon: Waves,
    title: 'Exceptional Comfort',
    detail: 'Handcrafted organic linens, bespoke spatial acoustics, and serene private retreats engineered for restorative slumber.',
  },
  {
    icon: ConciergeBell,
    title: 'Personalized Service',
    detail: 'Discreet, intuitive attention curated by dedicated 24/7 concierges and personal hosts tuned to your cadence.',
  },
  {
    icon: KeyRound,
    title: 'Timeless Elegance',
    detail: 'Harmonious architectural forms celebrating refined minimalism, coastal breezes, and bespoke woodwork craftsmanship.',
  },
  {
    icon: BadgeCheck,
    title: 'Attention to Detail',
    detail: 'Thoughtful touches from arrival botanicals to customized evening aromatherapy and pillow menus.',
  },
]

const moments = [
  {
    image: roomImage,
    category: 'SANCTUARY',
    title: 'Luxury Accommodation',
    detail: 'Private lagoon suites with panoramic floor-to-ceiling views, bespoke furnishings, and deep stone baths.',
    action: 'EXPLORE SUITES',
    href: '/#rooms',
  },
  {
    image: diningImage,
    category: 'GASTRONOMY',
    title: 'Dining & Culinary Experiences',
    detail: 'Afro-fusion gastronomy and curated wine cellars set over tranquil waters, crafted by master culinary artisans.',
    action: 'DISCOVER MENUS',
    href: '/#experiences',
  },
  {
    image: wellnessImage,
    category: 'WELLNESS',
    title: 'Relaxation & Leisure',
    detail: 'Travertine plunge pools, tranquil lagoon terraces, and holistic wellness rituals tailored to calm the soul.',
    action: 'SPA SANCTUARY',
    href: '/#experiences',
  },
  {
    image: aboutImage,
    category: 'CONCIERGE',
    title: 'Warm & Attentive Hospitality',
    detail: 'Genuine West African warmth married with international five-star discretion, anticipating every unspoken requirement.',
    action: 'MEET OUR TEAM',
    href: '/#contact',
  },
]

const promises = [
  {
    icon: Waves,
    title: 'Unmatched Waterfront Tranquility',
    detail: 'A peaceful coastal sanctuary situated within Lagos’ premier commercial and diplomatic district, shielding you from the energy of the city.',
  },
  {
    icon: KeyRound,
    title: 'Effortless Comfort & Convenience',
    detail: 'Enjoy frictionless in-suite check-ins, ultra-fast discreet connectivity, chauffeur arrangements, and a private boat charter moments away.',
  },
  {
    icon: BadgeCheck,
    title: 'Intuitive, Uncompromising Quality',
    detail: 'Immaculately maintained architectural spaces, world-class gastronomy, and personalized care delivered with quiet sophistication.',
  },
]

function AboutHero() {
  return (
    <section className="relative isolate flex min-h-[360px] items-center justify-center overflow-hidden bg-forest-deep px-5 py-20 text-center text-white sm:min-h-[430px]">
      <img src={heroImage} alt="The Opzy lagoon at dusk" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(7,23,17,0.72),rgba(7,23,17,0.90))]" />
      <div className="max-w-[740px]">
        <p className="mb-5 flex items-center justify-center gap-3 text-[9px] font-medium tracking-[0.16em] text-champagne">
          <span className="h-px w-5 bg-champagne/70" /> DISCOVER OPZY <span className="h-px w-5 bg-champagne/70" />
        </p>
        <h1 className="font-display text-[38px] leading-[1.14] sm:text-[52px]">
          A <em className="font-normal text-champagne">Refined Expression</em> of Luxury
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[12px] leading-5 text-white/75 sm:text-sm sm:leading-6">
          Discover a place where exceptional hospitality, thoughtful comfort and timeless elegance come together along the tranquil waters of Lagos.
        </p>
        <a href="#about-story" className="mt-10 inline-flex flex-col items-center gap-3 text-[8px] font-medium tracking-[0.2em] text-champagne/80 hover:text-champagne">
          EXPLORE OUR SANCTUARY <span aria-hidden="true" className="h-9 w-px bg-champagne/60" />
        </a>
      </div>
    </section>
  )
}

function StorySection() {
  return (
    <section id="about-story" className="bg-paper px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
      <div className="mx-auto max-w-[1280px]">
        <p className="mb-3 text-[9px] font-medium tracking-[0.13em] text-[#94713a]">HERITAGE &amp; VISION</p>
        <h2 className="font-display text-[32px] leading-tight text-ink sm:text-[38px]">The Story Behind OPZY</h2>
        <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1fr] lg:gap-12">
          <div className="relative min-h-[300px] bg-[#ece9e2] sm:min-h-[440px]">
            <img src={aboutImage} alt="A quiet moment inside the Opzy waterfront sanctuary" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute -bottom-4 right-4 max-w-[290px] bg-forest px-5 py-4 text-white shadow-xl sm:right-6 sm:px-6">
              <p className="text-[8px] font-medium tracking-[0.15em] text-champagne">OPZY LAGOS</p>
              <p className="mt-1 font-display text-[17px] italic">A Sanctuary of Quiet Luxury</p>
              <span aria-hidden="true" className="mt-3 block h-px w-8 bg-champagne/60" />
            </div>
          </div>

          <div className="pt-1 text-[11px] leading-[1.8] text-muted sm:text-[12px]">
            <p>
              Perched gracefully along the calm inlets of Victoria Island, OPZY Luxury Hotel was conceived as an architectural haven where the vibrant rhythm of Lagos softens into coastal stillness. It stands as an ode to intentional design, bespoke craft, and absolute discretion.
            </p>
            <p className="mt-4 text-[10px] leading-[1.8]">
              Our vision centers on unhurried luxury: eschewing superficial excess in favor of tactile perfection, natural materials, and an intuitive guest journey. Here, each guest is greeted not merely as a patron, but as an honored resident of a curated coastal sanctuary.
            </p>
            <blockquote className="my-5 border-l border-[#94713a] bg-[#f3f1eb] px-5 py-4 font-display text-[17px] italic leading-[1.35] text-ink sm:px-6 sm:text-[19px]">
              “Every stay should be an elevated sensory sanctuary shaped with discretion and personal warmth.”
              <cite className="mt-3 block font-body text-[8px] not-italic tracking-[0.12em] text-[#94713a]">THE OPZY CURATORIAL COUNCIL</cite>
            </blockquote>
            <p>
              From arrival through lagoon-side departures, our discreet team orchestrates moments tailored exclusively to individual rhythms, making every passage through OPZY a restful and enduring memory.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#e9e5dc] pt-4">
              <div>
                <p className="font-display text-[19px] text-ink">Private Waterfront</p>
                <p className="text-[8px] tracking-wide text-muted">UNINTERRUPTED LAGOON VIEWS</p>
              </div>
              <div>
                <p className="font-display text-[19px] text-ink">24/7 Dedicated</p>
                <p className="text-[8px] tracking-wide text-muted">INTUITIVE PERSONAL HOSTS</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PillarsSection() {
  return (
    <section className="border-y border-[#ece9e2] bg-[#f3f1eb] px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-8 text-center sm:mb-10">
          <p className="text-[9px] font-medium tracking-[0.15em] text-[#94713a]">CORE PILLARS</p>
          <h2 className="mt-3 font-display text-[30px] leading-tight text-ink sm:text-[38px]">Hospitality, Thoughtfully Redefined</h2>
          <span aria-hidden="true" className="mx-auto mt-3 block h-px w-8 bg-[#94713a]" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ icon: Icon, title, detail }) => (
            <article key={title} className="border border-[#e5e2dc] bg-white px-5 py-5 transition-colors hover:border-[#c5ae83]">
              <span className="mb-4 grid h-9 w-9 place-items-center bg-[#f2f0eb] text-[#94713a]">
                <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
              </span>
              <h3 className="font-display text-[17px] text-ink">{title}</h3>
              <p className="mt-2 text-[10px] leading-[1.7] text-muted">{detail}</p>
              <span aria-hidden="true" className="mt-4 block h-px w-5 bg-[#d8d1c3]" />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function MomentsSection() {
  return (
    <section className="bg-paper px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-8 grid items-end gap-4 sm:grid-cols-[1fr_0.8fr] sm:gap-8">
          <div>
            <p className="text-[9px] font-medium tracking-[0.14em] text-[#94713a]">CURATED MOMENTS</p>
            <h2 className="mt-3 font-display text-[31px] leading-tight text-ink sm:text-[38px]">More Than Just a Stay</h2>
          </div>
          <p className="max-w-[420px] text-[10px] leading-[1.7] text-muted sm:justify-self-end">
            An immersive collection of sensory journeys sculpted for discerning travelers along the serene coastline of Victoria Island.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {moments.map((moment) => (
            <article key={moment.title} className="group relative isolate flex min-h-[220px] items-end overflow-hidden bg-forest-deep p-5 text-white sm:min-h-[260px] sm:p-6">
              <img src={moment.image} alt="" aria-hidden="true" className="absolute inset-0 -z-20 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(5,20,14,0.92),rgba(5,20,14,0.25))]" />
              <div>
                <p className="text-[8px] font-medium tracking-[0.14em] text-champagne">{moment.category}</p>
                <h3 className="mt-1 font-display text-[20px] leading-tight sm:text-[22px]">{moment.title}</h3>
                <p className="mt-2 max-w-[480px] text-[10px] leading-[1.65] text-white/75">{moment.detail}</p>
                <a href={moment.href} className="mt-3 inline-flex items-center gap-1.5 text-[8px] font-medium tracking-wide text-champagne hover:text-white">
                  {moment.action} <ArrowRight aria-hidden="true" className="h-3 w-3" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function PromiseSection() {
  return (
    <section className="bg-forest-deep px-5 py-14 text-white sm:px-8 sm:py-20 lg:px-10">
      <div className="mx-auto max-w-[1280px]">
        <div className="mx-auto mb-8 max-w-[620px] text-center">
          <p className="text-[9px] font-medium tracking-[0.16em] text-champagne">THE OPZY PROMISE</p>
          <h2 className="mt-3 font-display text-[31px] leading-tight sm:text-[38px]">A Standard of Discreet Hospitality</h2>
          <p className="mt-3 text-[10px] leading-[1.7] text-white/60">An intentional departure from ordinary city hospitality, engineered for tranquility and absolute security.</p>
          <span aria-hidden="true" className="mx-auto mt-3 block h-px w-8 bg-champagne/60" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {promises.map(({ icon: Icon, title, detail }) => (
            <article key={title} className="border border-white/10 bg-white/[0.04] px-5 py-5">
              <Icon aria-hidden="true" className="h-5 w-5 text-champagne" strokeWidth={1.5} />
              <h3 className="mt-4 max-w-[220px] font-display text-[17px] leading-tight">{title}</h3>
              <p className="mt-2 text-[10px] leading-[1.7] text-white/55">{detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function AboutPage() {
  return (
    <>
      <AboutHero />
      <StorySection />
      <PillarsSection />
      <MomentsSection />
      <PromiseSection />
      <ReservationSection />
    </>
  )
}