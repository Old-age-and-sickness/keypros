export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          name: string
          phone: string | null
          platform_id: string | null
          role: 'ADMIN' | 'MANAGER' | 'DELEGATOR' | 'INVESTOR' | 'GUEST'
          client_type: 'MANAGER' | 'DELEGATOR' | 'INVESTOR' | null
          perm_data_access: boolean
          perm_vote: boolean
          perm_data_edit: boolean
          perm_delegate_vote: boolean
          joined_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          name: string
          phone?: string | null
          platform_id?: string | null
          role?: string
          client_type?: string | null
          perm_data_access?: boolean
          perm_vote?: boolean
          perm_data_edit?: boolean
          perm_delegate_vote?: boolean
          joined_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string | null
          name?: string
          phone?: string | null
          platform_id?: string | null
          role?: string
          client_type?: string | null
          perm_data_access?: boolean
          perm_vote?: boolean
          perm_data_edit?: boolean
          perm_delegate_vote?: boolean
          updated_at?: string
        }
      }
      permission_requests: {
        Row: {
          id: string
          user_id: string
          client_type: 'MANAGER' | 'DELEGATOR' | 'INVESTOR'
          req_delegate_vote: boolean
          status: 'PENDING' | 'APPROVED' | 'REJECTED'
          reject_reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          client_type: string
          req_delegate_vote?: boolean
          status?: string
          reject_reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          status?: string
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type PermissionRequest = Database['public']['Tables']['permission_requests']['Row']

export type PropertyRegistrationRequest = {
  id: string
  requested_by: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reject_reason: string | null
  name: string
  address: string
  asset_type: string
  acquisition_price: number
  acquisition_date: string
  total_area_sqm: number | null
  floors_above: number | null
  floors_below: number | null
  settlement_cycle: string
  purpose: string | null
  rental_units: object[]
  requested_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}
