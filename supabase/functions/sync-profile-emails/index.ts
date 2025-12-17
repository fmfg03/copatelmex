import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

// Validation schemas for user metadata
const userMetadataSchema = z.object({
  full_name: z.string().max(200).optional(),
  phone: z.string().max(20).optional()
}).passthrough()

const emailSchema = z.string().email().max(255)

// Sanitize string to prevent any potential issues
function sanitizeString(str: string | undefined | null, maxLength: number = 200): string {
  if (!str) return ''
  return str.toString().trim().slice(0, maxLength)
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization')
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify the JWT token and get user ID
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if user has admin role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (roleError || !userRole || userRole.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Se requieren permisos de administrador' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get all auth users
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error listing users:', authError)
      return new Response(
        JSON.stringify({ error: 'Error obteniendo usuarios' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Total auth users found: ${authUsers?.length || 0}`)

    // Get all existing profiles
    const { data: existingProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return new Response(
        JSON.stringify({ error: 'Error obteniendo perfiles' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const existingProfileIds = new Set(existingProfiles?.map(p => p.id) || [])
    console.log(`Existing profiles: ${existingProfileIds.size}`)

    // Sync statistics
    let updated = 0
    let created = 0
    let errors = 0
    let skipped = 0
    const errorDetails: Array<{ userId: string; email: string; error: string }> = []

    for (const authUser of authUsers || []) {
      // Validate email
      const emailValidation = emailSchema.safeParse(authUser.email)
      if (!emailValidation.success) {
        console.log(`Skipping user ${authUser.id} - invalid or missing email`)
        skipped++
        continue
      }

      const validEmail = emailValidation.data

      // Validate and sanitize user metadata
      const metadataValidation = userMetadataSchema.safeParse(authUser.user_metadata || {})
      const metadata = metadataValidation.success ? metadataValidation.data : {}

      try {
        // Check if profile exists
        if (!existingProfileIds.has(authUser.id)) {
          // Create missing profile with sanitized data
          console.log(`Creating missing profile for ${validEmail}`)
          
          const fullName = sanitizeString(metadata.full_name, 200) || validEmail.split('@')[0].slice(0, 100)
          const phone = sanitizeString(metadata.phone, 20) || '0000000000'
          
          const { error: insertError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: authUser.id,
              email: validEmail,
              full_name: fullName,
              phone: phone
            })

          if (insertError) {
            console.error(`Error creating profile for ${validEmail}:`, insertError)
            errors++
            errorDetails.push({
              userId: authUser.id,
              email: validEmail,
              error: insertError.message
            })
          } else {
            created++
            console.log(`Profile created for ${validEmail}`)
          }
        } else {
          // Update existing profile email
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ email: validEmail })
            .eq('id', authUser.id)

          if (updateError) {
            console.error(`Error updating profile for ${validEmail}:`, updateError)
            errors++
            errorDetails.push({
              userId: authUser.id,
              email: validEmail,
              error: updateError.message
            })
          } else {
            updated++
          }
        }
      } catch (error) {
        console.error(`Exception processing user ${validEmail}:`, error)
        errors++
        errorDetails.push({
          userId: authUser.id,
          email: validEmail,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    const message = `Sincronización completada: ${created} perfiles creados, ${updated} perfiles actualizados, ${skipped} omitidos${errors > 0 ? `, ${errors} errores` : ''}`
    console.log(message)

    return new Response(
      JSON.stringify({ 
        success: true, 
        created,
        updated,
        skipped,
        errors,
        totalAuthUsers: authUsers?.length || 0,
        totalProfiles: existingProfileIds.size + created,
        errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
        message
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in sync-profile-emails function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
