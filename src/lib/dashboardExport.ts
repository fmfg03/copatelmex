import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

type StatsData = {
  totalTeams: number;
  totalPlayers: number;
  teamsByStatus: { name: string; value: number }[];
  teamsByPayment: { name: string; value: number }[];
  teamsByState: { name: string; value: number }[];
  teamsByCategory: { name: string; value: number }[];
  documentStats: { name: string; value: number }[];
};

type TrendData = {
  date: string;
  registrations: number;
  payments: number;
}[];

export const exportDashboardToPDF = (stats: StatsData, trendData: TrendData, dateRange?: { from?: Date; to?: Date }) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(18);
  doc.text("Reporte de Estadísticas - Copa Telmex Telcel", pageWidth / 2, 20, { align: "center" });
  
  doc.setFontSize(10);
  const dateText = dateRange?.from && dateRange?.to 
    ? `Período: ${dateRange.from.toLocaleDateString('es-MX')} - ${dateRange.to.toLocaleDateString('es-MX')}`
    : "Período: Todo el tiempo";
  doc.text(dateText, pageWidth / 2, 28, { align: "center" });
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}`, pageWidth / 2, 34, { align: "center" });

  let yPos = 45;

  doc.setFontSize(14);
  doc.text("Resumen General", 14, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [["Métrica", "Valor"]],
    body: [
      ["Total Equipos", stats.totalTeams.toString()],
      ["Total Jugadores", stats.totalPlayers.toString()],
      ["Pagos Completados", (stats.teamsByPayment.find(p => p.name === "Pagado")?.value || 0).toString()],
      ["Estados Participantes", stats.teamsByState.length.toString()],
    ],
    theme: "striped",
    headStyles: { fillColor: [15, 76, 129] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.text("Equipos por Status", 14, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [["Status", "Cantidad"]],
    body: stats.teamsByStatus.map(s => [s.name, s.value.toString()]),
    theme: "striped",
    headStyles: { fillColor: [15, 76, 129] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.text("Registros por Estado de Pago", 14, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [["Estado de Pago", "Cantidad"]],
    body: stats.teamsByPayment.map(p => [p.name, p.value.toString()]),
    theme: "striped",
    headStyles: { fillColor: [15, 76, 129] },
  });

  doc.addPage();
  yPos = 20;

  doc.setFontSize(14);
  doc.text("Equipos por Estado (Top 10)", 14, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [["Estado", "Equipos"]],
    body: stats.teamsByState.map(s => [s.name, s.value.toString()]),
    theme: "striped",
    headStyles: { fillColor: [15, 76, 129] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.text("Registros por Categoría", 14, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [["Categoría", "Registros"]],
    body: stats.teamsByCategory.map(c => [c.name, c.value.toString()]),
    theme: "striped",
    headStyles: { fillColor: [15, 76, 129] },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  doc.setFontSize(14);
  doc.text("Documentos de Jugadores", 14, yPos);
  yPos += 8;
  
  autoTable(doc, {
    startY: yPos,
    head: [["Estado", "Jugadores"]],
    body: stats.documentStats.map(d => [d.name, d.value.toString()]),
    theme: "striped",
    headStyles: { fillColor: [15, 76, 129] },
  });

  if (trendData.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Tendencia de Inscripciones", 14, 20);
    
    autoTable(doc, {
      startY: 28,
      head: [["Fecha", "Inscripciones", "Pagos"]],
      body: trendData.map(t => [t.date, t.registrations.toString(), t.payments.toString()]),
      theme: "striped",
      headStyles: { fillColor: [15, 76, 129] },
    });
  }

  doc.save(`estadisticas-copa-america-${new Date().toISOString().split('T')[0]}.pdf`);
};

const addSheetData = (worksheet: ExcelJS.Worksheet, title: string, headers: string[], rows: (string | number)[][]) => {
  worksheet.addRow([title]);
  worksheet.addRow(headers);
  rows.forEach(row => worksheet.addRow(row));
  worksheet.getColumn(1).width = 25;
  worksheet.getColumn(2).width = 15;
};

export const exportDashboardToExcel = async (stats: StatsData, trendData: TrendData, dateRange?: { from?: Date; to?: Date }) => {
  const wb = new ExcelJS.Workbook();

  const summarySheet = wb.addWorksheet("Resumen");
  summarySheet.addRow(["Reporte de Estadísticas - Copa Telmex Telcel"]);
  summarySheet.addRow([dateRange?.from && dateRange?.to 
    ? `Período: ${dateRange.from.toLocaleDateString('es-MX')} - ${dateRange.to.toLocaleDateString('es-MX')}`
    : "Período: Todo el tiempo"]);
  summarySheet.addRow([`Generado: ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}`]);
  summarySheet.addRow([]);
  summarySheet.addRow(["Resumen General"]);
  summarySheet.addRow(["Métrica", "Valor"]);
  summarySheet.addRow(["Total Equipos", stats.totalTeams]);
  summarySheet.addRow(["Total Jugadores", stats.totalPlayers]);
  summarySheet.addRow(["Pagos Completados", stats.teamsByPayment.find(p => p.name === "Pagado")?.value || 0]);
  summarySheet.addRow(["Estados Participantes", stats.teamsByState.length]);
  summarySheet.getColumn(1).width = 25;
  summarySheet.getColumn(2).width = 15;

  const statusSheet = wb.addWorksheet("Por Status");
  addSheetData(statusSheet, "Equipos por Status", ["Status", "Cantidad"], stats.teamsByStatus.map(s => [s.name, s.value]));

  const paymentSheet = wb.addWorksheet("Por Pago");
  addSheetData(paymentSheet, "Registros por Estado de Pago", ["Estado", "Cantidad"], stats.teamsByPayment.map(p => [p.name, p.value]));

  const stateSheet = wb.addWorksheet("Por Estado");
  addSheetData(stateSheet, "Equipos por Estado", ["Estado", "Equipos"], stats.teamsByState.map(s => [s.name, s.value]));

  const categorySheet = wb.addWorksheet("Por Categoría");
  addSheetData(categorySheet, "Registros por Categoría", ["Categoría", "Registros"], stats.teamsByCategory.map(c => [c.name, c.value]));

  const docsSheet = wb.addWorksheet("Documentos");
  addSheetData(docsSheet, "Documentos de Jugadores", ["Estado", "Jugadores"], stats.documentStats.map(d => [d.name, d.value]));

  if (trendData.length > 0) {
    const trendSheet = wb.addWorksheet("Tendencias");
    trendSheet.addRow(["Tendencia de Inscripciones"]);
    trendSheet.addRow(["Fecha", "Inscripciones", "Pagos"]);
    trendData.forEach(t => trendSheet.addRow([t.date, t.registrations, t.payments]));
    trendSheet.getColumn(1).width = 15;
    trendSheet.getColumn(2).width = 15;
    trendSheet.getColumn(3).width = 15;
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `estadisticas-copa-america-${new Date().toISOString().split('T')[0]}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
};
