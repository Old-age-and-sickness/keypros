'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type AssetType = 'COMMERCIAL' | 'LAND' | 'APARTMENT' | 'OFFICETEL'
export type RegisterPurpose = 'CO_OWNERSHIP' | 'SETTLEMENT'
export type SettlementCycle = 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL'
export type VerifyStatus = 'IDLE' | 'UPLOADING' | 'VERIFIED' | 'FAILED'

export type Owner = {
  name: string
  contact: string
  share_ratio: string
  is_representative: boolean
}

export type RegisterFormData = {
  // Step 1
  asset_type: AssetType
  purpose: RegisterPurpose
  // Step 2
  registry_file: File | null
  registry_address: string
  registry_owner: string
  verify_status: VerifyStatus
  // Step 3
  asset_name: string
  address: string
  total_area_sqm: string
  floors_above: string
  floors_below: string
  current_status: string
  settlement_cycle: SettlementCycle
  acquisition_price: string
  acquisition_date: string
  // Step 4
  owners: Owner[]
  // Step 5
  agreed: boolean
}

const initialForm: RegisterFormData = {
  asset_type: 'COMMERCIAL',
  purpose: 'CO_OWNERSHIP',
  registry_file: null,
  registry_address: '',
  registry_owner: '',
  verify_status: 'IDLE',
  asset_name: '',
  address: '',
  total_area_sqm: '',
  floors_above: '',
  floors_below: '',
  current_status: '',
  settlement_cycle: 'MONTHLY',
  acquisition_price: '',
  acquisition_date: '',
  owners: [{ name: '', contact: '', share_ratio: '100', is_representative: true }],
  agreed: false,
}

type RegisterContextValue = {
  form: RegisterFormData
  setForm: React.Dispatch<React.SetStateAction<RegisterFormData>>
  resetForm: () => void
}

const RegisterContext = createContext<RegisterContextValue | null>(null)

export function RegisterProvider({ children }: { children: ReactNode }) {
  const [form, setForm] = useState<RegisterFormData>(initialForm)
  const resetForm = () => setForm(initialForm)
  return (
    <RegisterContext.Provider value={{ form, setForm, resetForm }}>
      {children}
    </RegisterContext.Provider>
  )
}

export function useRegister() {
  const ctx = useContext(RegisterContext)
  if (!ctx) throw new Error('useRegister must be used within RegisterProvider')
  return ctx
}
