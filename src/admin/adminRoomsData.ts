import type { Reservation } from './adminReservationsData'

export type RoomStatus = 'Available' | 'Occupied' | 'Reserved'

export type RoomTypePhoto = {
  id: string
  url: string
}

export type BedSetupItem = {
  type: string
  count: number
}

export type RoomType = {
  id: string
  name: string
  description: string
  area: number
  maxGuests: number
  bedSetup: BedSetupItem[]
  rate: number
  currency: string
  amenities: string[]
  photos: RoomTypePhoto[]
  active: boolean
}

export type RoomTypeDraft = Omit<RoomType, 'id' | 'active' | 'photos' | 'currency'>

export type RoomDraft = {
  roomNumber: string
  roomTypeId: string
  floor?: number
  wing?: string
  notes?: string
}

export type Room = {
  id: string
  name: string
  roomTypeId?: string
  type: string
  floor: number
  wing?: string
  notes?: string
  area: number
  rate: number
  guests: number
  status: RoomStatus
  active: boolean
  currency: string
  image?: string
  amenities: string[]
  guest?: string
  note?: string
}

export function getRoomStatusCounts(rooms: Room[]) {
  return rooms.reduce((counts, room) => {
    counts[room.status] += 1
    return counts
  }, { Available: 0, Occupied: 0, Reserved: 0 })
}

function normalizeRoomReference(value: string | undefined) {
  return value?.trim().toLowerCase().replace(/^room\s+/, '').replace(/^#/, '')
}

export function getRoomStatusesForDate(rooms: Room[], reservations: Reservation[], date: string) {
  const reservationsByRoom = new Map<string, Reservation[]>()

  for (const reservation of reservations) {
    const checkOut = reservation.checkOut.slice(0, 10)
    if (
      checkOut < date
      || (checkOut === date && reservation.folio !== 'Checked In')
      || ['Cancelled', 'Checked Out', 'No Show'].includes(reservation.folio)
    ) continue

    const references = [reservation.assignedRoomId, reservation.assignedRoomName]
      .map(normalizeRoomReference)
      .filter((reference): reference is string => Boolean(reference))
    const assignedRoom = rooms.find((room) => (
      references.includes(normalizeRoomReference(room.id) ?? '')
      || references.includes(normalizeRoomReference(room.name) ?? '')
    ))
    if (!assignedRoom) continue

    const roomReservations = reservationsByRoom.get(assignedRoom.id) ?? []
    roomReservations.push(reservation)
    reservationsByRoom.set(assignedRoom.id, roomReservations)
  }

  return rooms.map((room) => {
    const currentReservations = reservationsByRoom.get(room.id)
    if (!currentReservations?.length) return room

    const checkedInReservation = currentReservations.find((reservation) => (
      reservation.folio === 'Checked In' && reservation.checkIn.slice(0, 10) <= date
    ))
    if (!checkedInReservation && room.status === 'Occupied') return room

    const reservation = checkedInReservation
      ?? currentReservations
        .filter((item) => item.checkIn.slice(0, 10) <= date)
        .sort((first, second) => first.checkIn.localeCompare(second.checkIn))[0]
      ?? [...currentReservations].sort((first, second) => first.checkIn.localeCompare(second.checkIn))[0]
    if (!reservation) return room

    const status: RoomStatus = checkedInReservation ? 'Occupied' : 'Reserved'
    return {
      ...room,
      status,
      guest: reservation.guest,
      note: reservation.reference,
    }
  })
}

export function getAvailableRoomsForStay(
  rooms: Room[],
  reservations: Reservation[],
  checkIn: string,
  checkOut: string,
  guestCount: number,
  matches: (room: Room) => boolean = () => true,
) {
  if (!checkIn || !checkOut || checkOut <= checkIn || guestCount < 1) return []

  return rooms.filter((room) => {
    if (!room.active || room.guests < guestCount || !matches(room)) return false

    const activeReservations = reservations.filter((reservation) => (
      reservation.assignedRoomId === room.id
      && !['Cancelled', 'Checked Out', 'No Show'].includes(reservation.folio)
    ))
    const hasDateConflict = activeReservations.some((reservation) => (
      checkIn < reservation.checkOut && reservation.checkIn < checkOut
    ))
    const statusAllowsAssignment = room.status === 'Available'
      || (activeReservations.length > 0 && !activeReservations.some((reservation) => reservation.folio === 'Checked In'))

    return statusAllowsAssignment && !hasDateConflict
  })
}

