import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, ArrowLeft, Newspaper, ExternalLink, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useEffect } from "react";
import { getLocalNewsArticleById } from "@/content/localNews";
import { NewsImage } from "@/components/NewsImage";
import copaLogo from "@/assets/copa-telmex-logo.png";

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const localArticle = id ? getLocalNewsArticleById(id) : undefined;

  const { data: article, isLoading, error } = useQuery({
    queryKey: ["news-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !localArticle,
  });

  // If external article, redirect to source
  useEffect(() => {
    if (!localArticle && article?.source_url) {
      window.location.replace(article.source_url);
    }
  }, [article, localArticle]);

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return format(new Date(date), "d 'de' MMMM, yyyy", { locale: es });
  };

  const formatArticleContent = (content: string) => {
    const hasHtmlTags = /<[^>]+>/.test(content);
    if (!hasHtmlTags) {
      return content
        .split(/\n\n+/)
        .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br/>")}</p>`)
        .join("");
    }
    // Template contents are inert: inspect legacy URLs before any image can load.
    const template = document.createElement("template");
    template.innerHTML = content;
    template.content.querySelectorAll("img").forEach((image) => {
      const src = image.getAttribute("src");
      if (!src) return;
      let url: URL;
      try {
        url = new URL(src, "https://copatelmextelcel.com.mx");
      } catch {
        return;
      }
      if (
        url.hostname !== "yrrqjcnthnleqiblwlom.supabase.co" &&
        !url.pathname.startsWith("/__l5e/")
      ) return;

      const inertDocument = template.content.ownerDocument;
      const fallback = inertDocument.createElement("div");
      fallback.setAttribute("role", "img");
      fallback.setAttribute("aria-label", `Imagen institucional de Copa Telmex Telcel para: ${image.alt || "esta noticia"}`);
      fallback.className = "flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-secondary/10 to-primary/10 p-4";
      const logo = inertDocument.createElement("img");
      logo.setAttribute("src", copaLogo);
      logo.alt = "";
      logo.className = "w-24 max-w-full max-h-24 object-contain";
      const label = inertDocument.createElement("span");
      label.setAttribute("aria-hidden", "true");
      label.className = "text-center text-sm font-medium text-secondary";
      label.textContent = "Imagen institucional";
      fallback.append(logo, label);
      image.replaceWith(fallback);
    });
    return template.innerHTML;
  };

  // Show loading while redirecting external articles
  if (!localArticle && article?.source_url) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <ExternalLink className="w-8 h-8 text-primary mx-auto animate-pulse" />
            <p className="text-muted-foreground">Redirigiendo a {article.source_name || "la fuente original"}...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Regresar
          </Button>

          {isLoading && !localArticle && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-[400px] w-full rounded-xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {error && !localArticle && (
            <div className="text-center py-16">
              <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Artículo no encontrado</h2>
              <p className="text-muted-foreground mb-4">No pudimos encontrar la noticia que buscas.</p>
              <Button onClick={() => navigate("/")}>Ir al inicio</Button>
            </div>
          )}

          {localArticle && (
            <article>
              <div className="mb-6">
                <Badge className="bg-accent text-accent-foreground mb-3">Destacado</Badge>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-3">
                  {localArticle.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {formatDate(localArticle.publishedAt)}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {localArticle.location}
                  </span>
                </div>
              </div>

              <div className="rounded-xl overflow-hidden mb-8 shadow-[var(--shadow-lg)]">
                <img
                  src={localArticle.coverImage}
                  alt={localArticle.title}
                  className="w-full h-auto"
                  loading="eager"
                />
              </div>
              <p className="-mt-4 mb-8 text-sm text-muted-foreground">Imagen: Archivo</p>

              <div className="prose max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-ul:text-foreground/90 prose-ol:text-foreground/90 prose-headings:my-6 prose-li:my-1 [&_p]:my-6">
                <p className="text-xl font-semibold text-accent leading-8">{localArticle.excerpt}</p>
                <p>{localArticle.lead}</p>
                <p>{localArticle.paragraphs[0]}</p>
              </div>

              <div className="grid gap-6 my-8">
                <div className="rounded-xl overflow-hidden shadow-[var(--shadow-md)]">
                  <img
                    src={localArticle.gallery[0].src}
                    alt={localArticle.gallery[0].alt}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>

                <div className="prose max-w-none dark:prose-invert prose-p:text-foreground/90 prose-ul:text-foreground/90 prose-li:my-1 [&_p]:my-6 [&_ul]:my-6">
                  <p>{localArticle.paragraphs[1]}</p>
                  <p>Las regiones son:</p>
                  <ul>
                    {localArticle.regions.map((region) => (
                      <li key={region}>{region}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="rounded-xl overflow-hidden shadow-[var(--shadow-md)]">
                    <img
                      src={localArticle.gallery[1].src}
                      alt={localArticle.gallery[1].alt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="rounded-xl overflow-hidden shadow-[var(--shadow-md)]">
                    <img
                      src={localArticle.gallery[2].src}
                      alt={localArticle.gallery[2].alt}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="prose max-w-none dark:prose-invert prose-p:text-foreground/90 prose-li:my-1 [&_p]:my-6">
                  <p>{localArticle.paragraphs[2]}</p>
                  <p>{localArticle.paragraphs[3]}</p>
                  <p>{localArticle.paragraphs[4]}</p>
                </div>

                <div className="rounded-xl overflow-hidden shadow-[var(--shadow-md)]">
                  <img
                    src={localArticle.gallery[3].src}
                    alt={localArticle.gallery[3].alt}
                    className="w-full h-auto"
                    loading="lazy"
                  />
                </div>
              </div>
            </article>
          )}

          {article && !article.source_url && !localArticle && (
            <article>
              <div className="mb-6">
                {article.is_featured && (
                  <Badge className="bg-accent text-accent-foreground mb-3">Destacado</Badge>
                )}
                <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-3">
                  {article.title}
                </h1>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="w-4 h-4" />
                  {formatDate(article.published_at)}
                </div>
              </div>

              <NewsImage
                src={article.image_url}
                alt={article.title}
                source={article.image_source}
                className="w-full h-auto max-h-[500px] object-cover"
                loading="eager"
              >
                {({ image, attribution }) => (
                <>
                  <div className="rounded-xl overflow-hidden mb-3">
                    {image}
                  </div>
                  <p className="mb-8 text-sm text-muted-foreground">{attribution}</p>
                </>
                )}
              </NewsImage>

              <div
                className="prose max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-ul:text-foreground/90 prose-ol:text-foreground/90 prose-headings:my-6 prose-li:my-1 [&_br]:leading-normal [&_p]:my-6 [&_blockquote]:my-6 [&_figure]:my-6 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl"
                dangerouslySetInnerHTML={{ __html: formatArticleContent(article.content) }}
              />
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NewsDetail;
