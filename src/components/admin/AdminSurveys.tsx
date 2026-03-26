import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Star, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export const AdminSurveys = () => {
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("survey_responses").select("*, categories(name), teams(team_name)").order("created_at", { ascending: false });
    setResponses(data || []);
    setLoading(false);
  };

  const deleteResponse = async (id: string) => {
    const { error } = await supabase.from("survey_responses").delete().eq("id", id);
    if (!error) { toast({ title: "Eliminado" }); fetchData(); }
  };

  const filtered = responses.filter(r => typeFilter === "all" || r.survey_type === typeFilter);
  const avgRating = filtered.length > 0 ? (filtered.reduce((sum, r) => sum + r.rating, 0) / filtered.length).toFixed(1) : "0";
  const surveyTypes = [...new Set(responses.map(r => r.survey_type))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="w-6 h-6" /> Encuestas
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold">{filtered.length}</div>
          <div className="text-sm text-muted-foreground">Total respuestas</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-2xl font-bold flex items-center justify-center gap-1">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />{avgRating}
          </div>
          <div className="text-sm text-muted-foreground">Calificación promedio</div>
        </Card>
        <Card className="p-4">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger><SelectValue placeholder="Tipo de encuesta" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {surveyTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Calificación</TableHead>
              <TableHead>Equipo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Comentario</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8">Cargando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No hay respuestas</TableCell></TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.respondent_name || "-"}</TableCell>
                  <TableCell><Badge variant="outline">{r.survey_type}</Badge></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < r.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{r.teams?.team_name || "-"}</TableCell>
                  <TableCell>{r.categories?.name || "-"}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{r.feedback || "-"}</TableCell>
                  <TableCell>{new Date(r.created_at).toLocaleDateString("es-MX")}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="destructive" onClick={() => deleteResponse(r.id)}><Trash2 className="w-4 h-4" /></Button>
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
