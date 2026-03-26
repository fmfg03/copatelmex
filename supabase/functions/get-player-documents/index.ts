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

    const { player_id } = await req.json();
    if (!player_id) return new Response(JSON.stringify({ error: 'player_id es requerido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: player, error: playerError } = await supabaseAdmin.from('players')
      .select('id, first_name, last_name, photo_url, birth_certificate_url, responsiva_url, curp')
      .eq('id', player_id).maybeSingle();
    if (playerError || !player) return new Response(JSON.stringify({ error: 'Jugador no encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const documents: Record<string, string | null> = { photo: null, birth_certificate: null, responsiva: null };

    if (player.photo_url) {
      const { data } = await supabaseAdmin.storage.from('registration-documents').createSignedUrl(player.photo_url, 3600);
      if (data) documents.photo = data.signedUrl;
    }
    if (player.birth_certificate_url) {
      const { data } = await supabaseAdmin.storage.from('registration-documents').createSignedUrl(player.birth_certificate_url, 3600);
      if (data) documents.birth_certificate = data.signedUrl;
    }
    if (player.responsiva_url) {
      const { data } = await supabaseAdmin.storage.from('registration-documents').createSignedUrl(player.responsiva_url, 3600);
      if (data) documents.responsiva = data.signedUrl;
    }

    await supabaseAdmin.from('admin_audit_log').insert({
      user_id: user.id, user_email: user.email, action: 'VIEW_PLAYER_DOCUMENTS',
      table_name: 'players', record_id: player_id,
      new_values: { player_name: `${player.first_name} ${player.last_name}`, documents_accessed: Object.keys(documents).filter(k => documents[k] !== null) },
    });

    return new Response(JSON.stringify({ success: true, player: { id: player.id, name: `${player.first_name} ${player.last_name}`, curp: player.curp }, documents }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error in get-player-documents:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
