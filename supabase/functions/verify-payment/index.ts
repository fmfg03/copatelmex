import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation schema for verify-payment
const verifyPaymentSchema = z.object({
  sessionId: z.string()
    .min(20, 'Session ID muy corto')
    .max(200, 'Session ID muy largo')
    .regex(/^cs_/, 'Session ID debe empezar con cs_')
});

const logStep = (step: string) => {
  console.log(`[VERIFY-PAYMENT] ${step}`);
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

    // Get and validate request body
    const body = await req.json();
    const validation = verifyPaymentSchema.safeParse(body);
    
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

    const { sessionId } = validation.data;

    logStep("Verifying payment session");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", { 
      apiVersion: "2025-08-27.basil" 
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    logStep("Payment session retrieved successfully");

    const isPaid = session.payment_status === "paid";

    return new Response(JSON.stringify({ 
      paid: isPaid,
      amount: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email,
      payment_status: session.payment_status
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR - Verification failed");
    console.error("[VERIFY-PAYMENT] Error details:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
