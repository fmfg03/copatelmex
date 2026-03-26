import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { FileCheck, Search, CheckCircle, XCircle, Clock, Eye, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const AdminDocuments = () => {
  const [players, setPlayers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [playersRes, catsRes] = await Promise.all([
      supabase.from("players").select("*, registrations(*, teams(team_name), categories(name, id))").order("created_at", { ascending: false }),
      supabase.from("categories").select("*"),
    ]);
    setPlayers(playersRes.data || []);
    setCategories(catsRes.data || []);
    setLoading(false);
  };

  const updateVerification = async (playerId: string, verified: boolean, notes?: string) => {
    const { error } = await supabase.from("players").update({
      documents_verified: verified,
      verification_notes: notes || null,
    }).eq("id", playerId);
    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
    } else {
      toast({ title: verified ? "Verificado" : "Rechazado", description: `Documentos ${verified ? "verificados" : "rechazados"}` });
      fetchData();
    }
  };

  const filtered = players.filter((p) => {
    const matchesSearch = searchTerm === "" ||
      `${p.first_name} ${p.paternal_surname || ""} ${p.maternal_surname || ""}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.curp?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.registrations?.teams?.team_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVerification =
      verificationFilter === "all" ||
      (verificationFilter === "verified" && p.documents_verified) ||
      (verificationFilter === "pending" && !p.documents_verified && p.documents_complete) ||
      (verificationFilter === "incomplete" && !p.documents_complete);
    const matchesCategory = categoryFilter === "all" || p.registrations?.categories?.id === categoryFilter;
    return matchesSearch && matchesVerification && matchesCategory;
  });

  const totalPlayers = players.length;
  const verifiedCount = players.filter(p => p.documents_verified).length;
  const completeCount = players.filter(p => p.documents_complete && !p.documents_verified).length;
  const incompleteCount = players.filter(p => !p.documents_complete).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileCheck className="w-6 h-6" /> Documentos de Jugadores
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold">{totalPlayers}</div>
          <div className="text-sm text-muted-foreground">Total jugadores</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{verifiedCount}</div>
          <div className="text-sm text-muted-foreground">Verificados</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{completeCount}</div>
          <div className="text-sm text-muted-foreground">Pendientes revisión</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{incompleteCount}</div>
          <div className="text-sm text-muted-foreground">Incompletos</div>
        </Card>
      </div>

      {totalPlayers > 0 && (
        <Progress value={(verifiedCount / totalPlayers) * 100} className="h-3" />
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar jugador, CURP o equipo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={verificationFilter} onValueChange={setVerificationFilter}>
          <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="verified">Verificados</SelectItem>
            <SelectItem value="pending">Pendientes revisión</SelectItem>
            <SelectItem value="incomplete">Incompletos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jugador</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>CURP</TableHead>
              <TableHead>Foto</TableHead>
              <TableHead>Acta</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8">Cargando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No hay jugadores</TableCell></TableRow>
            ) : (
              filtered.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">
                    {player.first_name} {player.paternal_surname || ""} {player.maternal_surname || ""}
                  </TableCell>
                  <TableCell>{player.registrations?.teams?.team_name || "-"}</TableCell>
                  <TableCell>{player.registrations?.categories?.name || "-"}</TableCell>
                  <TableCell className="font-mono text-xs">{player.curp || "-"}</TableCell>
                  <TableCell>
                    {player.photo_url ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
                  </TableCell>
                  <TableCell>
                    {player.birth_certificate_url ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-400" />}
                  </TableCell>
                  <TableCell>
                    {player.documents_verified ? (
                      <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Verificado</Badge>
                    ) : player.documents_complete ? (
                      <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-500"><AlertTriangle className="w-3 h-3 mr-1" />Incompleto</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {player.photo_url && (
                        <Button size="sm" variant="ghost" onClick={() => window.open(player.photo_url, "_blank")}><Eye className="w-4 h-4" /></Button>
                      )}
                      {!player.documents_verified && player.documents_complete && (
                        <>
                          <Button size="sm" variant="default" onClick={() => updateVerification(player.id, true)}>✓</Button>
                          <Button size="sm" variant="destructive" onClick={() => updateVerification(player.id, false, "Documentos rechazados")}>✗</Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};
