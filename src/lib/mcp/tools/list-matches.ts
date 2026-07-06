import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_matches",
  title: "List tournament matches",
  description:
    "Lists tournament matches with dates, scores, phase and status. Filter by category or status.",
  inputSchema: {
    category_id: z.string().uuid().optional(),
    status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category_id, status, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    );
    let query = supabase
      .from("matches")
      .select("id, category_id, home_team_id, away_team_id, match_date, field_number, phase, home_score, away_score, status")
      .order("match_date", { ascending: true })
      .limit(limit ?? 50);
    if (category_id) query = query.eq("category_id", category_id);
    if (status) query = query.eq("status", status);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { matches: data },
    };
  },
});
