import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Trophy, Users, TrendingUp, Download, Filter, GitBranch, Shield } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Match {
  id: string;
  match_date: string;
  home_score: number;
  away_score: number;
  status: string;
  phase: string;
  field_number: string;
  home_team: { team_name: string; id: string } | null;
  away_team: { team_name: string; id: string } | null;
  category: { name: string; id: string } | null;
}

interface TeamStanding {
  team_id: string;
  team_name: string;
  category_id: string;
  category_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

interface TopScorer {
  player_id: string;
  first_name: string;
  last_name: string;
  team_name: string;
  goals: number;
}

interface Goalkeeper {
  player_id: string;
  first_name: string;
  last_name: string;
  team_name: string;
  goals_conceded: number;
  matches_played: number;
  average: number;
}

interface KnockoutMatch {
  round: string;
  position: number;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
}

export default function Schedule() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedField, setSelectedField] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  const [topScorers, setTopScorers] = useState<TopScorer[]>([]);
  const [topGoalkeepers, setTopGoalkeepers] = useState<Goalkeeper[]>([]);
  const [knockoutMatches, setKnockoutMatches] = useState<KnockoutMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
    loadMatches();
    loadStandings();
    loadTopScorers();
    loadTopGoalkeepers();
    loadKnockoutMatches();

    // Set up realtime subscription for matches
    const channel = supabase
      .channel("matches-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
        },
        () => {
          loadMatches();
          loadStandings();
          loadKnockoutMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories(data || []);
  };

  const loadMatches = async () => {
    setLoading(true);
    let query = supabase
      .from("matches")
      .select(
        `
        *,
        home_team:teams!matches_home_team_id_fkey(id, team_name),
        away_team:teams!matches_away_team_id_fkey(id, team_name),
        category:categories(id, name)
      `
      )
      .order("match_date", { ascending: true });

    if (selectedCategory !== "all") {
      query = query.eq("category_id", selectedCategory);
    }

    if (selectedField !== "all") {
      query = query.eq("field_number", selectedField);
    }

    if (startDate) {
      query = query.gte("match_date", startDate);
    }

    if (endDate) {
      query = query.lte("match_date", endDate);
    }

    const { data } = await query;
    setMatches(data || []);
    setLoading(false);
  };

  const loadStandings = async () => {
    // Usar la tabla team_standings que ya tiene los datos calculados
    const { data: standingsData } = await supabase
      .from("team_standings")
      .select(
        `
        team_id,
        category_id,
        played,
        won,
        drawn,
        lost,
        goals_for,
        goals_against,
        goal_difference,
        points,
        teams(team_name),
        categories(name)
      `
      )
      .order("category_id", { ascending: true })
      .order("points", { ascending: false })
      .order("goal_difference", { ascending: false })
      .order("goals_for", { ascending: false });

    if (!standingsData) return;

    const standings = standingsData.map((standing: any) => ({
      team_id: standing.team_id,
      category_id: standing.category_id,
      team_name: standing.teams?.team_name || "Unknown",
      category_name: standing.categories?.name || "Unknown",
      played: standing.played,
      won: standing.won,
      drawn: standing.drawn,
      lost: standing.lost,
      goals_for: standing.goals_for,
      goals_against: standing.goals_against,
      goal_difference: standing.goal_difference,
      points: standing.points,
    }));

    setStandings(standings);
  };

  const loadTopScorers = async () => {
    const { data } = await supabase
      .from("player_stats")
      .select(
        `
        player_id,
        goals,
        players!inner(
          first_name,
          last_name,
          registration_id,
          registrations!inner(
            team_id,
            teams!inner(team_name)
          )
        )
      `
      )
      .gt("goals", 0)
      .order("goals", { ascending: false })
      .limit(10);

    if (!data) return;

    const scorers = data.map((stat: any) => ({
      player_id: stat.player_id,
      first_name: stat.players.first_name,
      last_name: stat.players.last_name,
      team_name: stat.players.registrations.teams.team_name,
      goals: stat.goals,
    }));

    setTopScorers(scorers);
  };

  const loadTopGoalkeepers = async () => {
    const { data: matchesData } = await supabase
      .from("matches")
      .select(
        `
        home_team_id,
        away_team_id,
        home_score,
        away_score,
        status
      `
      )
      .eq("status", "finished");

    if (!matchesData) return;

    // Calculate goals conceded per team
    const goalsMap = new Map<string, { conceded: number; played: number }>();

    matchesData.forEach((match: any) => {
      if (!goalsMap.has(match.home_team_id)) {
        goalsMap.set(match.home_team_id, { conceded: 0, played: 0 });
      }
      if (!goalsMap.has(match.away_team_id)) {
        goalsMap.set(match.away_team_id, { conceded: 0, played: 0 });
      }

      const homeTeam = goalsMap.get(match.home_team_id)!;
      const awayTeam = goalsMap.get(match.away_team_id)!;

      homeTeam.conceded += match.away_score;
      homeTeam.played++;
      awayTeam.conceded += match.home_score;
      awayTeam.played++;
    });

    // Get team names and create goalkeeper stats (mock data for now)
    const topKeepers: Goalkeeper[] = [];
    for (const [teamId, stats] of goalsMap.entries()) {
      const { data: teamData } = await supabase
        .from("teams")
        .select("team_name")
        .eq("id", teamId)
        .single();

      if (teamData && stats.played > 0) {
        topKeepers.push({
          player_id: teamId,
          first_name: "Portero",
          last_name: teamData.team_name,
          team_name: teamData.team_name,
          goals_conceded: stats.conceded,
          matches_played: stats.played,
          average: stats.conceded / stats.played,
        });
      }
    }

    topKeepers.sort((a, b) => a.average - b.average);
    setTopGoalkeepers(topKeepers.slice(0, 10));
  };

  const loadKnockoutMatches = async () => {
    const { data } = await supabase
      .from("matches")
      .select(
        `
        *,
        home_team:teams!matches_home_team_id_fkey(team_name),
        away_team:teams!matches_away_team_id_fkey(team_name)
      `
      )
      .in("phase", ["Octavos", "Cuartos", "Semifinal", "Final"])
      .order("match_date", { ascending: true });

    if (!data) return;

    const knockoutData: KnockoutMatch[] = data.map((match: any, index) => ({
      round: match.phase,
      position: index,
      home_team: match.home_team?.team_name || "TBD",
      away_team: match.away_team?.team_name || "TBD",
      home_score: match.status === "completed" ? match.home_score : null,
      away_score: match.status === "completed" ? match.away_score : null,
      status: match.status,
    }));

    setKnockoutMatches(knockoutData);
  };

  useEffect(() => {
    loadMatches();
  }, [selectedCategory, selectedField, startDate, endDate]);

  const generateICS = (match: Match) => {
    if (!match.home_team || !match.away_team || !match.category) return;

    const startDate = new Date(match.match_date);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour later

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Copa Club América//NONSGML v1.0//EN",
      "BEGIN:VEVENT",
      `UID:${match.id}@copaclubamerica.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${match.home_team.team_name} vs ${match.away_team.team_name}`,
      `DESCRIPTION:${match.category.name} - Campo ${match.field_number || "TBD"}`,
      `LOCATION:CECAP Facilities`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `partido-${match.id}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline">Programado</Badge>;
      case "live":
        return <Badge className="bg-red-500 text-white animate-pulse">En Vivo</Badge>;
      case "finished":
      case "completed":
        return <Badge variant="secondary">Finalizado</Badge>;
      case "cancelled":
      case "postponed":
        return <Badge variant="destructive">Pospuesto</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const groupMatchesByDate = (matches: Match[]) => {
    const grouped = new Map<string, Match[]>();
    matches.forEach((match) => {
      const date = format(new Date(match.match_date), "yyyy-MM-dd");
      if (!grouped.has(date)) {
        grouped.set(date, []);
      }
      grouped.get(date)!.push(match);
    });
    return grouped;
  };

  const groupedMatches = groupMatchesByDate(matches);
  const fieldNumbers = Array.from(new Set(matches.map((m) => m.field_number).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Navbar />
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-secondary mb-4">
              Partidos y Resultados
            </h1>
            <p className="text-muted-foreground text-lg">
              Seguimiento en tiempo real de todos los partidos del torneo
            </p>
          </div>

          {/* Advanced Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Campo</Label>
                  <Select value={selectedField} onValueChange={setSelectedField}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los campos</SelectItem>
                      {fieldNumbers.map((field) => (
                        <SelectItem key={field} value={field}>
                          Campo {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Desde</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Hasta</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {(selectedCategory !== "all" || selectedField !== "all" || startDate || endDate) && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedField("all");
                      setStartDate("");
                      setEndDate("");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="calendario" className="space-y-8">
            <TabsList className="grid w-full grid-cols-4 max-w-3xl mx-auto">
              <TabsTrigger value="calendario" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Calendario</span>
              </TabsTrigger>
              <TabsTrigger value="posiciones" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span className="hidden sm:inline">Posiciones</span>
              </TabsTrigger>
              <TabsTrigger value="eliminatorias" className="flex items-center gap-2">
                <GitBranch className="w-4 h-4" />
                <span className="hidden sm:inline">Llaves</span>
              </TabsTrigger>
              <TabsTrigger value="estadisticas" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Estadísticas</span>
              </TabsTrigger>
            </TabsList>

            {/* Calendario Tab */}
            <TabsContent value="calendario" className="space-y-8">
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Cargando partidos...</p>
                </div>
              ) : groupedMatches.size === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No hay partidos programados</p>
                </div>
              ) : (
                Array.from(groupedMatches.entries()).map(([date, dayMatches]) => (
                  <div key={date}>
                    <h3 className="text-2xl font-bold mb-4 text-secondary">
                      {format(parseISO(date), "EEEE, d 'de' MMMM", { locale: es })}
                    </h3>
                    <div className="grid gap-4">
                      {dayMatches.map((match) => (
                        <Card key={match.id} className="hover:shadow-lg transition-all hover:border-primary">
                          <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge variant="outline">{match.category?.name}</Badge>
                                  {match.phase && <Badge variant="secondary">{match.phase}</Badge>}
                                  {match.field_number && (
                                    <Badge variant="outline">Campo {match.field_number}</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(match.match_date), "HH:mm")} hrs
                                </p>
                              </div>

                              <div className="flex-1 flex items-center justify-center gap-4">
                                <div className="text-right flex-1">
                                  <p className="font-semibold text-lg">
                                    {match.home_team?.team_name || "TBD"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                   <div
                                    className={`text-2xl font-bold ${
                                      match.status === "finished" || match.status === "completed" ? "text-secondary" : "text-muted-foreground"
                                    }`}
                                   >
                                     {match.status === "finished" || match.status === "completed" || match.status === "live"
                                       ? match.home_score
                                       : "-"}
                                   </div>
                                   <div className="text-muted-foreground">vs</div>
                                   <div
                                    className={`text-2xl font-bold ${
                                      match.status === "finished" || match.status === "completed" ? "text-secondary" : "text-muted-foreground"
                                    }`}
                                   >
                                     {match.status === "finished" || match.status === "completed" || match.status === "live"
                                       ? match.away_score
                                       : "-"}
                                   </div>
                                </div>
                                <div className="text-left flex-1">
                                  <p className="font-semibold text-lg">
                                    {match.away_team?.team_name || "TBD"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex-1 flex justify-end items-center gap-2">
                                {getStatusBadge(match.status)}
                                {match.status === "scheduled" && match.home_team && match.away_team && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => generateICS(match)}
                                    title="Agregar al calendario"
                                  >
                                    <Download className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            {/* Posiciones Tab */}
            <TabsContent value="posiciones">
              {standings.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No hay datos de posiciones disponibles
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {categories.map((category) => {
                    const categoryStandings = standings.filter(
                      (team: any) => team.category_id === category.id
                    );

                    if (categoryStandings.length === 0) return null;

                    return (
                      <Card key={category.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Trophy className="w-5 h-5" />
                            Tabla de Posiciones - {category.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b-2">
                                  <th className="text-left py-3 px-4 font-bold">Pos</th>
                                  <th className="text-left py-3 px-4 font-bold">Equipo</th>
                                  <th className="text-center py-3 px-4 font-bold">PJ</th>
                                  <th className="text-center py-3 px-4 font-bold">G</th>
                                  <th className="text-center py-3 px-4 font-bold">E</th>
                                  <th className="text-center py-3 px-4 font-bold">P</th>
                                  <th className="text-center py-3 px-4 font-bold">GF</th>
                                  <th className="text-center py-3 px-4 font-bold">GC</th>
                                  <th className="text-center py-3 px-4 font-bold">DG</th>
                                  <th className="text-center py-3 px-4 font-bold text-secondary">Pts</th>
                                </tr>
                              </thead>
                              <tbody>
                                {categoryStandings.map((team, index) => (
                                  <tr
                                    key={team.team_id}
                                    className={`border-b hover:bg-muted/50 transition-colors ${
                                      index === 0
                                        ? "bg-primary/10 dark:bg-primary/5"
                                        : index < 3
                                        ? "bg-green-50 dark:bg-green-950/20"
                                        : ""
                                    }`}
                                  >
                                    <td className="py-3 px-4 font-semibold">{index + 1}</td>
                                    <td className="py-3 px-4 font-medium">{team.team_name}</td>
                                    <td className="text-center py-3 px-4">{team.played}</td>
                                    <td className="text-center py-3 px-4 text-green-600 dark:text-green-400">
                                      {team.won}
                                    </td>
                                    <td className="text-center py-3 px-4">{team.drawn}</td>
                                    <td className="text-center py-3 px-4 text-red-600 dark:text-red-400">
                                      {team.lost}
                                    </td>
                                    <td className="text-center py-3 px-4">{team.goals_for}</td>
                                    <td className="text-center py-3 px-4">{team.goals_against}</td>
                                    <td className="text-center py-3 px-4 font-medium">
                                      {team.goal_difference > 0 ? "+" : ""}
                                      {team.goal_difference}
                                    </td>
                                    <td className="text-center py-3 px-4 font-bold text-secondary">
                                      {team.points}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Eliminatorias Tab */}
            <TabsContent value="eliminatorias">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5" />
                    Diagrama de Llaves - FASE DE LIGUILLA
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {knockoutMatches.length === 0 ? (
                    <div className="text-center py-12">
                      <GitBranch className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        La fase de liguilla aún no ha comenzado
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Octavos */}
                      {knockoutMatches.filter((m) => m.round === "Octavos").length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold mb-4 text-center text-secondary">Octavos de Final</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {knockoutMatches
                              .filter((m) => m.round === "Octavos")
                              .map((match, index) => (
                                <Card key={index} className="bg-gradient-card">
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="font-semibold">{match.home_team}</p>
                                      </div>
                                      <div className="flex items-center gap-3 mx-4">
                                        <span className="text-xl font-bold">
                                          {match.home_score !== null ? match.home_score : "-"}
                                        </span>
                                        <span className="text-muted-foreground">vs</span>
                                        <span className="text-xl font-bold">
                                          {match.away_score !== null ? match.away_score : "-"}
                                        </span>
                                      </div>
                                      <div className="flex-1 text-right">
                                        <p className="font-semibold">{match.away_team}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Cuartos */}
                      {knockoutMatches.filter((m) => m.round === "Cuartos").length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold mb-4 text-center text-secondary">Cuartos de Final</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {knockoutMatches
                              .filter((m) => m.round === "Cuartos")
                              .map((match, index) => (
                                <Card key={index} className="bg-gradient-card border-2">
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="font-semibold">{match.home_team}</p>
                                      </div>
                                      <div className="flex items-center gap-3 mx-4">
                                        <span className="text-xl font-bold">
                                          {match.home_score !== null ? match.home_score : "-"}
                                        </span>
                                        <span className="text-muted-foreground">vs</span>
                                        <span className="text-xl font-bold">
                                          {match.away_score !== null ? match.away_score : "-"}
                                        </span>
                                      </div>
                                      <div className="flex-1 text-right">
                                        <p className="font-semibold">{match.away_team}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Semifinales */}
                      {knockoutMatches.filter((m) => m.round === "Semifinal").length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold mb-4 text-center text-secondary">Semifinales</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                            {knockoutMatches
                              .filter((m) => m.round === "Semifinal")
                              .map((match, index) => (
                                <Card key={index} className="bg-gradient-card border-2 border-primary/20">
                                  <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="font-bold text-lg">{match.home_team}</p>
                                      </div>
                                      <div className="flex items-center gap-3 mx-4">
                                        <span className="text-2xl font-bold">
                                          {match.home_score !== null ? match.home_score : "-"}
                                        </span>
                                        <span className="text-muted-foreground">vs</span>
                                        <span className="text-2xl font-bold">
                                          {match.away_score !== null ? match.away_score : "-"}
                                        </span>
                                      </div>
                                      <div className="flex-1 text-right">
                                        <p className="font-bold text-lg">{match.away_team}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Final */}
                      {knockoutMatches.filter((m) => m.round === "Final").length > 0 && (
                        <div>
                          <h3 className="text-2xl font-bold mb-4 text-center text-white">🏆 FINAL 🏆</h3>
                          <div className="max-w-2xl mx-auto">
                            {knockoutMatches
                              .filter((m) => m.round === "Final")
                              .map((match, index) => (
                                <Card key={index} className="bg-gradient-hero text-white border-4 border-primary">
                                  <CardContent className="p-8">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="font-bold text-2xl">{match.home_team}</p>
                                      </div>
                                      <div className="flex items-center gap-4 mx-6">
                                        <span className="text-4xl font-bold">
                                          {match.home_score !== null ? match.home_score : "-"}
                                        </span>
                                        <span className="text-xl">vs</span>
                                        <span className="text-4xl font-bold">
                                          {match.away_score !== null ? match.away_score : "-"}
                                        </span>
                                      </div>
                                      <div className="flex-1 text-right">
                                        <p className="font-bold text-2xl">{match.away_team}</p>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Estadísticas Tab */}
            <TabsContent value="estadisticas" className="space-y-6">
              {/* Goleadores */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Tabla de Goleadores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topScorers.length === 0 ? (
                    <div className="text-center py-12">
                      <TrendingUp className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No hay estadísticas de goleadores disponibles
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topScorers.map((scorer, index) => (
                        <div
                          key={scorer.player_id}
                          className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                            index === 0
                              ? "bg-gradient-to-r from-primary/10 to-primary/20 dark:from-primary/5 dark:to-primary/10 border-2 border-primary"
                              : "bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                                index === 0
                                  ? "bg-primary text-primary-foreground"
                                  : index === 1
                                  ? "bg-gray-300 text-gray-900"
                                  : index === 2
                                  ? "bg-orange-400 text-orange-900"
                                  : "bg-muted-foreground/20 text-muted-foreground"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-bold text-lg">
                                {scorer.first_name} {scorer.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{scorer.team_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-6 h-6 text-white" />
                            <span className="text-3xl font-bold">{scorer.goals}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Porteros Menos Goleados */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Porteros Menos Goleados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topGoalkeepers.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        No hay estadísticas de porteros disponibles
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {topGoalkeepers.map((keeper, index) => (
                        <div
                          key={keeper.player_id}
                          className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                            index === 0
                              ? "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border-2 border-blue-400"
                              : "bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                                index === 0
                                  ? "bg-blue-400 text-blue-900"
                                  : index === 1
                                  ? "bg-gray-300 text-gray-900"
                                  : index === 2
                                  ? "bg-orange-400 text-orange-900"
                                  : "bg-muted-foreground/20 text-muted-foreground"
                              }`}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-bold text-lg">{keeper.team_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {keeper.matches_played} {keeper.matches_played === 1 ? "partido" : "partidos"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <Shield className="w-6 h-6 text-blue-500" />
                              <span className="text-3xl font-bold">{keeper.average.toFixed(2)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {keeper.goals_conceded} goles recibidos
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
