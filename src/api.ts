const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

function getErrorCode(payload: unknown) {
  if (typeof payload !== 'object' || payload === null || !('error' in payload)) return undefined
  const { error } = payload
  return typeof error === 'string' ? error : undefined
}

function getErrorMessage(status: number, code?: string) {
  if (code === 'invalid_credentials') return 'The email or password is incorrect.'
  if (code === 'email_not_verified') return 'Please verify your email address before signing in.'
  if (code === 'account_already_exists') return 'An account with this email already exists.'
  if (code === 'invalid_or_expired_token') return 'This verification link is invalid or has expired. Request a new email and try again.'
  if (code === 'verification_email_delivery_failed') return 'Your account was created, but the verification email could not be sent. Please request a new email.'
  if (code === 'subscription_selection_locked') return 'A plan has already been selected for this hotel.'
  if (code === 'plan_not_found' || code === 'invalid_plan') return 'That plan is unavailable. Please choose another plan.'
  if (code === 'authentication_required' || code === 'invalid_token') return 'Your session has expired. Please sign in again.'
  if (code === 'platform_operator_required') return 'This account does not have platform administrator access.'
  if (code === 'subscription_not_active') return 'This hotel cannot be activated until its subscription is active.'
  if (status === 429) return 'Too many attempts. Please wait a while and try again.'
  if (status >= 500) return 'The server encountered an error. Please try again later.'
  return code ? `The request could not be completed (${code}).` : `The request failed (HTTP ${status}).`
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new Error(`Could not reach the hotel API at ${API_BASE_URL}. Make sure the backend is running.`)
  }

  const responseText = await response.text()
  let payload: unknown
  if (responseText) {
    try {
      payload = JSON.parse(responseText)
    } catch {
      throw new Error('The hotel API returned an unreadable response.')
    }
  }

  if (!response.ok) {
    const code = getErrorCode(payload)
    throw new ApiError(getErrorMessage(response.status, code), response.status, code)
  }

  return payload as T
}

export type PlatformUser = {
  id: string
  name: string
  email: string
}

export type PlatformLoginResponse = {
  token: string
  user: PlatformUser
}

export type PlatformProfileResponse = {
  user: PlatformUser
  isPlatformOperator: boolean
  memberships: HotelMembership[]
}

export type HotelMembership = {
  hotelId: string
  hotelName: string
  hotelStatus: string
  hotelSlug: string
  role: string
}

export type HotelPlan = {
  _id: string
  name: string
  code: string
  amountMinor: number
  currency: string
  interval: 'month' | 'year'
  trialDays: number
  features: string[]
}

export type HotelOnboardingResponse = {
  hotelStatus: string
  currentStep: 'choose_plan' | 'configure_hotel' | 'complete'
  completedSteps: string[]
  subscription: {
    status: string
    plan: Pick<HotelPlan, 'name' | 'code'> | null
    trialEndsAt?: string
  } | null
}

export type PlatformHotel = {
  id?: string
  _id?: string
  name: string
  email: string
  phone: string
  address: {
    country: string
    city?: string
  }
  slug: string
  status: 'pending_approval' | 'active' | 'suspended'
  createdAt?: string
}

export type PlatformHotelsResponse = {
  data: PlatformHotel[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}
