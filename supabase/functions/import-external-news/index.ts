import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function extractMetaContent(html: string, property: string): string | null {
  // Match both property="og:X" content="Y" and content="Y" property="og:X" orders
  const pattern1 = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i');
  const pattern2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, 'i');
  const pattern3 = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i');
  const pattern4 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, 'i');
  return pattern1.exec(html)?.[1] ?? pattern2.exec(html)?.[1] ?? pattern3.exec(html)?.[1] ?? pattern4.exec(html)?.[1] ?? null;
}

function stripToArticleHtml(html: string): { title: string; content: string; imageUrl: string | null; description: string } {
  // Extract title from og:title or <title>
  const ogTitle = extractMetaContent(html, "og:title")
    ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]
    ?? "";

  // Extract og:image
  const imageUrl = extractMetaContent(html, "og:image") ?? null;

  // Extract og:description
  const description = extractMetaContent(html, "og:description")
    ?? extractMetaContent(html, "description")
    ?? "";

  // Try to extract the main article body
  let articleHtml = "";

  // Try common article selectors via regex
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    articleHtml = articleMatch[1];
  } else {
    // Fallback: look for common content divs
    const contentMatch = html.match(/<div[^>]*class="[^"]*(?:article-body|entry-content|post-content|article-content|story-body)[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<\/div>|<div)/i);
    if (contentMatch) {
      articleHtml = contentMatch[1];
    }
  }

  // Clean the HTML content
  let content = articleHtml || "";

  // Remove script and style tags
  content = content.replace(/<script[\s\S]*?<\/script>/gi, "");
  content = content.replace(/<style[\s\S]*?<\/style>/gi, "");
  content = content.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");

  // Remove navigation, aside, footer elements
  content = content.replace(/<nav[\s\S]*?<\/nav>/gi, "");
  content = content.replace(/<aside[\s\S]*?<\/aside>/gi, "");
  content = content.replace(/<footer[\s\S]*?<\/footer>/gi, "");

  // Remove social sharing widgets and related articles
  content = content.replace(/<div[^>]*class="[^"]*(?:share|social|related|comment|sidebar|ad-|banner|newsletter)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");

  // Remove iframe, form, button, input elements
  content = content.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  content = content.replace(/<form[\s\S]*?<\/form>/gi, "");
  content = content.replace(/<button[\s\S]*?<\/button>/gi, "");
  content = content.replace(/<input[^>]*>/gi, "");

  // Remove all links but keep text
  content = content.replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, "$1");

  // Remove class, style, id, data-* attributes from remaining tags
  content = content.replace(/<(\w+)\s+[^>]*>/gi, (match, tag) => {
    // Keep img src and alt
    if (tag.toLowerCase() === "img") {
      const src = match.match(/src="([^"]+)"/)?.[1] ?? "";
      const alt = match.match(/alt="([^"]+)"/)?.[1] ?? "";
      return `<img src="${src}" alt="${alt}">`;
    }
    return `<${tag}>`;
  });

  // Remove empty paragraphs
  content = content.replace(/<p>\s*<\/p>/gi, "");
  content = content.replace(/<p>\s*&nbsp;\s*<\/p>/gi, "");

  // Trim whitespace
  content = content.trim();

  return {
    title: ogTitle.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">"),
    content,
    imageUrl,
    description: description.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;/g, "'"),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabaseClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Se requiere rol de administrador" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { url, source_name, action } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL es requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return new Response(JSON.stringify({ error: "URL inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sourceName = (source_name || "").trim() || "Fuente externa";

    console.log("Fetching URL:", url);

    // Fetch the page
    const pageResponse = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CopaTelmexBot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "es-MX,es;q=0.9",
      },
    });

    if (!pageResponse.ok) {
      return new Response(
        JSON.stringify({ error: `No se pudo acceder al sitio (${pageResponse.status})` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await pageResponse.text();
    const extracted = stripToArticleHtml(html);

    if (!extracted.title) {
      return new Response(
        JSON.stringify({ error: "No se pudo extraer el título del artículo" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add source credit
    const creditHeader = `<p><em>Nota cortesía de <strong>${sourceName}</strong></em></p>`;
    const creditFooter = `<hr><p><em>Artículo original publicado por <strong>${sourceName}</strong>. Reproducido con fines informativos como cortesía editorial.</em></p>`;

    let finalContent = extracted.content;
    if (extracted.description && !finalContent.includes(extracted.description)) {
      finalContent = `<p><em>${extracted.description}</em></p>${finalContent}`;
    }
    finalContent = `${creditHeader}${finalContent}${creditFooter}`;

    const result = {
      title: extracted.title,
      content: finalContent,
      image_url: extracted.imageUrl,
      source_name: sourceName,
      source_url: url,
    };

    // If action is "preview", just return the extracted data
    if (action === "preview") {
      return new Response(JSON.stringify({ success: true, data: result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If action is "publish", save to database
    if (action === "publish") {
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { error: insertError } = await serviceClient.from("news").insert({
        title: result.title,
        content: result.content,
        image_url: result.image_url,
        is_featured: false,
        published_at: new Date().toISOString(),
        author_id: user.id,
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        return new Response(
          JSON.stringify({ error: "Error al guardar la noticia" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ success: true, message: "Noticia importada correctamente" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: return preview
    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
