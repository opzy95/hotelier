import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { fetchDepartments, fetchStaff } from './adminStaffApi'
import type { Department, StaffMember } from './adminStaffData'

type AdminStaffContextValue = {
  staff: StaffMember[]
  setStaff: Dispatch<SetStateAction<StaffMember[]>>
  departments: Department[]
  setDepartments: Dispatch<SetStateAction<Department[]>>
  loading: boolean
  error: string
  refresh: () => void
}

const AdminStaffContext = createContext<AdminStaffContextValue | null>(null)

export function AdminStaffProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const hotelId = sessionStorage.getItem('selectedHotelId') ?? ''
    setLoading(true)
    setError('')

    if (!hotelId) {
      setStaff([])
      setDepartments([])
      setLoading(false)
      setError('Select a hotel to load its staff and departments.')
      return () => { cancelled = true }
    }

    void Promise.all([fetchDepartments(hotelId), fetchStaff(hotelId)])
      .then(([nextDepartments, nextStaff]) => {
        if (cancelled) return
        setDepartments(nextDepartments)
        setStaff(nextStaff)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setStaff([])
          setDepartments([])
          setError(loadError instanceof Error ? loadError.message : 'Could not load hotel staff and departments.')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [reloadKey])

  const refresh = useCallback(() => {
    setLoading(true)
    setError('')
    setReloadKey((current) => current + 1)
  }, [])

  return (
    <AdminStaffContext.Provider value={{ staff, setStaff, departments, setDepartments, loading, error, refresh }}>
      {children}
    </AdminStaffContext.Provider>
  )
}

export function useAdminStaff() {
  const context = useContext(AdminStaffContext)
  if (!context) throw new Error('useAdminStaff must be used within AdminStaffProvider')
  return context
}