import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData) {
      throw new Error('User is not an admin');
    }

    console.log('Starting player ID regeneration...');

    // Get all players
    const { data: players, error: playersError } = await supabaseClient
      .from('players')
      .select('id, first_name, last_name, paternal_surname, maternal_surname, unique_player_id');

    if (playersError) {
      throw playersError;
    }

    console.log(`Found ${players.length} players to process`);

    let updatedCount = 0;
    let errors = [];

    // Process each player
    for (const player of players) {
      try {
        let needsUpdate = false;
        const updates: any = {};

        // Split last_name if surnames are not set
        if (!player.paternal_surname || !player.maternal_surname) {
          const lastNameParts = player.last_name.trim().split(/\s+/);
          
          if (lastNameParts.length >= 2) {
            updates.paternal_surname = lastNameParts[0];
            updates.maternal_surname = lastNameParts[1];
          } else if (lastNameParts.length === 1) {
            updates.paternal_surname = lastNameParts[0];
            updates.maternal_surname = 'X';
          } else {
            updates.paternal_surname = 'X';
            updates.maternal_surname = 'X';
          }
          needsUpdate = true;
        }

        // Force regeneration by clearing unique_player_id
        if (player.unique_player_id || needsUpdate) {
          updates.unique_player_id = null;
          needsUpdate = true;
        }

        if (needsUpdate) {
          const { error: updateError } = await supabaseClient
            .from('players')
            .update(updates)
            .eq('id', player.id);

          if (updateError) {
            console.error(`Error updating player ${player.id}:`, updateError);
            errors.push({ playerId: player.id, error: updateError.message });
          } else {
            // Trigger another update to generate the ID
            const { error: triggerError } = await supabaseClient
              .from('players')
              .update({ 
                paternal_surname: updates.paternal_surname || player.paternal_surname,
                maternal_surname: updates.maternal_surname || player.maternal_surname
              })
              .eq('id', player.id);

            if (triggerError) {
              console.error(`Error triggering ID generation for player ${player.id}:`, triggerError);
              errors.push({ playerId: player.id, error: triggerError.message });
            } else {
              updatedCount++;
              console.log(`Successfully regenerated ID for player ${player.id}`);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing player ${player.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({ playerId: player.id, error: errorMessage });
      }
    }

    console.log(`Regeneration complete. Updated ${updatedCount} players.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `IDs regenerados exitosamente para ${updatedCount} jugadores`,
        updatedCount,
        totalProcessed: players.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in regenerate-player-ids function:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
