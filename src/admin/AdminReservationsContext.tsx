import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { fetchRoomInventory } from './adminRoomsApi'
import type { Room, RoomType } from './adminRoomsData'
import type { Reservation } from './adminReservationsData'
import { fetchAllReservations } from './adminReservationsApi'

type AdminReservationsContextValue = {
  reservations: Reservation[]
  setReservations: Dispatch<SetStateAction<Reservation[]>>
  reservationsLoading: boolean
  reservationsError: string
  refreshReservations: () => void
  rooms: Room[]
  roomTypes: RoomType[]
  includeInactiveRooms: boolean
  roomLoading: boolean
  roomError: string
  refreshRoomInventory: (includeInactive?: boolean) => void
}

const AdminReservationsContext = createContext<AdminReservationsContextValue | null>(null)

export function AdminReservationsProvider({ children }: { children: ReactNode }) {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [reservationsLoading, setReservationsLoading] = useState(true)
  const [reservationsError, setReservationsError] = useState('')
  const [reservationReloadKey, setReservationReloadKey] = useState(0)
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [roomLoading, setRoomLoading] = useState(true)
  const [roomError, setRoomError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [includeInactiveRooms, setIncludeInactiveRooms] = useState(false)

  useEffect(() => {
    let cancelled = false
    const hotelId = sessionStorage.getItem('selectedHotelId') ?? ''
    setReservationsLoading(true)
    setReservationsError('')

    if (!hotelId) {
      setReservations([])
      setReservationsLoading(false)
      setReservationsError('Select a hotel to load its reservations.')
      return () => { cancelled = true }
    }

    void fetchAllReservations(hotelId)
      .then((result) => {
        if (!cancelled) setReservations(result.reservations)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setReservations([])
          setReservationsError(error instanceof Error ? error.message : 'Could not load reservations.')
        }
      })
      .finally(() => { if (!cancelled) setReservationsLoading(false) })

    return () => { cancelled = true }
  }, [reservationReloadKey])

  useEffect(() => {
    let cancelled = false
    const hotelId = sessionStorage.getItem('selectedHotelId') ?? ''
    setRoomLoading(true)
    setRoomError('')

    if (!hotelId) {
      setRoomLoading(false)
      setRoomError('Select a hotel to load its room inventory.')
      return () => { cancelled = true }
    }

    void fetchRoomInventory(hotelId, includeInactiveRooms)
      .then((inventory) => {
        if (cancelled) return
        setRoomTypes(inventory.roomTypes)
        setRooms(inventory.rooms)
      })
      .catch((error: unknown) => {
        if (!cancelled) setRoomError(error instanceof Error ? error.message : 'Could not load hotel room inventory.')
      })
      .finally(() => { if (!cancelled) setRoomLoading(false) })

    return () => { cancelled = true }
  }, [includeInactiveRooms, reloadKey])

  function refreshRoomInventory(includeInactive = includeInactiveRooms) {
    setIncludeInactiveRooms(includeInactive)
    setReloadKey((current) => current + 1)
  }

  const refreshReservations = useCallback(() => {
    setReservationsLoading(true)
    setReservationsError('')
    setReservationReloadKey((current) => current + 1)
  }, [])

  return (
    <AdminReservationsContext.Provider value={{
      reservations,
      setReservations,
      reservationsLoading,
      reservationsError,
      refreshReservations,
      rooms,
      roomTypes,
      includeInactiveRooms,
      roomLoading,
      roomError,
      refreshRoomInventory,
    }}>
      {children}
    </AdminReservationsContext.Provider>
  )
}

export function useAdminReservations() {
  const context = useContext(AdminReservationsContext)
  if (!context) {
    throw new Error('useAdminReservations must be used within AdminReservationsProvider')
  }
  return context
}
