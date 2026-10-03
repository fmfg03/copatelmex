import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRepresentatives, representativeQueryKey } from "@/hooks/useRepresentatives";
import { representativeStates } from "@/lib/representativeStates";
import { birthdayToDisplay, emptyRepresentativeForm, filterRepresentatives, formFromRepresentative, saveRepresentativeArgs, stateName } from "@/lib/representativeDirectory";
import type { Representative, RepresentativeForm } from "@/lib/representativeDirectory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

function errorMessage(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? error.code : null;
  if (code === "23505") return "Ya existe un contacto con ese estado, zona, nombre y correo.";
  if (code === "40001") return "El registro cambió. Cierra el formulario y actualiza la lista antes de guardar.";
  if (code === "42501") return "No tienes permisos para modificar representantes.";
  if (error instanceof Error) return error.message;
  return "No se pudo guardar el representante. Revisa los datos e intenta nuevamente.";
}

export function AdminRepresentatives({ canManage }: { canManage: boolean }) {
  const query = useRepresentatives(true);
  const client = useQueryClient();
  const [search, setSearch] = useState("");
  const [state, setState] = useState("all");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Representative | null>(null);
  const [form, setForm] = useState<RepresentativeForm>({ ...emptyRepresentativeForm });
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<Representative | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const rows = (query.data || []) as Representative[];
  const filtered = filterRepresentatives(rows, search, state, status);
  const refresh = () => client.invalidateQueries({ queryKey: representativeQueryKey });

  const edit = (row: Representative | null) => {
    setEditing(row);
    setForm(row ? formFromRepresentative(row) : { ...emptyRepresentativeForm });
    setFormError(null);
    setOpen(true);
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManage || saving) return;
    setSaving(true);
    setFormError(null);
    try {
      const { error } = await supabase.rpc("save_state_representative", saveRepresentativeArgs(form, editing));
      if (error) throw error;
      setOpen(false);
      toast({ title: editing ? "Representante actualizado" : "Representante creado" });
      await refresh();
    } catch (error) {
      setFormError(errorMessage(error));
    } finally { setSaving(false); }
  };
  const toggleActive = async () => {
    if (!canManage || !confirmation || saving) return;
    setSaving(true);
    try {
      const args = saveRepresentativeArgs({ ...formFromRepresentative(confirmation), is_active: !confirmation.is_active }, confirmation);
      const { error } = await supabase.rpc("save_state_representative", args);
      if (error) throw error;
      toast({ title: confirmation.is_active ? "Representante dado de baja" : "Representante reactivado" });
      setConfirmation(null);
      await refresh();
    } catch (error) {
      toast({ title: "No se pudo cambiar el estado", description: errorMessage(error), variant: "destructive" });
    } finally { setSaving(false); }
  };
  const textField = (key: keyof RepresentativeForm, label: string, type = "text", placeholder?: string) => (
    <div className="space-y-2" key={key}>
      <Label htmlFor={`representative-${key}`}>{label}</Label>
      <Input id={`representative-${key}`} type={type} placeholder={placeholder} value={String(form[key])}
        required={key === "name" || key === "email"} disabled={saving}
        maxLength={key.includes("birthday") ? 5 : key === "phone" ? 40 : key === "zone" ? 120 : key === "email" ? 254 : 200}
        onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))} />
    </div>
  );

  return <section className="space-y-5" aria-label="Representantes estatales">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-bold">Representantes estatales</h2><p className="text-sm text-muted-foreground">Contactos del torneo por estado y zona. Cónyuge y cumpleaños son de consulta interna.</p></div>
      {canManage && <Button onClick={() => edit(null)}>Agregar representante</Button>}
    </div>
    <div className="grid gap-3 md:grid-cols-3">
      <div><Label htmlFor="representative-search">Buscar</Label><Input id="representative-search" placeholder="Nombre, estado, zona o correo" value={search} onChange={event => setSearch(event.target.value)} /></div>
      <div><Label htmlFor="representative-state-filter">Estado</Label><select id="representative-state-filter" className="h-10 w-full rounded-md border bg-background px-3" value={state} onChange={event => setState(event.target.value)}><option value="all">Todos los estados</option>{representativeStates.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></div>
      <div><Label htmlFor="representative-status-filter">Situación</Label><select id="representative-status-filter" className="h-10 w-full rounded-md border bg-background px-3" value={status} onChange={event => setStatus(event.target.value)}><option value="all">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select></div>
    </div>
    <Button variant="outline" disabled={query.isFetching || saving} onClick={() => query.refetch()}>Actualizar lista</Button>
    {query.isPending ? <p role="status">Cargando representantes…</p> : query.isError ? <p role="alert">No se pudo cargar el directorio. Actualiza la lista para reintentar.</p> : <>
      <p className="text-sm text-muted-foreground">{filtered.length} representantes</p>
      <Table><TableHeader><TableRow>{["Estado", "Zona", "Representante", "Correo", "Teléfono", "Cónyuge", "Cumpleaños representante", "Cumpleaños cónyuge", "Situación", ...(canManage ? ["Acciones"] : [])].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{filtered.length ? filtered.map(row => <TableRow key={row.id}>
          <TableCell>{stateName(row.state_slug)}</TableCell><TableCell>{row.zone || "Estatal"}</TableCell><TableCell>{row.name}</TableCell><TableCell>{row.email}</TableCell><TableCell>{row.phone || "—"}</TableCell>
          <TableCell>{row.representative_personal_details?.spouse_name || "—"}</TableCell><TableCell>{birthdayToDisplay(row.representative_personal_details?.representative_birthday) || "—"}</TableCell><TableCell>{birthdayToDisplay(row.representative_personal_details?.spouse_birthday) || "—"}</TableCell>
          <TableCell><Badge variant="outline" className={row.is_active ? "bg-primary text-white border-transparent" : "bg-muted text-foreground"}>{row.is_active ? "Activo" : "Inactivo"}</Badge></TableCell>
          {canManage && <TableCell><div className="flex gap-2"><Button size="sm" variant="outline" disabled={saving} onClick={() => edit(row)}>Editar</Button><Button size="sm" variant="outline" disabled={saving} onClick={() => setConfirmation(row)}>{row.is_active ? "Dar de baja" : "Reactivar"}</Button></div></TableCell>}
        </TableRow>) : <TableRow><TableCell colSpan={canManage ? 10 : 9}>No hay representantes con estos filtros.</TableCell></TableRow>}</TableBody>
      </Table>
    </>}
    <Dialog open={open} onOpenChange={value => { if (!saving) { setOpen(value); if (!value) { setForm({ ...emptyRepresentativeForm }); setEditing(null); } } }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{editing ? "Editar representante" : "Agregar representante"}</DialogTitle></DialogHeader>
      <form onSubmit={save} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="representative-state">Estado *</Label><select id="representative-state" required disabled={saving} className="h-10 w-full rounded-md border bg-background px-3" value={form.state_slug} onChange={event => setForm(current => ({ ...current, state_slug: event.target.value }))}><option value="">Selecciona un estado</option>{representativeStates.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></div>
        {textField("zone", "Zona (opcional)")}{textField("name", "Nombre del representante *")}{textField("email", "Correo *", "email")}{textField("phone", "Teléfono (opcional)", "tel")}
        {textField("spouse_name", "Nombre del cónyuge (opcional)")}{textField("representative_birthday", "Cumpleaños del representante (opcional)", "text", "DD/MM")}{textField("spouse_birthday", "Cumpleaños del cónyuge (opcional)", "text", "DD/MM")}
      </div><p className="text-sm text-muted-foreground">Cumpleaños: día y mes, sin año. Los datos del cónyuge y los cumpleaños no se publican.</p>
        {formError && <p role="alert" className="text-destructive">{formError}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={saving} onClick={() => setOpen(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button></div>
      </form>
    </DialogContent></Dialog>
    <Dialog open={!!confirmation} onOpenChange={value => { if (!value && !saving) setConfirmation(null); }}><DialogContent><DialogHeader><DialogTitle>{confirmation?.is_active ? "Dar de baja al representante" : "Reactivar al representante"}</DialogTitle></DialogHeader><p>{confirmation?.name}: {confirmation?.is_active ? "dejará de aparecer en el mapa público. Se conservarán sus datos." : "volverá a aparecer en el mapa público."}</p><div className="flex justify-end gap-2"><Button variant="outline" disabled={saving} onClick={() => setConfirmation(null)}>Cancelar</Button><Button disabled={saving} onClick={toggleActive}>{saving ? "Guardando…" : "Confirmar"}</Button></div></DialogContent></Dialog>
  </section>;
}
