import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ApiError, publicApiRequest } from '../api'
import type {
  CreatePublicReservationRequest,
  CreatePublicReservationResponse,
  PublicAvailabilityResponse,
  PublicHotel,
  PublicReservation,
  PublicRoomType,
} from '../api'
import { ArrowLeft, ArrowRight, BedDouble, CalendarDays, CheckCircle2, Clock3, Copy, Download, MapPin, Search, Users } from 'lucide-react'
import { downloadReservationConfirmationPdf } from '../reservationConfirmationPdf'

type GuestDetails = {
  name: string
  email: string
  phone: string
}

type BookingStep = 'availability' | 'guest' | 'review' | 'payment' | 'confirmation'

function localDateValue(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00`)
  date.setDate(date.getDate() + days)
  return localDateValue(date)
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function formatMinorAmount(amountMinor: number, currency: string) {
  const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency })
  const fractionDigits = formatter.resolvedOptions().maximumFractionDigits ?? 2
  return formatter.format(amountMinor / (10 ** fractionDigits))
}

function getErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error.message : 'The request could not be completed. Please try again.'
  }

  if (error.status === 404 && error.code === 'hotel_not_found') {
    return 'This hotel is not available for public bookings.'
  }
  if (error.status === 404 && error.code === 'room_type_not_found') {
    return 'That room type is no longer available. Search availability again to choose another.'
  }
  if (error.status === 409 && error.code === 'room_unavailable') {
    return 'Availability changed while you were booking. Search again to see current room options.'
  }
  if (error.status === 409 && error.code === 'room_guest_limit_exceeded') {
    return 'This room type cannot accommodate your party. Choose a room type with sufficient capacity.'
  }
  if (error.status === 400 && (error.code === 'validation_error' || error.code === 'invalid_query')) {
    return 'Check the booking dates and guest details, then try again.'
  }
  if (error.status === 404 && !error.code) {
    return 'The booking API endpoint was not found. Verify that the backend exposes the public hotel booking routes.'
  }

  return error.message
}

function assignedRoomName(reservation: PublicReservation) {
  const room = reservation.assignedRoom ?? reservation.room
  if (typeof room === 'string') return room
  if (room) return room.roomNumber ?? room.number ?? room.code ?? room.name ?? reservation.roomNumber ?? ''
  return reservation.roomNumber ?? ''
}

function BookingProgress({ step }: { step: BookingStep }) {
  const steps: Array<{ key: BookingStep; label: string }> = [
    { key: 'availability', label: 'Availability' },
    { key: 'guest', label: 'Guest details' },
    { key: 'review', label: 'Review' },
    { key: 'payment', label: 'Payment' },
    { key: 'confirmation', label: 'Confirmation' },
  ]
  const currentIndex = steps.findIndex(({ key }) => key === step)

  return (
    <ol aria-label="Booking progress" className="mb-7 grid grid-cols-5 border-b border-[#e9e6df] pb-4 text-center text-[8px]">
      {steps.map(({ key, label }, index) => (
        <li key={key} aria-current={key === step ? 'step' : undefined} className={index <= currentIndex ? 'font-semibold text-ink' : 'text-[#a5a49d]'}>
          <span className={`mx-auto mb-1.5 grid h-6 w-6 place-items-center border ${index <= currentIndex ? 'border-forest bg-forest text-white' : 'border-[#e3e1da] bg-[#f0efeb] text-[#9b9a93]'}`}>
            {index < currentIndex ? '✓' : `0${index + 1}`}
          </span>
          {label}
        </li>
      ))}
    </ol>
  )
}

function StayCard({ room, selected, onSelect }: {
  room: PublicRoomType
  selected: boolean
  onSelect: () => void
}) {
  const photoUrl = room.photos[0]?.secureUrl

  return (
    <article className={`grid overflow-hidden border bg-white transition-colors sm:grid-cols-[0.82fr_1.18fr] ${selected ? 'border-[#957238] ring-1 ring-[#957238]' : 'border-[#e9e6df]'}`}>
      <div className="relative grid min-h-[190px] place-items-center overflow-hidden bg-[#e6e2d9] sm:min-h-[235px]">
        <div aria-hidden="true" className="flex flex-col items-center gap-2 text-[#94713a]">
          <BedDouble className="h-8 w-8" />
          <span className="text-[9px]">{room.name}</span>
        </div>
        {photoUrl && <img src={photoUrl} alt={room.name} onError={(event) => { event.currentTarget.style.display = 'none' }} className="absolute inset-0 h-full w-full object-cover" />}
        <span className="absolute bottom-2 left-2 bg-forest/90 px-2 py-1 text-[8px] text-white">
          {room.availableRoomCount} available
        </span>
      </div>
      <div className="flex min-w-0 flex-col p-3.5 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            {selected && <p className="mb-1 text-[8px] font-medium tracking-wide text-[#94713a]">SELECTED ROOM TYPE</p>}
            <h2 className="font-display text-[20px] leading-tight text-ink">{room.name}</h2>
            {room.description && <p className="mt-1 text-[9px] leading-[1.6] text-muted">{room.description}</p>}
          </div>
          <p className="shrink-0 text-right font-display text-[16px] text-[#94713a]">
            {formatMinorAmount(room.pricing.rateMinorPerNight, room.pricing.currency)}
            <span className="block font-body text-[8px] text-muted">per room / night</span>
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-b border-[#efede8] pb-3 text-[8px] text-ink/75">
          {room.sizeSqm > 0 && <span>{room.sizeSqm} m²</span>}
          <span>Up to {room.maxGuests} guests</span>
          {room.bedSetup.map(({ type, count }) => <span key={`${type}-${count}`}>{count} × {type} bed</span>)}
        </div>
        {room.amenities.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[8px] text-[#697266]">
            {room.amenities.map((amenity) => <li key={amenity}>✓ {amenity}</li>)}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <span className="text-[8px] text-muted">{room.pricing.nights} night{room.pricing.nights === 1 ? '' : 's'} · {formatMinorAmount(room.pricing.totalMinor, room.pricing.currency)}</span>
          <button type="button" aria-pressed={selected} onClick={onSelect} className={`min-h-8 px-3 text-[8px] font-medium tracking-wide transition-colors ${selected ? 'bg-[#84652e] text-white' : 'border border-forest text-forest hover:bg-forest hover:text-white'}`}>
            {selected ? 'SELECTED' : 'SELECT ROOM'}
          </button>
        </div>
      </div>
    </article>
  )
}

function HotelAddress({ hotel }: { hotel: PublicHotel }) {
  const address = [hotel.address.line1, hotel.address.line2, hotel.address.city, hotel.address.region, hotel.address.postalCode, hotel.address.country]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[9px] text-white/75">
      {address && <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="h-3 w-3 text-champagne" />{address}</span>}
      {hotel.phone && <a className="underline underline-offset-2" href={`tel:${hotel.phone}`}>{hotel.phone}</a>}
      <span>Check-in {hotel.settings.checkInTime} · Check-out {hotel.settings.checkOutTime}</span>
    </div>
  )
}

export function BookYourStayRoute() {
  const { hotelSlug = '' } = useParams()
  return <BookYourStayPage key={hotelSlug} hotelSlug={hotelSlug} />
}

function BookYourStayPage({ hotelSlug }: { hotelSlug: string }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [today] = useState(() => localDateValue(new Date()))
  const defaultCheckIn = searchParams.get('checkin') || today
  const [hotel, setHotel] = useState<PublicHotel | null>(null)
  const [hotelError, setHotelError] = useState('')
  const [checkIn, setCheckIn] = useState(defaultCheckIn)
  const [checkOut, setCheckOut] = useState(searchParams.get('checkout') || addDays(defaultCheckIn, 2))
  const [adults, setAdults] = useState(Number(searchParams.get('adults') || 2))
  const [children, setChildren] = useState(Number(searchParams.get('children') || 0))
  const [availability, setAvailability] = useState<PublicAvailabilityResponse | null>(null)
  const [availabilityError, setAvailabilityError] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState('')
  const [step, setStep] = useState<BookingStep>('availability')
  const [guestDetails, setGuestDetails] = useState<GuestDetails | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'paystack' | ''>('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [copyNotice, setCopyNotice] = useState('')
  const [bookingError, setBookingError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reservation, setReservation] = useState<PublicReservation | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const roomTypes = availability?.roomTypes ?? []
  const selectedRoomType = availability?.roomTypes.find(({ id }) => id === selectedRoomTypeId)
  const nights = availability?.stay.nights ?? 0
  const bankDetails = hotel?.bankDetails
  const hasBankDetails = Boolean(
    typeof bankDetails?.bankName === 'string'
    && bankDetails.bankName.trim()
    && typeof bankDetails.accountName === 'string'
    && bankDetails.accountName.trim()
    && typeof bankDetails.bankAccountNumber === 'string'
    && bankDetails.bankAccountNumber.trim(),
  )

  useEffect(() => {
    const controller = new AbortController()
    publicApiRequest<{ hotel: PublicHotel }>(`/public/hotels/${encodeURIComponent(hotelSlug)}`, { signal: controller.signal })
      .then(({ hotel: result }) => setHotel(result))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setHotelError(getErrorMessage(error))
      })

    return () => controller.abort()
  }, [hotelSlug])

  async function searchAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAvailabilityError('')
    setBookingError('')
    setSelectedRoomTypeId('')
    setReceiptFile(null)
    setPaymentMethod('')
    setAvailability(null)
    setStep('availability')

    if (checkOut <= checkIn) {
      setAvailabilityError('Check-out must be after check-in.')
      return
    }

    setIsSearching(true)
    try {
      const query = new URLSearchParams({
        checkIn,
        checkOut,
        adults: String(adults),
        children: String(children),
      })
      const result = await publicApiRequest<PublicAvailabilityResponse>(
        `/public/hotels/${encodeURIComponent(hotelSlug)}/availability?${query.toString()}`,
      )
      setAvailability(result)
      const requestedRoomTypeId = searchParams.get('room')
      if (requestedRoomTypeId && result.roomTypes.some(({ id }) => id === requestedRoomTypeId)) {
        setSelectedRoomTypeId(requestedRoomTypeId)
      }
      const nextParams = new URLSearchParams(searchParams)
      nextParams.set('checkin', checkIn)
      nextParams.set('checkout', checkOut)
      nextParams.set('adults', String(adults))
      nextParams.set('children', String(children))
      setSearchParams(nextParams, { replace: true })
      requestAnimationFrame(() => document.getElementById('available-stays')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch (error) {
      setAvailabilityError(getErrorMessage(error))
    } finally {
      setIsSearching(false)
    }
  }

  function selectRoomType(roomTypeId: string) {
    setSelectedRoomTypeId(roomTypeId)
    setGuestDetails(null)
    setReceiptFile(null)
    setPaymentMethod('')
    setBookingError('')
    setStep('availability')
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('room', roomTypeId)
    setSearchParams(nextParams, { replace: true })
  }

  function collectGuestDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setGuestDetails({
      name: String(formData.get('guestName') ?? '').trim(),
      email: String(formData.get('guestEmail') ?? '').trim(),
      phone: String(formData.get('guestPhone') ?? '').trim(),
    })
    setBookingError('')
    setPaymentMethod('')
    setReceiptFile(null)
    setStep('review')
  }

  async function copyBankDetails() {
    if (!bankDetails) return
    try {
      await navigator.clipboard.writeText([
        `Bank: ${bankDetails.bankName}`,
        `Account name: ${bankDetails.accountName}`,
        `Account number: ${bankDetails.bankAccountNumber}`,
      ].join('\n'))
      setCopyNotice('Bank details copied.')
    } catch {
      setCopyNotice('Could not copy automatically. Please select and copy the bank details.')
    }
  }

  async function createReservation() {
    if (!selectedRoomType || !guestDetails) return
    if (paymentMethod !== 'bank_transfer' || !hasBankDetails) {
      setBookingError('Select direct bank transfer and make sure this hotel has bank details configured.')
      return
    }
    if (!receiptFile) {
      setBookingError('Upload your transfer receipt before confirming the reservation.')
      return
    }

    setIsSubmitting(true)
    setBookingError('')
    try {
      const request: CreatePublicReservationRequest = {
        hotelSlug,
        roomTypeId: selectedRoomType.id,
        checkIn,
        checkOut,
        adults,
        children,
        guestName: guestDetails.name,
        guestEmail: guestDetails.email,
        guestPhone: guestDetails.phone,
      }
      const requestBody = new FormData()
      Object.entries(request).forEach(([key, value]) => requestBody.append(key, String(value)))
      requestBody.append('receipt', receiptFile)
      const result = await publicApiRequest<CreatePublicReservationResponse>('/public/reservations', {
        method: 'POST',
        body: requestBody,
      })
      setReservation(result.reservation)
      setStep('confirmation')
    } catch (error) {
      const message = getErrorMessage(error)
      setBookingError(message)
      if (error instanceof ApiError && error.status === 409 && error.code === 'room_unavailable') {
        setAvailability(null)
        setSelectedRoomTypeId('')
        setReceiptFile(null)
        setPaymentMethod('')
        setStep('availability')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function downloadReservationConfirmation() {
    if (!reservation || !guestDetails || !hotel) return

    setPdfError('')
    setIsGeneratingPdf(true)
    try {
      const address = [
        hotel.address.line1,
        hotel.address.line2,
        hotel.address.city,
        hotel.address.region,
        hotel.address.postalCode,
        hotel.address.country,
      ].filter(Boolean).join(', ')
      await downloadReservationConfirmationPdf({
        hotelName: hotel.name,
        hotelAddress: address,
        reference: reservation.reference,
        status: reservation.status,
        guestName: guestDetails.name,
        guestEmail: guestDetails.email,
        guestPhone: guestDetails.phone,
        roomTypeName: selectedRoomType?.name,
        assignedRoom: assignedRoomName(reservation) || 'Assigned by hotel',
        checkIn: `${displayDate(checkIn)} - ${hotel.settings.checkInTime}`,
        checkOut: `${displayDate(checkOut)} - ${hotel.settings.checkOutTime}`,
        adults,
        children,
        pricing: reservation.pricing,
        paymentStatus: reservation.paymentStatus,
      })
    } catch (error) {
      setPdfError(error instanceof Error ? `Could not generate the PDF: ${error.message}` : 'Could not generate the reservation confirmation PDF.')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  if (!hotel && !hotelError) {
    return <section className="grid min-h-[55vh] place-items-center bg-paper px-5 text-sm text-muted" role="status">Loading hotel details…</section>
  }

  if (hotelError || !hotel) {
    return (
      <section className="grid min-h-[55vh] place-items-center bg-paper px-5">
        <div role="alert" className="max-w-xl border border-[#e9e6df] bg-white p-6 text-center">
          <h1 className="font-display text-2xl text-ink">Hotel unavailable</h1>
          <p className="mt-2 text-sm text-muted">{hotelError || 'This hotel is not available for public bookings.'}</p>
        </div>
      </section>
    )
  }

  return (
    <div className="booking-flow">
      {step === 'guest' && selectedRoomType ? (
        <section className="min-h-[65vh] bg-paper px-5 py-7 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[980px]">
            <BookingProgress step={step} />
            <h1 className="font-display text-3xl text-ink">Guest details</h1>
            <p className="mt-2 text-sm text-muted">Your reservation at {hotel.name}</p>
            <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1.3fr_0.8fr]">
              <form onSubmit={collectGuestDetails} className="space-y-4 border border-[#e9e6df] bg-white p-5">
                <label className="block text-xs font-medium text-ink">Full name
                  <input required name="guestName" autoComplete="name" className="mt-1 block h-10 w-full border border-[#dedbd3] bg-[#faf9f6] px-3 text-sm outline-none focus:border-[#94713a]" />
                </label>
                <label className="block text-xs font-medium text-ink">Email
                  <input required name="guestEmail" type="email" autoComplete="email" className="mt-1 block h-10 w-full border border-[#dedbd3] bg-[#faf9f6] px-3 text-sm outline-none focus:border-[#94713a]" />
                </label>
                <label className="block text-xs font-medium text-ink">Phone
                  <input required name="guestPhone" type="tel" autoComplete="tel" className="mt-1 block h-10 w-full border border-[#dedbd3] bg-[#faf9f6] px-3 text-sm outline-none focus:border-[#94713a]" />
                </label>
                <div className="flex flex-wrap justify-between gap-3 pt-2">
                  <button type="button" onClick={() => setStep('availability')} className="inline-flex min-h-10 items-center gap-2 border border-[#a9a79f] px-4 text-xs text-ink hover:bg-[#f3f1eb]"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to rooms</button>
                  <button type="submit" className="inline-flex min-h-10 items-center gap-2 bg-forest px-5 text-xs font-medium text-white hover:bg-forest-deep">Review booking<ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
                </div>
              </form>
              <BookingQuote room={selectedRoomType} checkIn={checkIn} checkOut={checkOut} adults={adults} childrenCount={children} hotel={hotel} />
            </div>
          </div>
        </section>
      ) : step === 'review' && selectedRoomType && guestDetails ? (
        <section className="min-h-[65vh] bg-paper px-5 py-7 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[980px]">
            <BookingProgress step={step} />
            <h1 className="font-display text-3xl text-ink">Review your reservation</h1>
            <p className="mt-2 text-sm text-muted">Review your details, then choose a payment method and upload your transfer receipt.</p>
            <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1.3fr_0.8fr]">
              <div className="border border-[#e9e6df] bg-white p-5">
                <h2 className="font-display text-xl text-ink">{selectedRoomType.name}</h2>
                <p className="mt-2 text-sm text-muted">{displayDate(checkIn)} – {displayDate(checkOut)} · {nights} night{nights === 1 ? '' : 's'}</p>
                <p className="mt-1 text-sm text-muted">{adults} adult{adults === 1 ? '' : 's'} · {children} child{children === 1 ? '' : 'ren'}</p>
                <div className="mt-5 border-t border-[#eeece6] pt-4">
                  <h3 className="text-sm font-semibold text-ink">Primary guest</h3>
                  <p className="mt-2 text-sm text-muted">{guestDetails.name}</p>
                  <p className="text-sm text-muted">{guestDetails.email}</p>
                  <p className="text-sm text-muted">{guestDetails.phone}</p>
                </div>
                {bookingError && <p role="alert" className="mt-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{bookingError}</p>}
                <div className="mt-6 flex flex-wrap justify-between gap-3">
                  <button type="button" onClick={() => setStep('guest')} className="inline-flex min-h-10 items-center gap-2 border border-[#a9a79f] px-4 text-xs text-ink hover:bg-[#f3f1eb]"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Edit details</button>
                  <button type="button" onClick={() => { setBookingError(''); setStep('payment') }} className="inline-flex min-h-10 items-center gap-2 bg-forest px-5 text-xs font-medium text-white hover:bg-forest-deep">
                    Continue to payment <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <BookingQuote room={selectedRoomType} checkIn={checkIn} checkOut={checkOut} adults={adults} childrenCount={children} hotel={hotel} />
            </div>
          </div>
        </section>
      ) : step === 'payment' && selectedRoomType && guestDetails ? (
        <section className="min-h-[65vh] bg-paper px-5 py-7 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[980px]">
            <BookingProgress step={step} />
            <h1 className="font-display text-3xl text-ink">Payment</h1>
            <p className="mt-2 text-sm text-muted">Choose how you’ll pay for your stay. Your reservation will remain pending payment verification until the hotel checks your receipt.</p>
            <div className="mt-6 grid items-start gap-5 lg:grid-cols-[1.3fr_0.8fr]">
              <form onSubmit={(event) => { event.preventDefault(); void createReservation() }} className="space-y-4 border border-[#e9e6df] bg-white p-5">
                <fieldset>
                  <legend className="text-xs font-semibold text-ink">Choose a payment method</legend>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className={`flex cursor-pointer items-start gap-3 border p-4 ${paymentMethod === 'bank_transfer' ? 'border-forest bg-forest/5 ring-1 ring-forest' : 'border-[#e9e6df]'}`}>
                      <input type="radio" name="paymentMethod" value="bank_transfer" checked={paymentMethod === 'bank_transfer'} onChange={() => { setPaymentMethod('bank_transfer'); setBookingError('') }} className="mt-0.5 accent-[#183f2c]" />
                      <span>
                        <strong className="block text-xs text-ink">Direct bank transfer</strong>
                        <span className="mt-1 block text-[10px] leading-4 text-muted">Transfer to the hotel account and upload your receipt.</span>
                      </span>
                    </label>
                    <label aria-disabled="true" className="flex cursor-not-allowed items-start gap-3 border border-stone-200 bg-stone-50 p-4 opacity-60">
                      <input type="radio" name="paymentMethod" value="paystack" disabled className="mt-0.5" />
                      <span>
                        <strong className="block text-xs text-ink">Paystack</strong>
                        <span className="mt-1 block text-[10px] leading-4 text-muted">Not available at the moment.</span>
                      </span>
                    </label>
                  </div>
                </fieldset>

                {paymentMethod === 'bank_transfer' && (
                  <section aria-labelledby="transfer-details-title" className="border border-[#e9e6df] bg-paper p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 id="transfer-details-title" className="font-display text-lg text-ink">Hotel bank details</h2>
                        <p className="mt-1 text-[10px] text-muted">Transfer the booking total to this account.</p>
                      </div>
                      {hasBankDetails && <button type="button" onClick={() => { void copyBankDetails() }} className="inline-flex min-h-8 items-center gap-1.5 border border-forest px-2.5 text-[10px] font-semibold text-forest hover:bg-forest hover:text-white"><Copy aria-hidden="true" className="size-3" />Copy details</button>}
                    </div>
                    {hasBankDetails && bankDetails ? (
                      <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                        <div><dt className="text-[10px] text-muted">Bank</dt><dd className="mt-1 font-medium text-ink">{bankDetails.bankName}</dd></div>
                        <div><dt className="text-[10px] text-muted">Account name</dt><dd className="mt-1 font-medium text-ink">{bankDetails.accountName}</dd></div>
                        <div className="sm:col-span-2"><dt className="text-[10px] text-muted">Account number</dt><dd className="mt-1 font-medium tracking-wide text-ink">{bankDetails.bankAccountNumber}</dd></div>
                      </dl>
                    ) : (
                      <p role="alert" className="mt-3 text-xs leading-5 text-rose-800">Bank details are not available for this hotel yet. Please contact the hotel before continuing.</p>
                    )}
                    {copyNotice && <p role="status" className="mt-3 text-[10px] text-muted">{copyNotice}</p>}
                    <p className="mt-4 border-t border-[#e9e6df] pt-3 text-[10px] leading-5 text-muted">Booking total: <strong className="text-ink">{formatMinorAmount(selectedRoomType.pricing.totalMinor, selectedRoomType.pricing.currency)}</strong></p>
                  </section>
                )}

                {paymentMethod === 'bank_transfer' && hasBankDetails && (
                  <label className="block text-xs font-medium text-ink">Upload transfer receipt
                    <input
                      type="file"
                      name="receipt"
                      accept="image/*,application/pdf"
                      required
                      onChange={(event) => { setReceiptFile(event.target.files?.[0] ?? null); setBookingError('') }}
                      className="mt-2 block w-full border border-[#dedbd3] bg-[#faf9f6] p-3 text-xs file:mr-3 file:border-0 file:bg-forest file:px-3 file:py-2 file:text-[10px] file:font-semibold file:text-white"
                    />
                    <span className="mt-1 block text-[10px] text-muted">Accepted formats: image or PDF. Payment remains unverified until the hotel reviews the receipt.</span>
                    {receiptFile && <span className="mt-1 block text-[10px] text-forest">Selected: {receiptFile.name}</span>}
                  </label>
                )}

                {bookingError && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-800">{bookingError}</p>}
                <div className="flex flex-wrap justify-between gap-3 pt-2">
                  <button type="button" disabled={isSubmitting} onClick={() => setStep('review')} className="inline-flex min-h-10 items-center gap-2 border border-[#a9a79f] px-4 text-xs text-ink hover:bg-[#f3f1eb] disabled:opacity-60"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to review</button>
                  <button type="submit" disabled={isSubmitting || !hasBankDetails || paymentMethod !== 'bank_transfer' || !receiptFile} className="inline-flex min-h-10 items-center gap-2 bg-forest px-5 text-xs font-medium text-white hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-60">
                    {isSubmitting ? 'Submitting…' : 'Upload receipt and confirm'} {!isSubmitting && <ArrowRight aria-hidden="true" className="h-4 w-4" />}
                  </button>
                </div>
              </form>
              <BookingQuote room={selectedRoomType} checkIn={checkIn} checkOut={checkOut} adults={adults} childrenCount={children} hotel={hotel} />
            </div>
          </div>
        </section>
      ) : step === 'confirmation' && reservation && guestDetails ? (
        <section className="min-h-[65vh] bg-paper px-5 py-7 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-[800px]">
            <BookingProgress step={step} />
            <div className="border border-[#e9e6df] bg-white p-6 text-center sm:p-9">
              <CheckCircle2 aria-hidden="true" className="mx-auto h-12 w-12 text-forest" />
              <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-[#84652e]">RESERVATION {reservation.status.toUpperCase()}</p>
              <h1 className="mt-2 font-display text-3xl text-ink">Thank you, {guestDetails.name}</h1>
              <p className="mt-2 text-sm text-muted">{reservation.paymentStatus === 'pending_verification'
                ? `Your reservation at ${hotel.name} has been received. Your transfer receipt is waiting for hotel verification.`
                : `Your reservation at ${hotel.name} has been confirmed.`}</p>
              <dl className="mx-auto mt-7 grid max-w-xl gap-4 border-y border-[#eeece6] py-5 text-left sm:grid-cols-2">
                <div><dt className="text-xs text-muted">Reference</dt><dd className="mt-1 font-medium text-ink">{reservation.reference}</dd></div>
                <div><dt className="text-xs text-muted">Assigned room</dt><dd className="mt-1 font-medium text-ink">{assignedRoomName(reservation) || 'Assigned by hotel'}</dd></div>
                <div><dt className="text-xs text-muted">Stay</dt><dd className="mt-1 font-medium text-ink">{displayDate(checkIn)} – {displayDate(checkOut)}</dd></div>
                <div><dt className="text-xs text-muted">Payment status</dt><dd className="mt-1 font-medium capitalize text-ink">{reservation.paymentStatus}</dd></div>
                <div className="sm:col-span-2"><dt className="text-xs text-muted">Final total</dt><dd className="mt-1 font-display text-2xl text-ink">{formatMinorAmount(reservation.pricing.totalMinor, reservation.pricing.currency)}</dd></div>
              </dl>
              <p className="mt-5 text-sm text-muted">{reservation.paymentStatus === 'pending_verification'
                ? 'Your payment is not marked as paid yet. The hotel will verify your transfer receipt.'
                : `Payment status: ${reservation.paymentStatus}.`}</p>
              {hotel.bankDetails && (
                <section aria-labelledby="bank-details-title" className="mx-auto mt-5 max-w-xl border border-[#e9e6df] bg-paper p-4 text-left">
                  <h2 id="bank-details-title" className="font-display text-lg text-ink">Bank details for payment</h2>
                  <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs text-muted">Bank</dt><dd className="mt-0.5 font-medium text-ink">{hotel.bankDetails.bankName}</dd></div>
                    <div><dt className="text-xs text-muted">Account name</dt><dd className="mt-0.5 font-medium text-ink">{hotel.bankDetails.accountName}</dd></div>
                    <div className="sm:col-span-2"><dt className="text-xs text-muted">Account number</dt><dd className="mt-0.5 font-medium text-ink">{hotel.bankDetails.bankAccountNumber}</dd></div>
                  </dl>
                  <p className="mt-3 text-xs leading-5 text-muted">Please use your reservation reference as the transfer description and contact the hotel to confirm payment.</p>
                </section>
              )}
              {pdfError && <p role="alert" className="mt-5 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{pdfError}</p>}
              <button type="button" disabled={isGeneratingPdf} onClick={downloadReservationConfirmation} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 bg-forest px-5 text-xs font-semibold tracking-wide text-white transition-colors hover:bg-forest-deep disabled:cursor-wait disabled:opacity-60">
                <Download aria-hidden="true" className="h-4 w-4" />{isGeneratingPdf ? 'PREPARING PDF…' : 'DOWNLOAD RESERVATION CONFIRMATION'}
              </button>
              <p className="mt-2 text-[10px] text-muted">This confirmation is not proof of payment.</p>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="relative flex min-h-[350px] items-start justify-center bg-forest-deep px-5 pb-24 pt-12 text-center text-white max-lg:min-h-0 max-lg:flex-col max-lg:items-center max-lg:pb-6">
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,20,14,0.78),rgba(5,20,14,0.96))]" />
            <div className="relative z-10 mx-auto max-w-[800px]">
              <p className="mx-auto inline-flex items-center gap-2 border border-champagne/30 bg-forest/50 px-3 py-1 text-[9px] font-medium tracking-[0.14em] text-champagne"><span aria-hidden="true">●</span> RESERVATIONS &amp; AVAILABILITY</p>
              <h1 className="mt-4 font-display text-[36px] leading-tight sm:text-[48px]">Reserve Your Stay at {hotel.name}</h1>
              <HotelAddress hotel={hotel} />
            </div>
            <form onSubmit={searchAvailability} className="absolute inset-x-5 bottom-0 z-10 mx-auto grid max-w-[1150px] gap-3 border border-[#e9e6df] bg-white p-4 text-left shadow-[0_12px_30px_rgba(8,24,16,0.12)] max-lg:static max-lg:mt-8 max-lg:w-full sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.15fr_auto] lg:items-end">
              <label className="px-1 text-[9px] font-medium tracking-wide text-ink">CHECK-IN
                <span className="mt-1 flex h-9 items-center gap-2 border border-[#dedbd3] px-2"><CalendarDays aria-hidden="true" className="h-4 w-4 text-[#94713a]" /><input required aria-label="Check-in date" type="date" min={today} value={checkIn} onChange={(event) => {
                  const value = event.target.value
                  setCheckIn(value)
                  if (checkOut <= value) setCheckOut(addDays(value, 1))
                }} className="min-w-0 flex-1 bg-transparent text-xs outline-none" /></span>
              </label>
              <label className="px-1 text-[9px] font-medium tracking-wide text-ink">CHECK-OUT
                <span className="mt-1 flex h-9 items-center gap-2 border border-[#dedbd3] px-2"><CalendarDays aria-hidden="true" className="h-4 w-4 text-[#94713a]" /><input required aria-label="Check-out date" type="date" min={addDays(checkIn, 1)} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none" /></span>
              </label>
              <div className="grid grid-cols-2 gap-2 px-1">
                <label className="text-[9px] font-medium tracking-wide text-ink">ADULTS
                  <span className="mt-1 flex h-9 items-center gap-2 border border-[#dedbd3] px-2"><Users aria-hidden="true" className="h-4 w-4 text-[#94713a]" /><select aria-label="Adults" value={adults} onChange={(event) => setAdults(Number(event.target.value))} className="w-full bg-transparent text-xs outline-none">{[1, 2, 3, 4, 5, 6].map((count) => <option value={count} key={count}>{count}</option>)}</select></span>
                </label>
                <label className="text-[9px] font-medium tracking-wide text-ink">CHILDREN
                  <span className="mt-1 flex h-9 items-center gap-2 border border-[#dedbd3] px-2"><Users aria-hidden="true" className="h-4 w-4 text-[#94713a]" /><select aria-label="Children" value={children} onChange={(event) => setChildren(Number(event.target.value))} className="w-full bg-transparent text-xs outline-none">{[0, 1, 2, 3, 4].map((count) => <option value={count} key={count}>{count}</option>)}</select></span>
                </label>
              </div>
              <button type="submit" disabled={isSearching} className="flex min-h-10 items-center justify-center gap-2 bg-[#84652e] px-5 text-[9px] font-medium tracking-wide text-white transition-colors hover:bg-forest disabled:cursor-wait disabled:opacity-60">
                <Search aria-hidden="true" className="h-4 w-4" />{isSearching ? 'SEARCHING…' : 'CHECK AVAILABILITY'}
              </button>
            </form>
          </section>

          <section id="available-stays" className="scroll-mt-5 bg-paper px-5 pb-14 pt-14 sm:px-8 lg:px-10">
            <div className="mx-auto max-w-[1150px]">
              {availabilityError && <p role="alert" className="mb-4 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{availabilityError}</p>}
              {bookingError && <p role="alert" className="mb-4 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{bookingError}</p>}
              {availability ? (
                <>
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="font-display text-2xl text-ink">Available room types</h2>
                      <p className="mt-1 text-sm text-muted">{displayDate(availability.stay.checkIn)} – {displayDate(availability.stay.checkOut)} · {availability.stay.nights} night{availability.stay.nights === 1 ? '' : 's'} · {availability.guests.adults} adult{availability.guests.adults === 1 ? '' : 's'}, {availability.guests.children} child{availability.guests.children === 1 ? '' : 'ren'}</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted"><Clock3 aria-hidden="true" className="h-3.5 w-3.5" />Quote is subject to availability and repricing at booking</span>
                  </div>
                  {roomTypes.length > 0 ? (
                    <div className="grid gap-3">
                      {roomTypes.map((room) => <StayCard key={room.id} room={room} selected={selectedRoomTypeId === room.id} onSelect={() => selectRoomType(room.id)} />)}
                    </div>
                  ) : (
                    <p role="status" className="border border-[#e9e6df] bg-white px-5 py-6 text-sm text-muted">No room types are available for those dates and guests. Try different dates or guest numbers.</p>
                  )}
                  {selectedRoomType && (
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border border-[#e9e6df] bg-white p-4">
                      <div><p className="text-xs text-muted">Selected · {selectedRoomType.name}</p><p className="mt-1 font-display text-xl text-ink">{formatMinorAmount(selectedRoomType.pricing.totalMinor, selectedRoomType.pricing.currency)} total</p></div>
                      <button type="button" onClick={() => { setBookingError(''); setStep('guest') }} className="inline-flex min-h-10 items-center gap-2 bg-forest px-5 text-xs font-medium text-white hover:bg-forest-deep">Continue<ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
                    </div>
                  )}
                </>
              ) : (
                <div className="mx-auto max-w-[600px] py-6 text-center">
                  <p className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-[#94713a]"><BedDouble aria-hidden="true" className="h-4 w-4" /> LIVE ROOM AVAILABILITY</p>
                  <h2 className="mt-3 font-display text-2xl text-ink">Find a room for your stay</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">Choose your dates and guest count above to see room types, availability, and current prices.</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function BookingQuote({ room, checkIn, checkOut, adults, childrenCount, hotel }: {
  room: PublicRoomType
  checkIn: string
  checkOut: string
  adults: number
  childrenCount: number
  hotel: PublicHotel
}) {
  return (
    <aside className="border border-[#e5e2dc] bg-white">
      <div className="bg-forest px-4 py-3 text-white">
        <p className="text-[8px] tracking-wide text-champagne">{hotel.name}</p>
        <h2 className="mt-1 font-display text-lg">Your stay summary</h2>
      </div>
      <dl className="space-y-3 p-4 text-xs">
        <div className="flex justify-between gap-3"><dt className="text-muted">Room type</dt><dd className="text-right font-medium text-ink">{room.name}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted">Check-in</dt><dd className="text-right text-ink">{displayDate(checkIn)} · {hotel.settings.checkInTime}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted">Check-out</dt><dd className="text-right text-ink">{displayDate(checkOut)} · {hotel.settings.checkOutTime}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted">Guests</dt><dd className="text-right text-ink">{adults} adults, {childrenCount} children</dd></div>
        <div className="flex justify-between gap-3 border-t border-[#eeece6] pt-3"><dt className="text-muted">Estimated total</dt><dd className="font-display text-lg text-ink">{formatMinorAmount(room.pricing.totalMinor, room.pricing.currency)}</dd></div>
      </dl>
      <p className="px-4 pb-4 text-[10px] leading-5 text-muted">This quote is a point-in-time estimate. Availability and price are checked again when you confirm. No online payment is taken.</p>
    </aside>
  )
}
