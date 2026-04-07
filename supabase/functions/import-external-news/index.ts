import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const requestSchema = z.object({
  url: z.string().trim().url("URL inválida").max(2000, "URL muy larga"),
  source_name: z.string().trim().max(120, "La fuente es demasiado larga").optional(),
  action: z.enum(["preview", "publish"]).optional().default("preview"),
});

type ImportedArticle = {
  title: string;
  excerpt: string;
  image_url: string | null;
  source_name: string;
  source_url: string;
};

type RuntimeWithWaitUntil = typeof globalThis & {
  EdgeRuntime?: {
    waitUntil: (promise: Promise<unknown>) => void;
  };
};

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#039;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
};

function jsonResponse(status: number, payload: unknown) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function decodeHtmlEntities(value: string) {
  return value.replace(/&(amp|quot|#039|lt|gt|nbsp);/g, (entity) => HTML_ENTITIES[entity] ?? entity).trim();
}

function extractMetaContent(html: string, property: string) {
  const pattern1 = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, "i");
  const pattern2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, "i");
  const pattern3 = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, "i");
  const pattern4 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, "i");

  return pattern1.exec(html)?.[1] ?? pattern2.exec(html)?.[1] ?? pattern3.exec(html)?.[1] ?? pattern4.exec(html)?.[1] ?? null;
}

function normalizeUrl(value: string | null, baseUrl: string) {
  if (!value) return null;
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function extractArticleMeta(html: string, url: string) {
  const ogTitle = extractMetaContent(html, "og:title") ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? "";
  const imageUrl = normalizeUrl(extractMetaContent(html, "og:image"), url);
  const description = extractMetaContent(html, "og:description") ?? extractMetaContent(html, "description") ?? "";

  return {
    title: decodeHtmlEntities(ogTitle),
    description: decodeHtmlEntities(description),
    imageUrl,
  };
}

async function fetchImportedArticle(url: string, sourceName: string): Promise<ImportedArticle> {
  console.log("Fetching URL:", url);

  const pageResponse = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "es-MX,es;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  if (!pageResponse.ok) {
    throw new Error(`No se pudo acceder al sitio (${pageResponse.status})`);
  }

  const html = await pageResponse.text();
  const meta = extractArticleMeta(html, url);

  if (!meta.title) {
    throw new Error("No se pudo extraer el título del artículo");
  }

  // Only store a short excerpt (max 200 chars), not the full content
  const excerpt = meta.description
    ? (meta.description.length > 200 ? meta.description.substring(0, 200).trim() + "…" : meta.description)
    : "";

  return {
    title: meta.title,
    excerpt,
    image_url: meta.imageUrl,
    source_name: sourceName,
    source_url: url,
  };
}

async function processImportJob(params: {
  jobId: string;
  userId: string;
  url: string;
  sourceName: string;
  action: "preview" | "publish";
}) {
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  await serviceClient
    .from("news_import_jobs")
    .update({ status: "processing", error_message: null })
    .eq("id", params.jobId);

  try {
    const article = await fetchImportedArticle(params.url, params.sourceName);
    let newsId: string | null = null;

    if (params.action === "publish") {
      const { data: insertedNews, error: insertError } = await serviceClient
        .from("news")
        .insert({
          title: article.title,
          content: article.excerpt,
          image_url: article.image_url,
          source_url: article.source_url,
          source_name: article.source_name,
          is_featured: false,
          published_at: new Date().toISOString(),
          author_id: params.userId,
        })
        .select("id")
        .single();

      if (insertError) {
        throw new Error("Error al guardar la noticia");
      }

      newsId = insertedNews.id;
    }

    await serviceClient
      .from("news_import_jobs")
      .update({
        status: "completed",
        error_message: null,
        extracted_title: article.title,
        extracted_content: article.excerpt,
        extracted_image_url: article.image_url,
        result: { ...article, published: params.action === "publish", news_id: newsId },
        completed_at: new Date().toISOString(),
      })
      .eq("id", params.jobId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno al importar la nota";
    console.error("Import job failed:", message);

    await serviceClient
      .from("news_import_jobs")
      .update({
        status: "failed",
        error_message: message,
        completed_at: new Date().toISOString(),
      })
      .eq("id", params.jobId);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(500, { error: "Faltan credenciales del servidor" });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(401, { error: "No autorizado" });
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, { error: "No autorizado" });
    }

    const { data: isAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return jsonResponse(403, { error: "Se requiere rol de administrador" });
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return jsonResponse(400, { error: parsed.error.issues[0]?.message ?? "Datos inválidos" });
    }

    const sourceName = parsed.data.source_name || "Fuente externa";
    const { data: job, error: insertJobError } = await supabaseClient
      .from("news_import_jobs")
      .insert({
        user_id: user.id,
        url: parsed.data.url,
        source_name: sourceName,
        requested_action: parsed.data.action,
      })
      .select("id")
      .single();

    if (insertJobError || !job) {
      console.error("Queue insert error:", insertJobError);
      return jsonResponse(500, { error: "No se pudo iniciar la importación" });
    }

    const jobPromise = processImportJob({
      jobId: job.id,
      userId: user.id,
      url: parsed.data.url,
      sourceName,
      action: parsed.data.action,
    });

    const runtime = globalThis as RuntimeWithWaitUntil;
    if (runtime.EdgeRuntime?.waitUntil) {
      runtime.EdgeRuntime.waitUntil(jobPromise);
    } else {
      void jobPromise;
    }

    return jsonResponse(202, {
      success: true,
      queued: true,
      jobId: job.id,
      status: "pending",
    });
  } catch (error) {
    console.error("Error:", error);
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : "Error interno",
    });
  }
});
