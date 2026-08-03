import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Validation schema for checkout
const checkoutSchema = z.object({
  registrationIds: z.union([
    z.array(z.string().regex(UUID_REGEX, 'ID de registro inválido')).min(1, 'Se requiere al menos un registro').max(50, 'Máximo 50 registros'),
    z.string().max(2000, 'IDs muy largos')
  ])
});

const logStep = (step: string) => {
  console.log(`[CREATE-CHECKOUT] ${step}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated");

    // Get and validate request body
    const body = await req.json();
    const validation = checkoutSchema.safeParse(body);
    
    if (!validation.success) {
      const errors = validation.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
      logStep("Validation failed");
      return new Response(
        JSON.stringify({ 
          error: 'Datos de entrada inválidos',
          details: errors 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const registrationIds = Array.isArray(validation.data.registrationIds)
      ? validation.data.registrationIds
      : validation.data.registrationIds.split(",").map((id) => id.trim()).filter(Boolean);
    const uniqueRegistrationIds = [...new Set(registrationIds)];

    if (uniqueRegistrationIds.length !== registrationIds.length) {
      throw new Error("No se permiten registros duplicados");
    }

    if (uniqueRegistrationIds.length === 0 || uniqueRegistrationIds.length > 50) {
      throw new Error("Cantidad de registros inválida");
    }

    for (const registrationId of uniqueRegistrationIds) {
      if (!UUID_REGEX.test(registrationId)) {
        throw new Error("ID de registro inválido");
      }
    }

    const { data: config, error: configError } = await supabaseAdmin
      .from("tournament_config")
      .select("registration_fee, payment_enabled")
      .limit(1)
      .maybeSingle();

    if (configError) throw configError;
    if (!config?.payment_enabled) throw new Error("Los pagos no están habilitados");

    const registrationFee = Number(config.registration_fee);
    if (!Number.isFinite(registrationFee) || registrationFee <= 0) {
      throw new Error("Cuota de registro no configurada");
    }

    const { data: registrations, error: registrationsError } = await supabaseAdmin
      .from("registrations")
      .select("id, payment_status, teams!inner(id, user_id)")
      .in("id", uniqueRegistrationIds);

    if (registrationsError) throw registrationsError;
    if (!registrations || registrations.length !== uniqueRegistrationIds.length) {
      throw new Error("Uno o más registros no existen");
    }

    const unauthorizedRegistration = registrations.find((registration: any) => registration.teams?.user_id !== user.id);
    if (unauthorizedRegistration) {
      throw new Error("No puedes pagar registros de otro usuario");
    }

    const alreadyPaidRegistration = registrations.find((registration) => registration.payment_status === "paid");
    if (alreadyPaidRegistration) {
      throw new Error("Uno o más registros ya están pagados");
    }

    const numberOfTeams = registrations.length;
    const amount = registrationFee * numberOfTeams;
    const registrationIdsParam = uniqueRegistrationIds.join(",");

    logStep(`Processing payment for ${numberOfTeams} registrations, amount: $${amount}`);

    // Get user profile for additional information
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .single();

    logStep("User profile retrieved");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing customer found");
    } else {
      // Create new customer with full information
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || user.email,
        phone: profile?.phone,
        metadata: {
          user_id: user.id,
          tournament: "Copa Club América 2025"
        }
      });
      customerId = customer.id;
      logStep("New customer created");
    }

    // Create checkout session with comprehensive metadata
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: `Inscripción Copa Club América 2025 - ${numberOfTeams} equipo${numberOfTeams > 1 ? 's' : ''}`,
              description: `Registro de ${numberOfTeams} equipo${numberOfTeams > 1 ? 's' : ''} para el torneo`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/register?payment=success&session_id={CHECKOUT_SESSION_ID}&registration_ids=${registrationIdsParam}`,
      cancel_url: `${req.headers.get("origin")}/register?payment=cancelled`,
      billing_address_collection: "required",
      phone_number_collection: {
        enabled: true,
      },
      metadata: {
        user_id: user.id,
        user_email: user.email,
        tournament: "Copa Club América 2025",
        product_type: "tournament_registration",
        number_of_teams: numberOfTeams.toString(),
        registration_ids: registrationIdsParam
      },
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          tournament: "Copa Club América 2025",
          registration_ids: registrationIdsParam
        },
        description: `Inscripción Copa Club América 2025 - ${numberOfTeams} equipo${numberOfTeams > 1 ? 's' : ''}`,
        statement_descriptor: "CLUB AMERICA CUP",
      },
      locale: "es",
    });

    logStep("Checkout session created successfully");

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR - Operation failed");
    console.error("[CREATE-CHECKOUT] Error details:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
