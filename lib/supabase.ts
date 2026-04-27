import { createClient } from '@supabase/supabase-js'

export type Business = {
  id: string
  created_at: string
  name: string
  slug: string
  business_type: string
  products: string | null
  delivery_info: string | null
  working_hours: string | null
  return_policy: string | null
  language: string
  whatsapp: string | null
  admin_token: string | null
}

// One row per (slug, date) — used for daily rate limiting
export type MessageLog = {
  id: string
  slug: string
  date: string          // YYYY-MM-DD
  message_count: number
}

export type OrderItem = {
  name: string
  quantity: number
  size?: string
  price: number
}

export type Order = {
  id: string
  created_at: string
  order_number: string
  slug: string
  items: OrderItem[]
  customer_name: string | null
  customer_phone: string | null
  customer_address: string | null
  subtotal: number | null
  delivery_charge: number | null
  total_amount: number | null
  special_notes: string | null
  status: string
}

type Database = {
  public: {
    Tables: {
      businesses: {
        Row: Business
        Insert: Omit<Business, 'id' | 'created_at'>
        Update: Partial<Omit<Business, 'id' | 'created_at'>>
      }
      message_logs: {
        Row: MessageLog
        Insert: Omit<MessageLog, 'id'>
        Update: Partial<Omit<MessageLog, 'id'>>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at'>
        Update: Partial<Omit<Order, 'id' | 'created_at'>>
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side only — never call from Client Components
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!
  return createClient<Database>(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
