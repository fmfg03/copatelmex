import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
}

interface PhotoAssignment {
  file: File;
  preview: string;
  playerId: string | null;
  uploading: boolean;
  uploaded: boolean;
}

interface BulkPhotoUploadProps {
  players: Player[];
  registrationId: string;
  onComplete: () => void;
}

export const BulkPhotoUpload = ({ players, registrationId, onComplete }: BulkPhotoUploadProps) => {
  const { toast } = useToast();
  const [photos, setPhotos] = useState<PhotoAssignment[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    processFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const processFiles = (files: File[]) => {
    const newPhotos: PhotoAssignment[] = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      playerId: null,
      uploading: false,
      uploaded: false,
    }));
    
    setPhotos(prev => [...prev, ...newPhotos]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const assignPlayer = (index: number, playerId: string) => {
    setPhotos(prev => {
      const updated = [...prev];
      updated[index].playerId = playerId;
      return updated;
    });
  };

  const uploadPhoto = async (index: number) => {
    const photo = photos[index];
    
    if (!photo.playerId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Debes asignar un jugador a esta foto",
      });
      return;
    }

    setPhotos(prev => {
      const updated = [...prev];
      updated[index].uploading = true;
      return updated;
    });

    try {
      const fileExt = photo.file.name.split('.').pop();
      const fileName = `${registrationId}/${photo.playerId}/photo_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('registration-documents')
        .upload(fileName, photo.file);

      if (uploadError) throw uploadError;

      // Update player record with photo URL
      const { error: updateError } = await supabase
        .from('players')
        .update({ 
          photo_url: fileName,
          documents_complete: false // Will be marked complete when birth cert is also uploaded
        })
        .eq('id', photo.playerId);

      if (updateError) throw updateError;

      setPhotos(prev => {
        const updated = [...prev];
        updated[index].uploading = false;
        updated[index].uploaded = true;
        return updated;
      });

      toast({
        title: "Foto subida",
        description: "La foto se subió correctamente",
      });
    } catch (error: any) {
      setPhotos(prev => {
        const updated = [...prev];
        updated[index].uploading = false;
        return updated;
      });
      
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Error al subir la foto",
      });
    }
  };

  const uploadAll = async () => {
    const unassigned = photos.some(p => !p.playerId);
    if (unassigned) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Todas las fotos deben tener un jugador asignado",
      });
      return;
    }

    for (let i = 0; i < photos.length; i++) {
      if (!photos[i].uploaded) {
        await uploadPhoto(i);
      }
    }

    const allUploaded = photos.every(p => p.uploaded);
    if (allUploaded) {
      toast({
        title: "¡Completado!",
        description: "Todas las fotos fueron subidas exitosamente",
      });
      onComplete();
    }
  };

  const getAvailablePlayers = (currentPlayerId: string | null) => {
    const assignedPlayerIds = photos
      .filter(p => p.playerId && p.playerId !== currentPlayerId)
      .map(p => p.playerId);
    
    return players.filter(p => !assignedPlayerIds.includes(p.id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carga Masiva de Fotos</CardTitle>
        <CardDescription>
          Arrastra y suelta todas las fotos de los jugadores aquí, luego asigna cada foto al jugador correspondiente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-semibold mb-2">Arrastra las fotos aquí</p>
          <p className="text-sm text-muted-foreground mb-4">o haz clic para seleccionar archivos</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="photo-upload"
          />
          <Button asChild variant="outline">
            <label htmlFor="photo-upload" className="cursor-pointer">
              Seleccionar Fotos
            </label>
          </Button>
        </div>

        {/* Photos Grid */}
        {photos.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{photos.length} foto(s) cargada(s)</h3>
              <Button onClick={uploadAll} disabled={photos.some(p => p.uploading)}>
                Subir Todas
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {photos.map((photo, index) => (
                <Card key={index} className={photo.uploaded ? 'border-green-500' : ''}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <img 
                          src={photo.preview} 
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        {photo.uploaded && (
                          <div className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                          </div>
                        )}
                        {!photo.uploaded && (
                          <button
                            onClick={() => removePhoto(index)}
                            className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <Select
                          value={photo.playerId || ""}
                          onValueChange={(value) => assignPlayer(index, value)}
                          disabled={photo.uploaded}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona jugador" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailablePlayers(photo.playerId).map((player) => (
                              <SelectItem key={player.id} value={player.id}>
                                {player.first_name} {player.last_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {!photo.uploaded && photo.playerId && (
                          <Button
                            onClick={() => uploadPhoto(index)}
                            disabled={photo.uploading}
                            size="sm"
                            className="w-full"
                          >
                            {photo.uploading ? "Subiendo..." : "Subir Foto"}
                          </Button>
                        )}
                        
                        {photo.uploaded && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Subida exitosamente</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};