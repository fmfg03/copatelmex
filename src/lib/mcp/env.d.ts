// Ambient types for MCP tool handlers that execute in Deno with Node compat.
// The `process.env` reads happen only at runtime inside the emitted edge function.
declare const process: { env: Record<string, string | undefined> };
