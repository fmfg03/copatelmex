import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  CreditCard, 
  FileText, 
  Shield, 
  User, 
  Mail, 
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Lock,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { EditTeamDialog } from "@/components/EditTeamDialog";
import { AddPlayerDialog } from "@/components/AddPlayerDialog";
import { EditPlayerDialog } from "@/components/EditPlayerDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Team {
  id: string;
  team_name: string;
  academy_name: string | null;
  state: string;
  phone_number: string;
  phone_country_code: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  shield_url: string | null;
  status: string;
  registrations: {
    id: string;
    payment_status: string;
    payment_amount: number | null;
    payment_reference: string | null;
    payment_date: string | null;
    category_id: string;
    categories: {
      name: string;
      description: string | null;
    };
  }[];
}

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  paternal_surname: string | null;
  maternal_surname: string | null;
  birth_date: string;
  curp: string | null;
  jersey_number: number | null;
  position: string | null;
  documents_complete: boolean;
  documents_verified: boolean;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
}

interface Manager {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string | null;
  is_primary: boolean;
}

export default function MyTeams() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [user, setUser] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addPlayerDialogOpen, setAddPlayerDialogOpen] = useState(false);
  const [editPlayerDialogOpen, setEditPlayerDialogOpen] = useState(false);
  const [deletePlayerDialogOpen, setDeletePlayerDialogOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(null);
  const [maxPlayersForCategory, setMaxPlayersForCategory] = useState<number>(15);
  
  // Mínimo de jugadores requeridos por categoría (estándar de fútbol)
  const MIN_PLAYERS_PER_TEAM = 11;

  // Fecha de inicio del torneo: 27 de febrero 2026
  const TOURNAMENT_START_DATE = new Date("2026-02-27T00:00:00");
  const EDIT_LOCKOUT_DAYS = 7;

  // Calcular si estamos en periodo de bloqueo (7 días antes del torneo)
  const isEditingLocked = () => {
    const now = new Date();
    const lockoutDate = new Date(TOURNAMENT_START_DATE);
    lockoutDate.setDate(lockoutDate.getDate() - EDIT_LOCKOUT_DAYS);
    return now >= lockoutDate;
  };

  const getDaysUntilLockout = () => {
    const now = new Date();
    const lockoutDate = new Date(TOURNAMENT_START_DATE);
    lockoutDate.setDate(lockoutDate.getDate() - EDIT_LOCKOUT_DAYS);
    const diffTime = lockoutDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    loadTeams(session.user.id);
  };

  const loadTeams = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("teams")
        .select(`
          *,
          registrations (
            id,
            payment_status,
            payment_amount,
            payment_reference,
            payment_date,
            category_id,
            categories (
              name,
              description
            )
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTeams(data || []);
      
      if (data && data.length > 0) {
        setSelectedTeam(data[0].id);
        loadTeamDetails(data[0].id);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al cargar equipos",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTeamDetails = async (teamId: string) => {
    // Cargar jugadores
    const { data: registration } = await supabase
      .from("registrations")
      .select(`
        id,
        categories (
          max_players_per_team
        )
      `)
      .eq("team_id", teamId)
      .single();

    if (registration) {
      setSelectedRegistrationId(registration.id);
      
      // Guardar el límite de jugadores de la categoría
      const maxPlayers = registration.categories?.max_players_per_team || 15;
      setMaxPlayersForCategory(maxPlayers);
      
      const { data: playersData } = await supabase
        .from("players")
        .select("id, first_name, last_name, paternal_surname, maternal_surname, birth_date, curp, jersey_number, position, documents_complete, documents_verified, parent_name, parent_email, parent_phone")
        .eq("registration_id", registration.id)
        .order("jersey_number");
      
      setPlayers(playersData || []);
    }

    // Cargar managers
    const { data: managersData } = await supabase
      .from("team_managers")
      .select("*")
      .eq("team_id", teamId)
      .order("is_primary", { ascending: false });
    
    setManagers(managersData || []);
  };

  const handleDeletePlayer = async () => {
    if (!selectedPlayer) return;

    // Validar mínimo de jugadores
    if (players.length <= MIN_PLAYERS_PER_TEAM) {
      toast({
        variant: "destructive",
        title: "No se puede eliminar",
        description: `Se requiere un mínimo de ${MIN_PLAYERS_PER_TEAM} jugadores por equipo`,
      });
      setDeletePlayerDialogOpen(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("players")
        .delete()
        .eq("id", selectedPlayer.id);

      if (error) throw error;

      toast({
        title: "Jugador eliminado",
        description: "El jugador se eliminó correctamente del equipo",
      });

      if (selectedTeam) {
        loadTeamDetails(selectedTeam);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al eliminar jugador",
        description: error.message,
      });
    } finally {
      setDeletePlayerDialogOpen(false);
      setSelectedPlayer(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "secondary" as const, icon: Clock },
      approved: { label: "Aprobado", variant: "default" as const, icon: CheckCircle },
      rejected: { label: "Rechazado", variant: "destructive" as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendiente", variant: "secondary" as const, icon: Clock },
      paid: { label: "Pagado", variant: "default" as const, icon: CheckCircle },
      failed: { label: "Fallido", variant: "destructive" as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const currentTeam = teams.find(t => t.id === selectedTeam);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No tienes equipos registrados</h2>
              <p className="text-muted-foreground mb-4">
                Registra tu primer equipo para la Copa Telmex Telcel
              </p>
              <Button onClick={() => navigate("/register")}>
                Registrar Equipo
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mis Equipos</h1>
          <p className="text-muted-foreground">
            Gestiona tus equipos, jugadores y documentación
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          {/* Lista de equipos */}
          <div className="space-y-3">
            <h2 className="font-semibold text-lg mb-4">Equipos</h2>
            {teams.map((team) => (
              <Card
                key={team.id}
                className={`cursor-pointer transition-colors ${
                  selectedTeam === team.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => {
                  setSelectedTeam(team.id);
                  loadTeamDetails(team.id);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {team.shield_url ? (
                      <img
                        src={team.shield_url}
                        alt={team.team_name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Shield className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{team.team_name}</h3>
                      {team.academy_name && (
                        <p className="text-sm text-muted-foreground truncate">
                          {team.academy_name}
                        </p>
                      )}
                      <div className="mt-2">
                        {getStatusBadge(team.status)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detalles del equipo seleccionado */}
          {currentTeam && (
            <div className="space-y-6">
              {/* Alerta de bloqueo de edición */}
              {isEditingLocked() ? (
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    La edición de equipos está bloqueada. El periodo de edición finaliza 7 días antes del inicio del torneo (23 de enero 2026).
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Puedes editar la información de tu equipo hasta el 23 de enero 2026. Quedan {getDaysUntilLockout()} días.
                  </AlertDescription>
                </Alert>
              )}

              {/* Información general */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{currentTeam.team_name}</CardTitle>
                      <CardDescription>
                        {currentTeam.academy_name || "Sin academia"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(currentTeam.status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditDialogOpen(true)}
                        disabled={isEditingLocked()}
                        className="gap-2"
                      >
                        {isEditingLocked() ? (
                          <>
                            <Lock className="h-4 w-4" />
                            Bloqueado
                          </>
                        ) : (
                          <>
                            <Edit className="h-4 w-4" />
                            Editar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Estado</p>
                      <p className="text-lg">{currentTeam.state}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                      <p className="text-lg">{currentTeam.phone_number}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registros y pagos */}
              {currentTeam.registrations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Registros y Pagos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentTeam.registrations.map((reg) => (
                      <div
                        key={reg.id}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{reg.categories.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {reg.categories.description}
                            </p>
                          </div>
                          {getPaymentStatusBadge(reg.payment_status)}
                        </div>
                        
                        <div className="grid gap-2 md:grid-cols-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Monto</p>
                            <p className="font-medium">
                              ${reg.payment_amount?.toLocaleString("es-MX") || "0"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Referencia</p>
                            <p className="font-medium font-mono">
                              {reg.payment_reference || "N/A"}
                            </p>
                          </div>
                          {reg.payment_date && (
                            <div>
                              <p className="text-muted-foreground">Fecha de pago</p>
                              <p className="font-medium">
                                {new Date(reg.payment_date).toLocaleDateString("es-MX")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Tabs para managers y jugadores */}
              <Tabs defaultValue="players" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="players" className="gap-2">
                    <Users className="h-4 w-4" />
                    Jugadores ({players.length})
                  </TabsTrigger>
                  <TabsTrigger value="managers" className="gap-2">
                    <User className="h-4 w-4" />
                    Managers ({managers.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="players" className="mt-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Lista de Jugadores</CardTitle>
                          <CardDescription>
                            Jugadores registrados: {players.length}/{maxPlayersForCategory}
                          </CardDescription>
                        </div>
                        <Button
                          onClick={() => setAddPlayerDialogOpen(true)}
                          disabled={isEditingLocked() || players.length >= maxPlayersForCategory}
                          size="sm"
                          className="gap-2"
                        >
                          {isEditingLocked() ? (
                            <>
                              <Lock className="h-4 w-4" />
                              Bloqueado
                            </>
                          ) : players.length >= maxPlayersForCategory ? (
                            <>
                              <AlertCircle className="h-4 w-4" />
                              Límite alcanzado
                            </>
                          ) : (
                            <>
                              <Users className="h-4 w-4" />
                              Agregar Jugador
                            </>
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {players.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No hay jugadores registrados aún</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {players.map((player) => (
                            <div
                              key={player.id}
                              className="p-4 border rounded-lg space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold">
                                      {player.first_name} {player.last_name}
                                    </p>
                                    {player.jersey_number && (
                                      <Badge variant="outline">
                                        #{player.jersey_number}
                                      </Badge>
                                    )}
                                  </div>
                                  {player.position && (
                                    <p className="text-sm text-muted-foreground">
                                      {player.position}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-col gap-1">
                                  {player.documents_complete ? (
                                    <Badge variant="default" className="gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      Completo
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="gap-1">
                                      <AlertCircle className="h-3 w-3" />
                                      Pendiente
                                    </Badge>
                                  )}
                                  {player.documents_verified && (
                                    <Badge variant="default" className="gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      Verificado
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="grid gap-2 text-sm pt-2 border-t">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(player.birth_date).toLocaleDateString("es-MX")}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <User className="h-4 w-4" />
                                  {player.parent_name}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-4 w-4" />
                                  {player.parent_email}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  {player.parent_phone}
                                </div>
                              </div>

                              <div className="flex gap-2 pt-2 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPlayer(player);
                                    setEditPlayerDialogOpen(true);
                                  }}
                                  disabled={isEditingLocked()}
                                  className="flex-1 gap-2"
                                >
                                  {isEditingLocked() ? (
                                    <>
                                      <Lock className="h-4 w-4" />
                                      Bloqueado
                                    </>
                                  ) : (
                                    <>
                                      <Edit className="h-4 w-4" />
                                      Editar
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedPlayer(player);
                                    setDeletePlayerDialogOpen(true);
                                  }}
                                  disabled={isEditingLocked() || players.length <= MIN_PLAYERS_PER_TEAM}
                                  className="flex-1 gap-2"
                                >
                                  {isEditingLocked() ? (
                                    <>
                                      <Lock className="h-4 w-4" />
                                      Bloqueado
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="h-4 w-4" />
                                      Eliminar
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="managers" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Staff del Equipo</CardTitle>
                      <CardDescription>
                        Entrenadores y representantes del equipo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {managers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No hay managers registrados
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {managers.map((manager) => (
                            <div
                              key={manager.id}
                              className="p-4 border rounded-lg space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold">
                                    {manager.first_name} {manager.last_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {manager.position || "Manager"}
                                  </p>
                                </div>
                                {manager.is_primary && (
                                  <Badge>Principal</Badge>
                                )}
                              </div>
                              <div className="grid gap-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-4 w-4" />
                                  {manager.email}
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  {manager.phone}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Botón para subir documentos */}
              <Card>
                <CardContent className="pt-6">
                  <Button 
                    className="w-full"
                    onClick={() => navigate("/documents")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Subir Documentos de Jugadores
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
      
      {/* Dialog de edición */}
      {currentTeam && (
        <EditTeamDialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          team={currentTeam}
          onSuccess={() => {
            checkAuth(); // Recargar equipos
          }}
        />
      )}
      
      {/* Dialog para agregar jugador */}
      {selectedRegistrationId && (
        <AddPlayerDialog
          open={addPlayerDialogOpen}
          onClose={() => setAddPlayerDialogOpen(false)}
          registrationId={selectedRegistrationId}
          currentPlayerCount={players.length}
          maxPlayers={maxPlayersForCategory}
          onSuccess={() => {
            if (selectedTeam) {
              loadTeamDetails(selectedTeam);
            }
          }}
        />
      )}

      {/* Dialog para editar jugador */}
      <EditPlayerDialog
        open={editPlayerDialogOpen}
        onClose={() => {
          setEditPlayerDialogOpen(false);
          setSelectedPlayer(null);
        }}
        player={selectedPlayer}
        onSuccess={() => {
          if (selectedTeam) {
            loadTeamDetails(selectedTeam);
          }
        }}
      />

      {/* Dialog de confirmación para eliminar jugador */}
      <AlertDialog open={deletePlayerDialogOpen} onOpenChange={setDeletePlayerDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar jugador?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a {selectedPlayer?.first_name} {selectedPlayer?.last_name} del equipo?
              Esta acción no se puede deshacer.
              {players.length <= MIN_PLAYERS_PER_TEAM && (
                <span className="block mt-2 text-destructive font-medium">
                  Se requiere un mínimo de {MIN_PLAYERS_PER_TEAM} jugadores por equipo.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedPlayer(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlayer}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
