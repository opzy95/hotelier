import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

export type HotelSessionIdentity = {
  hotelName: string
  managerName: string
  managerRole: string
}

const HotelSessionContext = createContext<HotelSessionIdentity | null>(null)

export function HotelSessionProvider({ value, children }: { value: HotelSessionIdentity; children: ReactNode }) {
  return <HotelSessionContext.Provider value={value}>{children}</HotelSessionContext.Provider>
}

export function useHotelSession() {
  const identity = useContext(HotelSessionContext)
  if (!identity) throw new Error('useHotelSession must be used within HotelSessionProvider.')
  return identity
}