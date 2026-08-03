import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCategoriesTool from "./tools/list-categories";
import listRecentNewsTool from "./tools/list-recent-news";
import listTeamsTool from "./tools/list-teams";
import listMatchesTool from "./tools/list-matches";
import getStandingsTool from "./tools/get-standings";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "copa-telmex-telcel-mcp",
  title: "Copa Telmex Telcel MCP",
  version: "0.1.0",
  instructions:
    "Read-only tools for the Copa Telmex Telcel amateur football tournament. Use list_categories to discover category IDs, list_teams and list_matches to explore participants and fixtures, get_standings for a category's table, and list_recent_news for tournament news.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listCategoriesTool,
    listRecentNewsTool,
    listTeamsTool,
    listMatchesTool,
    getStandingsTool,
  ],
});
