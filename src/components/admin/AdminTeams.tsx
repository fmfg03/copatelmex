import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Search, Users, Filter, X, CalendarIcon, Eye, CheckCircle, FileText, AlertCircle, Circle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

type Team = {
  id: string;
  team_name: string;
  academy_name: string;
  state: string;
  phone_number: string;
  status: string;
  created_at: string;
  user_id: string;
  shield_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  phone_country_code: string;
  category_ids?: string[];
  category_names?: string[];
  documents_status?: 'empty' | 'incomplete' | 'complete';
  players_count?: number;
  documents_complete_count?: number;
};

type Player = {
  id: string;
  first_name: string;
  last_name: string;
  paternal_surname: string | null;
  maternal_surname: string | null;
  unique_player_id: string | null;
  birth_date: string;
  jersey_number: number;
  position: string;
  documents_complete: boolean;
  documents_verified: boolean;
  verification_notes: string;
  registration_id: string;
  curp: string | null;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  photo_url: string | null;
  birth_certificate_url: string | null;
};

type TeamManager = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  position: string | null;
  is_primary: boolean;
};

type TeamCategory = {
  id: string;
  name: string;
  registration_date: string;
  payment_status: string;
  registration_id: string;
};

export const AdminTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);
  const [teamManagers, setTeamManagers] = useState<TeamManager[]>([]);
  const [teamCategories, setTeamCategories] = useState<TeamCategory[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [documentsDialogTeam, setDocumentsDialogTeam] = useState<Team | null>(null);
  const [documentsPlayers, setDocumentsPlayers] = useState<Player[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  
  // Rejection dialog state
  const [rejectionDialogTeam, setRejectionDialogTeam] = useState<Team | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchTeams();
    fetchCategories();
  }, []);

  useEffect(() => {
    // Extract unique states from teams
    const uniqueStates = [...new Set(teams.map((t) => t.state))].sort();
    setStates(uniqueStates);
  }, [teams]);

  useEffect(() => {
    let filtered = teams;

    // Search filter
    if (search.trim()) {
      filtered = filtered.filter(
        (t) =>
          t.team_name.toLowerCase().includes(search.toLowerCase()) ||
          t.academy_name?.toLowerCase().includes(search.toLowerCase()) ||
          t.state.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // State filter
    if (stateFilter !== "all") {
      filtered = filtered.filter((t) => t.state === stateFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((t) => 
        t.category_ids && t.category_ids.includes(categoryFilter)
      );
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((t) => new Date(t.created_at) >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((t) => new Date(t.created_at) <= dateTo);
    }

    setFilteredTeams(filtered);
  }, [search, teams, statusFilter, stateFilter, categoryFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setStatusFilter("all");
    setStateFilter("all");
    setCategoryFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearch("");
  };

  const hasActiveFilters = statusFilter !== "all" || stateFilter !== "all" || categoryFilter !== "all" || dateFrom || dateTo || search;

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchTeams = async () => {
    try {
      const { data: teamsData, error } = await supabase
        .from("teams")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get category_ids and documents status for each team
      const teamsWithCategories = await Promise.all(
        (teamsData || []).map(async (team) => {
          const { data: registrations } = await supabase
            .from("registrations")
            .select("id, category_id, categories(name)")
            .eq("team_id", team.id);
          
          // Get players count and documents status
          let playersCount = 0;
          let documentsCompleteCount = 0;
          
          if (registrations && registrations.length > 0) {
            const registrationIds = registrations.map(r => r.id);
            const { data: players } = await supabase
              .from("players")
              .select("id, documents_complete, photo_url, birth_certificate_url")
              .in("registration_id", registrationIds);
            
            if (players) {
              playersCount = players.length;
              // A player has complete documents if documents_complete is true OR has both photo and birth certificate
              documentsCompleteCount = players.filter(p => 
                p.documents_complete || (p.photo_url && p.birth_certificate_url)
              ).length;
            }
          }
          
          // Determine documents status
          let documentsStatus: 'empty' | 'incomplete' | 'complete' = 'empty';
          if (playersCount > 0) {
            if (documentsCompleteCount === playersCount) {
              documentsStatus = 'complete';
            } else if (documentsCompleteCount > 0) {
              documentsStatus = 'incomplete';
            }
          }
          
          // Extract category names
          const categoryNames = registrations?.map(r => (r.categories as any)?.name).filter(Boolean) || [];
          
          return {
            ...team,
            category_ids: registrations?.map(r => r.category_id) || [],
            category_names: categoryNames,
            documents_status: documentsStatus,
            players_count: playersCount,
            documents_complete_count: documentsCompleteCount
          };
        })
      );

      setTeams(teamsWithCategories);
      setFilteredTeams(teamsWithCategories);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los equipos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamPlayers = async (teamId: string) => {
    setLoadingPlayers(true);
    try {
      // First get the registrations for this team
      const { data: registrations, error: regError } = await supabase
        .from("registrations")
        .select(`
          id,
          registration_date,
          payment_status,
          category_id,
          categories (
            id,
            name
          )
        `)
        .eq("team_id", teamId);

      if (regError) throw regError;

      if (!registrations || registrations.length === 0) {
        setTeamPlayers([]);
        setTeamCategories([]);
        return;
      }

      // Format categories data
      const categoriesData = registrations.map(reg => ({
        id: reg.categories?.id || "",
        name: reg.categories?.name || "N/A",
        registration_date: reg.registration_date,
        payment_status: reg.payment_status,
        registration_id: reg.id
      }));
      setTeamCategories(categoriesData);

      const registrationIds = registrations.map(r => r.id);

      // Then get all players for these registrations
      const { data: players, error: playersError } = await supabase
        .from("players")
        .select("*")
        .in("registration_id", registrationIds)
        .order("jersey_number", { ascending: true });

      if (playersError) throw playersError;

      setTeamPlayers(players || []);

      // Get team managers
      const { data: managers, error: managersError } = await supabase
        .from("team_managers")
        .select("*")
        .eq("team_id", teamId)
        .order("is_primary", { ascending: false });

      if (managersError) throw managersError;

      setTeamManagers(managers || []);
    } catch (error) {
      console.error("Error fetching team data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del equipo",
        variant: "destructive",
      });
    } finally {
      setLoadingPlayers(false);
    }
  };

  const handleViewTeam = async (team: Team) => {
    setSelectedTeam(team);
    await fetchTeamPlayers(team.id);
  };


  const handleUpdateStatus = async (teamId: string, newStatus: string, rejectionNote?: string) => {
    try {
      const team = teams.find(t => t.id === teamId);
      const oldStatus = team?.status;

      const updateData: { status: string; rejection_reason?: string | null } = { status: newStatus };
      
      // If rejecting, add the rejection reason; if approving, clear it
      if (newStatus === "rejected" && rejectionNote) {
        updateData.rejection_reason = rejectionNote;
      } else if (newStatus === "approved") {
        updateData.rejection_reason = null;
      }

      const { error } = await supabase
        .from("teams")
        .update(updateData)
        .eq("id", teamId);

      if (error) throw error;

      // Log the action in audit log
      await supabase.rpc('log_admin_action', {
        p_action: `UPDATE_TEAM_STATUS: ${oldStatus} -> ${newStatus}`,
        p_table_name: 'teams',
        p_record_id: teamId,
        p_old_values: { status: oldStatus },
        p_new_values: { status: newStatus, rejection_reason: rejectionNote || null }
      });

      toast({
        title: "Estado actualizado",
        description: newStatus === "rejected" 
          ? "El equipo ha sido rechazado. La nota de rechazo ha sido guardada."
          : "El estado del equipo ha sido actualizado correctamente",
      });

      fetchTeams();
    } catch (error) {
      console.error("Error updating team status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const handleRejectTeam = (team: Team) => {
    setRejectionDialogTeam(team);
    setRejectionReason("");
  };

  const confirmRejectTeam = async () => {
    if (!rejectionDialogTeam) return;
    
    if (!rejectionReason.trim()) {
      toast({
        title: "Nota requerida",
        description: "Por favor ingresa una nota explicando el motivo del rechazo",
        variant: "destructive",
      });
      return;
    }
    
    await handleUpdateStatus(rejectionDialogTeam.id, "rejected", rejectionReason);
    setRejectionDialogTeam(null);
    setRejectionReason("");
  };

  const handleUpdatePaymentStatus = async (registrationId: string, newStatus: string) => {
    try {
      // Get old payment status first
      const { data: oldData } = await supabase
        .from("registrations")
        .select("payment_status")
        .eq("id", registrationId)
        .single();

      const { error } = await supabase
        .from("registrations")
        .update({ payment_status: newStatus })
        .eq("id", registrationId);

      if (error) throw error;

      // Log the action in audit log
      await supabase.rpc('log_admin_action', {
        p_action: `UPDATE_PAYMENT_STATUS: ${oldData?.payment_status} -> ${newStatus}`,
        p_table_name: 'registrations',
        p_record_id: registrationId,
        p_old_values: { payment_status: oldData?.payment_status },
        p_new_values: { payment_status: newStatus }
      });

      toast({
        title: "Estado de pago actualizado",
        description: "El estado de pago ha sido actualizado correctamente",
      });

      // Refresh team data to show updated payment status
      if (selectedTeam) {
        await fetchTeamPlayers(selectedTeam.id);
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de pago",
        variant: "destructive",
      });
    }
  };

  const handleViewDocuments = async (team: Team) => {
    setDocumentsDialogTeam(team);
    setLoadingDocuments(true);
    try {
      const { data: registrations } = await supabase
        .from("registrations")
        .select("id")
        .eq("team_id", team.id);

      if (registrations && registrations.length > 0) {
        const registrationIds = registrations.map(r => r.id);
        const { data: players } = await supabase
          .from("players")
          .select("*")
          .in("registration_id", registrationIds)
          .order("jersey_number", { ascending: true });

        setDocumentsPlayers(players || []);
      } else {
        setDocumentsPlayers([]);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos",
        variant: "destructive",
      });
    } finally {
      setLoadingDocuments(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando equipos...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar equipo por nombre, academia o estado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <Badge variant="default" className="ml-1 px-1 py-0 text-xs">
              {[statusFilter !== "all", stateFilter !== "all", categoryFilter !== "all", dateFrom, dateTo, search].filter(Boolean).length}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
          <div>
            <Label>Estado de Registro</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="rejected">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Estado</Label>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Categoría</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Fecha Registro Desde</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : "Seleccionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Fecha Registro Hasta</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : "Seleccionar"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Academia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Documentos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeams.map((team) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {team.team_name}
                  </div>
                </TableCell>
                <TableCell>
                  {team.category_names && team.category_names.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {team.category_names.map((cat, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">Sin categoría</span>
                  )}
                </TableCell>
                <TableCell>{team.academy_name || "N/A"}</TableCell>
                <TableCell>{team.state}</TableCell>
                <TableCell>
                  <button 
                    onClick={() => handleViewDocuments(team)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    {team.documents_status === 'complete' ? (
                      <div className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">Completo</span>
                      </div>
                    ) : team.documents_status === 'incomplete' ? (
                      <div className="flex items-center gap-1.5 text-yellow-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs font-medium">{team.documents_complete_count}/{team.players_count}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-red-500">
                        <Circle className="w-4 h-4" />
                        <span className="text-xs font-medium">Vacío</span>
                      </div>
                    )}
                  </button>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      team.status === "approved"
                        ? "default"
                        : team.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {team.status === "approved"
                      ? "Aprobado"
                      : team.status === "rejected"
                      ? "Rechazado"
                      : "Pendiente"}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(team.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewTeam(team)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleUpdateStatus(team.id, "approved")}
                      disabled={team.status === "approved"}
                    >
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRejectTeam(team)}
                      disabled={team.status === "rejected"}
                    >
                      Rechazar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog para ver datos del equipo y jugadores */}
      <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Equipo: {selectedTeam?.team_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Información del equipo */}
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <Label className="text-muted-foreground">Nombre del Equipo</Label>
                <p className="font-medium">{selectedTeam?.team_name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Academia</Label>
                <p className="font-medium">{selectedTeam?.academy_name || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Estado</Label>
                <p className="font-medium">{selectedTeam?.state}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Teléfono</Label>
                <p className="font-medium">{selectedTeam?.phone_country_code} {selectedTeam?.phone_number}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Estado de Registro</Label>
                <Badge
                  variant={
                    selectedTeam?.status === "approved"
                      ? "default"
                      : selectedTeam?.status === "rejected"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {selectedTeam?.status === "approved"
                    ? "Aprobado"
                    : selectedTeam?.status === "rejected"
                    ? "Rechazado"
                    : "Pendiente"}
                </Badge>
              </div>
              <div>
                <Label className="text-muted-foreground">Fecha de Registro</Label>
                <p className="font-medium">{selectedTeam && new Date(selectedTeam.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Responsables del equipo */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Responsables del Equipo ({teamManagers.length})
              </h3>
              {teamManagers.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground border rounded-lg bg-muted/50">
                  No hay responsables registrados
                </div>
              ) : (
                <div className="space-y-3">
                  {teamManagers.map((manager) => (
                    <div key={manager.id} className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">
                          {manager.first_name} {manager.last_name}
                        </p>
                        {manager.is_primary && (
                          <Badge variant="default" className="text-xs">Principal</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Email:</span>{" "}
                          <span className="font-medium">{manager.email}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Puesto:</span>{" "}
                          <span className="font-medium">{manager.position || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Categorías registradas */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Categorías Registradas ({teamCategories.length})
              </h3>
              {teamCategories.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground border rounded-lg bg-muted/50">
                  No hay categorías registradas
                </div>
              ) : (
                <div className="space-y-3">
                  {teamCategories.map((category) => (
                    <div key={category.id} className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-semibold">{category.name}</p>
                        <div className="flex items-center gap-3">
                          <Label className="text-sm text-muted-foreground">Estado de Pago:</Label>
                          <Select 
                            value={category.payment_status || "pending"} 
                            onValueChange={(value) => handleUpdatePaymentStatus(category.registration_id, value)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pendiente</SelectItem>
                              <SelectItem value="completed">Pagado</SelectItem>
                              <SelectItem value="cancelled">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Fecha de registro: {new Date(category.registration_date).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de jugadores */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Jugadores del Equipo ({teamPlayers.length})
              </h3>
              {loadingPlayers ? (
                <div className="text-center py-8">Cargando jugadores...</div>
              ) : teamPlayers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay jugadores registrados en este equipo
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Número</TableHead>
                        <TableHead>Posición</TableHead>
                        <TableHead>Documentos</TableHead>
                        <TableHead>Verificado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamPlayers.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">
                              {player.unique_player_id || "Pendiente"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">
                            {player.first_name} {player.last_name}
                          </TableCell>
                          <TableCell>{player.jersey_number || "N/A"}</TableCell>
                          <TableCell>{player.position || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={player.documents_complete ? "default" : "secondary"}>
                              {player.documents_complete ? "Completos" : "Incompletos"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={player.documents_verified ? "default" : "destructive"}>
                              {player.documents_verified ? "Verificado" : "Pendiente"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedPlayer(player)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver datos del jugador */}
      <Dialog open={!!selectedPlayer} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div>
              <DialogTitle>
                Datos del Jugador: {selectedPlayer?.first_name} {selectedPlayer?.last_name}
              </DialogTitle>
              {selectedPlayer?.unique_player_id && (
                <Badge variant="outline" className="font-mono text-sm mt-2">
                  ID: {selectedPlayer.unique_player_id}
                </Badge>
              )}
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">ID Único</Label>
                    <p className="font-mono font-bold text-lg">{selectedPlayer?.unique_player_id || "Pendiente de asignar"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Nombre Completo</Label>
                    <p className="font-medium">{selectedPlayer?.first_name} {selectedPlayer?.last_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Apellido Paterno</Label>
                    <p className="font-medium">{selectedPlayer?.paternal_surname || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Apellido Materno</Label>
                    <p className="font-medium">{selectedPlayer?.maternal_surname || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Fecha de Nacimiento</Label>
                    <p className="font-medium">{selectedPlayer && new Date(selectedPlayer.birth_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Número</Label>
                    <p className="font-medium">{selectedPlayer?.jersey_number || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Posición</Label>
                    <p className="font-medium">{selectedPlayer?.position || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">CURP</Label>
                    <p className="font-medium">{selectedPlayer?.curp || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estado de Documentos</Label>
                    <Badge variant={selectedPlayer?.documents_complete ? "default" : "secondary"}>
                      {selectedPlayer?.documents_complete ? "Completos" : "Incompletos"}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Estado de Verificación</Label>
                    <Badge variant={selectedPlayer?.documents_verified ? "default" : "destructive"}>
                      {selectedPlayer?.documents_verified ? "Verificado" : "Pendiente"}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <Label className="text-muted-foreground">Información de Contacto</Label>
                  <div className="mt-2 space-y-1">
                    <p><span className="font-medium">Nombre del Padre/Tutor:</span> {selectedPlayer?.parent_name}</p>
                    <p><span className="font-medium">Email:</span> {selectedPlayer?.parent_email}</p>
                    <p><span className="font-medium">Teléfono:</span> {selectedPlayer?.parent_phone}</p>
                  </div>
                </div>

                {selectedPlayer?.verification_notes && (
                  <div>
                    <Label className="text-muted-foreground">Notas de Verificación</Label>
                    <p className="mt-2 p-3 bg-muted rounded-md">{selectedPlayer.verification_notes}</p>
                  </div>
                )}
              </div>

              {/* Foto del jugador */}
              <div className="w-40 h-40 flex-shrink-0">
                {selectedPlayer?.photo_url ? (
                  <img
                    src={selectedPlayer.photo_url}
                    alt={`${selectedPlayer.first_name} ${selectedPlayer.last_name}`}
                    className="w-full h-full object-cover rounded-lg border-2 border-border"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg border-2 border-border">
                    <span className="text-sm font-medium text-muted-foreground">PENDIENTE</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver documentos de jugadores */}
      <Dialog open={!!documentsDialogTeam} onOpenChange={() => setDocumentsDialogTeam(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Documentos: {documentsDialogTeam?.team_name}
            </DialogTitle>
          </DialogHeader>
          
          {loadingDocuments ? (
            <div className="text-center py-8">Cargando documentos...</div>
          ) : documentsPlayers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay jugadores registrados en este equipo
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Completo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span>Incompleto</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Circle className="w-4 h-4 text-red-500" />
                  <span>Faltante</span>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Jugador</TableHead>
                    <TableHead className="text-center">Foto</TableHead>
                    <TableHead className="text-center">Acta</TableHead>
                    <TableHead className="text-center">CURP</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documentsPlayers.map((player) => {
                    const hasPhoto = !!player.photo_url;
                    const hasBirthCert = !!player.birth_certificate_url;
                    const hasCurp = !!player.curp;
                    const isComplete = player.documents_complete || (hasPhoto && hasBirthCert);
                    const hasAny = hasPhoto || hasBirthCert || hasCurp;

                    return (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.jersey_number || '-'}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {player.first_name} {player.paternal_surname || player.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">{player.unique_player_id || 'Sin ID'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {hasPhoto ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <Circle className="w-5 h-5 text-red-500 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasBirthCert ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <Circle className="w-5 h-5 text-red-500 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {hasCurp ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                          ) : (
                            <Circle className="w-5 h-5 text-red-500 mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isComplete ? (
                            <Badge variant="default" className="bg-green-600">Completo</Badge>
                          ) : hasAny ? (
                            <Badge variant="secondary" className="bg-yellow-500 text-white">Incompleto</Badge>
                          ) : (
                            <Badge variant="destructive">Vacío</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total jugadores:</span>
                  <span className="font-medium">{documentsPlayers.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Documentos completos:</span>
                  <span className="font-medium text-green-600">
                    {documentsPlayers.filter(p => p.documents_complete || (p.photo_url && p.birth_certificate_url)).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Documentos faltantes:</span>
                  <span className="font-medium text-red-500">
                    {documentsPlayers.filter(p => !p.documents_complete && !(p.photo_url && p.birth_certificate_url)).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para rechazar equipo con nota */}
      <Dialog open={!!rejectionDialogTeam} onOpenChange={() => setRejectionDialogTeam(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rechazar Equipo</DialogTitle>
            <DialogDescription>
              Ingresa una nota explicando el motivo del rechazo para el equipo "{rejectionDialogTeam?.team_name}". 
              Esta nota podrá ser enviada por correo o WhatsApp posteriormente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Motivo del rechazo *</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Ej: Documentación incompleta, información incorrecta, etc."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionDialogTeam(null)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmRejectTeam}
              disabled={!rejectionReason.trim()}
            >
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
