const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')
let accessToken: string | null = null
let refreshRequest: Promise<string> | null = null

export function setAccessToken(token: string) {
  accessToken = token
}

export function clearAccessToken() {
  accessToken = null
}

function expireAccessToken() {
  clearAccessToken()
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('auth:expired'))
}

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
  if (typeof payload !== 'object' || payload === null) return undefined

  if ('error' in payload) {
    const { error } = payload
    if (typeof error === 'string') return error
    if (typeof error === 'object' && error && 'code' in error && typeof error.code === 'string') return error.code
  }

  if ('code' in payload && typeof payload.code === 'string') return payload.code

  return undefined
}

function getErrorMessageFromPayload(payload: unknown) {
  if (typeof payload !== 'object' || payload === null) return undefined

  if ('message' in payload && typeof payload.message === 'string' && payload.message.trim().length > 0) return payload.message

  if ('error' in payload) {
    const { error } = payload
    if (typeof error === 'string' && error.trim().length > 0) return error
    if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string' && error.message.trim().length > 0) return error.message
  }

  return undefined
}

function normalizeErrorText(value: string) {
  const withoutHtml = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!withoutHtml) return undefined
  return withoutHtml.length > 180 ? `${withoutHtml.slice(0, 177).trim()}...` : withoutHtml
}

function getErrorMessage(status: number, code?: string, payload?: unknown, rawText?: string) {
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

  const payloadMessage = getErrorMessageFromPayload(payload)
  if (payloadMessage) return payloadMessage

  const textMessage = rawText ? normalizeErrorText(rawText) : undefined
  if (textMessage) return textMessage

  if (status === 429) return 'Too many attempts. Please wait a while and try again.'
  if (status >= 500) return 'The server encountered an error. Please try again later.'
  return code ? `The request could not be completed (${code}).` : `The request failed (HTTP ${status}).`
}

async function sendRequest(path: string, init: RequestInit, token: string | null) {
  const headers = new Headers(init.headers)
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  try {
    return await fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: 'include' })
  } catch {
    throw new Error(`Could not reach the hotel API at ${API_BASE_URL}. Make sure the backend is running.`)
  }
}

async function readResponse(response: Response) {
  const responseText = await response.text()
  let payload: unknown
  let unreadable = false
  if (responseText) {
    try {
      payload = JSON.parse(responseText)
    } catch {
      unreadable = true
    }
  }
  return { payload, responseText, unreadable }
}

async function refreshAccessToken() {
  if (!refreshRequest) {
    refreshRequest = (async () => {
      let response: Response
      try {
        response = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
      } catch {
        throw new Error(`Could not reach the hotel API at ${API_BASE_URL}. Make sure the backend is running.`)
      }

      const { payload, responseText, unreadable } = await readResponse(response)
      if (response.status === 401) {
        expireAccessToken()
        throw new ApiError(getErrorMessage(401, getErrorCode(payload), payload, responseText), 401, getErrorCode(payload))
      }
      if (!response.ok) {
        const code = getErrorCode(payload)
        throw new ApiError(getErrorMessage(response.status, code, payload, responseText), response.status, code)
      }
      if (unreadable || typeof payload !== 'object' || payload === null || !('token' in payload) || typeof payload.token !== 'string' || !payload.token) {
        throw new Error('The hotel API returned an invalid refresh response.')
      }

      setAccessToken(payload.token)
      return payload.token
    })().finally(() => { refreshRequest = null })
  }
  return refreshRequest
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isLoginRequest = path.split('?')[0] === '/auth/login'
  const tokenForRequest = isLoginRequest ? null : accessToken
  let response = await sendRequest(path, init, tokenForRequest)

  if (response.status === 401 && !isLoginRequest) {
    const refreshedToken = accessToken && accessToken !== tokenForRequest
      ? accessToken
      : await refreshAccessToken()
    response = await sendRequest(path, init, refreshedToken)
    if (response.status === 401) expireAccessToken()
  }

  const { payload, responseText, unreadable } = await readResponse(response)

  if (!response.ok) {
    const code = getErrorCode(payload)
    throw new ApiError(getErrorMessage(response.status, code, payload, responseText), response.status, code)
  }
  if (unreadable) throw new Error('The hotel API returned an unreadable response.')

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
    line1?: string
    line2?: string
    region?: string
    postalCode?: string
  }
  slug: string
  status: 'pending_approval' | 'active' | 'suspended'
  type?: string
  roomCount?: number
  manager?: {
    name?: string
    email?: string
    phone?: string
  }
  settings?: {
    timezone?: string
    locale?: string
    currency?: string
    checkInTime?: string
    checkOutTime?: string
  }
  setupCompletedSteps?: string[]
  subscription?: {
    status?: string
    plan?: {
      name?: string
      code?: string
    } | null
    trialEndsAt?: string
  } | null
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