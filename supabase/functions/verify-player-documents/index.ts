import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: roleData } = await supabaseAdmin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!roleData) return new Response(JSON.stringify({ error: 'Se requiere rol de administrador.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { player_id, verified, notes } = await req.json();
    if (!player_id) return new Response(JSON.stringify({ error: 'player_id es requerido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (typeof verified !== 'boolean') return new Response(JSON.stringify({ error: 'verified debe ser un booleano' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: currentPlayer, error: fetchError } = await supabaseAdmin.from('players')
      .select('id, first_name, last_name, documents_verified, verification_notes, registration_id')
      .eq('id', player_id).maybeSingle();
    if (fetchError || !currentPlayer) return new Response(JSON.stringify({ error: 'Jugador no encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const updateData: Record<string, unknown> = { documents_verified: verified };
    if (notes !== undefined) updateData.verification_notes = notes;

    const { data: updatedPlayer, error: updateError } = await supabaseAdmin.from('players').update(updateData).eq('id', player_id).select().single();
    if (updateError) return new Response(JSON.stringify({ error: 'Error al actualizar el jugador' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    await supabaseAdmin.from('admin_audit_log').insert({
      user_id: user.id, user_email: user.email,
      action: verified ? 'VERIFY_PLAYER_DOCUMENTS' : 'REJECT_PLAYER_DOCUMENTS',
      table_name: 'players', record_id: player_id,
      old_values: { documents_verified: currentPlayer.documents_verified, verification_notes: currentPlayer.verification_notes },
      new_values: { documents_verified: verified, verification_notes: notes || null },
    });

    return new Response(JSON.stringify({ success: true, message: verified ? 'Documentos verificados' : 'Documentos rechazados', player: updatedPlayer }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in verify-player-documents:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
