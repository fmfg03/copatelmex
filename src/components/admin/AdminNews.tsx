import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Newspaper, Star, Calendar, Image, Upload, Loader2, Globe, ExternalLink, Check } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface NewsArticle {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  published_at: string | null;
  is_featured: boolean | null;
  created_at: string | null;
}

interface ImportPreviewData {
  title: string;
  content: string;
  image_url: string | null;
  source_name: string;
  source_url?: string;
}

interface ImportJobRecord {
  status: "pending" | "processing" | "completed" | "failed";
  error_message: string | null;
  result: ImportPreviewData | null;
}

const emptyForm = {
  title: "",
  content: "",
  image_url: "",
  is_featured: false,
};

export const AdminNews = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import state
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importSource, setImportSource] = useState("Claro Sports");
  const [importLoading, setImportLoading] = useState(false);
  const [importPreview, setImportPreview] = useState<ImportPreviewData | null>(null);
  const [importPublishing, setImportPublishing] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from("news")
        .select("*")
        .order("published_at", { ascending: false });
      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error("Error fetching news:", error);
      toast({ title: "Error", description: "No se pudieron cargar las noticias", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

  const pollImportJob = async (jobId: string): Promise<ImportPreviewData> => {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const { data, error } = await (supabase as any)
        .from("news_import_jobs")
        .select("status, error_message, result")
        .eq("id", jobId)
        .single();

      const job = data as ImportJobRecord | null;

      if (error) throw error;

      if (job?.status === "completed" && job.result) {
        return job.result;
      }

      if (job?.status === "failed") {
        throw new Error(job.error_message || "No se pudo importar la nota");
      }

      await wait(1500);
    }

    throw new Error("La importación tardó demasiado. Intenta nuevamente.");
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (article: NewsArticle) => {
    setEditingId(article.id);
    setForm({
      title: article.title,
      content: article.content,
      image_url: article.image_url || "",
      is_featured: article.is_featured || false,
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Archivo inválido", description: "Solo se permiten imágenes", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("news-images")
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("news-images")
        .getPublicUrl(fileName);

      setForm({ ...form, image_url: publicUrl });
      toast({ title: "Imagen subida correctamente" });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({ title: "Error", description: "No se pudo subir la imagen", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast({ title: "Campos requeridos", description: "Título y contenido son obligatorios", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        image_url: form.image_url.trim() || null,
        is_featured: form.is_featured,
        published_at: new Date().toISOString(),
      };

      if (editingId) {
        const { error } = await supabase.from("news").update(payload).eq("id", editingId);
        if (error) throw error;
        toast({ title: "Noticia actualizada" });
      } else {
        const { error } = await supabase.from("news").insert(payload);
        if (error) throw error;
        toast({ title: "Noticia creada" });
      }
      setDialogOpen(false);
      fetchArticles();
    } catch (error) {
      console.error("Error saving news:", error);
      toast({ title: "Error", description: "No se pudo guardar la noticia", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta noticia?")) return;
    try {
      const { error } = await supabase.from("news").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Noticia eliminada" });
      fetchArticles();
    } catch (error) {
      console.error("Error deleting news:", error);
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
    }
  };

  const toggleFeatured = async (article: NewsArticle) => {
    try {
      const { error } = await supabase.from("news").update({ is_featured: !article.is_featured }).eq("id", article.id);
      if (error) throw error;
      fetchArticles();
    } catch (error) {
      console.error("Error toggling featured:", error);
    }
  };

  const handleImportPreview = async () => {
    if (!importUrl.trim()) {
      toast({ title: "URL requerido", description: "Pega la URL del artículo a importar", variant: "destructive" });
      return;
    }
    setImportLoading(true);
    setImportPreview(null);
    try {
      const { data, error } = await supabase.functions.invoke("import-external-news", {
        body: { url: importUrl.trim(), source_name: importSource.trim(), action: "preview" },
      });
      if (error) throw error;
      if (!data?.success || !data?.jobId) throw new Error(data?.error || "No se pudo iniciar la importación");

      const preview = await pollImportJob(data.jobId);
      setImportPreview(preview);
    } catch (error: any) {
      console.error("Import preview error:", error);
      toast({ title: "Error", description: error.message || "No se pudo procesar la URL", variant: "destructive" });
    } finally {
      setImportLoading(false);
    }
  };

  const handleImportPublish = async () => {
    if (!importPreview) return;

    setImportPublishing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("news").insert({
        title: importPreview.title.trim(),
        content: importPreview.content.trim(),
        image_url: importPreview.image_url,
        is_featured: false,
        published_at: new Date().toISOString(),
        author_id: user?.id ?? null,
      });

      if (error) throw error;

      toast({ title: "¡Nota importada!", description: "La noticia se publicó correctamente" });
      setImportDialogOpen(false);
      setImportUrl("");
      setImportPreview(null);
      fetchArticles();
    } catch (error: any) {
      console.error("Import publish error:", error);
      toast({ title: "Error", description: error.message || "No se pudo importar", variant: "destructive" });
    } finally {
      setImportPublishing(false);
    }
  };

  if (loading) return <div className="text-center py-8">Cargando noticias...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Newspaper className="w-6 h-6" />
            Noticias del Torneo
          </h2>
          <p className="text-muted-foreground text-sm">Gestiona las noticias que aparecen en "Lo Último del Torneo"</p>
        </div>
        <div className="flex gap-2">
          {/* Import Dialog */}
          <Dialog open={importDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if (!open) { setImportPreview(null); setImportUrl(""); } }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Globe className="w-4 h-4 mr-2" />
                Importar nota externa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Importar nota de terceros
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="import-source">Fuente / Partner</Label>
                  <Input
                    id="import-source"
                    value={importSource}
                    onChange={(e) => setImportSource(e.target.value)}
                    placeholder="Ej: Claro Sports"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="import-url">URL del artículo</Label>
                  <Input
                    id="import-url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://www.clarosports.com/futbol/..."
                    type="url"
                  />
                </div>
                <Button onClick={handleImportPreview} disabled={importLoading} className="w-full">
                  {importLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Procesando...</>
                  ) : (
                    <><ExternalLink className="w-4 h-4 mr-2" />Vista previa</>
                  )}
                </Button>

                {importPreview && (
                  <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    <h3 className="font-bold text-sm">Vista previa de la nota:</h3>
                    {importPreview.image_url && (
                      <img
                        src={importPreview.image_url}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-md"
                      />
                    )}
                    <p className="font-semibold text-base">{importPreview.title}</p>
                    <div
                      className="text-xs text-muted-foreground max-h-40 overflow-y-auto prose prose-sm dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: importPreview.content.substring(0, 1000) + "..." }}
                    />
                    <Badge variant="secondary" className="text-xs">
                      Cortesía de {importPreview.source_name}
                    </Badge>
                    <Button onClick={handleImportPublish} disabled={importPublishing} className="w-full" variant="default">
                      {importPublishing ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Publicando...</>
                      ) : (
                        <><Check className="w-4 h-4 mr-2" />Publicar nota</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Noticia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Noticia" : "Nueva Noticia"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título de la noticia" />
              </div>
              <div className="space-y-2">
                <Label>Contenido *</Label>
                <RichTextEditor value={form.content} onChange={(html) => setForm({ ...form, content: html })} />
              </div>
              <div className="space-y-2">
                <Label>Imagen</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex-1"
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Subiendo...</>
                    ) : (
                      <><Upload className="w-4 h-4 mr-2" />Subir imagen</>
                    )}
                  </Button>
                </div>
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="O pega una URL de imagen"
                  className="text-xs"
                />
                {form.image_url && (
                  <img src={form.image_url} alt="Preview" className="w-full h-32 object-cover rounded-md mt-1" onError={(e) => (e.currentTarget.style.display = "none")} />
                )}
              </div>
              <div className="flex items-center gap-3">
                <Switch id="is_featured" checked={form.is_featured} onCheckedChange={(checked) => setForm({ ...form, is_featured: checked })} />
                <Label htmlFor="is_featured" className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500" />
                  Marcar como destacada
                </Label>
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? "Guardando..." : editingId ? "Actualizar" : "Publicar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {articles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No hay noticias publicadas.</p>
            <p className="text-sm">Crea tu primera noticia para que aparezca en la sección "Lo Último del Torneo".</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {articles.map((article) => (
            <Card key={article.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-28 h-28 sm:w-36 sm:h-28 flex-shrink-0 overflow-hidden">
                    {article.image_url ? (
                      <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Image className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  {/* Content */}
                  <div className="flex-1 py-3 pr-4 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-sm truncate">{article.title}</h4>
                          {article.is_featured && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              <Star className="w-3 h-3 mr-1 text-amber-500" />
                              Destacada
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs line-clamp-2">{article.content}</p>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2">
                          <Calendar className="w-3 h-3" />
                          {article.published_at
                            ? format(new Date(article.published_at), "d MMM yyyy, HH:mm", { locale: es })
                            : "Sin fecha"}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => toggleFeatured(article)} title={article.is_featured ? "Quitar destacado" : "Destacar"}>
                          <Star className={`w-4 h-4 ${article.is_featured ? "text-amber-500 fill-amber-500" : "text-muted-foreground"}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(article)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(article.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
