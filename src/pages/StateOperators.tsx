import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MexicoMap } from "@/components/MexicoMap";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin } from "lucide-react";
import { useRepresentatives } from "@/hooks/useRepresentatives";
import { groupPublicContacts, stateName } from "@/lib/representativeDirectory";
import { representativeStates } from "@/lib/representativeStates";

const StateOperators = () => {
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const query = useRepresentatives();
  const contacts = groupPublicContacts(query.data || []);
  const activeState = selectedState || hoveredState;
  const operators = activeState ? contacts[activeState] || [] : [];
  return <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-1 pt-24 pb-16"><div className="container mx-auto px-4">
      <div className="text-center mb-12"><h1 className="text-3xl md:text-5xl font-black text-secondary dark:text-white mb-4 font-display">Inscribe a tu Equipo</h1><p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">Selecciona tu estado para conocer al operador del torneo en tu región</p></div>
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
        <div className="xl:col-span-3"><div className="bg-card rounded-2xl p-4 md:p-6 shadow-lg border"><MexicoMap onStateHover={setHoveredState} onStateClick={setSelectedState} hoveredState={hoveredState} /></div>
          <div className="mt-4 max-w-md mx-auto space-y-2"><Label htmlFor="public-operator-state">Selecciona un estado</Label><select id="public-operator-state" className="h-10 w-full rounded-md border bg-background px-3" value={selectedState || ""} onChange={event => setSelectedState(event.target.value || null)}><option value="">Selecciona un estado</option>{representativeStates.map(state => <option key={state.slug} value={state.slug}>{state.name}</option>)}</select></div>
        </div>
        <div className="xl:col-span-1 xl:sticky xl:top-24"><Card><CardContent className="p-6">
          {query.isPending ? <p role="status">Cargando contactos…</p> : query.isError ? <div role="alert" className="space-y-3"><p>No se pudieron cargar los contactos.</p><Button onClick={() => query.refetch()} disabled={query.isFetching}>Reintentar</Button></div> : activeState ? <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b"><MapPin className="w-6 h-6 text-primary" /><div><h2 className="font-bold text-xl text-secondary dark:text-white">{stateName(activeState)}</h2><p className="text-sm text-muted-foreground">Operador del Torneo</p></div></div>
            {!operators.length ? <p>No hay un operador activo publicado para este estado.</p> : operators.map(operator => <div key={operator.id} className="space-y-3 border-b pb-4 last:border-0">
              {operator.zone && <p className="text-xs font-semibold text-primary uppercase tracking-wide">{operator.zone}</p>}
              <p className="font-semibold text-secondary dark:text-white">{operator.name}</p>
              <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-primary shrink-0" /><a href={`mailto:${operator.email}`} className="text-primary hover:underline break-all">{operator.email}</a></div>
              {operator.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary shrink-0" /><a href={`tel:${operator.phone.replace(/[^+0-9]/g, "")}`} className="text-primary hover:underline">{operator.phone}</a></div>}
              <a href={`mailto:${operator.email}?subject=${encodeURIComponent(`Inscripción Copa Telmex Telcel - ${stateName(activeState)}${operator.zone ? ` (${operator.zone})` : ""}`)}`} className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg"><Mail className="w-4 h-4" />Contactar Operador</a>
            </div>)}
          </div> : <div className="text-center py-8"><MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" /><p className="text-muted-foreground">Selecciona un estado en el mapa para ver la información del operador</p></div>}
        </CardContent></Card></div>
      </div>
    </div></main><Footer />
  </div>;
};
export default StateOperators;
