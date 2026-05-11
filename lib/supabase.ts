import { createClient } from '@supabase/supabase-js'

// ─── Legacy types (businesses table — existing bots) ──────────────────────────
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

export type MessageLog = {
  id: string
  slug: string
  date: string
  message_count: number
}

export type OrderItem = {
  name: string
  quantity: number
  size?: string
  price: number
}

// ─── New schema types ─────────────────────────────────────────────────────────

export type UserRole = 'shop_owner' | 'super_admin'
export type ShopStatus = 'active' | 'suspended'

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  is_verified: boolean
  created_at: string
  updated_at: string
}

export type BotConfig = {
  business_type?: string
  products?: string
  delivery_info?: string
  working_hours?: string
  return_policy?: string
}

export type Shop = {
  id: string
  owner_id: string
  shop_name: string
  slug: string
  whatsapp_number: string | null
  description: string | null
  bot_language: string
  bot_config: BotConfig
  status: ShopStatus
  is_active: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export type ChatSession = {
  id: string
  shop_id: string
  session_id: string | null
  language_detected: string | null
  message_count: number
  started_at: string
  ended_at: string | null
}

export type Order = {
  id: string
  shop_id: string
  session_id: string | null
  items: OrderItem[]
  customer_whatsapp: string | null
  total_amount: number | null
  status: string
  created_at: string
}

export type AuditLog = {
  id: string
  actor_id: string | null
  action: string
  target_type: string | null
  target_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

// ─── Legacy Order type (businesses table) ────────────────────────────────────
export type LegacyOrder = {
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

// ─── Database type map ────────────────────────────────────────────────────────

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
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      shops: {
        Row: Shop
        Insert: Omit<Shop, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Shop, 'id' | 'created_at' | 'updated_at'>>
      }
      chat_sessions: {
        Row: ChatSession
        Insert: Omit<ChatSession, 'id'>
        Update: Partial<Omit<ChatSession, 'id'>>
      }
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: never
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
