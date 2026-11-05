import { createContext, useContext, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { initialRoomInventory } from './adminRoomsData'
import type { Room } from './adminRoomsData'
import { initialReservations } from './adminReservationsData'
import type { Reservation } from './adminReservationsData'

type AdminReservationsContextValue = {
  reservations: Reservation[]
  setReservations: Dispatch<SetStateAction<Reservation[]>>
  rooms: Room[]
  setRooms: Dispatch<SetStateAction<Room[]>>
}

const AdminReservationsContext = createContext<AdminReservationsContextValue | null>(null)

export function AdminReservationsProvider({ children }: { children: ReactNode }) {
  const [reservations, setReservations] = useState(initialReservations)
  const [rooms, setRooms] = useState(initialRoomInventory)

  return (
    <AdminReservationsContext.Provider value={{ reservations, setReservations, rooms, setRooms }}>
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
