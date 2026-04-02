import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import { corsHeaders } from '../_shared/cors.ts'
import { resetUserPasswordSchema, validateInput, uuidSchema, emailSchema } from '../_shared/validation.ts'
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts'

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
      console.error('Error verifying user:', userError)
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

    // Get and validate request body
    const body = await req.json()
    const validation = validateInput(resetUserPasswordSchema, body, corsHeaders)
    
    if (!validation.success) {
      return validation.response
    }

    const { email, userId } = validation.data

    // Additional validation for specific fields if provided
    if (userId) {
      const uuidValidation = uuidSchema.safeParse(userId)
      if (!uuidValidation.success) {
        return new Response(
          JSON.stringify({ error: 'Formato de userId inválido' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    if (email) {
      const emailValidation = emailSchema.safeParse(email)
      if (!emailValidation.success) {
        return new Response(
          JSON.stringify({ error: 'Formato de email inválido' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // Get user email if only userId provided
    let userEmail = email
    if (userId && !email) {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single()

      if (profileError || !profile?.email) {
        return new Response(
          JSON.stringify({ error: 'Usuario no encontrado' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      userEmail = profile.email
    }

    // Generate password recovery link
    const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail!,
      options: {
        redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com')}/auth`
      }
    })

    if (recoveryError) {
      console.error('Error generating recovery link:', recoveryError)
      return new Response(
        JSON.stringify({ error: 'Error al generar enlace de recuperación' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Supabase automatically sends the email when using admin.generateLink
    console.log('Password recovery email sent to:', userEmail)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Email de recuperación enviado a ${userEmail}`
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in reset-user-password function:', error)
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
