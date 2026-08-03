import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_standings",
  title: "Get category standings",
  description:
    "Returns the standings table (played/won/drawn/lost/goals/points) for a given category.",
  inputSchema: {
    category_id: z.string().uuid().describe("Category UUID (see list_categories)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ category_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
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
