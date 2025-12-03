import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Search, CheckCircle, XCircle, Eye, Filter, X, Printer, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
  category_id?: string;
  category_name?: string;
  team_name?: string;
};

type Category = {
  id: string;
  name: string;
};

export const AdminPlayers = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [verifyingPlayer, setVerifyingPlayer] = useState<Player | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  
  // Filters
  const [documentStatus, setDocumentStatus] = useState<string>("all");
  const [verificationStatus, setVerificationStatus] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [ageMin, setAgeMin] = useState<string>("");
  const [ageMax, setAgeMax] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchPlayers();
    fetchCategories();
  }, []);

  useEffect(() => {
    let filtered = players;

    // Search filter
    if (search.trim()) {
      filtered = filtered.filter(
        (p) =>
          p.first_name.toLowerCase().includes(search.toLowerCase()) ||
          p.last_name.toLowerCase().includes(search.toLowerCase()) ||
          p.jersey_number?.toString().includes(search) ||
          p.unique_player_id?.toLowerCase().includes(search.toLowerCase()) ||
          p.team_name?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category_id === categoryFilter);
    }

    // Age range filter
    const currentDate = new Date();
    if (ageMin) {
      const maxBirthDate = new Date();
      maxBirthDate.setFullYear(currentDate.getFullYear() - parseInt(ageMin));
      filtered = filtered.filter((p) => new Date(p.birth_date) <= maxBirthDate);
    }
    if (ageMax) {
      const minBirthDate = new Date();
      minBirthDate.setFullYear(currentDate.getFullYear() - parseInt(ageMax) - 1);
      filtered = filtered.filter((p) => new Date(p.birth_date) > minBirthDate);
    }

    // Document status filter
    if (documentStatus !== "all") {
      filtered = filtered.filter((p) => 
        documentStatus === "complete" ? p.documents_complete : !p.documents_complete
      );
    }

    // Verification status filter
    if (verificationStatus !== "all") {
      filtered = filtered.filter((p) => 
        verificationStatus === "verified" ? p.documents_verified : !p.documents_verified
      );
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((p) => new Date(p.birth_date) >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((p) => new Date(p.birth_date) <= dateTo);
    }

    setFilteredPlayers(filtered);
  }, [search, players, documentStatus, verificationStatus, categoryFilter, ageMin, ageMax, dateFrom, dateTo]);

  const clearFilters = () => {
    setDocumentStatus("all");
    setVerificationStatus("all");
    setCategoryFilter("all");
    setAgeMin("");
    setAgeMax("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearch("");
  };

  const hasActiveFilters = documentStatus !== "all" || verificationStatus !== "all" || categoryFilter !== "all" || ageMin || ageMax || dateFrom || dateTo || search;

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

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

  const fetchPlayers = async () => {
    try {
      const { data: playersData, error } = await supabase
        .from("players")
        .select(`
          *,
          registrations!inner(
            id,
            category_id,
            team_id,
            categories(id, name),
            teams(team_name)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Format the data to include category and team info
      const formattedPlayers = (playersData || []).map((player: any) => ({
        ...player,
        category_id: player.registrations?.category_id,
        category_name: player.registrations?.categories?.name,
        team_name: player.registrations?.teams?.team_name,
      }));

      setPlayers(formattedPlayers);
      setFilteredPlayers(formattedPlayers);
    } catch (error) {
      console.error("Error fetching players:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los jugadores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPlayer = () => {
    window.print();
  };

  const handleRegenerateIds = async () => {
    setIsRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-player-ids');

      if (error) throw error;

      toast({
        title: "IDs Regenerados",
        description: data.message,
      });

      // Refresh players list
      fetchPlayers();
    } catch (error) {
      console.error("Error regenerating IDs:", error);
      toast({
        title: "Error",
        description: "No se pudieron regenerar los IDs de los jugadores",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleVerifyPlayer = async (playerId: string, verified: boolean) => {
    try {
      const { error } = await supabase
        .from("players")
        .update({
          documents_verified: verified,
          verification_notes: verificationNotes,
        })
        .eq("id", playerId);

      if (error) throw error;

      toast({
        title: verified ? "Jugador verificado" : "Verificación rechazada",
        description: `El jugador ha sido ${verified ? "verificado" : "rechazado"} correctamente`,
      });

      fetchPlayers();
      setVerifyingPlayer(null);
      setVerificationNotes("");
    } catch (error) {
      console.error("Error verifying player:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la verificación",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Cargando jugadores...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nombre, número, ID o equipo..."
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
                {[documentStatus !== "all", verificationStatus !== "all", categoryFilter !== "all", ageMin, ageMax, dateFrom, dateTo, search].filter(Boolean).length}
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
        <Button
          variant="default"
          onClick={handleRegenerateIds}
          disabled={isRegenerating}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          Regenerar IDs
        </Button>
      </div>

      {showFilters && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Categoría</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Edad Mínima</Label>
              <Input
                type="number"
                placeholder="Ej: 8"
                value={ageMin}
                onChange={(e) => setAgeMin(e.target.value)}
                min="0"
                max="100"
              />
            </div>

            <div>
              <Label>Edad Máxima</Label>
              <Input
                type="number"
                placeholder="Ej: 15"
                value={ageMax}
                onChange={(e) => setAgeMax(e.target.value)}
                min="0"
                max="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Estado de Documentos</Label>
              <Select value={documentStatus} onValueChange={setDocumentStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="complete">Completos</SelectItem>
                  <SelectItem value="incomplete">Incompletos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Estado de Verificación</Label>
              <Select value={verificationStatus} onValueChange={setVerificationStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="verified">Verificados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Fecha Nacimiento Desde</Label>
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
              <Label>Fecha Nacimiento Hasta</Label>
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
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Jugador</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Edad</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Documentos</TableHead>
              <TableHead>Verificado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.map((player) => (
              <TableRow key={player.id}>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {player.unique_player_id || "Pendiente"}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">
                  {player.first_name} {player.last_name}
                </TableCell>
                <TableCell>{player.team_name || "N/A"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{player.category_name || "N/A"}</Badge>
                </TableCell>
                <TableCell>{calculateAge(player.birth_date)} años</TableCell>
                <TableCell>{player.jersey_number || "N/A"}</TableCell>
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
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        setVerifyingPlayer(player);
                        setVerificationNotes(player.verification_notes || "");
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Verificar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog para ver datos del jugador */}
      <Dialog open={!!selectedPlayer} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
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
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintPlayer}
                className="print:hidden"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
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

      {/* Dialog para verificar/rechazar jugador */}
      <Dialog open={!!verifyingPlayer} onOpenChange={() => setVerifyingPlayer(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Verificar Jugador: {verifyingPlayer?.first_name} {verifyingPlayer?.last_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Notas de Verificación</Label>
              <Textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Agregar notas sobre la verificación..."
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => verifyingPlayer && handleVerifyPlayer(verifyingPlayer.id, true)}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Verificar
              </Button>
              <Button
                variant="destructive"
                onClick={() => verifyingPlayer && handleVerifyPlayer(verifyingPlayer.id, false)}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
