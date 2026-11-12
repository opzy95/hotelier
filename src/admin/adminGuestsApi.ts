import { apiRequest } from '../api'

export type HotelGuestProfile = {
  id: string
  name: string
  email: string
  phone: string
  country?: string
  countryCode?: string
  tier?: string
  createdAt?: string
}

type ApiRecord = Record<string, unknown>
type GuestPage = { profiles: HotelGuestProfile[]; pages: number }

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function guestRecords(payload: unknown): unknown[] | undefined {
  if (Array.isArray(payload)) return payload
  if (!isRecord(payload)) return undefined
  if (Array.isArray(payload.data)) return payload.data

  const data = isRecord(payload.data) ? payload.data : undefined
  for (const record of [payload, data]) {
    if (!record) continue
    for (const key of ['guests', 'guestProfiles', 'profiles']) {
      if (Array.isArray(record[key])) return record[key]
    }
  }
  return undefined
}

function field(record: ApiRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value) return value
  }
  return undefined
}

function paginationRecord(payload: unknown): ApiRecord | undefined {
  if (!isRecord(payload)) return undefined
  if (isRecord(payload.pagination)) return payload.pagination
  if (isRecord(payload.data) && isRecord(payload.data.pagination)) return payload.data.pagination
  return undefined
}

function normalizeGuestProfile(value: unknown): HotelGuestProfile {
  if (!isRecord(value)) throw new Error('The hotel API returned an invalid guest profile.')

  const id = field(value, ['id', '_id', 'guestId'])
  const name = field(value, ['name', 'fullName', 'guestName'])
  const email = field(value, ['email', 'guestEmail'])
  const phone = field(value, ['phone', 'guestPhone'])
  if (!id || !name || !email || !phone) {
    throw new Error('The hotel API returned a guest profile missing its ID or contact details.')
  }

  const country = field(value, ['country', 'guestCountry', 'countryOfResidence'])
  const countryCode = field(value, ['countryCode'])
  const tier = field(value, ['membershipTier', 'tier', 'guestTier'])
  const createdAt = field(value, ['createdAt', 'registeredAt'])
  return {
    id,
    name,
    email,
    phone,
    country,
    countryCode,
    tier,
    createdAt: createdAt?.slice(0, 10),
  }
}

function hotelGuestPath(hotelId: string) {
  return `/hotels/${encodeURIComponent(hotelId)}/guests`
}

export async function fetchHotelGuestProfiles(hotelId: string): Promise<HotelGuestProfile[]> {
  const fetchPage = async (page: number): Promise<GuestPage> => {
    const params = new URLSearchParams({ page: String(page), limit: '100' })
    const payload: unknown = await apiRequest(`${hotelGuestPath(hotelId)}?${params.toString()}`)
    const records = guestRecords(payload)
    if (!records) {
      throw new Error('The hotel API returned an invalid guest profile list.')
    }

    const pagination = paginationRecord(payload)
    const pages = pagination && typeof pagination.pages === 'number' && Number.isInteger(pagination.pages) && pagination.pages > 0
      ? pagination.pages
      : 1
    return { profiles: records.map(normalizeGuestProfile), pages }
  }

  const firstPage = await fetchPage(1)
  const profiles = [...firstPage.profiles]
  for (let page = 2; page <= firstPage.pages; page += 1) {
    const nextPage = await fetchPage(page)
    profiles.push(...nextPage.profiles)
  }
  return profiles
}

export function updateHotelGuestProfile(
  hotelId: string,
  guestId: string,
  changes: { country?: string; membershipTier?: string },
) {
  return apiRequest<unknown>(`${hotelGuestPath(hotelId)}/${encodeURIComponent(guestId)}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  })
}
