import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: registrations, error: regError } = await supabase
      .from("registrations")
      .select(`id, team_id, teams!inner (id, team_name, user_id, phone_number), categories!inner (name)`);
    if (regError) throw regError;

    const emailsSent: string[] = [];
    const errors: string[] = [];

    for (const reg of registrations || []) {
      const team = reg.teams as unknown as { id: string; team_name: string; user_id: string };
      const category = reg.categories as unknown as { name: string };
      if (!team || !category) continue;

      const { data: players } = await supabase.from("players")
        .select("id, first_name, last_name, photo_url, birth_certificate_url")
        .eq("registration_id", reg.id);
      if (!players?.length) continue;

      const missingPhotos = players.filter(p => !p.photo_url).length;
      const missingDocs = players.filter(p => !p.birth_certificate_url).length;
      if (missingPhotos === 0 && missingDocs === 0) continue;

      const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", team.user_id).single();
      if (!profile?.email) continue;

      const playersWithMissingPhotos = players.filter(p => !p.photo_url).map(p => `${p.first_name} ${p.last_name}`);
      const playersWithMissingDocs = players.filter(p => !p.birth_certificate_url).map(p => `${p.first_name} ${p.last_name}`);

      const emailHtml = `<!DOCTYPE html><html><body style="font-family:sans-serif;margin:0;padding:0;background:#f5f5f5;">
        <div style="max-width:600px;margin:0 auto;background:#fff;">
          <div style="background:linear-gradient(135deg,#0a3d2a,#1a6b4a);padding:40px 20px;text-align:center;">
            <h1 style="color:#ffd700;margin:0;">⚽ Copa Telmex Telcel 2026</h1>
            <p style="color:#fff;margin:10px 0 0;">Recordatorio de Documentación</p>
          </div>
          <div style="padding:20px 40px;">
            <p>Hola <strong>${profile.full_name || 'Entrenador'}</strong>,</p>
            <p>Te recordamos que aún tienes documentación pendiente para <strong>${team.team_name}</strong> (${category.name}).</p>
            <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:20px;margin:25px 0;border-radius:0 8px 8px 0;">
              <h3 style="margin:0 0 15px;color:#92400e;">Documentos Pendientes</h3>
              ${missingPhotos > 0 ? `<p><strong>📷 Fotos faltantes (${missingPhotos}):</strong> ${playersWithMissingPhotos.slice(0,5).join(', ')}${playersWithMissingPhotos.length > 5 ? ` y ${playersWithMissingPhotos.length - 5} más` : ''}</p>` : ''}
              ${missingDocs > 0 ? `<p><strong>📄 Actas/CURP faltantes (${missingDocs}):</strong> ${playersWithMissingDocs.slice(0,5).join(', ')}${playersWithMissingDocs.length > 5 ? ` y ${playersWithMissingDocs.length - 5} más` : ''}</p>` : ''}
            </div>
            <div style="text-align:center;margin:30px 0;">
              <a href="https://copatelmex.lovable.app/documents" style="background:#0a3d2a;color:#fff;padding:15px 30px;border-radius:8px;text-decoration:none;font-weight:bold;">Subir Documentos</a>
            </div>
          </div>
          <div style="background:#0a3d2a;padding:25px;text-align:center;">
            <p style="color:#94a3b8;margin:0;font-size:12px;">© 2026 Copa Telmex Telcel</p>
          </div>
        </div></body></html>`;

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
          body: JSON.stringify({ from: "Copa Telmex Telcel <onboarding@resend.dev>", to: [profile.email], subject: `⚠️ Documentación pendiente - ${team.team_name}`, html: emailHtml }),
        });
        if (emailResponse.ok) emailsSent.push(profile.email);
        else errors.push(`Error enviando a ${profile.email}`);
      } catch (e: unknown) { errors.push(`Error: ${(e as Error).message}`) }
    }

    return new Response(JSON.stringify({ success: true, emailsSent: emailsSent.length, errors: errors.length > 0 ? errors : undefined }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
