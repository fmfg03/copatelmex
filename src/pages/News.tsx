import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowRight, Newspaper, ExternalLink, MapPin } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { featuredLocalNewsArticle, localNewsArticles } from "@/content/localNews";

interface RemoteNewsArticle {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  published_at: string | null;
  is_featured: boolean | null;
  source_url: string | null;
  source_name: string | null;
}

const getExcerpt = (content: string, maxLength: number) => {
  const text = content.replace(/<[^>]*>/g, "");
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "…";
};

const formatDate = (date: string | null) => {
  if (!date) return "";
  return format(new Date(date), "d 'de' MMMM, yyyy", { locale: es });
};

const News = () => {
  const { data: remoteArticles, isLoading } = useQuery({
    queryKey: ["news-archive"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false });

      if (error) {
        console.error("Error loading news archive", error);
        return [] as RemoteNewsArticle[];
      }

      return data as RemoteNewsArticle[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <section className="relative overflow-hidden bg-gradient-hero text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_30%)]" />
          <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 bg-white/12 px-4 py-2 rounded-full text-sm font-semibold">
                <Newspaper className="w-4 h-4" />
                Archivo de noticias
              </div>
              <h1 className="mt-5 text-4xl md:text-6xl font-black tracking-tight leading-tight">
                Noticias y reportajes del torneo
              </h1>
              <p className="mt-5 text-lg md:text-xl text-white/85 max-w-2xl">
                Cobertura editorial, aperturas regionales e historias que acompañan el camino rumbo a la Copa Telmex Telcel 2026.
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-6xl mx-auto space-y-10">
            <Card className="overflow-hidden border-0 shadow-[var(--shadow-lg)]">
              <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative min-h-[280px]">
                  <img
                    src={featuredLocalNewsArticle.coverImage}
                    alt={featuredLocalNewsArticle.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/85 via-secondary/30 to-transparent" />
                  <div className="absolute left-6 bottom-6">
                    <Badge className="bg-primary text-white hover:bg-primary">Nota destacada</Badge>
                  </div>
                </div>
                <CardContent className="p-6 md:p-10">
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary" />
                      {formatDate(featuredLocalNewsArticle.publishedAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" />
                      {featuredLocalNewsArticle.location}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-secondary tracking-tight leading-tight">
                    {featuredLocalNewsArticle.title}
                  </h2>
                  <p className="mt-4 text-lg font-semibold text-accent">
                    {featuredLocalNewsArticle.excerpt}
                  </p>
                  <p className="mt-5 text-muted-foreground leading-relaxed">
                    {featuredLocalNewsArticle.lead}
                  </p>
                  <p className="mt-4 text-muted-foreground leading-relaxed">
                    {featuredLocalNewsArticle.paragraphs[0]}
                  </p>
                  <Link
                    to={`/noticias/${featuredLocalNewsArticle.id}`}
                    className="mt-8 inline-flex items-center gap-2 rounded-full bg-secondary px-6 py-3 text-white font-semibold hover:bg-secondary/90 transition-colors"
                  >
                    Leer nota completa
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </CardContent>
              </div>
            </Card>

            <div>
              <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">Más noticias</h2>
                <Badge variant="outline" className="px-3 py-1 text-xs uppercase tracking-[0.2em]">
                  {localNewsArticles.length + (remoteArticles?.length || 0)} entradas
                </Badge>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Skeleton className="h-[180px] rounded-xl" />
                  <Skeleton className="h-[180px] rounded-xl" />
                </div>
              ) : remoteArticles && remoteArticles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {remoteArticles.map((article) => {
                    const articleHref = article.source_url || `/noticias/${article.id}`;
                    const isExternal = Boolean(article.source_url);

                    return (
                      <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <CardContent className="p-0">
                          <div className="grid grid-cols-[120px_1fr] sm:grid-cols-[160px_1fr]">
                            <div className="h-full min-h-[160px] bg-muted overflow-hidden">
                              {article.image_url ? (
                                <img
                                  src={article.image_url}
                                  alt={article.title}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/10 to-primary/10">
                                  <Newspaper className="w-8 h-8 text-muted-foreground/40" />
                                </div>
                              )}
                            </div>
                            <div className="p-5">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                {article.is_featured && (
                                  <Badge className="bg-accent text-accent-foreground text-[10px]">
                                    Destacado
                                  </Badge>
                                )}
                                {article.source_name && (
                                  <Badge variant="outline" className="text-[10px] gap-1">
                                    <ExternalLink className="w-2.5 h-2.5" />
                                    {article.source_name}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-lg font-bold text-foreground leading-tight">
                                {article.title}
                              </h3>
                              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                                {getExcerpt(article.content, 140)}
                              </p>
                              <div className="mt-4 flex items-center justify-between gap-3">
                                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(article.published_at)}
                                </span>
                                <a
                                  href={articleHref}
                                  target={isExternal ? "_blank" : undefined}
                                  rel={isExternal ? "noopener noreferrer" : undefined}
                                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-primary transition-colors"
                                >
                                  Leer más
                                  <ArrowRight className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="py-10 text-center text-muted-foreground">
                    Próximamente se publicarán más artículos en este archivo.
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default News;
