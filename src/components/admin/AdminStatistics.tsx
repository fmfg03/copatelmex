import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { BarChart3, Upload, FileSpreadsheet, FileText, Trash2, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const AdminStatistics = () => {
  const [uploads, setUploads] = useState<any[]>([]);
  const [pdfReports, setPdfReports] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [uploadsRes, reportsRes, catsRes] = await Promise.all([
      supabase.from("statistics_uploads").select("*, categories(name)").order("uploaded_at", { ascending: false }),
      supabase.from("statistics_pdf_reports").select("*, categories(name)").order("created_at", { ascending: false }),
      supabase.from("categories").select("*"),
    ]);
    setUploads(uploadsRes.data || []);
    setPdfReports(reportsRes.data || []);
    setCategories(catsRes.data || []);
    setLoading(false);
  };

  const deleteUpload = async (id: string) => {
    const { error } = await supabase.from("statistics_uploads").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
    } else {
      toast({ title: "Eliminado" });
      fetchData();
    }
  };

  const deleteReport = async (id: string) => {
    const { error } = await supabase.from("statistics_pdf_reports").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" });
    } else {
      toast({ title: "Eliminado" });
      fetchData();
    }
  };

  const filteredUploads = uploads.filter(u => categoryFilter === "all" || u.category_id === categoryFilter);
  const filteredReports = pdfReports.filter(r => categoryFilter === "all" || r.category_id === categoryFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" /> Estadísticas
        </h2>
      </div>

      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="w-[250px]"><SelectValue placeholder="Filtrar por categoría" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorías</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Tabs defaultValue="uploads">
        <TabsList>
          <TabsTrigger value="uploads" className="flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" />Subidas Excel</TabsTrigger>
          <TabsTrigger value="pdf" className="flex items-center gap-2"><FileText className="w-4 h-4" />Reportes PDF</TabsTrigger>
        </TabsList>

        <TabsContent value="uploads" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Registros</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell></TableRow>
                ) : filteredUploads.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay subidas de estadísticas</TableCell></TableRow>
                ) : (
                  filteredUploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell>{upload.categories?.name || "-"}</TableCell>
                      <TableCell>{upload.excel_file_name || upload.file_name || "-"}</TableCell>
                      <TableCell>{upload.records_updated || 0}</TableCell>
                      <TableCell>{new Date(upload.uploaded_at).toLocaleDateString("es-MX")}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{upload.notes || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {upload.excel_file_path && (
                            <Button size="sm" variant="outline" onClick={() => window.open(upload.excel_file_path, "_blank")}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => deleteUpload(upload.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="pdf" className="mt-4">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Jornada</TableHead>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Fecha Reporte</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell></TableRow>
                ) : filteredReports.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay reportes PDF</TableCell></TableRow>
                ) : (
                  filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.categories?.name || "-"}</TableCell>
                      <TableCell>Jornada {report.jornada_number}</TableCell>
                      <TableCell>{report.file_name}</TableCell>
                      <TableCell>{new Date(report.report_date).toLocaleDateString("es-MX")}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{report.notes || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {report.file_path && (
                            <Button size="sm" variant="outline" onClick={() => window.open(report.file_path, "_blank")}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="destructive" onClick={() => deleteReport(report.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
