import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Pencil, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { optimizeChampionImage } from "@/lib/championImages";
import { fetchAdminChampions, saveChampionDraft, publishChampion, withdrawChampion } from "@/lib/stateChampionsApi";
import { CHAMPION_BUCKET, CHAMPION_CATEGORIES, CHAMPION_LABELS, CHAMPION_STATES, DEFAULT_CHAMPION_FRAMING, completeChampionPhotos, sortChampions, validateChampionImage, type ChampionCategory, type ChampionEntry, type ChampionFraming, type ChampionPhoto, type ChampionPhotos } from "@/lib/stateChampions";

type PendingPhoto = { file?: File; framing: ChampionFraming };
type PendingPhotos = Partial<Record<ChampionCategory, PendingPhoto>>;
const message = (error: unknown) => error instanceof Error ? error.message : "No se pudo completar la operación. Intenta nuevamente.";

function PhotoPreview({ photo, pending, category, onFrame, onFile, onRemove, disabled }: {
  photo?: ChampionPhoto; pending?: PendingPhoto; category: ChampionCategory;
  onFrame: (frame: ChampionFraming) => void; onFile: (file: File) => void; onRemove: () => void; disabled: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const framing = pending?.framing ?? photo?.framing ?? DEFAULT_CHAMPION_FRAMING;
  const label = CHAMPION_LABELS[category];
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    setError(null);
    setPreview(null);
    const timer = window.setTimeout(async () => {
      try {
        let original: Blob | undefined = pending?.file;
        if (!original && photo?.original_path) {
          const result = await supabase.storage.from(CHAMPION_BUCKET).download(photo.original_path);
          if (result.error || !result.data) throw new Error("No se pudo cargar la fotografía original.");
          original = result.data;
        }
        if (!original || !active) return;
        const prepared = await optimizeChampionImage(original, framing);
        if (!active) return;
        objectUrl = URL.createObjectURL(prepared);
        setPreview(objectUrl);
      } catch (cause) { if (active) setError(message(cause)); }
    }, 120);
    return () => { active = false; window.clearTimeout(timer); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [pending?.file, photo?.original_path, framing.zoom, framing.x, framing.y]);
  const hasPhoto = Boolean(pending?.file || photo);
  return <fieldset disabled={disabled} className="min-w-0 space-y-3 rounded-lg border p-3">
    <legend className="px-1 font-semibold">{label}</legend>
    <div className="aspect-[3/2] overflow-hidden rounded-md bg-muted">
      {preview ? <img src={preview} alt={`Vista previa ${label}`} width={900} height={600} className="h-full w-full object-contain" />
        : <p className="flex h-full items-center justify-center p-2 text-center text-sm text-muted-foreground">{hasPhoto ? "Preparando vista previa…" : "Sin fotografía"}</p>}
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Label htmlFor={`champion-file-${category}`}>Fotografía {label}</Label>
    <Input id={`champion-file-${category}`} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) onFile(file); }} />
    {hasPhoto && <>
      {(["zoom", "x", "y"] as const).map((field) => <div key={field}>
        <Label htmlFor={`champion-${field}-${category}`} className="text-sm">{field === "zoom" ? "Acercamiento" : field === "x" ? "Posición horizontal" : "Posición vertical"} {framing[field]}{field === "zoom" ? "×" : "%"}</Label>
        <input id={`champion-${field}-${category}`} type="range" min={field === "zoom" ? 1 : 0} max={field === "zoom" ? 3 : 100} step={field === "zoom" ? 0.1 : 1} value={framing[field]} onChange={(event) => onFrame({ ...framing, [field]: Number(event.target.value) })} className="block w-full accent-primary" />
      </div>)}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => onFrame({ ...DEFAULT_CHAMPION_FRAMING })}>Restablecer encuadre</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onRemove}>Quitar foto</Button>
      </div>
    </>}
  </fieldset>;
}

