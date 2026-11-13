import { apiRequest } from '../api'
import type { Reservation } from './adminReservationsData'
import { currencyMinorUnitScale } from './adminReservationsData'

type ApiRecord = Record<string, unknown>

export type ReservationPage = {
  reservations: Reservation[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export type ReservationDraft = {
  checkIn: string
  checkOut: string
  roomTypeId: string
  assignedRoomId?: string
  source?: 'walk_in'
  guestName: string
  guestEmail: string
  guestPhone: string
  adults: number
  children: number
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'other'

export type ReservationPayment = {
  amountMinor: number
  method: PaymentMethod
  idempotencyKey: string
}

export type ReservationPaymentSummary = {
  paidAmount: number
  balanceDue: number
}

export type ReservationPaymentRecord = {
  id: string
  amount: number
  currency: string
  method: PaymentMethod
  note?: string
  receivedAt: string
}

const paymentMethods = new Set<string>(['cash', 'card', 'bank_transfer', 'mobile_money', 'other'])

function isPaymentMethod(value: string): value is PaymentMethod {
  return paymentMethods.has(value)
}

export type ReservationAvailabilityQuery = {
  checkIn: string
  checkOut: string
  roomTypeId: string
  adults: number
  children?: number
}

export type ReservationAvailability = {
  availableRooms: { id: string; code: string }[]
  pricing: {
    rateMinorPerNight: number
    totalMinor: number
    currency: string
  }
}

export function createPaymentIdempotencyKey() {
  return crypto.randomUUID()
}

export type ReservationQuery = {
  page: number
  limit: number
  search?: string
  status?: string
  checkInFrom?: string
  checkInTo?: string
}

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringField(record: ApiRecord, field: string) {
  const value = record[field]
  if (typeof value !== 'string' || !value) {
    throw new Error(`The hotel API returned a reservation with an invalid ${field}.`)
  }
  return value
}

function optionalRecordId(value: unknown) {
  if (typeof value === 'string' && value) return value
  if (!isRecord(value)) return undefined
  const id = value.id ?? value._id
  return typeof id === 'string' && id ? id : undefined
}

function optionalStringField(record: ApiRecord, field: string) {
  const value = record[field]
  return typeof value === 'string' && value ? value : undefined
}

function numberField(record: ApiRecord, field: string) {
  const value = record[field]
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`The hotel API returned a reservation with an invalid ${field}.`)
  }
  return value
}

function nestedRecord(record: ApiRecord, field: string) {
  const value = record[field]
  if (!isRecord(value)) {
    throw new Error(`The hotel API returned a reservation with an invalid ${field}.`)
  }
  return value
}

export async function fetchReservationAvailability(
  hotelId: string,
  query: ReservationAvailabilityQuery,
): Promise<ReservationAvailability> {
  const params = new URLSearchParams({
    checkIn: query.checkIn,
    checkOut: query.checkOut,
    roomTypeId: query.roomTypeId,
    adults: String(query.adults),
    children: String(query.children ?? 0),
  })
  const payload: unknown = await apiRequest(`${hotelPath(hotelId)}/availability?${params.toString()}`)
  if (!isRecord(payload) || !Array.isArray(payload.availableRooms)) {
    throw new Error('The hotel API returned an invalid room availability response.')
  }

  const pricing = nestedRecord(payload, 'pricing')
  return {
    availableRooms: payload.availableRooms.map((value) => {
      if (!isRecord(value)) throw new Error('The hotel API returned an invalid available room.')
      return {
        id: stringField(value, 'id'),
        code: stringField(value, 'code'),
      }
    }),
    pricing: {
      rateMinorPerNight: numberField(pricing, 'rateMinorPerNight'),
      totalMinor: numberField(pricing, 'totalMinor'),
      currency: stringField(pricing, 'currency'),
    },
  }
}

function normalizeReservation(value: unknown): Reservation {
  if (!isRecord(value)) throw new Error('The hotel API returned an invalid reservation.')

  const guest = nestedRecord(value, 'guest')
  const roomType = nestedRecord(value, 'roomType')
  const guests = nestedRecord(value, 'guests')
  const pricing = nestedRecord(value, 'pricing')
  const paymentSummary = nestedRecord(value, 'paymentSummary')
  const assignedRoom = isRecord(value.assignedRoom) ? value.assignedRoom : undefined
  const assignedRoomId = optionalRecordId(value.assignedRoom ?? value.assignedRoomId)
  const currency = stringField(pricing, 'currency')
  const minorUnitScale = currencyMinorUnitScale(currency)
  const total = numberField(pricing, 'totalMinor') / minorUnitScale
  const paymentStatus = stringField(value, 'paymentStatus')
  const source = optionalStringField(value, 'source')
  const folioByStatus: Record<string, Reservation['folio']> = {
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    checked_in: 'Checked In',
    checked_out: 'Checked Out',
    no_show: 'No Show',
  }
  const paymentByStatus: Record<string, Reservation['payment']> = {
    unpaid: 'Pending',
    partially_paid: 'Partially Paid',
    paid: 'Paid',
    refunded: 'Refunded',
  }
  const status = stringField(value, 'status')
  const folio = folioByStatus[status]
  const payment = paymentByStatus[paymentStatus]
  if (!folio) throw new Error(`The hotel API returned an unsupported reservation status: ${status}.`)
  if (!payment) throw new Error(`The hotel API returned an unsupported payment status: ${paymentStatus}.`)

  return {
    id: stringField(value, 'id'),
    guestId: optionalRecordId(guest) ?? optionalRecordId(value.guestId),
    reference: stringField(value, 'reference'),
    guest: stringField(guest, 'name'),
    email: typeof guest.email === 'string' ? guest.email : '',
    phone: stringField(guest, 'phone'),
    guestCountry: optionalStringField(guest, 'country'),
    guestCountryCode: optionalStringField(guest, 'countryCode'),
    guestTier: optionalStringField(guest, 'tier'),
    guestCreatedAt: optionalStringField(guest, 'createdAt')?.slice(0, 10),
    tier: source === 'walk_in' ? 'Walk-in' : '',
    room: stringField(roomType, 'name'),
    assignedRoomId,
    assignedRoomName: assignedRoom && typeof assignedRoom.code === 'string' ? assignedRoom.code : undefined,
    source,
    registeredAt: typeof value.createdAt === 'string' ? value.createdAt.slice(0, 10) : undefined,
    checkIn: stringField(value, 'checkIn'),
    checkOut: stringField(value, 'checkOut'),
    adults: numberField(guests, 'adults'),
    children: numberField(guests, 'children'),
    amount: total,
    paidAmount: numberField(paymentSummary, 'paidMinor') / minorUnitScale,
    balanceDue: numberField(paymentSummary, 'balanceDueMinor') / minorUnitScale,
    nightlyRate: numberField(pricing, 'rateMinorPerNight') / minorUnitScale,
    currency,
    payment,
    folio,
  }
}

function hotelPath(hotelId: string) {
  return `/hotels/${encodeURIComponent(hotelId)}/reservations`
}

export async function fetchReservations(hotelId: string, query: ReservationQuery): Promise<ReservationPage> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  })
  if (query.search) params.set('search', query.search)
  if (query.status) params.set('status', query.status)
  if (query.checkInFrom) params.set('checkInFrom', query.checkInFrom)
  if (query.checkInTo) params.set('checkInTo', query.checkInTo)

  const payload: unknown = await apiRequest(`${hotelPath(hotelId)}?${params.toString()}`)
  if (!isRecord(payload) || !Array.isArray(payload.reservations) || !isRecord(payload.pagination)) {
    throw new Error('The hotel API returned an invalid reservations list.')
  }

  const pagination = payload.pagination
  return {
    reservations: payload.reservations.map(normalizeReservation),
    pagination: {
      page: numberField(pagination, 'page'),
      limit: numberField(pagination, 'limit'),
      total: numberField(pagination, 'total'),
      pages: numberField(pagination, 'pages'),
    },
  }
}

