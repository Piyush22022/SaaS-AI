import dotenv from 'dotenv'
import { neon } from '@neondatabase/serverless'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: new URL('../.env', import.meta.url) })

function isPlaceholder(value) {
  const text = String(value || '').trim().toLowerCase()
  return (
    !text ||
    text.startsWith('your_') ||
    text.startsWith('replace_with_') ||
    text.includes('placeholder')
  )
}

const supabaseUrl = process.env.SUPABASE_URL?.trim()
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const databaseUrl = process.env.DATABASE_URL?.trim()

const canUseSupabase = supabaseUrl && supabaseServiceRoleKey && !isPlaceholder(supabaseServiceRoleKey)
const canUseNeon = databaseUrl && !isPlaceholder(databaseUrl)

export const dbMode = canUseSupabase ? 'supabase' : canUseNeon ? 'neon' : 'none'

export const supabase = canUseSupabase
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null

export const sql = canUseNeon ? neon(databaseUrl) : null

if (dbMode === 'none') {
  throw new Error(
    'Set a real SUPABASE_SERVICE_ROLE_KEY or provide DATABASE_URL for local development.'
  )
}
