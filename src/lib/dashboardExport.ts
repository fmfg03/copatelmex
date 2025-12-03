import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

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
  
  // Title
  doc.setFontSize(18);
  doc.text("Reporte de Estadísticas - Copa Club América", pageWidth / 2, 20, { align: "center" });
  
  // Date range
  doc.setFontSize(10);
  const dateText = dateRange?.from && dateRange?.to 
    ? `Período: ${dateRange.from.toLocaleDateString('es-MX')} - ${dateRange.to.toLocaleDateString('es-MX')}`
    : "Período: Todo el tiempo";
  doc.text(dateText, pageWidth / 2, 28, { align: "center" });
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}`, pageWidth / 2, 34, { align: "center" });

  let yPos = 45;

  // Summary
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

  // Teams by Status
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

  // Teams by Payment
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

  // New page for more data
  doc.addPage();
  yPos = 20;

  // Teams by State
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

  // Teams by Category
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

  // Document Stats
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

  // Trend data if available
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

export const exportDashboardToExcel = (stats: StatsData, trendData: TrendData, dateRange?: { from?: Date; to?: Date }) => {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryData = [
    ["Reporte de Estadísticas - Copa Club América"],
    [dateRange?.from && dateRange?.to 
      ? `Período: ${dateRange.from.toLocaleDateString('es-MX')} - ${dateRange.to.toLocaleDateString('es-MX')}`
      : "Período: Todo el tiempo"],
    [`Generado: ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}`],
    [],
    ["Resumen General"],
    ["Métrica", "Valor"],
    ["Total Equipos", stats.totalTeams],
    ["Total Jugadores", stats.totalPlayers],
    ["Pagos Completados", stats.teamsByPayment.find(p => p.name === "Pagado")?.value || 0],
    ["Estados Participantes", stats.teamsByState.length],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summarySheet, "Resumen");

  // Status sheet
  const statusData = [
    ["Equipos por Status"],
    ["Status", "Cantidad"],
    ...stats.teamsByStatus.map(s => [s.name, s.value])
  ];
  const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
  XLSX.utils.book_append_sheet(wb, statusSheet, "Por Status");

  // Payment sheet
  const paymentData = [
    ["Registros por Estado de Pago"],
    ["Estado", "Cantidad"],
    ...stats.teamsByPayment.map(p => [p.name, p.value])
  ];
  const paymentSheet = XLSX.utils.aoa_to_sheet(paymentData);
  XLSX.utils.book_append_sheet(wb, paymentSheet, "Por Pago");

  // State sheet
  const stateData = [
    ["Equipos por Estado"],
    ["Estado", "Equipos"],
    ...stats.teamsByState.map(s => [s.name, s.value])
  ];
  const stateSheet = XLSX.utils.aoa_to_sheet(stateData);
  XLSX.utils.book_append_sheet(wb, stateSheet, "Por Estado");

  // Category sheet
  const categoryData = [
    ["Registros por Categoría"],
    ["Categoría", "Registros"],
    ...stats.teamsByCategory.map(c => [c.name, c.value])
  ];
  const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
  XLSX.utils.book_append_sheet(wb, categorySheet, "Por Categoría");

  // Documents sheet
  const docsData = [
    ["Documentos de Jugadores"],
    ["Estado", "Jugadores"],
    ...stats.documentStats.map(d => [d.name, d.value])
  ];
  const docsSheet = XLSX.utils.aoa_to_sheet(docsData);
  XLSX.utils.book_append_sheet(wb, docsSheet, "Documentos");

  // Trend sheet
  if (trendData.length > 0) {
    const trendSheetData = [
      ["Tendencia de Inscripciones"],
      ["Fecha", "Inscripciones", "Pagos"],
      ...trendData.map(t => [t.date, t.registrations, t.payments])
    ];
    const trendSheet = XLSX.utils.aoa_to_sheet(trendSheetData);
    XLSX.utils.book_append_sheet(wb, trendSheet, "Tendencias");
  }

  XLSX.writeFile(wb, `estadisticas-copa-america-${new Date().toISOString().split('T')[0]}.xlsx`);
};
