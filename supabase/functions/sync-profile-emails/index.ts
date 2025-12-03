import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'

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
    const errorDetails: Array<{ userId: string; email: string; error: string }> = []

    for (const authUser of authUsers || []) {
      if (!authUser.email) {
        console.log(`Skipping user ${authUser.id} - no email`)
        continue
      }

      try {
        // Check if profile exists
        if (!existingProfileIds.has(authUser.id)) {
          // Create missing profile
          console.log(`Creating missing profile for ${authUser.email}`)
          
          const { error: insertError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: authUser.id,
              email: authUser.email,
              full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
              phone: authUser.user_metadata?.phone || '0000000000'
            })

          if (insertError) {
            console.error(`Error creating profile for ${authUser.email}:`, insertError)
            errors++
            errorDetails.push({
              userId: authUser.id,
              email: authUser.email,
              error: insertError.message
            })
          } else {
            created++
            console.log(`Profile created for ${authUser.email}`)
          }
        } else {
          // Update existing profile email
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ email: authUser.email })
            .eq('id', authUser.id)

          if (updateError) {
            console.error(`Error updating profile for ${authUser.email}:`, updateError)
            errors++
            errorDetails.push({
              userId: authUser.id,
              email: authUser.email,
              error: updateError.message
            })
          } else {
            updated++
          }
        }
      } catch (error) {
        console.error(`Exception processing user ${authUser.email}:`, error)
        errors++
        errorDetails.push({
          userId: authUser.id,
          email: authUser.email,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    const message = `Sincronización completada: ${created} perfiles creados, ${updated} perfiles actualizados${errors > 0 ? `, ${errors} errores` : ''}`
    console.log(message)

    return new Response(
      JSON.stringify({ 
        success: true, 
        created,
        updated,
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
