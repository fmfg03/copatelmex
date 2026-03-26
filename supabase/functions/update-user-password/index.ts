import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt)
    if (userError || !user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: userRole } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (!userRole || userRole.role !== 'admin') return new Response(JSON.stringify({ error: 'Se requieren permisos de administrador' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { userId, newPassword } = await req.json()
    if (!userId || !newPassword) return new Response(JSON.stringify({ error: 'Se requiere userId y newPassword' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: newPassword })
    if (updateError) return new Response(JSON.stringify({ error: 'Error al actualizar contraseña' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    return new Response(JSON.stringify({ success: true, message: 'Contraseña actualizada' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch {
    return new Response(JSON.stringify({ error: 'Error desconocido' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
