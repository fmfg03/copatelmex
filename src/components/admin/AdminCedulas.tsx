import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { FileText, Search, Eye, Upload, CheckCircle, Clock, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const AdminCedulas = () => {
  const [cedulas, setCedulas] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedCedula, setSelectedCedula] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cedulasRes, matchesRes, categoriesRes] = await Promise.all([
        supabase.from("match_cedulas").select("*, matches(*, home_team:teams!matches_home_team_id_fkey(team_name), away_team:teams!matches_away_team_id_fkey(team_name), categories(name))").order("created_at", { ascending: false }),
        supabase.from("matches").select("*, home_team:teams!matches_home_team_id_fkey(team_name), away_team:teams!matches_away_team_id_fkey(team_name), categories(name)").order("match_date", { ascending: false }),
        supabase.from("categories").select("*"),
      ]);
      setCedulas(cedulasRes.data || []);
      setMatches(matchesRes.data || []);
      setCategories(categoriesRes.data || []);
    } catch (error) {
      console.error("Error fetching cedulas:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateCedulaStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("match_cedulas").update({ status }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar el estado", variant: "destructive" });
    } else {
      toast({ title: "Actualizado", description: `Cédula marcada como ${status}` });
      fetchData();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprobada</Badge>;
      case "rejected": return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rechazada</Badge>;
      default: return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
    }
  };

  const filtered = cedulas.filter((c) => {
    const matchInfo = c.matches;
    const matchesSearch = searchTerm === "" ||
      matchInfo?.home_team?.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      matchInfo?.away_team?.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.referee_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || matchInfo?.categories?.name === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-6 h-6" /> Cédulas de Partido
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por equipo o árbitro..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="approved">Aprobada</SelectItem>
            <SelectItem value="rejected">Rechazada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partido</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Árbitro</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay cédulas registradas</TableCell></TableRow>
            ) : (
              filtered.map((cedula) => (
                <TableRow key={cedula.id}>
                  <TableCell className="font-medium">
                    {cedula.matches?.home_team?.team_name || "?"} vs {cedula.matches?.away_team?.team_name || "?"}
                  </TableCell>
                  <TableCell>{cedula.matches?.categories?.name || "-"}</TableCell>
                  <TableCell>{cedula.referee_name || "-"}</TableCell>
                  <TableCell>{getStatusBadge(cedula.status)}</TableCell>
                  <TableCell>{new Date(cedula.created_at).toLocaleDateString("es-MX")}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {cedula.file_url && (
                        <Button size="sm" variant="outline" onClick={() => window.open(cedula.file_url, "_blank")}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {cedula.status === "pending" && (
                        <>
                          <Button size="sm" variant="default" onClick={() => updateCedulaStatus(cedula.id, "approved")}>Aprobar</Button>
                          <Button size="sm" variant="destructive" onClick={() => updateCedulaStatus(cedula.id, "rejected")}>Rechazar</Button>
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
