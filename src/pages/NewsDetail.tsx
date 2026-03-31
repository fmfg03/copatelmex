import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, ArrowLeft, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
    enabled: !!id,
  });

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return format(new Date(date), "d 'de' MMMM, yyyy", { locale: es });
  };

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

          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-[400px] w-full rounded-xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}

          {error && (
            <div className="text-center py-16">
              <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">Artículo no encontrado</h2>
              <p className="text-muted-foreground mb-4">No pudimos encontrar la noticia que buscas.</p>
              <Button onClick={() => navigate("/home")}>Ir al inicio</Button>
            </div>
          )}

          {article && (
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

              {article.image_url && (
                <div className="rounded-xl overflow-hidden mb-8">
                  <img
                    src={article.image_url}
                    alt={article.title}
                    className="w-full h-auto max-h-[500px] object-cover"
                  />
                </div>
              )}

              <div
                className="prose max-w-none dark:prose-invert prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-ul:text-foreground/90 prose-ol:text-foreground/90 prose-p:my-2 prose-headings:my-3 [&_br]:leading-normal"
                dangerouslySetInnerHTML={{ __html: article.content }}
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
