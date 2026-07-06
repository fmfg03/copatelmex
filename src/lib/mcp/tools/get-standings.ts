import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_standings",
  title: "Get category standings",
  description:
    "Returns the standings table (played/won/drawn/lost/goals/points) for a given category.",
  inputSchema: {
    category_id: z.string().uuid().describe("Category UUID (see list_categories)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category_id }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    );
    const { data, error } = await supabase
      .from("team_standings")
      .select("team_id, played, won, drawn, lost, goals_for, goals_against, goal_difference, points")
      .eq("category_id", category_id)
      .order("points", { ascending: false });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { standings: data },
    };
  },
});
