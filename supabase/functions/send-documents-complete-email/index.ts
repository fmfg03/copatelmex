import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { teamName, categoryName, userEmail, userName, playerCount, registrationId } = await req.json();
    if (!userEmail || !teamName || !categoryName) throw new Error("Missing required fields");

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const emailHtml = `<!DOCTYPE html><html><body style="font-family:sans-serif;margin:0;padding:0;background:#f5f5f5;">
      <div style="max-width:600px;margin:0 auto;background:#fff;">
        <div style="background:linear-gradient(135deg,#0a3d2a,#1a6b4a);padding:40px 20px;text-align:center;">
          <h1 style="color:#ffd700;margin:0;">⚽ Copa Telmex Telcel 2026</h1>
        </div>
        <div style="text-align:center;padding:30px 20px;">
          <div style="display:inline-block;background:#22c55e;color:#fff;padding:15px 30px;border-radius:50px;font-size:18px;font-weight:bold;">✅ ¡Documentación Completa!</div>
        </div>
        <div style="padding:20px 40px;">
          <p>Hola <strong>${userName || 'Entrenador'}</strong>,</p>
          <p>La documentación de tu equipo está completa y lista para revisión.</p>
          <div style="background:#f8fafc;border-left:4px solid #0a3d2a;padding:20px;margin:25px 0;border-radius:0 8px 8px 0;">
            <h3 style="margin:0 0 15px;color:#0a3d2a;">Detalles del Equipo</h3>
            <p><strong>Equipo:</strong> ${teamName}</p>
            <p><strong>Categoría:</strong> ${categoryName}</p>
            <p><strong>Jugadores:</strong> ${playerCount} registrados</p>
          </div>
          <div style="background:#fef3c7;border-radius:8px;padding:20px;margin:25px 0;">
            <h4 style="margin:0 0 10px;color:#92400e;">📋 Próximos pasos:</h4>
            <ol style="color:#78350f;line-height:1.8;">
              <li>Nuestro equipo revisará la documentación en las próximas 48-72 horas.</li>
              <li>Recibirás confirmación cuando sean verificados.</li>
              <li>Si hay algún problema, te contactaremos.</li>
            </ol>
          </div>
          <p>¡Gracias por ser parte de la Copa Telmex Telcel 2026!<br><strong>El Equipo Organizador</strong></p>
        </div>
        <div style="background:#0a3d2a;padding:25px;text-align:center;">
          <p style="color:#94a3b8;margin:0;font-size:12px;">© 2026 Copa Telmex Telcel</p>
        </div>
      </div></body></html>`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: "Copa Telmex Telcel <onboarding@resend.dev>", to: [userEmail], subject: `✅ Documentación completa - ${teamName} (${categoryName})`, html: emailHtml }),
    });

    const emailResult = await emailResponse.json();
    if (!emailResponse.ok) throw new Error(emailResult.message || "Failed to send email");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await supabase.from("registrations").update({ notes: "Documentación completa - En revisión" }).eq("id", registrationId);

    return new Response(JSON.stringify({ success: true, data: emailResult }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
