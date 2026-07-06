import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "list_teams",
  title: "List registered teams",
  description:
    "Lists teams participating in the tournament (public info: name, academy, state, country).",
  inputSchema: {
    state: z.string().optional().describe("Filter by Mexican state name."),
    search: z.string().optional().describe("Case-insensitive substring match on team name."),
    limit: z.number().int().min(1).max(200).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ state, search, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    );
    let query = supabase
      .from("teams_public")
      .select("id, team_name, academy_name, shield_url, state, country")
      .limit(limit ?? 50);
    if (state) query = query.eq("state", state);
    if (search) query = query.ilike("team_name", `%${search}%`);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { teams: data },
    };
  },
});