export function AdminStateChampions() {
  const [entries, setEntries] = useState<ChampionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ChampionEntry | null>(null);
  const [state, setState] = useState("");
  const [draft, setDraft] = useState<ChampionPhotos>({});
  const [pending, setPending] = useState<PendingPhotos>({});
  const [preparing, setPreparing] = useState<Partial<Record<ChampionCategory, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const fileVersions = useRef<Record<ChampionCategory, number>>({ varonil: 0, juvenil: 0, femenil: 0 });

  async function load() {
    setLoading(true);
    setError(null);
    try { setEntries(await fetchAdminChampions()); }
    catch (cause) { setError(message(cause)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  function start(entry: ChampionEntry | null) {
    CHAMPION_CATEGORIES.forEach((category) => fileVersions.current[category]++);
    setEditing(entry); setState(entry?.state ?? ""); setDraft(entry?.draft ?? {});
    setPending({}); setPreparing({}); setDialogError(null); setOpen(true);
  }
  function mergeEntry(entry: ChampionEntry) {
    setEntries((current) => sortChampions([...current.filter((item) => item.id !== entry.id), entry]));
  }
  async function selectFile(category: ChampionCategory, file: File) {
    const validation = validateChampionImage(file);
    if (validation) { setDialogError(validation); return; }
    const version = ++fileVersions.current[category];
    setPreparing((current) => ({ ...current, [category]: true }));
    setDialogError(null);
    try {
      // Decode before admitting a file, including corrupted files with an allowed extension.
      await optimizeChampionImage(file, DEFAULT_CHAMPION_FRAMING);
      if (version === fileVersions.current[category]) setPending((current) => ({ ...current, [category]: { file, framing: { ...DEFAULT_CHAMPION_FRAMING } } }));
    } catch (cause) { if (version === fileVersions.current[category]) setDialogError(message(cause)); }
    finally { if (version === fileVersions.current[category]) setPreparing((current) => ({ ...current, [category]: false })); }
  }
  function removePhoto(category: ChampionCategory) {
    fileVersions.current[category]++;
    setDraft((current) => { const next = { ...current }; delete next[category]; return next; });
    setPending((current) => { const next = { ...current }; delete next[category]; return next; });
    setPreparing((current) => ({ ...current, [category]: false }));
  }
  const busy = saving || Object.values(preparing).some(Boolean);
  const complete = CHAMPION_CATEGORIES.every((category) => pending[category]?.file || draft[category]);

  async function save(publish: boolean) {
    if (busy || !state || (publish && !complete)) return;
    setSaving(true); setDialogError(null);
    const uploaded: string[] = [];
    let mutationAttempted = false;
    try {
      const preparedDraft = { ...draft };
      for (const category of CHAMPION_CATEGORIES) {
        const replacement = pending[category];
        if (!replacement) continue;
        let original: Blob;
        let originalPath = draft[category]?.original_path;
        const folder = `champions/${crypto.randomUUID()}/${category}`;
        if (replacement.file) {
          original = replacement.file;
          const extension = original.type === "image/jpeg" ? "jpg" : original.type === "image/png" ? "png" : "webp";
          originalPath = `${folder}/original.${extension}`;
          const result = await supabase.storage.from(CHAMPION_BUCKET).upload(originalPath, original, { contentType: original.type, upsert: false });
          if (result.error) throw new Error("No se pudo subir la fotografía original. Intenta nuevamente.");
          uploaded.push(originalPath);
        } else {
          const result = await supabase.storage.from(CHAMPION_BUCKET).download(originalPath);
          if (result.error || !result.data) throw new Error("No se pudo recuperar el original para ajustar el encuadre.");
          original = result.data;
        }
        const optimized = await optimizeChampionImage(original, replacement.framing);
        const extension = optimized.type === "image/webp" ? "webp" : "png";
        const imagePath = `${folder}/banner.${extension}`;
        const result = await supabase.storage.from(CHAMPION_BUCKET).upload(imagePath, optimized, { contentType: optimized.type, upsert: false });
        if (result.error) throw new Error("No se pudo subir la fotografía del banner. Intenta nuevamente.");
        uploaded.push(imagePath);
        preparedDraft[category] = { original_path: originalPath, image_path: imagePath, framing: replacement.framing };
      }
      mutationAttempted = true;
      const saved = await saveChampionDraft({ id: editing?.id, state, draft: preparedDraft, expectedUpdatedAt: editing?.updated_at });
      mergeEntry(saved); setEditing(saved); setDraft(saved.draft); setPending({});
      if (publish) mergeEntry(await publishChampion(saved.id, saved.updated_at));
      setOpen(false);
    } catch (cause) {
      // Once a metadata request was sent, a network error may hide a committed save.
      // Retain its immutable assets instead of deleting a possibly referenced image.
      if (!mutationAttempted && uploaded.length) await supabase.storage.from(CHAMPION_BUCKET).remove(uploaded);
      setDialogError(message(cause));
    } finally { setSaving(false); }
  }
  async function withdraw(entry: ChampionEntry) {
    if (saving) return;
    setSaving(true); setError(null);
    try { mergeEntry(await withdrawChampion(entry.id, entry.updated_at)); }
    catch (cause) { setError(message(cause)); }
    finally { setSaving(false); }
  }
  async function publish(entry: ChampionEntry) {
    if (saving || !completeChampionPhotos(entry.draft)) return;
    setSaving(true); setError(null);
    try { mergeEntry(await publishChampion(entry.id, entry.updated_at)); }
    catch (cause) { setError(message(cause)); }
    finally { setSaving(false); }
  }

  return <div className="space-y-6" data-testid="admin-state-champions">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="text-2xl font-bold">Campeones estatales</h2><p className="text-sm text-muted-foreground">Carga las tres categorías de cada estado y revisa el encuadre antes de publicar.</p></div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void load()} disabled={loading || saving}>Recargar estados</Button>
        <Button onClick={() => start(null)} disabled={loading || saving || Boolean(error)}><ImagePlus className="mr-2 h-4 w-4" />Agregar estado</Button>
      </div>
    </div>
    <p className="text-sm text-muted-foreground">Guardar un borrador no cambia el banner. Las fotografías cargadas tienen enlaces públicos, igual que en la galería.</p>
    {error && <div role="alert" className="rounded-lg border border-destructive p-4 text-destructive">{error}</div>}
    {loading ? <p role="status">Cargando estados…</p> : !error && entries.length === 0 ? <p>No hay campeones registrados. Agrega el primer estado.</p> : null}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {entries.map((entry) => <Card key={entry.id}>
        <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" />{entry.state}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="font-medium">{entry.published ? "Publicado" : "Borrador"}</p>
          <p className="text-sm text-muted-foreground">{CHAMPION_CATEGORIES.filter((category) => entry.draft[category]).length} / 3 fotografías en borrador</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" disabled={saving} onClick={() => start(entry)}><Pencil className="mr-1 h-4 w-4" />Editar {entry.state}</Button>
            <Button size="sm" disabled={saving || !completeChampionPhotos(entry.draft)} onClick={() => void publish(entry)}>Publicar {entry.state}</Button>
            {entry.published && <Button variant="outline" size="sm" disabled={saving} onClick={() => void withdraw(entry)}>Retirar {entry.state}</Button>}
          </div>
        </CardContent>
      </Card>)}
    </div>
    <Dialog open={open} onOpenChange={(value) => { if (!busy) { setOpen(value); if (!value) CHAMPION_CATEGORIES.forEach((category) => fileVersions.current[category]++); } }}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto" onInteractOutside={(event) => { if (busy) event.preventDefault(); }} onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }}>
        <DialogHeader><DialogTitle>{editing ? `Editar campeones de ${editing.state}` : "Agregar campeones de un estado"}</DialogTitle><DialogDescription>JPG, PNG o WebP, hasta 10 MB por foto. El ajuste inicial conserva la fotografía completa.</DialogDescription></DialogHeader>
        {dialogError && <p role="alert" className="text-sm text-destructive">{dialogError} Si otra persona cambió el registro, cierra esta ventana y recarga los estados antes de editar nuevamente.</p>}
        <div className="space-y-2"><Label htmlFor="champion-state">Estado</Label>
          <select id="champion-state" value={state} disabled={Boolean(editing) || busy} onChange={(event) => setState(event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Selecciona un estado</option>
            {CHAMPION_STATES.filter((name) => name === editing?.state || !entries.some((entry) => entry.state === name)).map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-3">{CHAMPION_CATEGORIES.map((category) => <PhotoPreview key={`${editing?.id ?? "new"}-${category}`} category={category} photo={draft[category]} pending={pending[category]} disabled={busy}
          onFile={(file) => void selectFile(category, file)} onRemove={() => removePhoto(category)}
          onFrame={(framing) => setPending((current) => ({ ...current, [category]: { ...current[category], framing } }))} />)}</div>
        {!complete && <p className="text-sm text-muted-foreground">Completa Varonil, Juvenil y Femenil para publicar. Puedes guardar un borrador incompleto.</p>}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="outline" disabled={busy || !state} onClick={() => void save(false)}>Guardar borrador</Button>
          <Button disabled={busy || !state || !complete} onClick={() => void save(true)}>{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Publicar estado</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>;
}
