import { createContext, useContext, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { initialReservations } from './adminReservationsData'
import type { Reservation } from './adminReservationsData'

type AdminReservationsContextValue = {
  reservations: Reservation[]
  setReservations: Dispatch<SetStateAction<Reservation[]>>
}

const AdminReservationsContext = createContext<AdminReservationsContextValue | null>(null)

export function AdminReservationsProvider({ children }: { children: ReactNode }) {
  const [reservations, setReservations] = useState(initialReservations)

  return (
    <AdminReservationsContext.Provider value={{ reservations, setReservations }}>
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
