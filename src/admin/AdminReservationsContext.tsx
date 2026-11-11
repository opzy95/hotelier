import { createContext, useContext, useEffect, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { fetchRoomInventory } from './adminRoomsApi'
import type { Room, RoomType } from './adminRoomsData'
import { initialReservations } from './adminReservationsData'
import type { Reservation } from './adminReservationsData'

type AdminReservationsContextValue = {
  reservations: Reservation[]
  setReservations: Dispatch<SetStateAction<Reservation[]>>
  rooms: Room[]
  roomTypes: RoomType[]
  includeInactiveRooms: boolean
  roomLoading: boolean
  roomError: string
  refreshRoomInventory: (includeInactive?: boolean) => void
}

const AdminReservationsContext = createContext<AdminReservationsContextValue | null>(null)

export function AdminReservationsProvider({ children }: { children: ReactNode }) {
  const [reservations, setReservations] = useState(initialReservations)
  const [rooms, setRooms] = useState<Room[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [roomLoading, setRoomLoading] = useState(true)
  const [roomError, setRoomError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [includeInactiveRooms, setIncludeInactiveRooms] = useState(false)

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

  return (
    <AdminReservationsContext.Provider value={{ reservations, setReservations, rooms, roomTypes, includeInactiveRooms, roomLoading, roomError, refreshRoomInventory }}>
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
