import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BulkPhotoUpload } from "@/components/BulkPhotoUpload";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle2, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  birth_certificate_url?: string;
  documents_complete: boolean;
}

interface Registration {
  id: string;
  team_id: string;
  category_id: string;
  registration_date: string;
  teams: {
    team_name: string;
  };
  categories: {
    name: string;
  };
}

export default function DocumentsPortal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedRegistration, setSelectedRegistration] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "No autenticado",
          description: "Por favor inicia sesión para acceder al portal de documentos",
        });
        navigate("/auth");
        return;
      }

      await loadRegistrations(user.id);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRegistrations = async (userId: string) => {
    const { data: teamsData, error: teamsError } = await supabase
      .from("teams")
      .select("id")
      .eq("user_id", userId);

    if (teamsError) throw teamsError;

    if (!teamsData || teamsData.length === 0) {
      return;
    }

    const teamIds = teamsData.map(t => t.id);

    const { data: regsData, error: regsError } = await supabase
      .from("registrations")
      .select(`
        id,
        team_id,
        category_id,
        registration_date,
        teams (team_name),
        categories (name)
      `)
      .in("team_id", teamIds)
      .order("registration_date", { ascending: false });

    if (regsError) throw regsError;

    setRegistrations(regsData || []);
    
    if (regsData && regsData.length > 0) {
      setSelectedRegistration(regsData[0].id);
      await loadPlayers(regsData[0].id);
    }
  };

  const loadPlayers = async (registrationId: string) => {
    const { data, error } = await supabase
      .from("players")
      .select("id, first_name, last_name, photo_url, birth_certificate_url, documents_complete")
      .eq("registration_id", registrationId)
      .order("first_name");

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los jugadores",
      });
      return;
    }

    setPlayers(data || []);
  };

  const handleRegistrationChange = async (registrationId: string) => {
    setSelectedRegistration(registrationId);
    await loadPlayers(registrationId);
  };

  const handleUploadComplete = () => {
    setRefreshKey(prev => prev + 1);
    if (selectedRegistration) {
      loadPlayers(selectedRegistration);
    }
  };

  const getDeadlineDate = () => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    return deadline.toLocaleDateString('es-MX', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDocumentsStatus = () => {
    if (players.length === 0) return { complete: 0, total: 0, percentage: 0 };
    
    const withPhotos = players.filter(p => p.photo_url).length;
    const total = players.length;
    const percentage = Math.round((withPhotos / total) * 100);
    
    return { complete: withPhotos, total, percentage };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const status = getDocumentsStatus();
  const selectedReg = registrations.find(r => r.id === selectedRegistration);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">Portal de Documentos</h1>
            <p className="text-muted-foreground">
              Sube las fotos de tus jugadores de forma masiva
            </p>
          </div>

          {/* Deadline Alert */}
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              <span className="font-semibold">Fecha límite:</span> {getDeadlineDate()}
              {" "}— Completa la documentación antes de esta fecha para validar tu inscripción.
            </AlertDescription>
          </Alert>

          {/* Registration Selection */}
          {registrations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Selecciona tu Equipo</CardTitle>
                <CardDescription>
                  Elige el equipo para el cual deseas subir documentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {registrations.map((reg) => (
                    <button
                      key={reg.id}
                      onClick={() => handleRegistrationChange(reg.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedRegistration === reg.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-semibold">{reg.teams.team_name}</div>
                      <div className="text-sm text-muted-foreground">{reg.categories.name}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Overview */}
          {selectedRegistration && players.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Estado de Documentos</span>
                  <Badge variant={status.percentage === 100 ? "default" : "secondary"}>
                    {status.percentage}% Completo
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Fotos subidas:</span>
                    <span className="font-semibold">{status.complete} de {status.total}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${status.percentage}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bulk Upload */}
          {selectedRegistration && players.length > 0 && (
            <BulkPhotoUpload
              key={refreshKey}
              players={players}
              registrationId={selectedRegistration}
              onComplete={handleUploadComplete}
            />
          )}

          {/* Empty State */}
          {registrations.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay registros</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Aún no tienes equipos registrados en el torneo.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Player List */}
          {selectedRegistration && players.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lista de Jugadores</CardTitle>
                <CardDescription>
                  Estado de documentos por jugador
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        {player.photo_url ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                        )}
                        <span className="font-medium">
                          {player.first_name} {player.last_name}
                        </span>
                      </div>
                      <Badge variant={player.photo_url ? "default" : "secondary"}>
                        {player.photo_url ? "Foto subida" : "Pendiente"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