export async function fetchAllReservations(hotelId: string): Promise<ReservationPage> {
  const firstPage = await fetchReservations(hotelId, { page: 1, limit: 100 })
  if (firstPage.pagination.pages <= 1) return firstPage

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.pagination.pages - 1 }, (_, index) => (
      fetchReservations(hotelId, { page: index + 2, limit: 100 })
    )),
  )

  return {
    ...firstPage,
    reservations: [firstPage, ...remainingPages].flatMap((page) => page.reservations),
  }
}

export async function createReservation(hotelId: string, draft: ReservationDraft) {
  const payload: unknown = await apiRequest(hotelPath(hotelId), {
    method: 'POST',
    body: JSON.stringify(draft),
  })
  if (!isRecord(payload) || !('reservation' in payload)) {
    throw new Error('The hotel API returned an invalid created reservation.')
  }
  return normalizeReservation(payload.reservation)
}

export async function recordReservationPayment(
  hotelId: string,
  reservationId: string,
  payment: ReservationPayment,
  currency: string,
): Promise<ReservationPaymentSummary> {
  const payload: unknown = await apiRequest(`${hotelPath(hotelId)}/${encodeURIComponent(reservationId)}/payments`, {
    method: 'POST',
    body: JSON.stringify(payment),
  })
  if (!isRecord(payload) || !isRecord(payload.payment) || !isRecord(payload.paymentSummary)) {
    throw new Error('The hotel API returned an invalid recorded payment.')
  }

  const paymentSummary = payload.paymentSummary
  const minorUnitScale = currencyMinorUnitScale(currency)
  return {
    paidAmount: numberField(paymentSummary, 'paidMinor') / minorUnitScale,
    balanceDue: numberField(paymentSummary, 'balanceDueMinor') / minorUnitScale,
  }
}

export async function fetchReservationPayments(hotelId: string, reservationId: string): Promise<ReservationPaymentRecord[]> {
  const payload: unknown = await apiRequest(`${hotelPath(hotelId)}/${encodeURIComponent(reservationId)}/payments`)
  if (!isRecord(payload) || !Array.isArray(payload.payments)) {
    throw new Error('The hotel API returned an invalid reservation payment history.')
  }

  return payload.payments.map((value) => {
    if (!isRecord(value)) throw new Error('The hotel API returned an invalid payment record.')
    const currency = stringField(value, 'currency')
    const method = stringField(value, 'method')
    if (!isPaymentMethod(method)) {
      throw new Error(`The hotel API returned an unsupported payment method: ${method}.`)
    }

    return {
      id: stringField(value, 'id'),
      amount: numberField(value, 'amountMinor') / currencyMinorUnitScale(currency),
      currency,
      method,
      note: typeof value.note === 'string' ? value.note : undefined,
      receivedAt: stringField(value, 'receivedAt'),
    }
  })
}

export async function updateReservationStatus(hotelId: string, reservationId: string, status: string) {
  const payload: unknown = await apiRequest(`${hotelPath(hotelId)}/${encodeURIComponent(reservationId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
  if (!isRecord(payload) || !('reservation' in payload)) {
    throw new Error('The hotel API returned an invalid updated reservation.')
  }
  return normalizeReservation(payload.reservation)
}
