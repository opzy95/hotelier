import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Building2, MapPin, Phone } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ApiError, publicApiRequest } from '../api'
import type { PublicHotel, PublicHotelsResponse } from '../api'
import { publicBookingPath, publicHotelDetailsPath, publicHotelsPath } from '../routes/publicBooking'

function getPublicHotelError(error: unknown) {
  if (error instanceof ApiError && error.status === 404 && error.code === 'hotel_not_found') {
    return 'This hotel is not available for public bookings.'
  }
  if (error instanceof Error) return error.message
  return 'The hotel information could not be loaded. Please try again.'
}

function HotelAddress({ hotel }: { hotel: PublicHotel }) {
  const address = [
    hotel.address.line1,
    hotel.address.line2,
    hotel.address.city,
    hotel.address.region,
    hotel.address.postalCode,
    hotel.address.country,
  ].filter(Boolean).join(', ')

  return (
    <div className="space-y-2 text-sm text-muted">
      {address && <p className="flex items-start gap-2"><MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#94713a]" />{address}</p>}
      {hotel.phone && <p className="flex items-center gap-2"><Phone aria-hidden="true" className="h-4 w-4 shrink-0 text-[#94713a]" /><a href={`tel:${hotel.phone}`} className="hover:text-ink">{hotel.phone}</a></p>}
    </div>
  )
}

export function PublicHotelsPage() {
  const [searchParams] = useSearchParams()
  const [hotels, setHotels] = useState<PublicHotelsResponse['hotels'] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    publicApiRequest<PublicHotelsResponse>('/public/hotels', { signal: controller.signal })
      .then(({ hotels: result }) => setHotels(result))
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(getPublicHotelError(requestError))
      })

    return () => controller.abort()
  }, [])

  return (
    <section className="min-h-[60vh] bg-paper px-5 py-12 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1050px]">
        <header className="mb-8 text-center">
          <p className="text-[9px] font-medium tracking-[0.14em] text-[#94713a]">PUBLIC HOTEL DIRECTORY</p>
          <h1 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Choose your hotel</h1>
          <p className="mt-2 text-sm text-muted">Select a hotel to view its details and start a reservation.</p>
        </header>

        {error ? (
          <p role="alert" className="border border-red-200 bg-red-50 p-4 text-center text-sm text-red-800">{error}</p>
        ) : hotels === null ? (
          <p role="status" className="py-12 text-center text-sm text-muted">Loading active hotels…</p>
        ) : hotels.length === 0 ? (
          <p role="status" className="border border-[#e9e6df] bg-white p-6 text-center text-sm text-muted">There are no active hotels available for public booking right now.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {hotels.map((hotel) => (
              <li key={hotel.slug}>
                <Link
                  to={publicHotelDetailsPath(hotel.slug, searchParams)}
                  className="group flex min-h-32 items-center justify-between gap-4 border border-[#e9e6df] bg-white p-5 transition-colors hover:border-[#94713a]"
                >
                  <span className="flex min-w-0 items-center gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center bg-[#f3f1eb] text-[#94713a]"><Building2 aria-hidden="true" className="h-5 w-5" /></span>
                    <span className="min-w-0">
                      <strong className="block truncate font-display text-xl text-ink">{hotel.name}</strong>
                      <span className="mt-1 block text-xs text-muted">View hotel details</span>
                    </span>
                  </span>
                  <ArrowRight aria-hidden="true" className="h-5 w-5 shrink-0 text-[#94713a] transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export function PublicHotelDetailsRoute() {
  const { hotelSlug = '' } = useParams()
  return <PublicHotelDetailsPage key={hotelSlug} hotelSlug={hotelSlug} />
}

function PublicHotelDetailsPage({ hotelSlug }: { hotelSlug: string }) {
  const [searchParams] = useSearchParams()
  const [hotel, setHotel] = useState<PublicHotel | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    publicApiRequest<{ hotel: PublicHotel }>(`/public/hotels/${encodeURIComponent(hotelSlug)}`, { signal: controller.signal })
      .then(({ hotel: result }) => setHotel(result))
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(getPublicHotelError(requestError))
      })

    return () => controller.abort()
  }, [hotelSlug])

  if (error) {
    return (
      <section className="grid min-h-[55vh] place-items-center bg-paper px-5">
        <div role="alert" className="max-w-xl border border-stone-200 bg-white p-6 text-center">
          <h1 className="font-display text-2xl text-ink">Hotel unavailable</h1>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <Link to={publicHotelsPath(searchParams)} className="mt-5 inline-flex min-h-10 items-center gap-2 bg-forest px-4 text-xs font-medium text-white hover:bg-forest-deep"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Choose another hotel</Link>
        </div>
      </section>
    )
  }

  if (!hotel) {
    return <section className="grid min-h-[55vh] place-items-center bg-paper px-5 text-sm text-muted" role="status">Loading hotel details…</section>
  }

  return (
    <section className="min-h-[60vh] bg-paper px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1000px]">
        <Link to={publicHotelsPath(searchParams)} className="inline-flex min-h-9 items-center gap-2 text-xs text-muted hover:text-ink"><ArrowLeft aria-hidden="true" className="h-4 w-4" />All hotels</Link>
        <article className="mt-5 border border-[#e9e6df] bg-white">
          <div className="bg-forest px-6 py-10 text-white sm:px-9 sm:py-14">
            <p className="text-[9px] font-medium tracking-[0.14em] text-champagne">{hotel.type.toUpperCase()}</p>
            <h1 className="mt-3 font-display text-3xl sm:text-4xl">{hotel.name}</h1>
            <div className="mt-4"><HotelAddress hotel={hotel} /></div>
          </div>
          <div className="grid gap-6 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:px-9">
            <div>
              <h2 className="font-display text-xl text-ink">Plan your stay</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Check live room availability and pricing for your dates. Your selected hotel will be used throughout the booking process.</p>
              <p className="mt-3 text-xs text-muted">Check-in {hotel.settings.checkInTime} · Check-out {hotel.settings.checkOutTime}</p>
            </div>
            <Link to={publicBookingPath(hotel.slug, searchParams)} className="inline-flex min-h-11 items-center justify-center gap-2 bg-forest px-6 text-xs font-semibold tracking-wide text-white transition-colors hover:bg-forest-deep">
              BOOK A ROOM <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </div>
    </section>
  )
}
