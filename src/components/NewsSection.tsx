import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Calendar, ArrowRight, Newspaper } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  published_at: string | null;
  is_featured: boolean | null;
}

export const NewsSection = () => {
  const { data: articles, isLoading } = useQuery({
    queryKey: ["news-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data as NewsArticle[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[400px] rounded-xl" />
            <div className="grid grid-cols-1 gap-4">
              <Skeleton className="h-[120px] rounded-xl" />
              <Skeleton className="h-[120px] rounded-xl" />
              <Skeleton className="h-[120px] rounded-xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!articles || articles.length === 0) return null;

  const featured = articles[0];
  const secondary = articles.slice(1, 4);

  const getExcerpt = (content: string, maxLength: number) => {
    // Strip HTML tags for excerpt
    const text = content.replace(/<[^>]*>/g, "");
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + "…";
  };

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return format(new Date(date), "d 'de' MMMM, yyyy", { locale: es });
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Newspaper className="w-4 h-4" />
            Noticias y Reportajes
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Lo Último del Torneo
          </h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Mantente informado con las notas, reportajes y artículos más recientes de la Copa Telmex Telcel.
          </p>
        </div>

        {/* Featured + Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Featured Article */}
          <Card className="group overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer">
            <div className="relative h-64 lg:h-full min-h-[300px] overflow-hidden">
              {featured.image_url ? (
                <img
                  src={featured.image_url}
                  alt={featured.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Newspaper className="w-16 h-16 text-primary-foreground/50" />
                </div>
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                {featured.is_featured && (
                  <Badge className="bg-accent text-accent-foreground mb-3 text-xs">
                    Destacado
                  </Badge>
                )}
                <h3 className="text-xl md:text-2xl font-bold leading-tight mb-2">
                  {featured.title}
                </h3>
                <p className="text-white/80 text-sm mb-3 line-clamp-2">
                  {getExcerpt(featured.content, 150)}
                </p>
                <div className="flex items-center gap-2 text-white/60 text-xs">
                  <Calendar className="w-3 h-3" />
                  {formatDate(featured.published_at)}
                </div>
              </div>
            </div>
          </Card>

          {/* Secondary Articles */}
          <div className="flex flex-col gap-4">
            {secondary.map((article) => (
              <Card
                key={article.id}
                className="group overflow-hidden border hover:border-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <CardContent className="p-0">
                  <div className="flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-28 h-28 sm:w-36 sm:h-32 flex-shrink-0 overflow-hidden">
                      {article.image_url ? (
                        <img
                          src={article.image_url}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-primary/20 flex items-center justify-center">
                          <Newspaper className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex flex-col justify-center py-3 pr-4 flex-1 min-w-0">
                      <h4 className="font-bold text-foreground text-sm md:text-base leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {article.title}
                      </h4>
                      <p className="text-muted-foreground text-xs line-clamp-2 mb-2 hidden sm:block">
                        {getExcerpt(article.content, 100)}
                      </p>
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <Calendar className="w-3 h-3" />
                        {formatDate(article.published_at)}
                      </div>
                    </div>
                    {/* Arrow */}
                    <div className="hidden sm:flex items-center pr-4">
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty state for missing secondary articles */}
            {secondary.length === 0 && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                Próximamente más artículos.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
