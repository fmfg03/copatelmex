import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated");

    // Get request body
    const body = await req.json();
    const { amount, numberOfTeams, registrationIds } = body;
    
    logStep(`Processing payment for ${numberOfTeams} teams, amount: $${amount}`);

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
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/register?payment=success&session_id={CHECKOUT_SESSION_ID}&registration_ids=${registrationIds}`,
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
        registration_ids: registrationIds
      },
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          tournament: "Copa Club América 2025",
          registration_ids: registrationIds
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
