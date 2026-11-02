import { useState } from 'react'
import { ArrowRight, Check, ChevronDown, Compass, Waves } from 'lucide-react'
import { Link } from 'react-router-dom'
import { hotelExperiences } from '../data/hotelExperiences'
import heroImage from '../img/Opzy Luxury Hotel infinity lagoon pool at twilight in Victoria Island.png'
import { ReservationSection } from './HotelSections'

const categories = ['All Experiences', 'Gastronomy', 'Wellness', 'Lagoon Life']

function ExperienceHero() {
  return (
    <section className="relative isolate flex min-h-[360px] items-center overflow-hidden bg-forest-deep px-5 py-16 text-white sm:min-h-[420px] sm:px-8 lg:px-10">
      <img src={heroImage} alt="Evening over the Opzy lagoon" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,20,14,0.86),rgba(7,23,17,0.5)_56%,rgba(7,23,17,0.12))]" />
      <div className="mx-auto w-full max-w-[1280px]">
        <p className="mb-5 flex items-center gap-3 text-[9px] font-medium tracking-[0.15em] text-champagne">
          <span className="h-px w-6 bg-champagne" /> THE OPZY EXPERIENCE
        </p>
        <h1 className="max-w-[680px] font-display text-[38px] leading-[1.1] sm:text-[52px]">
          Moments that stay <em className="font-normal text-champagne">with you.</em>
        </h1>
        <p className="mt-5 max-w-[510px] text-[12px] leading-5 text-white/75 sm:text-sm sm:leading-6">
          From tableside discoveries to quiet rituals and private lagoon journeys, experience Lagos at your own pace.
        </p>
        <Link to="#experience-collection" className="mt-7 inline-flex min-h-11 items-center gap-2 bg-champagne px-5 text-[9px] font-semibold text-forest-deep transition-colors hover:bg-white">
          EXPLORE EXPERIENCES <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}

function ExperienceCard({ experience }: { experience: (typeof hotelExperiences)[number] }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <article className="group flex h-full flex-col bg-white">
      <div className="relative aspect-[1.5] overflow-hidden bg-[#e7e3da]">
        <img src={experience.image} alt={experience.alt} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" />
        <span className="absolute left-4 top-4 bg-forest px-3 py-1.5 text-[8px] font-medium tracking-wide text-champagne">{experience.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h2 className="font-display text-[24px] leading-tight text-ink">{experience.title}</h2>
        <p className="mt-3 text-[11px] leading-[1.75] text-muted">{experience.description}</p>
        {isExpanded && (
          <ul className="mt-4 space-y-2 border-l border-[#b39b6c] bg-[#f7f5f0] px-4 py-3">
            {experience.highlights.map((highlight) => (
              <li key={highlight} className="flex items-start gap-2 text-[10px] leading-[1.6] text-ink/80">
                <Check aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0 text-[#94713a]" />{highlight}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#eeece6] pt-4 mt-5">
          <button type="button" aria-expanded={isExpanded} onClick={() => setIsExpanded(!isExpanded)} className="inline-flex min-h-9 items-center gap-1.5 text-[9px] font-medium text-ink transition-colors hover:text-[#94713a]">
            {isExpanded ? 'LESS DETAILS' : 'DISCOVER DETAILS'} <ChevronDown aria-hidden="true" className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          <Link to="/#booking" className="inline-flex min-h-9 items-center gap-2 bg-forest px-4 text-[8px] font-medium tracking-wide text-white transition-colors hover:bg-forest-deep">
            PLAN YOUR VISIT <ArrowRight aria-hidden="true" className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  )
}

export function ExperiencesPage() {
  const [activeCategory, setActiveCategory] = useState(categories[0])
  const visibleExperiences = activeCategory === categories[0]
    ? hotelExperiences
    : hotelExperiences.filter((experience) => experience.group === activeCategory)

  return (
    <>
      <ExperienceHero />
      <section id="experience-collection" className="bg-paper px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto max-w-[1280px]">
          <div className="mx-auto mb-9 max-w-[620px] text-center">
            <p className="text-[9px] font-medium tracking-[0.14em] text-[#94713a]">CURATED FOR YOU</p>
            <h2 className="mt-3 font-display text-[32px] leading-tight text-ink sm:text-[40px]">A life well experienced.</h2>
            <p className="mt-3 text-[11px] leading-[1.7] text-muted">Choose your own rhythm, with considered details and warm personal service in every moment.</p>
          </div>

          <div className="mb-6 flex items-center justify-center gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 px-4 py-2.5 text-[9px] font-medium transition-colors ${activeCategory === category ? 'bg-forest text-white' : 'border border-[#e5e2dc] bg-white text-ink hover:border-[#b39b6c]'}`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visibleExperiences.map((experience) => <ExperienceCard key={experience.id} experience={experience} />)}
          </div>

          <div className="mt-10 flex flex-col items-center border-t border-[#e7e3da] pt-8 text-center">
            <span className="grid h-10 w-10 place-items-center border border-[#d6c9ad] text-[#94713a]">
              <Compass aria-hidden="true" className="h-4 w-4" />
            </span>
            <p className="mt-3 max-w-[440px] text-[10px] leading-[1.7] text-muted">Looking for something more personal? Our concierge can shape a private itinerary around your stay.</p>
            <Link to="/#contact" className="mt-4 inline-flex items-center gap-2 border-b border-[#a58b5c] pb-1 text-[9px] font-semibold text-ink hover:text-[#94713a]">
              SPEAK WITH OUR CONCIERGE <Waves aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
      <ReservationSection />
    </>
  )
}