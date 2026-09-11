import { User as SupabaseUser } from '@supabase/supabase-js'
import { AuthResult } from '@/types/results'
import { User } from '@/types/user'
import { SubscriptionType, UserType, ContactMethod, PlatformRole } from '@/types/enums'
import { FREE_PLAN_LISTINGS_LIMIT } from '@/constants'
import { getSupabaseBrowser } from '@/lib/supabase/browser'
import { translateError as sharedTranslateError } from '@/lib/userMessages'
import { propertyService } from '@/services/propertyService'
import type { Database } from '@/types/database.generated'

/** Row in public.profiles — schema shared with the mobile app. */
interface ProfileRow {
  id: string
  email: string
  name: string
  avatar_url: string | null
  user_type: string
  platform_role: string
  phone: string | null
  whatsapp: string | null
  company_name: string | null
  company_logo: string | null
  license_number: string | null
  subscription_type: string
  subscription_started_at: string | null
  subscription_expires_at: string | null
  trial_started_at: string | null
  trial_expires_at: string | null
  total_listings: number | null
  total_views: number | null
  rating: number | null
  review_count: number | null
  preferred_language: string | null
  preferred_currency: string | null
  is_email_verified: boolean | null
  is_phone_verified: boolean | null
  is_identity_verified: boolean | null
  created_at: string
  updated_at: string
}

/** Maps common Supabase auth errors to user-facing Spanish messages. */
function translateError(message: string): string {
  // Reglas compartidas en lib/userMessages.
  return sharedTranslateError(message)
}

/**
 * Loads the profile row, creating it if missing (no DB trigger guaranteed).
 * Los grants por columna (security-004) no exponen los datos sensibles del
 * propio perfil al cliente; se leen completos vía RPC get_own_profile
 * (SECURITY DEFINER, id = auth.uid()).
 */
async function loadOrCreateProfile(authUser: SupabaseUser): Promise<ProfileRow | null> {
  const supabase = getSupabaseBrowser()
  const { data: existing } = await supabase.rpc('get_own_profile').maybeSingle<ProfileRow>()
  if (existing) return existing

  const fallbackName =
    (authUser.user_metadata?.name as string) || authUser.email?.split('@')[0] || 'Usuario'
  const { error: insertError } = await supabase.from('profiles').insert({
    id: authUser.id,
    email: authUser.email ?? '',
    name: fallbackName,
    user_type: ((authUser.user_metadata?.user_type as string) ??
      'individual') as Database['public']['Enums']['user_type'],
  })
  if (insertError) return null
  // El insert solo devuelve columnas públicas; relee el perfil completo vía RPC.
  const { data: refreshed } = await supabase.rpc('get_own_profile').maybeSingle<ProfileRow>()
  return refreshed ?? null
}

