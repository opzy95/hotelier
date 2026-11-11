import { apiRequest } from '../api'
import type { BedSetupItem, Room, RoomStatus, RoomDraft, RoomType, RoomTypeDraft, RoomTypePhoto } from './adminRoomsData'

type ApiRecord = Record<string, unknown>

function isRecord(value: unknown): value is ApiRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function recordsFrom(payload: unknown, key: string): ApiRecord[] {
  if (Array.isArray(payload)) return payload.filter(isRecord)
  if (!isRecord(payload)) return []
  if (Array.isArray(payload.data)) return payload.data.filter(isRecord)
  if (Array.isArray(payload[key])) return (payload[key] as unknown[]).filter(isRecord)
  if (isRecord(payload.data) && Array.isArray(payload.data[key])) return (payload.data[key] as unknown[]).filter(isRecord)
  return []
}

function recordFrom(payload: unknown, key: string): ApiRecord {
  if (!isRecord(payload)) throw new Error('The hotel API returned an invalid room record.')
  if (isRecord(payload[key])) return payload[key] as ApiRecord
  if (isRecord(payload.data)) {
    if (isRecord(payload.data[key])) return payload.data[key] as ApiRecord
    return payload.data
  }
  return payload
}

function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback
}

function numberValue(value: unknown, fallback = 0) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function stringList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function recordId(record: ApiRecord) {
  return stringValue(record.id ?? record._id)
}

function normalizePhoto(value: unknown): RoomTypePhoto | undefined {
  if (typeof value === 'string' && value) return { id: value, url: value }
  if (!isRecord(value)) return undefined
  const url = stringValue(value.url ?? value.src ?? value.secureUrl)
  if (!url) return undefined
  return { id: stringValue(value.id ?? value._id ?? value.photoId, url), url }
}

function normalizeRoomType(record: ApiRecord): RoomType {
  const id = recordId(record)
  if (!id) throw new Error('A room type returned by the hotel API is missing its ID.')
  const photos = Array.isArray(record.photos) ? record.photos.map(normalizePhoto).filter((photo): photo is RoomTypePhoto => Boolean(photo)) : []
  const legacyImage = stringValue(record.imageUrl ?? record.image)
  if (!photos.length && legacyImage) photos.push({ id: legacyImage, url: legacyImage })
  const bedSetup: BedSetupItem[] = Array.isArray(record.bedSetup)
    ? record.bedSetup.filter(isRecord).flatMap((bed) => {
      const type = stringValue(bed.type)
      const count = numberValue(bed.count)
      return type && count > 0 ? [{ type, count }] : []
    })
    : typeof record.bedSetup === 'string'
      ? [{ type: record.bedSetup, count: 1 }]
      : []
  return {
    id,
    name: stringValue(record.name),
    description: stringValue(record.description),
    area: numberValue(record.sizeSqm ?? record.area),
    maxGuests: numberValue(record.maxGuests),
    bedSetup,
    rate: numberValue(record.baseRateMinor, numberValue(record.baseRate ?? record.rate) * 100) / 100,
    currency: stringValue(record.currency, 'NGN'),
    amenities: stringList(record.amenities),
    photos,
    active: record.active !== false && record.isActive !== false && stringValue(record.status).toLowerCase() !== 'inactive',
  }
}

function normalizeStatus(value: unknown): RoomStatus {
  const status = stringValue(value).toLowerCase()
  if (status === 'available') return 'Available'
  if (status === 'occupied') return 'Occupied'
  if (status === 'reserved') return 'Reserved'
  throw new Error(`The hotel API returned an unsupported room status: ${String(value)}.`)
}

function normalizeRoom(record: ApiRecord, roomTypes: RoomType[]): Room {
  const id = recordId(record)
  if (!id) throw new Error('A room returned by the hotel API is missing its ID.')

  const rawType = record.roomType
  const embeddedType = isRecord(rawType) ? normalizeRoomType(rawType) : undefined
  const rawTypeId = record.roomTypeId
  const roomTypeId = typeof rawTypeId === 'string'
    ? rawTypeId
    : isRecord(rawTypeId)
      ? recordId(rawTypeId)
      : embeddedType?.id ?? ''
  const roomType = embeddedType ?? roomTypes.find((type) => type.id === roomTypeId)
  const status = normalizeStatus(record.status)
  const currentStay = isRecord(record.currentStay) ? record.currentStay : undefined
  const roomRate = record.baseRateMinor !== undefined
    ? numberValue(record.baseRateMinor) / 100
    : numberValue(record.baseRate ?? record.rate)

  return {
    id,
    name: stringValue(record.code ?? record.roomNumber ?? record.number ?? record.name, id),
    roomTypeId,
    type: roomType?.name ?? stringValue(record.type, 'Room type'),
    floor: numberValue(record.floor, 1),
    wing: stringValue(record.wing ?? record.building),
    notes: stringValue(record.notes),
    area: roomType?.area ?? numberValue(record.sizeSqm ?? record.area),
    rate: roomType?.rate ?? roomRate,
    guests: roomType?.maxGuests ?? numberValue(record.maxGuests),
    status,
    active: record.active !== false && record.isActive !== false && stringValue(record.status).toLowerCase() !== 'inactive',
    currency: roomType?.currency ?? stringValue(record.currency, 'NGN'),
    image: roomType?.photos[0]?.url,
    amenities: roomType?.amenities ?? stringList(record.amenities),
    guest: currentStay ? stringValue(currentStay.guestName ?? currentStay.guest) || undefined : undefined,
    note: currentStay ? stringValue(currentStay.reference) || undefined : undefined,
  }
}

