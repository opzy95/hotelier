import { createContext, useContext, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { initialDepartments, initialStaff } from './adminStaffData'
import type { Department, StaffMember } from './adminStaffData'

type AdminStaffContextValue = {
  staff: StaffMember[]
  setStaff: Dispatch<SetStateAction<StaffMember[]>>
  departments: Department[]
}

const AdminStaffContext = createContext<AdminStaffContextValue | null>(null)

export function AdminStaffProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState(initialStaff)

  return (
    <AdminStaffContext.Provider value={{ staff, setStaff, departments: initialDepartments }}>
      {children}
    </AdminStaffContext.Provider>
  )
}

export function useAdminStaff() {
  const context = useContext(AdminStaffContext)
  if (!context) throw new Error('useAdminStaff must be used within AdminStaffProvider')
  return context
}