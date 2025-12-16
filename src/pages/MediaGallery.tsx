import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Play, Image as ImageIcon, Video, Radio } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const MediaGallery = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch gallery photos
  const { data: photos } = useQuery({
    queryKey: ["gallery-photos", selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("gallery_photos")
        .select("*, categories(name)")
        .order("photo_date", { ascending: false });
      
      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch featured videos
  const { data: videos } = useQuery({
    queryKey: ["featured-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("featured_videos")
        .select("*, categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch live streams
  const { data: streams } = useQuery({
    queryKey: ["live-streams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("live_streams")
        .select("*, matches(*, home_team_id(team_name), away_team_id(team_name))")
        .order("scheduled_time", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch categories for filtering
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const addToCalendar = (stream: any) => {
    const startDate = new Date(stream.scheduled_time);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const title = encodeURIComponent(stream.title);
    const description = encodeURIComponent(stream.description || '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${formatDate(startDate)}/${formatDate(endDate)}&details=${description}`;
    
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 mt-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Medios y Multimedia</h1>
          <p className="text-muted-foreground">Revive los mejores momentos del torneo</p>
        </div>

        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Galería de Fotos
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Videos Destacados
            </TabsTrigger>
            <TabsTrigger value="streams" className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Transmisiones
            </TabsTrigger>
          </TabsList>

          {/* Photo Gallery Tab */}
          <TabsContent value="photos" className="space-y-6">
            <div className="flex flex-wrap gap-2 mb-4">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                size="sm"
              >
                Todas
              </Button>
              {categories?.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat.id)}
                  size="sm"
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos?.map((photo) => (
                <Card key={photo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative">
                    <img
                      src={photo.image_url}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{photo.title}</CardTitle>
                      {photo.categories && (
                        <Badge variant="secondary">{photo.categories.name}</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {format(new Date(photo.photo_date), "dd 'de' MMMM, yyyy", { locale: es })}
                    </CardDescription>
                  </CardHeader>
                  {photo.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{photo.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {!photos || photos.length === 0 && (
              <div className="text-center py-12">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No hay fotos disponibles en este momento</p>
              </div>
            )}
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos?.map((video) => (
                <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative group cursor-pointer">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-16 w-16 text-white" />
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg">{video.title}</CardTitle>
                      <Badge variant="outline">
                        {video.video_type === 'highlight' && 'Jugada'}
                        {video.video_type === 'interview' && 'Entrevista'}
                        {video.video_type === 'summary' && 'Resumen'}
                      </Badge>
                    </div>
                    {video.categories && (
                      <Badge variant="secondary" className="w-fit">{video.categories.name}</Badge>
                    )}
                  </CardHeader>
                  {video.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{video.description}</p>
                      <Button asChild className="w-full">
                        <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                          <Play className="h-4 w-4 mr-2" />
                          Ver Video
                        </a>
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {!videos || videos.length === 0 && (
              <div className="text-center py-12">
                <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No hay videos disponibles en este momento</p>
              </div>
            )}
          </TabsContent>

          {/* Live Streams Tab */}
          <TabsContent value="streams" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {streams?.map((stream) => (
                <Card key={stream.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle>{stream.title}</CardTitle>
                      <Badge 
                        variant={
                          stream.status === 'live' ? 'default' : 
                          stream.status === 'finished' ? 'secondary' : 
                          'outline'
                        }
                      >
                        {stream.status === 'live' && '🔴 En Vivo'}
                        {stream.status === 'finished' && 'Finalizado'}
                        {stream.status === 'scheduled' && 'Programado'}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(stream.scheduled_time), "EEEE, dd 'de' MMMM 'a las' HH:mm", { locale: es })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stream.description && (
                      <p className="text-sm text-muted-foreground">{stream.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {stream.platform === 'youtube' && 'YouTube'}
                        {stream.platform === 'facebook' && 'Facebook Live'}
                        {stream.platform === 'embedded' && 'En vivo aquí'}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      {stream.status !== 'finished' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addToCalendar(stream)}
                          className="flex-1"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Agregar a Calendario
                        </Button>
                      )}
                      
                      {stream.status === 'live' && (
                        <Button asChild size="sm" className="flex-1">
                          <a href={stream.stream_url} target="_blank" rel="noopener noreferrer">
                            <Play className="h-4 w-4 mr-2" />
                            Ver Ahora
                          </a>
                        </Button>
                      )}

                      {stream.status === 'finished' && (
                        <Button asChild variant="secondary" size="sm" className="flex-1">
                          <a href={stream.stream_url} target="_blank" rel="noopener noreferrer">
                            <Play className="h-4 w-4 mr-2" />
                            Ver Repetición
                          </a>
                        </Button>
                      )}
                    </div>

                    {stream.status === 'live' && stream.platform === 'embedded' && (
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden mt-4">
                        <iframe
                          src={stream.stream_url}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {!streams || streams.length === 0 && (
              <div className="text-center py-12">
                <Radio className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No hay transmisiones programadas en este momento</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default MediaGallery;
