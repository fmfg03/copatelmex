import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_recent_news",
  title: "List recent news",
  description:
    "Lists the most recent published news articles for the Copa Telmex Telcel tournament.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).optional().describe("Max articles to return (default 10)."),
    featured_only: z.boolean().optional().describe("If true, only featured articles."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit, featured_only }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("news")
      .select("id, title, content, image_url, source_url, source_name, is_featured, published_at")
      .order("published_at", { ascending: false })
      .limit(limit ?? 10);
    if (featured_only) query = query.eq("is_featured", true);
    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { news: data },
    };
  },
});
