import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ArrowRight, Download, KeyRound, LockKeyhole, Mail, PhoneCall, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ApiError, publicApiRequest } from '../api'
import type { PublicReservationLookup, PublicReservationLookupResponse } from '../api'
import heroImage from '../img/Opzy Luxury Hotel infinity lagoon pool at twilight in Victoria Island.png'
import { downloadReservationConfirmationPdf } from '../reservationConfirmationPdf'

function formatReservationAmount(amountMinor: number, currency: string) {
  const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency })
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2
  return formatter.format(amountMinor / (10 ** fractionDigits))
}

function BookingLookup() {
  const [recoveryToast, setRecoveryToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [reservation, setReservation] = useState<PublicReservationLookup | null>(null)
  const [lookupEmail, setLookupEmail] = useState('')
  const [lookupError, setLookupError] = useState('')
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const [showReferenceRecovery, setShowReferenceRecovery] = useState(false)
  const [recoveryMessage, setRecoveryMessage] = useState('')
  const [recoveryError, setRecoveryError] = useState('')
  const [isRecoveringReference, setIsRecoveringReference] = useState(false)

  useEffect(() => {
    if (!recoveryToast) return

    const timeoutId = window.setTimeout(() => setRecoveryToast(null), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [recoveryToast])

  function getLookupError(error: unknown) {
    if (error instanceof ApiError && error.status === 404 && error.code === 'reservation_not_found') {
      return 'No reservation matched that reference and email. Check both details and try again.'
    }
    if (error instanceof ApiError && error.status === 400) {
      return 'Enter a valid reservation reference and email address.'
    }
    return error instanceof Error ? error.message : 'The reservation could not be retrieved. Please try again.'
  }

  async function handleLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const reference = String(formData.get('reference') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    setReservation(null)
    setLookupEmail(email)
    setLookupError('')
    setPdfError('')
    setIsLookingUp(true)
    try {
      const result = await publicApiRequest<PublicReservationLookupResponse>('/public/reservations/lookup', {
        method: 'POST',
        body: JSON.stringify({ reference, email }),
      })
      setReservation('reservation' in result ? result.reservation : result)
    } catch (error) {
      setLookupError(getLookupError(error))
    } finally {
      setIsLookingUp(false)
    }
  }

  async function handleReferenceRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('recoveryEmail') ?? '').trim()
    setRecoveryError('')
    setRecoveryMessage('')
    setRecoveryToast(null)
    setIsRecoveringReference(true)
    try {
      await publicApiRequest<unknown>('/public/reservations/reference-email', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      const message = 'If an upcoming confirmed reservation matches this email, its reference and check-in date will be emailed to you.'
      setRecoveryMessage(message)
      setRecoveryToast({ type: 'success', message: 'If there is a matching upcoming reservation, its reference will be emailed to you.' })
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        const message = 'Enter a valid email address.'
        setRecoveryError(message)
        setRecoveryToast({ type: 'error', message })
      } else if (error instanceof ApiError && error.status === 503) {
        const message = 'We could not send the reference email right now. Please try again later.'
        setRecoveryError(message)
        setRecoveryToast({ type: 'error', message })
      } else {
        const message = error instanceof Error ? error.message : 'Reference recovery could not be completed. Please try again.'
        setRecoveryError(message)
        setRecoveryToast({ type: 'error', message })
      }
    } finally {
      setIsRecoveringReference(false)
    }
  }

  async function handleDownloadConfirmation() {
    if (!reservation) return

    setPdfError('')
    setIsGeneratingPdf(true)
    try {
      const assignedRoom = reservation.assignedRoom ?? reservation.room
      const assignedRoomLabel = typeof assignedRoom === 'string'
        ? assignedRoom
        : assignedRoom?.roomNumber ?? assignedRoom?.number ?? assignedRoom?.code ?? assignedRoom?.name
      await downloadReservationConfirmationPdf({
        hotelName: reservation.hotel?.name ?? reservation.hotel?.slug ?? 'Hotel reservation',
        reference: reservation.reference,
        status: reservation.status,
        guestName: reservation.guestName,
        guestEmail: reservation.guestEmail ?? lookupEmail,
        guestPhone: reservation.guestPhone,
        roomTypeName: reservation.roomType?.name,
        assignedRoom: assignedRoomLabel,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        adults: reservation.adults,
        children: reservation.children,
        pricing: reservation.pricing,
        paymentStatus: reservation.paymentStatus,
      })
    } catch (error) {
      setPdfError(error instanceof Error ? `Could not generate the PDF: ${error.message}` : 'Could not generate the reservation confirmation PDF.')
    } finally {
      setIsGeneratingPdf(false)
    }
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
          <span className="mb-1.5 block text-[8px] font-medium tracking-wide text-ink">RESERVATION REFERENCE</span>
          <span className="flex h-10 items-center gap-2 border border-[#deddd7] bg-[#faf9f6] px-3 focus-within:border-[#94713a]">
            <KeyRound aria-hidden="true" className="h-3 w-3 shrink-0 text-muted" />
            <input required name="reference" autoComplete="off" placeholder="HTL-0123456789ABCDEF" className="h-full w-full bg-transparent text-[10px] text-ink outline-none placeholder:text-[#b4b5af]" />
          </span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[8px] font-medium tracking-wide text-ink">RESERVATION EMAIL ADDRESS</span>
          <span className="flex h-10 items-center gap-2 border border-[#deddd7] bg-[#faf9f6] px-3 focus-within:border-[#94713a]">
            <Mail aria-hidden="true" className="h-3 w-3 shrink-0 text-muted" />
            <input required name="email" type="email" autoComplete="email" placeholder="you@example.com" className="h-full w-full bg-transparent text-[10px] text-ink outline-none placeholder:text-[#b4b5af]" />
          </span>
        </label>
        <button type="submit" disabled={isLookingUp} className="flex h-10 w-full items-center justify-center gap-2 bg-forest text-[8px] font-medium tracking-wide text-white transition-colors hover:bg-forest-deep disabled:cursor-wait disabled:opacity-60">
          {isLookingUp ? 'SEARCHING…' : 'FIND MY BOOKING'} {!isLookingUp && <ArrowRight aria-hidden="true" className="h-3 w-3" />}
        </button>
      </form>

      {lookupError && <p role="alert" className="mt-4 border border-red-200 bg-red-50 px-3 py-2.5 text-center text-[10px] leading-[1.6] text-red-800">{lookupError}</p>}

      {recoveryToast && (
        <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex justify-center sm:inset-x-auto sm:right-5 sm:justify-end">
          <div
            role={recoveryToast.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto max-w-sm border px-4 py-3 text-xs leading-5 shadow-lg ${
              recoveryToast.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900'
            }`}
          >
            {recoveryToast.message}
          </div>
        </div>
      )}

      {reservation && (
        <section aria-label="Reservation details" className="mt-5 border border-[#e7e1d5] bg-[#f7f5f0] p-4 text-left">
          <h3 className="font-display text-lg text-ink">Reservation found</h3>
          <dl className="mt-3 grid gap-2 text-[10px] sm:grid-cols-2">
            <div><dt className="text-muted">Reference</dt><dd className="font-medium text-ink">{reservation.reference}</dd></div>
            {reservation.status && <div><dt className="text-muted">Status</dt><dd className="font-medium capitalize text-ink">{reservation.status}</dd></div>}
            {reservation.hotel?.name && <div><dt className="text-muted">Hotel</dt><dd className="font-medium text-ink">{reservation.hotel.name}</dd></div>}
            {reservation.roomType?.name && <div><dt className="text-muted">Room type</dt><dd className="font-medium text-ink">{reservation.roomType.name}</dd></div>}
            {reservation.checkIn && <div><dt className="text-muted">Check-in</dt><dd className="font-medium text-ink">{reservation.checkIn}</dd></div>}
            {reservation.checkOut && <div><dt className="text-muted">Check-out</dt><dd className="font-medium text-ink">{reservation.checkOut}</dd></div>}
            {reservation.paymentStatus && <div><dt className="text-muted">Payment status</dt><dd className="font-medium capitalize text-ink">{reservation.paymentStatus}</dd></div>}
            {reservation.pricing && <div><dt className="text-muted">Final total</dt><dd className="font-medium text-ink">{formatReservationAmount(reservation.pricing.totalMinor, reservation.pricing.currency)}</dd></div>}
          </dl>
          {pdfError && <p role="alert" className="mt-4 border border-red-200 bg-red-50 px-3 py-2.5 text-center text-[10px] leading-[1.6] text-red-800">{pdfError}</p>}
          <button type="button" disabled={isGeneratingPdf} onClick={handleDownloadConfirmation} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 bg-forest px-4 text-[9px] font-semibold tracking-wide text-white transition-colors hover:bg-forest-deep disabled:cursor-wait disabled:opacity-60">
            <Download aria-hidden="true" className="h-3.5 w-3.5" />{isGeneratingPdf ? 'PREPARING PDF…' : 'DOWNLOAD CONFIRMATION (PDF)'}
          </button>
          <p className="mt-2 text-[9px] text-muted">This confirmation is not proof of payment.</p>
        </section>
      )}

      <div className="mt-5 border-t border-[#eeece6] pt-4">
        <button type="button" aria-expanded={showReferenceRecovery} onClick={() => {
          setShowReferenceRecovery((shown) => !shown)
          setRecoveryError('')
          setRecoveryMessage('')
        }} className="text-[10px] font-medium text-[#84652e] underline underline-offset-2">
          Forgot your reservation reference?
        </button>
        {showReferenceRecovery && (
          <form onSubmit={handleReferenceRecovery} className="mt-4 space-y-3">
            <p className="text-[9px] leading-[1.6] text-muted">Enter your email and we’ll send references for any upcoming confirmed reservations.</p>
            <label className="block">
              <span className="mb-1.5 block text-[8px] font-medium tracking-wide text-ink">EMAIL ADDRESS</span>
              <span className="flex h-10 items-center gap-2 border border-[#deddd7] bg-[#faf9f6] px-3 focus-within:border-[#94713a]">
                <Mail aria-hidden="true" className="h-3 w-3 shrink-0 text-muted" />
                <input required name="recoveryEmail" type="email" autoComplete="email" placeholder="you@example.com" className="h-full w-full bg-transparent text-[10px] text-ink outline-none placeholder:text-[#b4b5af]" />
              </span>
            </label>
            <button type="submit" disabled={isRecoveringReference} className="flex h-10 w-full items-center justify-center gap-2 border border-forest text-[8px] font-medium tracking-wide text-forest transition-colors hover:bg-forest hover:text-white disabled:cursor-wait disabled:opacity-60">
              {isRecoveringReference ? 'SENDING…' : 'EMAIL MY REFERENCES'}
            </button>
            {recoveryMessage && <p role="status" className="border border-[#e7e1d5] bg-[#f7f5f0] px-3 py-2.5 text-center text-[10px] leading-[1.6] text-muted">{recoveryMessage}</p>}
            {recoveryError && <p role="alert" className="border border-red-200 bg-red-50 px-3 py-2.5 text-center text-[10px] leading-[1.6] text-red-800">{recoveryError}</p>}
          </form>
        )}
      </div>
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