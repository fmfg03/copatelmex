import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Image, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PlayerDocumentUploadProps {
  playerId: string;
  playerName: string;
  onDocumentsComplete: (playerId: string, complete: boolean) => void;
  initialData?: {
    photo_url?: string;
    birth_certificate_url?: string;
    documents_complete?: boolean;
    documents_verified?: boolean;
    verification_notes?: string;
  };
}

export const PlayerDocumentUpload = ({
  playerId,
  playerName,
  onDocumentsComplete,
  initialData,
}: PlayerDocumentUploadProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoUrl, setPhotoUrl] = useState(initialData?.photo_url || "");
  const [birthCertUrl, setBirthCertUrl] = useState(initialData?.birth_certificate_url || "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [birthCertFile, setBirthCertFile] = useState<File | null>(null);

  const isComplete = photoUrl && birthCertUrl;

  const validateFileSize = (file: File) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 10 MB",
      });
      return false;
    }
    return true;
  };

  const validateImageFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Formato inválido",
        description: "La foto debe ser JPG, PNG o WEBP",
      });
      return false;
    }
    return validateFileSize(file);
  };

  const validateDocumentFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Formato inválido",
        description: "El documento debe ser JPG, PNG, WEBP o PDF",
      });
      return false;
    }
    return validateFileSize(file);
  };

  const uploadFile = async (file: File, type: 'photo' | 'birth_certificate') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado");

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/players/${playerId}/${type}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('registration-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    return fileName;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateImageFile(file)) {
        setPhotoFile(file);
      }
    }
  };

  const handleBirthCertChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateDocumentFile(file)) {
        setBirthCertFile(file);
      }
    }
  };

  const handleUpload = async () => {
    if (!photoFile && !birthCertFile) {
      toast({
        variant: "destructive",
        title: "Sin archivos",
        description: "Selecciona al menos un archivo para subir",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const updates: any = {};
      let progress = 0;

      if (photoFile) {
        const photoPath = await uploadFile(photoFile, 'photo');
        updates.photo_url = photoPath;
        setPhotoUrl(photoPath);
        progress += 50;
        setUploadProgress(progress);
      }

      if (birthCertFile) {
        const certPath = await uploadFile(birthCertFile, 'birth_certificate');
        updates.birth_certificate_url = certPath;
        setBirthCertUrl(certPath);
        progress += 50;
        setUploadProgress(progress);
      }

      // Check if all documents are complete
      const allComplete = Boolean(updates.photo_url || photoUrl) && Boolean(updates.birth_certificate_url || birthCertUrl);
      updates.documents_complete = allComplete;
      updates.documents_verified = false; // Reset verification when new docs uploaded
      updates.verification_notes = null;

      // Update player record
      const { error: updateError } = await supabase
        .from("players")
        .update(updates)
        .eq("id", playerId);

      if (updateError) throw updateError;

      toast({
        title: "Documentos subidos",
        description: "Los documentos se han guardado correctamente",
      });

      onDocumentsComplete(playerId, allComplete);
      setPhotoFile(null);
      setBirthCertFile(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al subir",
        description: error.message || "No se pudieron subir los documentos",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (type: 'photo' | 'birth_certificate') => {
    const fileUrl = type === 'photo' ? photoUrl : birthCertUrl;
    if (!fileUrl) return;

    try {
      const { error: deleteError } = await supabase.storage
        .from('registration-documents')
        .remove([fileUrl]);

      if (deleteError) throw deleteError;

      const updates = {
        [type === 'photo' ? 'photo_url' : 'birth_certificate_url']: null,
        documents_complete: false,
        documents_verified: false,
      };

      const { error: updateError } = await supabase
        .from("players")
        .update(updates)
        .eq("id", playerId);

      if (updateError) throw updateError;

      if (type === 'photo') {
        setPhotoUrl("");
      } else {
        setBirthCertUrl("");
      }

      onDocumentsComplete(playerId, false);

      toast({
        title: "Archivo eliminado",
        description: "El archivo se ha eliminado correctamente",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "No se pudo eliminar el archivo",
      });
    }
  };

  return (
    <Card className={`border-2 ${isComplete ? 'border-green-500' : 'border-muted'}`}>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-lg">{playerName}</h4>
          {isComplete && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Completo</span>
            </div>
          )}
        </div>

        {initialData?.documents_verified === false && initialData?.verification_notes && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-3 flex gap-2">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Documento rechazado</p>
              <p className="text-sm text-muted-foreground mt-1">{initialData.verification_notes}</p>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          <div>
            <Label htmlFor={`photo-${playerId}`} className="flex items-center gap-2 mb-2">
              <Image className="h-4 w-4" />
              Foto del jugador
            </Label>
            <div className="flex gap-2">
              <Input
                id={`photo-${playerId}`}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handlePhotoChange}
                disabled={uploading}
                className="flex-1"
              />
              {photoUrl && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteFile('photo')}
                  disabled={uploading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {photoUrl && (
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Foto subida
              </p>
            )}
            {photoFile && (
              <p className="text-sm text-muted-foreground mt-1">
                Archivo seleccionado: {photoFile.name}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor={`birth-cert-${playerId}`} className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" />
              Acta de nacimiento o CURP
            </Label>
            <div className="flex gap-2">
              <Input
                id={`birth-cert-${playerId}`}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                onChange={handleBirthCertChange}
                disabled={uploading}
                className="flex-1"
              />
              {birthCertUrl && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteFile('birth_certificate')}
                  disabled={uploading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {birthCertUrl && (
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Documento subido
              </p>
            )}
            {birthCertFile && (
              <p className="text-sm text-muted-foreground mt-1">
                Archivo seleccionado: {birthCertFile.name}
              </p>
            )}
          </div>
        </div>

        {uploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} />
            <p className="text-sm text-center text-muted-foreground">
              Subiendo documentos... {uploadProgress}%
            </p>
          </div>
        )}

        <Button
          type="button"
          onClick={handleUpload}
          disabled={uploading || (!photoFile && !birthCertFile)}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Subiendo..." : "Subir Documentos"}
        </Button>

        <p className="text-xs text-muted-foreground">
          * Formatos aceptados: JPG, PNG, WEBP (foto) / PDF, JPG, PNG, WEBP (documentos)
          <br />* Tamaño máximo: 10 MB por archivo
        </p>
      </CardContent>
    </Card>
  );
};