/** Builds the app User from the Supabase session user + profile + listing counts. */
async function buildUser(authUser: SupabaseUser): Promise<User> {
  const [profile, activeListings, membership] = await Promise.all([
    loadOrCreateProfile(authUser),
    // Solo display (remainingListings); la cuota real se impone en /api/publish.
    propertyService.countActiveListings(authUser.id).catch(() => 0),
    // Active org membership (multi-tenant): first org the user belongs to.
    getSupabaseBrowser()
      .from('organization_members')
      .select('org_id, role')
      .eq('user_id', authUser.id)
      .eq('status', 'active')
      .maybeSingle()
      .then(
        ({ data }) => data ?? null,
        () => null
      ),
  ])

  const name =
    profile?.name ||
    (authUser.user_metadata?.name as string) ||
    authUser.email?.split('@')[0] ||
    'Usuario'
  // The mobile schema grants a 10-day trial on signup; an active trial counts as premium.
  const trialActive = !!profile?.trial_expires_at && new Date(profile.trial_expires_at) > new Date()
  const isPremium = profile?.subscription_type === 'premium' || trialActive
  const plan = isPremium ? SubscriptionType.PREMIUM : SubscriptionType.FREE

  return {
    id: authUser.id,
    email: profile?.email || authUser.email || '',
    name,
    avatar: profile?.avatar_url ?? undefined,
    userType: (profile?.user_type as UserType) ?? UserType.INDIVIDUAL,
    platformRole: (profile?.platform_role as PlatformRole) ?? PlatformRole.USER,
    organizationId: membership?.org_id ?? undefined,
    organizationRole: membership?.role as User['organizationRole'],
    companyName: profile?.company_name ?? undefined,
    companyLogo: profile?.company_logo ?? undefined,
    licenseNumber: profile?.license_number ?? undefined,
    subscription: {
      type: plan,
      startDate:
        profile?.subscription_started_at ?? profile?.trial_started_at ?? authUser.created_at,
      expiresAt:
        profile?.subscription_expires_at ??
        (trialActive ? (profile?.trial_expires_at ?? undefined) : undefined),
      isActive: true,
      features: isPremium ? ['unlimited_listings'] : ['basic_listings'],
      listingsLimit: isPremium ? undefined : FREE_PLAN_LISTINGS_LIMIT,
      remainingListings: isPremium
        ? undefined
        : Math.max(0, FREE_PLAN_LISTINGS_LIMIT - activeListings),
    },
    preferences: {
      language: (profile?.preferred_language as 'es' | 'en') ?? 'es',
      currency: (profile?.preferred_currency as 'CLP' | 'USD') ?? 'CLP',
      notifications: {
        email: true,
        push: false,
        sms: false,
        newProperties: false,
        priceChanges: false,
        messages: true,
      },
      searchRadius: 5,
      mapType: 'standard',
    },
    stats: {
      totalListings: profile?.total_listings ?? activeListings,
      activeListings,
      soldProperties: 0,
      rentedProperties: 0,
      totalViews: profile?.total_views ?? 0,
      totalContacts: 0,
      rating: profile?.rating ?? undefined,
      reviewCount: profile?.review_count ?? undefined,
    },
    properties: [],
    savedProperties: [],
    recentlyViewed: [],
    contactInfo: {
      id: authUser.id,
      name,
      email: profile?.email || authUser.email,
      phone: profile?.phone ?? undefined,
      whatsapp: profile?.whatsapp ?? undefined,
      preferredMethod: ContactMethod.EMAIL,
      isVerified: profile?.is_email_verified ?? !!authUser.email_confirmed_at,
    },
    createdAt: profile?.created_at ?? authUser.created_at,
    updatedAt: profile?.updated_at ?? authUser.created_at,
    isEmailVerified: profile?.is_email_verified ?? !!authUser.email_confirmed_at,
    isPhoneVerified: profile?.is_phone_verified ?? false,
    isIdentityVerified: profile?.is_identity_verified ?? false,
  }
}

export const authService = {
  buildUser,

  async login(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await getSupabaseBrowser().auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: translateError(error.message) }
    const user = await buildUser(data.user)
    return { success: true, user, token: data.session.access_token }
  },

  async register(data: {
    name: string
    email: string
    password: string
    userType?: UserType
  }): Promise<AuthResult> {
    if (!data.name || data.name.length < 2)
      return { success: false, error: 'Nombre demasiado corto (mínimo 2 caracteres)' }
    const { data: res, error } = await getSupabaseBrowser().auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name, user_type: data.userType ?? UserType.INDIVIDUAL } },
    })
    if (error) return { success: false, error: translateError(error.message) }

    // With email confirmation enabled there is no session yet.
    if (!res.session || !res.user) {
      return {
        success: true,
        info: 'Te enviamos un correo de confirmación. Revisa tu bandeja para activar la cuenta.',
      }
    }
    const user = await buildUser(res.user)
    return { success: true, user, token: res.session.access_token }
  },

  async loginWithSocial(provider: 'google' | 'apple' | 'facebook'): Promise<AuthResult> {
    const { error } = await getSupabaseBrowser().auth.signInWithOAuth({
      provider,
      options: { redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined },
    })
    if (error)
      return {
        success: false,
        error: `No se pudo iniciar con ${provider}: ${translateError(error.message)}`,
      }
    // The browser redirects to the provider; the session arrives on return.
    return { success: true, info: 'Redirigiendo…' }
  },

  async logout(): Promise<void> {
    await getSupabaseBrowser().auth.signOut()
  },

  async getCurrentUser(): Promise<User | null> {
    const { data } = await getSupabaseBrowser().auth.getSession()
    if (!data.session?.user) return null
    return buildUser(data.session.user)
  },

  async updateProfile(userId: string, updates: Partial<User>): Promise<AuthResult> {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (updates.name !== undefined) row.name = updates.name
    if (updates.avatar !== undefined) row.avatar_url = updates.avatar
    if (updates.contactInfo?.phone !== undefined) row.phone = updates.contactInfo.phone
    if (updates.contactInfo?.whatsapp !== undefined) row.whatsapp = updates.contactInfo.whatsapp

    const { error } = await getSupabaseBrowser()
      .from('profiles')
      .update(row as Database['public']['Tables']['profiles']['Update'])
      .eq('id', userId)
    if (error) return { success: false, error: translateError(error.message) }

    const user = await authService.getCurrentUser()
    return user ? { success: true, user } : { success: false, error: 'No autenticado' }
  },
}
