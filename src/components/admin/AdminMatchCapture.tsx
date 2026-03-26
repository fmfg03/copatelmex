import { useState, useEffect, useCallback, useMemo } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  CalendarIcon, ClipboardList, Save, Loader2, Plus, Trash2,
  Users, Target, Square, AlertTriangle, ArrowRightLeft, CheckCircle,
  ChevronRight, BarChart3,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface MatchRow {
  id: string;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  status: string | null;
  phase: string | null;
  field_number: string | null;
  category_id: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_team: { id: string; team_name: string } | null;
  away_team: { id: string; team_name: string } | null;
  category: { id: string; name: string } | null;
}

interface PlayerRow {
  id: string;
  first_name: string;
  paternal_surname: string | null;
  maternal_surname: string | null;
  jersey_number: number | null;
  position: string | null;
  documents_verified: boolean | null;
}

interface MatchEvent {
  id?: string;
  event_type: string;
  player_id: string;
  team_id: string;
  minute: number | null;
  notes: string | null;
  related_player_id: string | null;
}

interface LineupPlayer {
  player_id: string;
  jersey_number: number | null;
  is_starter: boolean;
  position: string | null;
}

const EVENT_TYPES = [
  { value: "goal", label: "Gol", icon: Target, color: "text-green-600" },
  { value: "own_goal", label: "Autogol", icon: Target, color: "text-red-600" },
  { value: "yellow_card", label: "Tarjeta Amarilla", icon: Square, color: "text-yellow-500" },
  { value: "red_card", label: "Tarjeta Roja", icon: Square, color: "text-red-600" },
  { value: "substitution_in", label: "Entra (Cambio)", icon: ArrowRightLeft, color: "text-blue-500" },
  { value: "substitution_out", label: "Sale (Cambio)", icon: ArrowRightLeft, color: "text-orange-500" },
];

// ─── Workflow steps ──────────────────────────────────────────────────────────
type WorkflowStep = "select_date" | "capture_results" | "publish_stats";

const STEPS: { key: WorkflowStep; label: string; icon: React.ElementType }[] = [
  { key: "select_date", label: "Seleccionar Fecha", icon: CalendarIcon },
  { key: "capture_results", label: "Capturar Resultados", icon: ClipboardList },
  { key: "publish_stats", label: "Publicar Estadística", icon: BarChart3 },
];