function hotelPath(hotelId: string) {
  return `/hotels/${encodeURIComponent(hotelId)}`
}

export async function fetchRoomInventory(hotelId: string, includeInactiveRooms = false) {
  const roomsQuery = includeInactiveRooms ? '?includeInactive=true' : ''
  const [typePayload, roomPayload] = await Promise.all([
    apiRequest<unknown>(`${hotelPath(hotelId)}/room-types?includeInactive=true`),
    apiRequest<unknown>(`${hotelPath(hotelId)}/rooms${roomsQuery}`),
  ])
  const roomTypes = recordsFrom(typePayload, 'roomTypes').map(normalizeRoomType)
  const rooms = recordsFrom(roomPayload, 'rooms').map((record) => normalizeRoom(record, roomTypes))
  return { roomTypes, rooms }
}

export function createRoomType(hotelId: string, draft: RoomTypeDraft) {
  return apiRequest<unknown>(`${hotelPath(hotelId)}/room-types`, {
    method: 'POST',
    body: JSON.stringify({
      name: draft.name,
      description: draft.description,
      sizeSqm: draft.area,
      maxGuests: draft.maxGuests,
      bedSetup: draft.bedSetup,
      baseRateMinor: Math.round(draft.rate * 100),
      amenities: draft.amenities,
    }),
  }).then((payload) => {
    try {
      return normalizeRoomType(recordFrom(payload, 'roomType'))
    } catch {
      return undefined
    }
  })
}

export function updateRoomType(hotelId: string, roomTypeId: string, draft: RoomTypeDraft) {
  return apiRequest<unknown>(`${hotelPath(hotelId)}/room-types/${encodeURIComponent(roomTypeId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      name: draft.name,
      description: draft.description,
      sizeSqm: draft.area,
      maxGuests: draft.maxGuests,
      bedSetup: draft.bedSetup,
      baseRateMinor: Math.round(draft.rate * 100),
      amenities: draft.amenities,
    }),
  })
}

export function deactivateRoomType(hotelId: string, roomTypeId: string) {
  return apiRequest<unknown>(`${hotelPath(hotelId)}/room-types/${encodeURIComponent(roomTypeId)}`, {
    method: 'DELETE',
  })
}

export function uploadRoomTypePhotos(hotelId: string, roomTypeId: string, photos: File[]) {
  const formData = new FormData()
  photos.forEach((photo) => formData.append('photos', photo))
  return apiRequest<unknown>(`${hotelPath(hotelId)}/room-types/${encodeURIComponent(roomTypeId)}/photos`, {
    method: 'POST',
    body: formData,
  })
}

export function deleteRoomTypePhoto(hotelId: string, roomTypeId: string, photoId: string) {
  return apiRequest<unknown>(`${hotelPath(hotelId)}/room-types/${encodeURIComponent(roomTypeId)}/photos/${encodeURIComponent(photoId)}`, {
    method: 'DELETE',
  })
}

export function createRoom(hotelId: string, draft: RoomDraft) {
  return apiRequest<unknown>(`${hotelPath(hotelId)}/rooms`, {
    method: 'POST',
    body: JSON.stringify({
      code: draft.roomNumber,
      roomTypeId: draft.roomTypeId,
      floor: String(draft.floor ?? ''),
      wing: draft.wing,
      notes: draft.notes,
    }),
  })
}

export function updateRoom(hotelId: string, roomId: string, draft: RoomDraft) {
  return apiRequest<unknown>(`${hotelPath(hotelId)}/rooms/${encodeURIComponent(roomId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      code: draft.roomNumber,
      roomTypeId: draft.roomTypeId,
      floor: String(draft.floor ?? ''),
      wing: draft.wing,
      notes: draft.notes,
    }),
  })
}

export function deactivateRoom(hotelId: string, roomId: string) {
  return apiRequest<unknown>(`${hotelPath(hotelId)}/rooms/${encodeURIComponent(roomId)}`, {
    method: 'DELETE',
  })
}