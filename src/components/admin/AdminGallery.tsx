import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Calendar, Image as ImageIcon, Loader2, Pencil, Plus, Radio, Trash2, Upload, Video, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const GALLERY_MEDIA_BUCKET = "gallery-media";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

type Category = {
  id: string;
  name: string;
};

type GalleryPhoto = {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category_id: string | null;
  photo_date: string;
  created_at: string | null;
  categories?: { name: string } | null;
};

type FeaturedVideo = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  video_type: string | null;
  category_id: string | null;
  created_at: string | null;
  categories?: { name: string } | null;
};

type LiveStream = {
  id: string;
  title: string;
  description: string | null;
  platform: string;
  scheduled_time: string;
  status: string | null;
  stream_url: string;
  created_at: string | null;
};

type PhotoFormState = {
  title: string;
  description: string;
  category_id: string;
  photo_date: string;
  image_url: string;
};

type VideoFormState = {
  title: string;
  description: string;
  category_id: string;
  video_type: string;
  source_mode: "upload" | "external";
  video_url: string;
  thumbnail_mode: "none" | "upload" | "url";
  thumbnail_url: string;
};

type StreamFormState = {
  title: string;
  description: string;
  platform: string;
  scheduled_time: string;
  status: string;
  stream_url: string;
};

type BulkGalleryPhotoItem = {
  file: File;
  preview: string;
  title: string;
  description: string;
  uploading: boolean;
  uploaded: boolean;
  error: string | null;
};

const emptyPhotoForm: PhotoFormState = {
  title: "",
  description: "",
  category_id: "none",
  photo_date: new Date().toISOString().slice(0, 10),
  image_url: "",
};

const emptyVideoForm: VideoFormState = {
  title: "",
  description: "",
  category_id: "none",
  video_type: "highlight",
  source_mode: "upload",
  video_url: "",
  thumbnail_mode: "none",
  thumbnail_url: "",
};

const emptyStreamForm: StreamFormState = {
  title: "",
  description: "",
  platform: "youtube",
  scheduled_time: "",
  status: "scheduled",
  stream_url: "",
};

const validateFileSize = (file: File, maxSize: number, label: string) => {
  if (file.size > maxSize) {
    toast({
      title: "Archivo muy grande",
      description: `${label} debe ser menor a ${Math.round(maxSize / (1024 * 1024))} MB`,
      variant: "destructive",
    });
    return false;
  }
  return true;
};

const validateImageFile = (file: File) => {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    toast({
      title: "Formato inválido",
      description: "Solo se permiten imágenes JPG, PNG o WEBP",
      variant: "destructive",
    });
    return false;
  }
  return validateFileSize(file, MAX_IMAGE_SIZE, "La imagen");
};

const validateVideoFile = (file: File) => {
  if (file.type !== "video/mp4") {
    toast({
      title: "Formato inválido",
      description: "Solo se permiten videos MP4",
      variant: "destructive",
    });
    return false;
  }
  return validateFileSize(file, MAX_VIDEO_SIZE, "El video");
};

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const formatDateTimeLocal = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const pad = (part: number) => part.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const getVideoTypeLabel = (value: string | null) => {
  if (value === "interview") return "Entrevista";
  if (value === "summary") return "Resumen";
  return "Jugada";
};

const getStreamStatusLabel = (value: string | null) => {
  if (value === "live") return "En Vivo";
  if (value === "finished") return "Finalizado";
  return "Programado";
};

