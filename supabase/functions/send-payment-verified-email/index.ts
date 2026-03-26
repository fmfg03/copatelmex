import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const sendgridApiKey = Deno.env.get("SENDGRID_API_KEY");
    if (!sendgridApiKey) throw new Error("SendGrid API key not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: userRole } = await supabase.from("user_roles").select("role").eq("user_id", user.id).single();
    if (!userRole || (userRole.role !== "admin" && userRole.role !== "moderator")) throw new Error("Insufficient permissions");

    const { registrationId } = await req.json();
    if (!registrationId) throw new Error("Registration ID required");

    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .select(`id, payment_reference, payment_amount, team_id, teams!inner (id, team_name, user_id), categories!inner (name)`)
      .eq("id", registrationId).single();
    if (regError || !registration) throw new Error("Registration not found");

    const teamData = registration.teams as unknown as { id: string; team_name: string; user_id: string };
    const { data: profile } = await supabase.from("profiles").select("email, full_name").eq("id", teamData.user_id).single();
    if (!profile?.email) throw new Error("User email not found");

    const { data: manager } = await supabase.from("team_managers").select("first_name, last_name").eq("team_id", teamData.id).eq("is_primary", true).single();
    const managerName = manager ? `${manager.first_name} ${manager.last_name}` : profile.full_name || "Usuario";
    const categoryData = registration.categories as unknown as { name: string };
    const paymentAmount = registration.payment_amount || 0;

    const htmlContent = `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:sans-serif;background:#f5f5f5;">
      <table style="width:100%;border-collapse:collapse;"><tr><td align="center" style="padding:40px 0;">
        <table style="width:100%;max-width:600px;background:#fff;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <tr><td style="padding:40px;text-align:center;background:linear-gradient(135deg,#0a3d2a,#1a6b4a);border-radius:12px 12px 0 0;">
            <h1 style="margin:0;color:#ffd700;">✓ ¡Pago Verificado!</h1>
            <p style="margin:10px 0 0;color:#fff;">Copa Telmex Telcel 2026</p>
          </td></tr>
          <tr><td style="padding:40px;">
            <p>Hola <strong>${managerName}</strong>,</p>
            <p>Tu pago ha sido verificado exitosamente. Ya puedes registrar jugadores.</p>
            <table style="width:100%;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin:20px 0;">
              <tr><td style="padding:20px;">
                <p><strong>Equipo:</strong> ${teamData.team_name}</p>
                <p><strong>Categoría:</strong> ${categoryData.name}</p>
                <p><strong>Referencia:</strong> ${registration.payment_reference || 'N/A'}</p>
                <p style="color:#16a34a;font-size:18px;font-weight:bold;">Monto: $${paymentAmount.toLocaleString("es-MX")} MXN</p>
              </td></tr>
            </table>
            <div style="text-align:center;padding:20px 0;">
              <a href="https://copatelmex.lovable.app/my-teams" style="padding:16px 32px;background:linear-gradient(135deg,#ffd700,#ffa500);color:#0a3d2a;text-decoration:none;font-weight:bold;border-radius:8px;">Registrar Jugadores</a>
            </div>
          </td></tr>
          <tr><td style="padding:20px 40px;background:#f9fafb;border-radius:0 0 12px 12px;text-align:center;">
            <p style="color:#9ca3af;font-size:12px;">© 2026 Copa Telmex Telcel</p>
          </td></tr>
        </table>
      </td></tr></table></body></html>`;

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${sendgridApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: profile.email, name: managerName }] }],
        from: { email: "noreply@copatelmex.com", name: "Copa Telmex Telcel" },
        subject: `✓ Pago Verificado - ${teamData.team_name} | Copa Telmex Telcel 2026`,
        content: [{ type: "text/html", value: htmlContent }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`SendGrid error: ${response.status} - ${errorBody}`);
    }

    try { await supabase.from("email_send_log").insert({ sent_by: user.id, recipient_count: 1, subject: `Pago Verificado - ${teamData.team_name}`, status: "sent" }) } catch {}

    return new Response(JSON.stringify({ success: true, message: `Email sent to ${profile.email}` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});
