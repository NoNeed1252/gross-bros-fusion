import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/**
 * Supabase Client Instance
 * 
 * Safe singleton for both client-side and server-side usage.
 * Uses lazy initialization to prevent build crashes when env vars are missing.
 */
let supabaseClient: any = null

export const getSupabase = () => {
  if (supabaseClient) return supabaseClient
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Returning proxy to avoid crash.')
    return new Proxy({}, {
      get: () => { throw new Error('Supabase called before credentials were available.') }
    })
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

// Export the client directly for compatibility, but initialized lazily if possible
// Note: This still evaluates createClient if referenced directly at top level.
// We proxy it to ensure it only crashes if actually CALLED without config.
export const supabase = (function() {
  try {
    if (supabaseUrl && supabaseAnonKey) {
      return createClient(supabaseUrl, supabaseAnonKey)
    }
  } catch (e) {
    console.error('Failed to initialize Supabase client:', e)
  }
  
  return new Proxy({}, {
    get: (target, prop) => {
      if (prop === 'from' || prop === 'auth' || prop === 'storage') {
        throw new Error(`Supabase client error: ${prop} was accessed but NEXT_PUBLIC_SUPABASE_URL is missing. Check Vercel Production environment variables.`)
      }
      return (target as any)[prop]
    }
  })
})()

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'your-project-url')
}