const getStoragePathFromUrl = (url: string) => {
  const marker = `/storage/v1/object/public/${GALLERY_MEDIA_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
};

const uploadPublicFile = async (folder: string, file: File) => {
  const ext = file.name.split(".").pop() || "bin";
  const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9.-]/g, "-");
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${baseName}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(GALLERY_MEDIA_BUCKET).upload(fileName, file);
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from(GALLERY_MEDIA_BUCKET).getPublicUrl(fileName);

  return { fileName, publicUrl };
};

const deleteManagedAsset = async (url: string | null | undefined) => {
  if (!url) return;
  const path = getStoragePathFromUrl(url);
  if (!path) return;

  const { error } = await supabase.storage.from(GALLERY_MEDIA_BUCKET).remove([path]);
  if (error) {
    console.error("Error deleting storage asset:", error);
  }
};

export const AdminGallery = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [videos, setVideos] = useState<FeaturedVideo[]>([]);
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);

  const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
  const [bulkPhotoDialogOpen, setBulkPhotoDialogOpen] = useState(false);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [streamDialogOpen, setStreamDialogOpen] = useState(false);

  const [photoForm, setPhotoForm] = useState<PhotoFormState>(emptyPhotoForm);
  const [videoForm, setVideoForm] = useState<VideoFormState>(emptyVideoForm);
  const [streamForm, setStreamForm] = useState<StreamFormState>(emptyStreamForm);

  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [editingVideo, setEditingVideo] = useState<FeaturedVideo | null>(null);
  const [editingStream, setEditingStream] = useState<LiveStream | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [bulkPhotoItems, setBulkPhotoItems] = useState<BulkGalleryPhotoItem[]>([]);
  const [bulkPhotoCategoryId, setBulkPhotoCategoryId] = useState("none");
  const [bulkPhotoDate, setBulkPhotoDate] = useState(new Date().toISOString().slice(0, 10));
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [savingPhoto, setSavingPhoto] = useState(false);
  const [savingBulkPhotos, setSavingBulkPhotos] = useState(false);
  const [savingVideo, setSavingVideo] = useState(false);
  const [savingStream, setSavingStream] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const bulkPhotoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const streamTitleInputRef = useRef<HTMLInputElement>(null);
  const streamDateTimeInputRef = useRef<HTMLInputElement>(null);
  const streamUrlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    try {
      const [categoriesResult, photosResult, videosResult, streamsResult] = await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        supabase.from("gallery_photos").select("*, categories(name)").order("photo_date", { ascending: false }),
        supabase.from("featured_videos").select("*, categories(name)").order("created_at", { ascending: false }),
        supabase.from("live_streams").select("*").order("scheduled_time", { ascending: false }),
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (photosResult.error) throw photosResult.error;
      if (videosResult.error) throw videosResult.error;
      if (streamsResult.error) throw streamsResult.error;

      setCategories((categoriesResult.data as Category[]) || []);
      setPhotos((photosResult.data as GalleryPhoto[]) || []);
      setVideos((videosResult.data as FeaturedVideo[]) || []);
      setStreams((streamsResult.data as LiveStream[]) || []);
    } catch (error) {
      console.error("Error loading multimedia admin data:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el módulo de multimedia",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const categoryOptions = useMemo(
    () => categories.map((category) => ({ value: category.id, label: category.name })),
    [categories],
  );

  const resetPhotoDialog = () => {
    setEditingPhoto(null);
    setPhotoForm(emptyPhotoForm);
    setPhotoFile(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const resetBulkPhotoDialog = () => {
    setBulkPhotoItems((current) => {
      current.forEach((item) => URL.revokeObjectURL(item.preview));
      return [];
    });
    setBulkPhotoCategoryId("none");
    setBulkPhotoDate(new Date().toISOString().slice(0, 10));
    if (bulkPhotoInputRef.current) bulkPhotoInputRef.current.value = "";
  };

  const resetVideoDialog = () => {
    setEditingVideo(null);
    setVideoForm(emptyVideoForm);
    setVideoFile(null);
    setThumbnailFile(null);
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const resetStreamDialog = () => {
    setEditingStream(null);
    setStreamForm(emptyStreamForm);
  };

  const openPhotoCreate = () => {
    resetPhotoDialog();
    setPhotoDialogOpen(true);
  };

  const openPhotoEdit = (photo: GalleryPhoto) => {
    resetPhotoDialog();
    setEditingPhoto(photo);
    setPhotoForm({
      title: photo.title,
      description: photo.description || "",
      category_id: photo.category_id || "none",
      photo_date: photo.photo_date,
      image_url: photo.image_url,
    });
    setPhotoDialogOpen(true);
  };

  const openVideoCreate = () => {
    resetVideoDialog();
    setVideoDialogOpen(true);
  };

  const openBulkPhotoCreate = () => {
    resetBulkPhotoDialog();
    setBulkPhotoDialogOpen(true);
  };

  const openVideoEdit = (video: FeaturedVideo) => {
    resetVideoDialog();
    setEditingVideo(video);
    setVideoForm({
      title: video.title,
      description: video.description || "",
      category_id: video.category_id || "none",
      video_type: video.video_type || "highlight",
      source_mode: getStoragePathFromUrl(video.video_url) ? "upload" : "external",
      video_url: video.video_url,
      thumbnail_mode: video.thumbnail_url ? (getStoragePathFromUrl(video.thumbnail_url) ? "upload" : "url") : "none",
      thumbnail_url: video.thumbnail_url || "",
    });
    setVideoDialogOpen(true);
  };

  const openStreamCreate = () => {
    resetStreamDialog();
    setStreamDialogOpen(true);
  };

  const openStreamEdit = (stream: LiveStream) => {
    resetStreamDialog();
    setEditingStream(stream);
    setStreamForm({
      title: stream.title,
      description: stream.description || "",
      platform: stream.platform,
      scheduled_time: formatDateTimeLocal(stream.scheduled_time),
      status: stream.status || "scheduled",
      stream_url: stream.stream_url,
    });
    setStreamDialogOpen(true);
  };

  const handlePhotoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!validateImageFile(file)) {
      event.target.value = "";
      return;
    }

    setPhotoFile(file);
    setPhotoForm((current) => ({ ...current, image_url: URL.createObjectURL(file) }));
  };

  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!validateVideoFile(file)) {
      event.target.value = "";
      return;
    }

    setVideoFile(file);
    setVideoForm((current) => ({ ...current, video_url: file.name }));
  };

  const processBulkPhotoFiles = (files: File[]) => {
    const validFiles = files.filter((file) => validateImageFile(file));

    if (validFiles.length === 0) {
      return;
    }

    const newItems: BulkGalleryPhotoItem[] = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^.]+$/, ""),
      description: "",
      uploading: false,
      uploaded: false,
      error: null,
    }));

    setBulkPhotoItems((current) => [...current, ...newItems]);
  };

  const handleBulkPhotoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    processBulkPhotoFiles(files);
  };

  const updateBulkPhotoItem = (index: number, patch: Partial<BulkGalleryPhotoItem>) => {
    setBulkPhotoItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    );
  };

  const removeBulkPhotoItem = (index: number) => {
    setBulkPhotoItems((current) => {
      const next = [...current];
      URL.revokeObjectURL(next[index].preview);
      next.splice(index, 1);
      return next;
    });
  };

  const handleSaveBulkPhotos = async () => {
    if (!bulkPhotoDate) {
      toast({
        title: "Fecha requerida",
        description: "Define una fecha para el lote",
        variant: "destructive",
      });
      return;
    }

    if (bulkPhotoItems.length === 0) {
      toast({
        title: "Sin fotos",
        description: "Selecciona al menos una imagen para subir",
        variant: "destructive",
      });
      return;
    }

    const hasMissingTitle = bulkPhotoItems.some((item) => !item.title.trim());
    if (hasMissingTitle) {
      toast({
        title: "Título requerido",
        description: "Todas las fotos del lote deben tener título",
        variant: "destructive",
      });
      return;
    }

    setSavingBulkPhotos(true);

    let successCount = 0;
    let errorCount = 0;

    for (let index = 0; index < bulkPhotoItems.length; index += 1) {
      const item = bulkPhotoItems[index];
      if (item.uploaded) continue;

      updateBulkPhotoItem(index, { uploading: true, error: null });

      try {
        const upload = await uploadPublicFile("photos", item.file);
        const { error } = await supabase.from("gallery_photos").insert({
          title: item.title.trim(),
          description: item.description.trim() || null,
          category_id: bulkPhotoCategoryId === "none" ? null : bulkPhotoCategoryId,
          photo_date: bulkPhotoDate,
          image_url: upload.publicUrl,
        });

        if (error) throw error;

        updateBulkPhotoItem(index, { uploading: false, uploaded: true, error: null });
        successCount += 1;
      } catch (error: any) {
        console.error("Error uploading bulk gallery photo:", error);
        updateBulkPhotoItem(index, {
          uploading: false,
          uploaded: false,
          error: error?.message || "No se pudo subir esta foto",
        });
        errorCount += 1;
      }
    }

    setSavingBulkPhotos(false);
    await loadData();

    if (errorCount === 0) {
      toast({
        title: "Carga completada",
        description: `Se subieron ${successCount} foto(s) correctamente`,
      });
      setBulkPhotoDialogOpen(false);
      resetBulkPhotoDialog();
      return;
    }

    toast({
      title: "Carga parcial",
      description: `${successCount} foto(s) subidas y ${errorCount} con error`,
      variant: "destructive",
    });
  };

  const handleThumbnailFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!validateImageFile(file)) {
      event.target.value = "";
      return;
    }

    setThumbnailFile(file);
    setVideoForm((current) => ({ ...current, thumbnail_url: URL.createObjectURL(file) }));
  };

  const handleSavePhoto = async () => {
    if (!photoForm.title.trim() || !photoForm.photo_date) {
      toast({
        title: "Campos requeridos",
        description: "Título y fecha son obligatorios",
        variant: "destructive",
      });
      return;
    }

    if (!photoFile && !photoForm.image_url.trim()) {
      toast({
        title: "Imagen requerida",
        description: "Sube una imagen para la foto de galería",
        variant: "destructive",
      });
      return;
    }

    setSavingPhoto(true);

    try {
      let imageUrl = editingPhoto?.image_url || null;

      if (photoFile) {
        const upload = await uploadPublicFile("photos", photoFile);
        imageUrl = upload.publicUrl;
      }

      const payload = {
        title: photoForm.title.trim(),
        description: photoForm.description.trim() || null,
        category_id: photoForm.category_id === "none" ? null : photoForm.category_id,
        photo_date: photoForm.photo_date,
        image_url: imageUrl as string,
      };

      if (editingPhoto) {
        const previousImageUrl = editingPhoto.image_url;
        const { error } = await supabase.from("gallery_photos").update(payload).eq("id", editingPhoto.id);
        if (error) throw error;

        if (photoFile && previousImageUrl !== imageUrl) {
          await deleteManagedAsset(previousImageUrl);
        }

        toast({ title: "Foto actualizada" });
      } else {
        const { error } = await supabase.from("gallery_photos").insert(payload);
        if (error) throw error;
        toast({ title: "Foto agregada" });
      }

      setPhotoDialogOpen(false);
      resetPhotoDialog();
      await loadData();
    } catch (error) {
      console.error("Error saving photo:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la foto",
        variant: "destructive",
      });
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleSaveVideo = async () => {
    const existingUploadUrl = editingVideo ? getStoragePathFromUrl(editingVideo.video_url) : null;

    if (!videoForm.title.trim()) {
      toast({
        title: "Campo requerido",
        description: "El título es obligatorio",
        variant: "destructive",
      });
      return;
    }

    if (videoForm.source_mode === "upload" && !videoFile && !existingUploadUrl) {
      toast({
        title: "Video requerido",
        description: "Sube un archivo MP4 o cambia a URL externa",
        variant: "destructive",
      });
      return;
    }

    if (videoForm.source_mode === "external" && !isValidHttpUrl(videoForm.video_url.trim())) {
      toast({
        title: "URL inválida",
        description: "Ingresa una URL válida de YouTube o Vimeo",
        variant: "destructive",
      });
      return;
    }

    if (videoForm.thumbnail_mode === "url" && videoForm.thumbnail_url.trim() && !isValidHttpUrl(videoForm.thumbnail_url.trim())) {
      toast({
        title: "URL inválida",
        description: "La miniatura debe usar una URL http o https",
        variant: "destructive",
      });
      return;
    }

    if (videoForm.thumbnail_mode === "upload" && !thumbnailFile && !editingVideo?.thumbnail_url) {
      toast({
        title: "Miniatura requerida",
        description: "Sube una miniatura o cambia el modo a URL o sin miniatura",
        variant: "destructive",
      });
      return;
    }

    setSavingVideo(true);

    try {
      let videoUrl = editingVideo?.video_url || "";
      let thumbnailUrl = editingVideo?.thumbnail_url || null;

      if (videoForm.source_mode === "upload") {
        if (videoFile) {
          const upload = await uploadPublicFile("videos", videoFile);
          videoUrl = upload.publicUrl;
        }
      } else {
        videoUrl = videoForm.video_url.trim();
      }

      if (videoForm.thumbnail_mode === "upload") {
        if (thumbnailFile) {
          const upload = await uploadPublicFile("thumbnails", thumbnailFile);
          thumbnailUrl = upload.publicUrl;
        }
      } else if (videoForm.thumbnail_mode === "url") {
        thumbnailUrl = videoForm.thumbnail_url.trim() || null;
      } else {
        thumbnailUrl = null;
      }

      const payload = {
        title: videoForm.title.trim(),
        description: videoForm.description.trim() || null,
        category_id: videoForm.category_id === "none" ? null : videoForm.category_id,
        video_type: videoForm.video_type,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
      };

      if (editingVideo) {
        const previousVideoUrl = editingVideo.video_url;
        const previousThumbnailUrl = editingVideo.thumbnail_url;

        const { error } = await supabase.from("featured_videos").update(payload).eq("id", editingVideo.id);
        if (error) throw error;

        if (videoFile && previousVideoUrl !== videoUrl) {
          await deleteManagedAsset(previousVideoUrl);
        }
        if (thumbnailFile && previousThumbnailUrl !== thumbnailUrl) {
          await deleteManagedAsset(previousThumbnailUrl);
        }
        if (videoForm.thumbnail_mode === "none" && previousThumbnailUrl) {
          await deleteManagedAsset(previousThumbnailUrl);
        }

        toast({ title: "Video actualizado" });
      } else {
        const { error } = await supabase.from("featured_videos").insert(payload);
        if (error) throw error;
        toast({ title: "Video agregado" });
      }

      setVideoDialogOpen(false);
      resetVideoDialog();
      await loadData();
    } catch (error) {
      console.error("Error saving video:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar el video",
        variant: "destructive",
      });
    } finally {
      setSavingVideo(false);
    }
  };

  const handleSaveStream = async (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    const formData = event ? new FormData(event.currentTarget) : null;
    const normalizedTitle = String(formData?.get("stream_title") || streamForm.title || streamTitleInputRef.current?.value || "").trim();
    const normalizedScheduledTime = String(formData?.get("stream_scheduled_time") || streamForm.scheduled_time || streamDateTimeInputRef.current?.value || "").trim();
    const normalizedStreamUrl = String(formData?.get("stream_url") || streamForm.stream_url || streamUrlInputRef.current?.value || "").trim();

    if (!normalizedTitle) {
      toast({
        title: "Título requerido",
        description: "El título de la transmisión es obligatorio",
        variant: "destructive",
      });
      return;
    }

    if (!normalizedScheduledTime) {
      toast({
        title: "Fecha y hora requeridas",
        description: "La fecha y hora de la transmisión son obligatorias",
        variant: "destructive",
      });
      return;
    }

    if (!normalizedStreamUrl) {
      toast({
        title: "URL requerida",
        description: "La URL de la transmisión es obligatoria",
        variant: "destructive",
      });
      return;
    }

    if (!isValidHttpUrl(normalizedStreamUrl)) {
      toast({
        title: "URL inválida",
        description: "La transmisión debe usar una URL http o https",
        variant: "destructive",
      });
      return;
    }

    setSavingStream(true);

    try {
      const payload = {
        title: normalizedTitle,
        description: streamForm.description.trim() || null,
        platform: streamForm.platform,
        status: streamForm.status,
        stream_url: normalizedStreamUrl,
        scheduled_time: new Date(normalizedScheduledTime).toISOString(),
      };

      if (editingStream) {
        const { error } = await supabase.from("live_streams").update(payload).eq("id", editingStream.id);
        if (error) throw error;
        toast({ title: "Transmisión actualizada" });
      } else {
        const { error } = await supabase.from("live_streams").insert(payload);
        if (error) throw error;
        toast({ title: "Transmisión agregada" });
      }

      setStreamDialogOpen(false);
      resetStreamDialog();
      await loadData();
    } catch (error) {
      console.error("Error saving stream:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la transmisión",
        variant: "destructive",
      });
    } finally {
      setSavingStream(false);
    }
  };

  const handleDeletePhoto = async (photo: GalleryPhoto) => {
    if (!confirm(`¿Eliminar la foto "${photo.title}"?`)) return;

    try {
      const { error } = await supabase.from("gallery_photos").delete().eq("id", photo.id);
      if (error) throw error;

      await deleteManagedAsset(photo.image_url);
      toast({ title: "Foto eliminada" });
      await loadData();
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la foto",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVideo = async (video: FeaturedVideo) => {
    if (!confirm(`¿Eliminar el video "${video.title}"?`)) return;

    try {
      const { error } = await supabase.from("featured_videos").delete().eq("id", video.id);
      if (error) throw error;

      await deleteManagedAsset(video.video_url);
      await deleteManagedAsset(video.thumbnail_url);
      toast({ title: "Video eliminado" });
      await loadData();
    } catch (error) {
      console.error("Error deleting video:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el video",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStream = async (stream: LiveStream) => {
    if (!confirm(`¿Eliminar la transmisión "${stream.title}"?`)) return;

    try {
      const { error } = await supabase.from("live_streams").delete().eq("id", stream.id);
      if (error) throw error;

      toast({ title: "Transmisión eliminada" });
      await loadData();
    } catch (error) {
      console.error("Error deleting stream:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la transmisión",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="py-10 text-center text-muted-foreground">Cargando multimedia...</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold">Multimedia</h2>
          <p className="text-sm text-muted-foreground">
            Administra fotos, shorts y transmisiones para que se publiquen en la sección pública de medios.
          </p>
        </div>

        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-2 md:grid-cols-3">
            <TabsTrigger value="photos" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Fotos
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="streams" className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Transmisiones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Galería de Fotos</h3>
                <p className="text-sm text-muted-foreground">Sube imágenes al bucket público y organízalas por categoría.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={openBulkPhotoCreate}>
                  <Upload className="mr-2 h-4 w-4" />
                  Carga masiva
                </Button>
                <Button onClick={openPhotoCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar foto
                </Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {photos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted">
                    <img src={photo.image_url} alt={photo.title} className="h-full w-full object-cover" />
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{photo.title}</CardTitle>
                        <CardDescription>
                          {format(new Date(photo.photo_date), "dd 'de' MMMM, yyyy", { locale: es })}
                        </CardDescription>
                      </div>
                      {photo.categories?.name ? <Badge variant="secondary">{photo.categories.name}</Badge> : null}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="min-h-10 text-sm text-muted-foreground">{photo.description || "Sin descripción"}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openPhotoEdit(photo)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeletePhoto(photo)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {photos.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">No hay fotos registradas.</div>
            ) : null}
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Shorts y Videos</h3>
                <p className="text-sm text-muted-foreground">Sube MP4 al storage o publica links externos de YouTube o Vimeo.</p>
              </div>
              <Button onClick={openVideoCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar video
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {videos.map((video) => (
                <Card key={video.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted">
                    {video.thumbnail_url ? (
                      <img src={video.thumbnail_url} alt={video.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Video className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{video.title}</CardTitle>
                        <CardDescription>{video.description || "Sin descripción"}</CardDescription>
                      </div>
                      <Badge variant="outline">{getVideoTypeLabel(video.video_type)}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {video.categories?.name ? <Badge variant="secondary">{video.categories.name}</Badge> : null}
                      <Badge variant="secondary">{getStoragePathFromUrl(video.video_url) ? "Archivo MP4" : "URL externa"}</Badge>
                    </div>
                    <a href={video.video_url} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-primary underline">
                      {video.video_url}
                    </a>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openVideoEdit(video)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteVideo(video)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {videos.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">No hay videos registrados.</div>
            ) : null}
          </TabsContent>

          <TabsContent value="streams" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Transmisiones</h3>
                <p className="text-sm text-muted-foreground">Registra próximos eventos o finales pasadas para publicar el enlace de repetición.</p>
              </div>
              <Button onClick={openStreamCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar transmisión
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {streams.map((stream) => (
                <Card key={stream.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{stream.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 pt-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(stream.scheduled_time), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                        </CardDescription>
                      </div>
                      <Badge variant={stream.status === "finished" ? "secondary" : stream.status === "live" ? "default" : "outline"}>
                        {getStreamStatusLabel(stream.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{stream.platform === "facebook" ? "Facebook Live" : stream.platform === "embedded" ? "Embed" : "YouTube"}</Badge>
                    </div>
                    <p className="min-h-10 text-sm text-muted-foreground">{stream.description || "Sin descripción"}</p>
                    <a href={stream.stream_url} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-primary underline">
                      {stream.stream_url}
                    </a>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openStreamEdit(stream)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1" onClick={() => handleDeleteStream(stream)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {streams.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">No hay transmisiones registradas.</div>
            ) : null}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={bulkPhotoDialogOpen}
        onOpenChange={(open) => {
          setBulkPhotoDialogOpen(open);
          if (!open) resetBulkPhotoDialog();
        }}
      >
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Carga masiva de fotos</DialogTitle>
            <DialogDescription>Selecciona varias imágenes, ajusta sus títulos y súbelas en un solo lote.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2 md:col-span-1">
                <Label htmlFor="bulk-photo-file">Seleccionar imágenes</Label>
                <Input
                  id="bulk-photo-file"
                  ref={bulkPhotoInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleBulkPhotoFileChange}
                />
              </div>

              <div className="grid gap-2">
                <Label>Categoría del lote</Label>
                <Select value={bulkPhotoCategoryId} onValueChange={setBulkPhotoCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bulk-photo-date">Fecha del lote</Label>
                <Input id="bulk-photo-date" type="date" value={bulkPhotoDate} onChange={(event) => setBulkPhotoDate(event.target.value)} />
              </div>
            </div>

            {bulkPhotoItems.length > 0 ? (
              <div className="grid max-h-[60vh] gap-4 overflow-y-auto pr-1 md:grid-cols-2">
                {bulkPhotoItems.map((item, index) => (
                  <Card key={`${item.file.name}-${index}`} className={item.uploaded ? "border-green-500" : ""}>
                    <CardContent className="space-y-4 p-4">
                      <div className="relative overflow-hidden rounded-lg border">
                        <img src={item.preview} alt={item.title} className="h-48 w-full object-cover" />
                        {!item.uploading && !item.uploaded ? (
                          <button
                            type="button"
                            onClick={() => removeBulkPhotoItem(index)}
                            className="absolute right-2 top-2 rounded-full bg-background/90 p-1 text-foreground shadow"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor={`bulk-photo-title-${index}`}>Título</Label>
                        <Input
                          id={`bulk-photo-title-${index}`}
                          value={item.title}
                          onChange={(event) => updateBulkPhotoItem(index, { title: event.target.value, error: null })}
                          disabled={item.uploading || item.uploaded}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor={`bulk-photo-description-${index}`}>Descripción</Label>
                        <Textarea
                          id={`bulk-photo-description-${index}`}
                          value={item.description}
                          onChange={(event) => updateBulkPhotoItem(index, { description: event.target.value, error: null })}
                          disabled={item.uploading || item.uploaded}
                        />
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate text-muted-foreground">{item.file.name}</span>
                        {item.uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {item.uploaded ? <Badge variant="secondary">Subida</Badge> : null}
                      </div>

                      {item.error ? <p className="text-sm text-destructive">{item.error}</p> : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                Selecciona varias imágenes para preparar el lote.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkPhotoDialogOpen(false)} disabled={savingBulkPhotos}>
              Cancelar
            </Button>
            <Button onClick={handleSaveBulkPhotos} disabled={savingBulkPhotos || bulkPhotoItems.length === 0}>
              {savingBulkPhotos ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Subir lote
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={photoDialogOpen}
        onOpenChange={(open) => {
          setPhotoDialogOpen(open);
          if (!open) resetPhotoDialog();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPhoto ? "Editar foto" : "Agregar foto"}</DialogTitle>
            <DialogDescription>Sube una imagen y define la categoría para que aparezca en la galería pública.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="photo-title">Título</Label>
              <Input id="photo-title" value={photoForm.title} onChange={(event) => setPhotoForm((current) => ({ ...current, title: event.target.value }))} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="photo-description">Descripción</Label>
              <Textarea id="photo-description" value={photoForm.description} onChange={(event) => setPhotoForm((current) => ({ ...current, description: event.target.value }))} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Categoría</Label>
                <Select value={photoForm.category_id} onValueChange={(value) => setPhotoForm((current) => ({ ...current, category_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="photo-date">Fecha</Label>
                <Input id="photo-date" type="date" value={photoForm.photo_date} onChange={(event) => setPhotoForm((current) => ({ ...current, photo_date: event.target.value }))} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="photo-file">Imagen</Label>
              <Input id="photo-file" ref={photoInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handlePhotoFileChange} />
              <p className="text-xs text-muted-foreground">Formatos permitidos: JPG, PNG, WEBP. Máximo 10 MB.</p>
            </div>

            {photoForm.image_url ? (
              <div className="overflow-hidden rounded-lg border">
                <img src={photoForm.image_url} alt="Vista previa" className="h-56 w-full object-cover" />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPhotoDialogOpen(false)} disabled={savingPhoto}>
              Cancelar
            </Button>
            <Button onClick={handleSavePhoto} disabled={savingPhoto}>
              {savingPhoto ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Guardar foto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={videoDialogOpen}
        onOpenChange={(open) => {
          setVideoDialogOpen(open);
          if (!open) resetVideoDialog();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingVideo ? "Editar video" : "Agregar video"}</DialogTitle>
            <DialogDescription>Publica un MP4 en storage o pega una URL externa de YouTube o Vimeo.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="video-title">Título</Label>
              <Input id="video-title" value={videoForm.title} onChange={(event) => setVideoForm((current) => ({ ...current, title: event.target.value }))} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="video-description">Descripción</Label>
              <Textarea id="video-description" value={videoForm.description} onChange={(event) => setVideoForm((current) => ({ ...current, description: event.target.value }))} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Categoría</Label>
                <Select value={videoForm.category_id} onValueChange={(value) => setVideoForm((current) => ({ ...current, category_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin categoría</SelectItem>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Select value={videoForm.video_type} onValueChange={(value) => setVideoForm((current) => ({ ...current, video_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="highlight">Jugada</SelectItem>
                    <SelectItem value="interview">Entrevista</SelectItem>
                    <SelectItem value="summary">Resumen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Origen del video</Label>
              <Select
                value={videoForm.source_mode}
                onValueChange={(value: "upload" | "external") =>
                  setVideoForm((current) => ({
                    ...current,
                    source_mode: value,
                    video_url: value === "external" ? editingVideo?.video_url || "" : "",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upload">Subir archivo MP4</SelectItem>
                  <SelectItem value="external">Pegar URL externa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {videoForm.source_mode === "upload" ? (
              <div className="grid gap-2">
                <Label htmlFor="video-file">Archivo MP4</Label>
                <Input id="video-file" ref={videoInputRef} type="file" accept="video/mp4" onChange={handleVideoFileChange} />
                <p className="text-xs text-muted-foreground">Tamaño máximo recomendado: 100 MB.</p>
                {editingVideo && !videoFile ? (
                  <p className="text-xs text-muted-foreground">Se conservará el archivo actual si no subes uno nuevo.</p>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="video-url">URL de YouTube o Vimeo</Label>
                <Input id="video-url" placeholder="https://www.youtube.com/watch?v=..." value={videoForm.video_url} onChange={(event) => setVideoForm((current) => ({ ...current, video_url: event.target.value }))} />
              </div>
            )}

            <div className="grid gap-2">
              <Label>Miniatura opcional</Label>
              <Select
                value={videoForm.thumbnail_mode}
                onValueChange={(value: "none" | "upload" | "url") =>
                  setVideoForm((current) => ({
                    ...current,
                    thumbnail_mode: value,
                    thumbnail_url: value === "none" ? "" : current.thumbnail_url,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin miniatura</SelectItem>
                  <SelectItem value="upload">Subir miniatura</SelectItem>
                  <SelectItem value="url">Pegar URL de miniatura</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {videoForm.thumbnail_mode === "upload" ? (
              <div className="grid gap-2">
                <Label htmlFor="thumbnail-file">Archivo de miniatura</Label>
                <Input id="thumbnail-file" ref={thumbnailInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={handleThumbnailFileChange} />
              </div>
            ) : null}

            {videoForm.thumbnail_mode === "url" ? (
              <div className="grid gap-2">
                <Label htmlFor="thumbnail-url">URL de miniatura</Label>
                <Input id="thumbnail-url" placeholder="https://..." value={videoForm.thumbnail_url} onChange={(event) => setVideoForm((current) => ({ ...current, thumbnail_url: event.target.value }))} />
              </div>
            ) : null}

            {videoForm.thumbnail_url ? (
              <div className="overflow-hidden rounded-lg border">
                <img src={videoForm.thumbnail_url} alt="Vista previa de miniatura" className="h-56 w-full object-cover" />
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)} disabled={savingVideo}>
              Cancelar
            </Button>
            <Button onClick={handleSaveVideo} disabled={savingVideo}>
              {savingVideo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Guardar video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={streamDialogOpen}
        onOpenChange={(open) => {
          setStreamDialogOpen(open);
          if (!open) resetStreamDialog();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStream ? "Editar transmisión" : "Agregar transmisión"}</DialogTitle>
            <DialogDescription>Registra links de YouTube o Facebook para eventos programados, en vivo o finalizados.</DialogDescription>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleSaveStream}>
            <div className="grid gap-2">
              <Label htmlFor="stream-title">Título</Label>
              <Input id="stream-title" name="stream_title" ref={streamTitleInputRef} value={streamForm.title} onChange={(event) => setStreamForm((current) => ({ ...current, title: event.target.value }))} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stream-description">Descripción</Label>
              <Textarea id="stream-description" value={streamForm.description} onChange={(event) => setStreamForm((current) => ({ ...current, description: event.target.value }))} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>Plataforma</Label>
                <Select value={streamForm.platform} onValueChange={(value) => setStreamForm((current) => ({ ...current, platform: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="facebook">Facebook Live</SelectItem>
                    <SelectItem value="embedded">Embebido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Estatus</Label>
                <Select value={streamForm.status} onValueChange={(value) => setStreamForm((current) => ({ ...current, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Programado</SelectItem>
                    <SelectItem value="live">En vivo</SelectItem>
                    <SelectItem value="finished">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="stream-scheduled-time">Fecha y hora</Label>
                <Input id="stream-scheduled-time" name="stream_scheduled_time" ref={streamDateTimeInputRef} type="datetime-local" value={streamForm.scheduled_time} onChange={(event) => setStreamForm((current) => ({ ...current, scheduled_time: event.target.value }))} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stream-url">URL</Label>
              <Input id="stream-url" name="stream_url" ref={streamUrlInputRef} placeholder="https://www.youtube.com/watch?v=..." value={streamForm.stream_url} onChange={(event) => setStreamForm((current) => ({ ...current, stream_url: event.target.value }))} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStreamDialogOpen(false)} disabled={savingStream}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingStream}>
                {savingStream ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Guardar transmisión
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
