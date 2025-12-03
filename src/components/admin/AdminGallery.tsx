import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Image } from "lucide-react";

type GalleryPhoto = {
  id: string;
  title: string;
  description: string;
  image_url: string;
  photo_date: string;
  created_at: string;
};

export const AdminGallery = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from("gallery_photos")
        .select("*")
        .order("photo_date", { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las fotos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando galería...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <Card key={photo.id}>
            <CardContent className="p-4">
              <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                <Image className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-1">{photo.title}</h3>
              <p className="text-sm text-muted-foreground">{photo.description}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(photo.photo_date).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