// ─── Component ───────────────────────────────────────────────────────────────
export const AdminMatchCapture = () => {
  const [step, setStep] = useState<WorkflowStep>("select_date");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [allMatches, setAllMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(false);

  // Match detail state
  const [selectedMatch, setSelectedMatch] = useState<MatchRow | null>(null);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Score
  const [homeScore, setHomeScore] = useState<string>("0");
  const [awayScore, setAwayScore] = useState<string>("0");
  const [refereeName, setRefereeName] = useState("");
  const [matchNotes, setMatchNotes] = useState("");

  // Lineups
  const [homePlayers, setHomePlayers] = useState<PlayerRow[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<PlayerRow[]>([]);
  const [homeLineup, setHomeLineup] = useState<LineupPlayer[]>([]);
  const [awayLineup, setAwayLineup] = useState<LineupPlayer[]>([]);

  // Events
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<MatchEvent>({
    event_type: "goal", player_id: "", team_id: "", minute: null, notes: null, related_player_id: null,
  });

  // Publishing
  const [publishing, setPublishing] = useState(false);

  // ─── Data fetching ─────────────────────────────────────────────────────────
  const fetchAllMatches = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("matches")
        .select(`
          id, match_date, home_score, away_score, status, phase, field_number,
          category_id, home_team_id, away_team_id,
          home_team:teams!matches_home_team_id_fkey(id, team_name),
          away_team:teams!matches_away_team_id_fkey(id, team_name),
          category:categories(id, name)
        `)
        .order("match_date", { ascending: true });
      if (error) throw error;

      setAllMatches((data || []).map((m: any) => ({
        ...m,
        home_team: Array.isArray(m.home_team) ? m.home_team[0] : m.home_team,
        away_team: Array.isArray(m.away_team) ? m.away_team[0] : m.away_team,
        category: Array.isArray(m.category) ? m.category[0] : m.category,
      })));
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAllMatches(); }, [fetchAllMatches]);

  // ─── Computed: dates that have matches ─────────────────────────────────────
  const matchDates = useMemo(() => {
    const dates = new Set<string>();
    allMatches.forEach(m => {
      dates.add(format(parseISO(m.match_date), "yyyy-MM-dd"));
    });
    return dates;
  }, [allMatches]);

  // ─── Computed: matches for selected date ───────────────────────────────────
  const dayMatches = useMemo(() => {
    if (!selectedDate) return [];
    return allMatches.filter(m => isSameDay(parseISO(m.match_date), selectedDate))
      .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
  }, [allMatches, selectedDate]);

  const pendingMatches = dayMatches.filter(m => m.status !== "finished");
  const finishedMatches = dayMatches.filter(m => m.status === "finished");

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const fetchTeamPlayers = async (teamId: string, categoryId: string): Promise<PlayerRow[]> => {
    const { data: regs } = await supabase
      .from("registrations").select("id").eq("team_id", teamId).eq("category_id", categoryId);
    if (!regs || regs.length === 0) return [];
    const regIds = regs.map(r => r.id);
    const { data: players } = await supabase
      .from("players")
      .select("id, first_name, paternal_surname, maternal_surname, jersey_number, position, documents_verified")
      .in("registration_id", regIds)
      .order("jersey_number", { ascending: true, nullsFirst: false });
    return (players || []) as PlayerRow[];
  };

  const getPlayerName = (playerId: string) => {
    const all = [...homePlayers, ...awayPlayers];
    const p = all.find(p => p.id === playerId);
    if (!p) return "Desconocido";
    return `#${p.jersey_number || "?"} ${p.first_name} ${p.paternal_surname || ""}`.trim();
  };

  // ─── Open match capture dialog ─────────────────────────────────────────────
  const openMatchCapture = async (match: MatchRow) => {
    setSelectedMatch(match);
    setHomeScore(String(match.home_score ?? 0));
    setAwayScore(String(match.away_score ?? 0));
    setRefereeName(""); setMatchNotes("");
    setEvents([]); setHomeLineup([]); setAwayLineup([]);

    if (match.home_team && match.category) {
      const hp = await fetchTeamPlayers(match.home_team.id, match.category.id);
      setHomePlayers(hp);
    }
    if (match.away_team && match.category) {
      const ap = await fetchTeamPlayers(match.away_team.id, match.category.id);
      setAwayPlayers(ap);
    }

    // Load existing events
    const { data: existingEvents } = await supabase
      .from("match_events" as any).select("*").eq("match_id", match.id).order("minute", { ascending: true });
    if (existingEvents) setEvents(existingEvents as any[]);

    // Load existing lineups
    const { data: existingLineups } = await supabase
      .from("match_lineups" as any).select("player_id, jersey_number, is_starter, position, team_id").eq("match_id", match.id);
    if (existingLineups && match.home_team && match.away_team) {
      setHomeLineup((existingLineups as any[]).filter((l: any) => l.team_id === match.home_team!.id).map((l: any) => ({
        player_id: l.player_id, jersey_number: l.jersey_number, is_starter: l.is_starter, position: l.position,
      })));
      setAwayLineup((existingLineups as any[]).filter((l: any) => l.team_id === match.away_team!.id).map((l: any) => ({
        player_id: l.player_id, jersey_number: l.jersey_number, is_starter: l.is_starter, position: l.position,
      })));
    }

    // Load existing cedula data
    const { data: cedula } = await supabase
      .from("match_cedulas").select("referee_name, notes").eq("match_id", match.id).maybeSingle();
    if (cedula) {
      setRefereeName(cedula.referee_name || "");
      setMatchNotes(cedula.notes || "");
    }

    setMatchDialogOpen(true);
  };

  // ─── Lineup toggle ─────────────────────────────────────────────────────────
  const toggleLineupPlayer = (player: PlayerRow, side: "home" | "away", isStarter: boolean) => {
    const setLineup = side === "home" ? setHomeLineup : setAwayLineup;
    setLineup(prev => {
      const exists = prev.find(l => l.player_id === player.id);
      if (exists) return prev.filter(l => l.player_id !== player.id);
      return [...prev, { player_id: player.id, jersey_number: player.jersey_number, is_starter: isStarter, position: player.position }];
    });
  };

  // ─── Events ────────────────────────────────────────────────────────────────
  const addEvent = () => {
    if (!newEvent.player_id || !newEvent.team_id) {
      toast({ title: "Error", description: "Selecciona un jugador", variant: "destructive" }); return;
    }
    setEvents(prev => [...prev, { ...newEvent }]);
    setNewEvent({ event_type: "goal", player_id: "", team_id: "", minute: null, notes: null, related_player_id: null });
    setAddEventOpen(false);
  };

  const removeEvent = (index: number) => setEvents(prev => prev.filter((_, i) => i !== index));

  // ─── Save match ────────────────────────────────────────────────────────────
  const saveMatchData = async () => {
    if (!selectedMatch) return;
    setSaving(true);
    try {
      // Update match score & status
      const { error: matchError } = await supabase.from("matches").update({
        home_score: parseInt(homeScore) || 0, away_score: parseInt(awayScore) || 0, status: "finished",
      }).eq("id", selectedMatch.id);
      if (matchError) throw matchError;

      // Save lineups
      await supabase.from("match_lineups" as any).delete().eq("match_id", selectedMatch.id);
      const lineupInserts: any[] = [];
      if (selectedMatch.home_team) homeLineup.forEach(l => lineupInserts.push({
        match_id: selectedMatch.id, team_id: selectedMatch.home_team!.id,
        player_id: l.player_id, jersey_number: l.jersey_number, is_starter: l.is_starter, position: l.position,
      }));
      if (selectedMatch.away_team) awayLineup.forEach(l => lineupInserts.push({
        match_id: selectedMatch.id, team_id: selectedMatch.away_team!.id,
        player_id: l.player_id, jersey_number: l.jersey_number, is_starter: l.is_starter, position: l.position,
      }));
      if (lineupInserts.length > 0) {
        const { error } = await supabase.from("match_lineups" as any).insert(lineupInserts);
        if (error) throw error;
      }

      // Save events
      await supabase.from("match_events" as any).delete().eq("match_id", selectedMatch.id);
      if (events.length > 0) {
        const eventInserts = events.map(e => ({
          match_id: selectedMatch.id, player_id: e.player_id, team_id: e.team_id,
          event_type: e.event_type, minute: e.minute, notes: e.notes, related_player_id: e.related_player_id,
        }));
        const { error } = await supabase.from("match_events" as any).insert(eventInserts);
        if (error) throw error;
      }

      // Update player_stats
      await supabase.from("player_stats").delete().eq("match_id", selectedMatch.id);
      const statsMap = new Map<string, { goals: number; yellow_cards: number; red_cards: number; assists: number }>();
      events.forEach(e => {
        if (!statsMap.has(e.player_id)) statsMap.set(e.player_id, { goals: 0, yellow_cards: 0, red_cards: 0, assists: 0 });
        const s = statsMap.get(e.player_id)!;
        if (e.event_type === "goal") s.goals++;
        if (e.event_type === "yellow_card") s.yellow_cards++;
        if (e.event_type === "red_card") s.red_cards++;
      });
      if (statsMap.size > 0) {
        const statsInserts = Array.from(statsMap.entries()).map(([playerId, s]) => ({
          match_id: selectedMatch.id, player_id: playerId, ...s,
        }));
        const { error } = await supabase.from("player_stats").insert(statsInserts);
        if (error) throw error;
      }

      // Upsert cedula
      await supabase.from("match_cedulas").upsert({
        match_id: selectedMatch.id,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id || "",
        referee_name: refereeName || null, notes: matchNotes || null, status: "captured",
      }, { onConflict: "match_id" });

      toast({ title: "Partido guardado", description: "Resultado, alineaciones y eventos guardados correctamente" });
      setMatchDialogOpen(false);
      fetchAllMatches();
    } catch (error: any) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // ─── Publish stats ──
  const publishStats = async () => {
    setPublishing(true);
    try {
      const categoryIds = [...new Set(dayMatches.filter(m => m.category).map(m => m.category!.id))];
      for (const catId of categoryIds) {
        await supabase.rpc("update_team_standings", { p_category_id: catId });
      }
      toast({
        title: "Estadísticas publicadas",
        description: `Tablas de posiciones actualizadas para ${categoryIds.length} categoría(s).`,
      });
      setStep("select_date");
    } catch (error: any) {
      toast({ title: "Error al publicar", description: error.message, variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  // ─── Lineup view helpers ───────────────────────────────────────────────────
  const allLineupPlayers = (side: "home" | "away") => {
    const lineup = side === "home" ? homeLineup : awayLineup;
    const players = side === "home" ? homePlayers : awayPlayers;
    return players.map(p => ({
      ...p,
      inLineup: lineup.some(l => l.player_id === p.id),
      isStarter: lineup.find(l => l.player_id === p.id)?.is_starter ?? false,
    }));
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        <p className="text-muted-foreground">Cargando partidos...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stepper */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {STEPS.map((s, idx) => {
              const StepIcon = s.icon;
              const isActive = step === s.key;
              const stepIndex = STEPS.findIndex(st => st.key === step);
              const isDone = idx < stepIndex;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const targetIdx = STEPS.findIndex(st => st.key === s.key);
                      if (targetIdx <= stepIndex || s.key === "select_date") setStep(s.key);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium",
                      isActive && "bg-primary text-primary-foreground",
                      isDone && "bg-primary/10 text-primary",
                      !isActive && !isDone && "text-muted-foreground",
                    )}
                  >
                    <StepIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{idx + 1}</span>
                  </button>
                  {idx < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Select Date */}
      {step === "select_date" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              ¿Qué día se juega?
            </CardTitle>
            <CardDescription>
              Selecciona la fecha para ver los partidos programados. Los días con partidos están resaltados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-[280px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className={cn("p-3 pointer-events-auto")}
                      modifiers={{ hasMatch: (date) => matchDates.has(format(date, "yyyy-MM-dd")) }}
                      modifiersClassNames={{ hasMatch: "bg-primary/20 font-bold text-primary" }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {selectedDate && (
                <div className="flex-1">
                  <h3 className="font-semibold mb-3">
                    Partidos del {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                    <Badge className="ml-2" variant="outline">{dayMatches.length} partidos</Badge>
                  </h3>
                  {dayMatches.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No hay partidos programados para esta fecha.</p>
                  ) : (
                    <>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {dayMatches.map(m => (
                          <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 text-sm">
                            <span className="text-xs text-muted-foreground w-12">
                              {format(parseISO(m.match_date), "HH:mm")}
                            </span>
                            <Badge variant="outline" className="text-xs">{m.category?.name || "-"}</Badge>
                            <span className="font-medium">{m.home_team?.team_name || "TBD"}</span>
                            <span className="text-muted-foreground">vs</span>
                            <span className="font-medium">{m.away_team?.team_name || "TBD"}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{m.field_number ? `Campo ${m.field_number}` : ""}</span>
                            {m.status === "finished" && <Badge className="bg-green-600 text-xs">✓</Badge>}
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button onClick={() => setStep("capture_results")}>
                          Siguiente: Capturar Resultados <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Capture Results */}
      {step === "capture_results" && selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Capturar Resultados
            </CardTitle>
            <CardDescription>
              {format(selectedDate, "EEEE d 'de' MMMM yyyy", { locale: es })} — Haz clic en un partido para capturar el resultado completo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dayMatches.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay partidos para esta fecha</p>
            ) : (
              <>
                <div className="mb-4 flex items-center gap-4">
                  <Badge variant="outline" className="text-sm">
                    {finishedMatches.length} / {dayMatches.length} capturados
                  </Badge>
                  {finishedMatches.length === dayMatches.length && (
                    <Badge className="bg-green-600 text-sm">✓ Todos los partidos capturados</Badge>
                  )}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead className="text-center">Marcador</TableHead>
                      <TableHead>Visitante</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dayMatches.map(m => (
                      <TableRow key={m.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openMatchCapture(m)}>
                        <TableCell className="text-sm">{format(parseISO(m.match_date), "HH:mm")}</TableCell>
                        <TableCell><Badge variant="outline">{m.category?.name || "-"}</Badge></TableCell>
                        <TableCell className="font-medium">{m.home_team?.team_name || "TBD"}</TableCell>
                        <TableCell className="text-center font-bold">
                          {m.status === "finished" ? `${m.home_score} - ${m.away_score}` : "vs"}
                        </TableCell>
                        <TableCell className="font-medium">{m.away_team?.team_name || "TBD"}</TableCell>
                        <TableCell>
                          {m.status === "finished"
                            ? <Badge className="bg-green-600">Capturado</Badge>
                            : <Badge variant="outline">Pendiente</Badge>}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); openMatchCapture(m); }}>
                            <ClipboardList className="w-4 h-4 mr-1" /> {m.status === "finished" ? "Editar" : "Capturar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-6 flex gap-2">
                  <Button variant="outline" onClick={() => setStep("select_date")}>Atrás</Button>
                  <Button
                    onClick={() => setStep("publish_stats")}
                    disabled={finishedMatches.length === 0}
                  >
                    Siguiente: Publicar Estadística <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Publish Stats */}
      {step === "publish_stats" && selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Publicar Estadística
            </CardTitle>
            <CardDescription>
              Revisa el resumen del día y publica las tablas de posiciones actualizadas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold">{dayMatches.length}</p>
                    <p className="text-xs text-muted-foreground">Partidos del día</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-green-600">{finishedMatches.length}</p>
                    <p className="text-xs text-muted-foreground">Capturados</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-orange-500">{pendingMatches.length}</p>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold">
                      {[...new Set(dayMatches.filter(m => m.category).map(m => m.category!.id))].length}
                    </p>
                    <p className="text-xs text-muted-foreground">Categorías afectadas</p>
                  </CardContent>
                </Card>
              </div>

              {finishedMatches.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Resultados del día</h4>
                  <div className="space-y-1">
                    {finishedMatches.map(m => (
                      <div key={m.id} className="flex items-center gap-3 p-2 rounded bg-muted/50 text-sm">
                        <Badge variant="outline" className="text-xs">{m.category?.name || "-"}</Badge>
                        <span className="font-medium">{m.home_team?.team_name || "TBD"}</span>
                        <span className="font-bold text-primary">{m.home_score} - {m.away_score}</span>
                        <span className="font-medium">{m.away_team?.team_name || "TBD"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {pendingMatches.length > 0 && (
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Hay {pendingMatches.length} partido(s) sin capturar. Puedes publicar parcialmente o regresar a capturar.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setStep("capture_results")}>Regresar a Captura</Button>
                <Button
                  onClick={publishStats}
                  disabled={publishing || finishedMatches.length === 0}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {publishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                  Publicar Tablas de Posiciones
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Match Capture Dialog */}
      <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Cédula: {selectedMatch?.home_team?.team_name || "?"} vs {selectedMatch?.away_team?.team_name || "?"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6 pb-4">
              {/* Score & Referee */}
              <Card>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-4 items-end">
                    <div>
                      <Label className="text-xs text-muted-foreground">{selectedMatch?.home_team?.team_name}</Label>
                      <Input type="number" min="0" value={homeScore} onChange={e => setHomeScore(e.target.value)} className="text-2xl text-center font-bold h-14" />
                    </div>
                    <div className="text-center text-2xl font-bold text-muted-foreground pt-6">vs</div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{selectedMatch?.away_team?.team_name}</Label>
                      <Input type="number" min="0" value={awayScore} onChange={e => setAwayScore(e.target.value)} className="text-2xl text-center font-bold h-14" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label>Árbitro</Label>
                      <Input value={refereeName} onChange={e => setRefereeName(e.target.value)} placeholder="Nombre del árbitro" />
                    </div>
                    <div>
                      <Label>Notas</Label>
                      <Input value={matchNotes} onChange={e => setMatchNotes(e.target.value)} placeholder="Observaciones" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lineups */}
              <div className="grid grid-cols-2 gap-4">
                {(["home", "away"] as const).map(side => {
                  const team = side === "home" ? selectedMatch?.home_team : selectedMatch?.away_team;
                  const players = allLineupPlayers(side);
                  const lineup = side === "home" ? homeLineup : awayLineup;
                  return (
                    <Card key={side}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {team?.team_name} ({lineup.length} convocados)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {players.length === 0 ? (
                          <p className="text-xs text-muted-foreground py-2">No hay jugadores registrados</p>
                        ) : (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {players.map(p => (
                              <div key={p.id} className={`flex items-center gap-2 p-1.5 rounded text-sm ${p.inLineup ? "bg-primary/10" : ""}`}>
                                <Checkbox checked={p.inLineup} onCheckedChange={() => toggleLineupPlayer(p, side, true)} />
                                <span className="font-mono text-xs w-6">#{p.jersey_number || "?"}</span>
                                <span className="flex-1 truncate">{p.first_name} {p.paternal_surname || ""}</span>
                                {p.documents_verified ? <CheckCircle className="w-3 h-3 text-green-500" /> : <AlertTriangle className="w-3 h-3 text-yellow-500" />}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Events */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4" /> Eventos ({events.length})
                    </CardTitle>
                    <Button size="sm" variant="outline" onClick={() => setAddEventOpen(true)}>
                      <Plus className="w-4 h-4 mr-1" /> Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Sin eventos</p>
                  ) : (
                    <div className="space-y-1">
                      {events.map((e, idx) => {
                        const evtType = EVENT_TYPES.find(t => t.value === e.event_type);
                        return (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm">
                            <span className="font-mono text-xs w-8">{e.minute ? `${e.minute}'` : "-"}</span>
                            <span className={evtType?.color || ""}>{evtType?.label || e.event_type}</span>
                            <span className="flex-1 font-medium">{getPlayerName(e.player_id)}</span>
                            {e.notes && <span className="text-xs text-muted-foreground">({e.notes})</span>}
                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeEvent(idx)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMatchDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveMatchData} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Guardar Partido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={addEventOpen} onOpenChange={setAddEventOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Agregar Evento</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo de Evento</Label>
              <Select value={newEvent.event_type} onValueChange={v => setNewEvent({ ...newEvent, event_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Equipo</Label>
              <Select value={newEvent.team_id} onValueChange={v => setNewEvent({ ...newEvent, team_id: v, player_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                <SelectContent>
                  {selectedMatch?.home_team && <SelectItem value={selectedMatch.home_team.id}>{selectedMatch.home_team.team_name}</SelectItem>}
                  {selectedMatch?.away_team && <SelectItem value={selectedMatch.away_team.id}>{selectedMatch.away_team.team_name}</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Jugador</Label>
              <Select value={newEvent.player_id} onValueChange={v => setNewEvent({ ...newEvent, player_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar jugador" /></SelectTrigger>
                <SelectContent>
                  {(newEvent.team_id === selectedMatch?.home_team?.id ? homePlayers : awayPlayers).map(p => (
                    <SelectItem key={p.id} value={p.id}>#{p.jersey_number || "?"} {p.first_name} {p.paternal_surname || ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Minuto</Label>
              <Input type="number" min="0" max="120" value={newEvent.minute ?? ""} onChange={e => setNewEvent({ ...newEvent, minute: e.target.value ? parseInt(e.target.value) : null })} />
            </div>
            {(newEvent.event_type === "substitution_in" || newEvent.event_type === "substitution_out") && (
              <div>
                <Label>Jugador Relacionado (Cambio)</Label>
                <Select value={newEvent.related_player_id || ""} onValueChange={v => setNewEvent({ ...newEvent, related_player_id: v || null })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar jugador" /></SelectTrigger>
                  <SelectContent>
                    {(newEvent.team_id === selectedMatch?.home_team?.id ? homePlayers : awayPlayers).map(p => (
                      <SelectItem key={p.id} value={p.id}>#{p.jersey_number || "?"} {p.first_name} {p.paternal_surname || ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Notas (opcional)</Label>
              <Input value={newEvent.notes || ""} onChange={e => setNewEvent({ ...newEvent, notes: e.target.value || null })} placeholder="Ej: Penal, tiro libre..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddEventOpen(false)}>Cancelar</Button>
            <Button onClick={addEvent}><Plus className="w-4 h-4 mr-1" /> Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
