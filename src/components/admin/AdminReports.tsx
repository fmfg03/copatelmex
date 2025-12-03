import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { FileSpreadsheet, FileText, Download } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const AdminReports = () => {
  const [loading, setLoading] = useState(false);

  const generatePlayersReport = async (format: "excel" | "pdf") => {
    setLoading(true);
    try {
      const { data: players, error } = await supabase
        .from("players")
        .select(`
          *,
          registrations!inner (
            teams!inner (
              team_name,
              academy_name
            )
          )
        `);

      if (error) throw error;

      const reportData = players.map((player) => ({
        Nombre: `${player.first_name} ${player.last_name}`,
        "Fecha Nacimiento": new Date(player.birth_date).toLocaleDateString(),
        Equipo: player.registrations?.teams?.team_name || "N/A",
        Academia: player.registrations?.teams?.academy_name || "N/A",
        Posición: player.position || "N/A",
        Número: player.jersey_number || "N/A",
        "Documentos Completos": player.documents_complete ? "Sí" : "No",
        Verificado: player.documents_verified ? "Sí" : "No",
      }));

      if (format === "excel") {
        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Jugadores");
        XLSX.writeFile(wb, `jugadores_${new Date().toISOString().split("T")[0]}.xlsx`);
      } else {
        const doc = new jsPDF();
        doc.text("Reporte de Jugadores", 14, 15);
        doc.autoTable({
          head: [Object.keys(reportData[0])],
          body: reportData.map((row) => Object.values(row)),
          startY: 25,
        });
        doc.save(`jugadores_${new Date().toISOString().split("T")[0]}.pdf`);
      }

      toast({
        title: "Reporte generado",
        description: `El reporte se ha descargado correctamente en formato ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTeamsReport = async (format: "excel" | "pdf") => {
    setLoading(true);
    try {
      const { data: teams, error } = await supabase
        .from("teams")
        .select(`
          *,
          registrations (
            category_id,
            payment_status,
            payment_amount
          )
        `);

      if (error) throw error;

      const reportData = teams.map((team) => ({
        Equipo: team.team_name,
        Academia: team.academy_name || "N/A",
        Estado: team.state,
        Teléfono: team.phone_number,
        "Estado Registro": team.status === "approved" ? "Aprobado" : team.status === "rejected" ? "Rechazado" : "Pendiente",
        "Fecha Registro": new Date(team.created_at).toLocaleDateString(),
      }));

      if (format === "excel") {
        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Equipos");
        XLSX.writeFile(wb, `equipos_${new Date().toISOString().split("T")[0]}.xlsx`);
      } else {
        const doc = new jsPDF();
        doc.text("Reporte de Equipos", 14, 15);
        doc.autoTable({
          head: [Object.keys(reportData[0])],
          body: reportData.map((row) => Object.values(row)),
          startY: 25,
        });
        doc.save(`equipos_${new Date().toISOString().split("T")[0]}.pdf`);
      }

      toast({
        title: "Reporte generado",
        description: `El reporte se ha descargado correctamente en formato ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentsReport = async (format: "excel" | "pdf") => {
    setLoading(true);
    try {
      const { data: registrations, error } = await supabase
        .from("registrations")
        .select(`
          *,
          teams!inner (
            team_name,
            academy_name
          )
        `);

      if (error) throw error;

      const reportData = registrations.map((reg) => ({
        Equipo: reg.teams?.team_name || "N/A",
        Academia: reg.teams?.academy_name || "N/A",
        Monto: `$${reg.payment_amount?.toLocaleString() || 0} MXN`,
        Estado: reg.payment_status === "completed" ? "Pagado" : reg.payment_status === "failed" ? "Fallido" : "Pendiente",
        Referencia: reg.payment_reference || "N/A",
        "Fecha Registro": new Date(reg.registration_date).toLocaleDateString(),
        "Fecha Pago": reg.payment_date ? new Date(reg.payment_date).toLocaleDateString() : "N/A",
      }));

      if (format === "excel") {
        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pagos");
        XLSX.writeFile(wb, `pagos_${new Date().toISOString().split("T")[0]}.xlsx`);
      } else {
        const doc = new jsPDF();
        doc.text("Reporte de Pagos", 14, 15);
        doc.autoTable({
          head: [Object.keys(reportData[0])],
          body: reportData.map((row) => Object.values(row)),
          startY: 25,
        });
        doc.save(`pagos_${new Date().toISOString().split("T")[0]}.pdf`);
      }

      toast({
        title: "Reporte generado",
        description: `El reporte se ha descargado correctamente en formato ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Reporte de Jugadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Exporta la lista completa de jugadores con sus datos y estado de documentos
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => generatePlayersReport("excel")}
              disabled={loading}
              className="flex-1"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar a Excel
            </Button>
            <Button
              onClick={() => generatePlayersReport("pdf")}
              disabled={loading}
              variant="secondary"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar a PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Reporte de Equipos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Exporta la lista de equipos registrados con su información de contacto
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => generateTeamsReport("excel")}
              disabled={loading}
              className="flex-1"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar a Excel
            </Button>
            <Button
              onClick={() => generateTeamsReport("pdf")}
              disabled={loading}
              variant="secondary"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar a PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Reporte de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Exporta el historial de pagos y registros con detalles financieros
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => generatePaymentsReport("excel")}
              disabled={loading}
              className="flex-1"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar a Excel
            </Button>
            <Button
              onClick={() => generatePaymentsReport("pdf")}
              disabled={loading}
              variant="secondary"
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar a PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
