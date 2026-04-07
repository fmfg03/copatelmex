import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Users, Shield, DollarSign, MapPin, FileCheck, Loader2 } from "lucide-react";
import { DashboardFilters } from "./DashboardFilters";
import { TrendChart } from "./TrendChart";
import { exportDashboardToPDF, exportDashboardToExcel } from "@/lib/dashboardExport";
import { format, startOfWeek, parseISO } from "date-fns";
import { es } from "date-fns/locale";

type StatsData = {
  totalTeams: number;
  totalPlayers: number;
  teamsByStatus: { name: string; value: number; color: string }[];
  teamsByPayment: { name: string; value: number; color: string }[];
  teamsByState: { name: string; value: number }[];
  teamsByCategory: { name: string; value: number }[];
  documentStats: { name: string; value: number; color: string }[];
};

type TrendDataPoint = {
  date: string;
  registrations: number;
  payments: number;
};

type DateRange = {
  from: Date | undefined;
  to: Date | undefined;
};

export const AdminDashboard = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [trendPeriod, setTrendPeriod] = useState<"day" | "week">("day");

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      
      let teamsQuery = supabase.from("teams").select("id, status, state, created_at");
      let registrationsQuery = supabase.from("registrations").select("id, payment_status, category_id, registration_date, payment_date, categories(name)");
      let playersQuery = supabase.from("players").select("id, documents_complete, photo_url, birth_certificate_url, curp, created_at");

      if (dateRange.from) {
        const fromStr = dateRange.from.toISOString();
        teamsQuery = teamsQuery.gte("created_at", fromStr);
        registrationsQuery = registrationsQuery.gte("registration_date", fromStr);
        playersQuery = playersQuery.gte("created_at", fromStr);
      }
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        const toStr = toDate.toISOString();
        teamsQuery = teamsQuery.lte("created_at", toStr);
        registrationsQuery = registrationsQuery.lte("registration_date", toStr);
        playersQuery = playersQuery.lte("created_at", toStr);
      }

      const [teamsResult, registrationsResult, playersResult] = await Promise.all([
        teamsQuery,
        registrationsQuery,
        playersQuery,
      ]);

      if (teamsResult.error) throw teamsResult.error;
      if (registrationsResult.error) throw registrationsResult.error;
      if (playersResult.error) throw playersResult.error;

      const teams = teamsResult.data;
      const registrations = registrationsResult.data;
      const players = playersResult.data;

      const statusCounts: Record<string, number> = {};
      teams?.forEach(team => {
        const status = team.status || 'pending';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const statusColors: Record<string, string> = {
        pending: "#f59e0b",
        approved: "#22c55e",
        rejected: "#ef4444",
      };

      const statusLabels: Record<string, string> = {
        pending: "Pendiente",
        approved: "Aprobado",
        rejected: "Rechazado",
      };

      const teamsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
        color: statusColors[status] || "#6b7280",
      }));

      const paymentCounts: Record<string, number> = {};
      registrations?.forEach(reg => {
        const status = reg.payment_status || 'pending';
        paymentCounts[status] = (paymentCounts[status] || 0) + 1;
      });

      const paymentColors: Record<string, string> = {
        pending: "#f59e0b",
        paid: "#22c55e",
        partial: "#3b82f6",
        refunded: "#ef4444",
      };

      const paymentLabels: Record<string, string> = {
        pending: "Pendiente",
        paid: "Pagado",
        partial: "Parcial",
        refunded: "Reembolsado",
      };

      const teamsByPayment = Object.entries(paymentCounts).map(([status, count]) => ({
        name: paymentLabels[status] || status,
        value: count,
        color: paymentColors[status] || "#6b7280",
      }));

      const stateCounts: Record<string, number> = {};
      teams?.forEach(team => {
        const state = team.state || 'Sin estado';
        stateCounts[state] = (stateCounts[state] || 0) + 1;
      });

      const teamsByState = Object.entries(stateCounts)
        .map(([state, count]) => ({ name: state, value: count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      const categoryCounts: Record<string, number> = {};
      registrations?.forEach(reg => {
        const categoryName = (reg.categories as any)?.name || 'Sin categoría';
        categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
      });

      const teamsByCategory = Object.entries(categoryCounts)
        .map(([category, count]) => ({ name: category, value: count }))
        .sort((a, b) => b.value - a.value);

      let completeCount = 0;
      let incompleteCount = 0;
      let emptyCount = 0;

      players?.forEach(player => {
        const hasPhoto = !!player.photo_url;
        const hasBirthCert = !!player.birth_certificate_url;
        const hasCurp = !!player.curp;
        
        if (hasPhoto && hasBirthCert && hasCurp) {
          completeCount++;
        } else if (hasPhoto || hasBirthCert || hasCurp) {
          incompleteCount++;
        } else {
          emptyCount++;
        }
      });

      const documentStats = [
        { name: "Completos", value: completeCount, color: "#22c55e" },
        { name: "Incompletos", value: incompleteCount, color: "#f59e0b" },
        { name: "Sin documentos", value: emptyCount, color: "#ef4444" },
      ];

      const trendMap: Record<string, { registrations: number; payments: number }> = {};
      
      registrations?.forEach(reg => {
        if (reg.registration_date) {
          const date = parseISO(reg.registration_date);
          const key = trendPeriod === "day" 
            ? format(date, "dd/MM", { locale: es })
            : format(startOfWeek(date, { weekStartsOn: 1 }), "dd/MM", { locale: es });
          
          if (!trendMap[key]) {
            trendMap[key] = { registrations: 0, payments: 0 };
          }
          trendMap[key].registrations++;
          
          if (reg.payment_status === "paid" && reg.payment_date) {
            trendMap[key].payments++;
          }
        }
      });

      const sortedTrendData = Object.entries(trendMap)
        .map(([date, data]) => ({ date, ...data }))
        .slice(-20);

      setTrendData(sortedTrendData);

      setStats({
        totalTeams: teams?.length || 0,
        totalPlayers: players?.length || 0,
        teamsByStatus,
        teamsByPayment,
        teamsByState,
        teamsByCategory,
        documentStats,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, [dateRange, trendPeriod]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExportPDF = () => {
    if (stats) {
      exportDashboardToPDF(stats, trendData, dateRange);
    }
  };

  const handleExportExcel = async () => {
    if (stats) {
      await exportDashboardToExcel(stats, trendData, dateRange);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se pudieron cargar las estadísticas
      </div>
    );
  }

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    ) : null;
  };

  return (
    <div className="space-y-6">
      <DashboardFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
        trendPeriod={trendPeriod}
        onTrendPeriodChange={setTrendPeriod}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Equipos</p>
                <p className="text-3xl font-bold">{stats.totalTeams}</p>
              </div>
              <Shield className="w-10 h-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Jugadores</p>
                <p className="text-3xl font-bold">{stats.totalPlayers}</p>
              </div>
              <Users className="w-10 h-10 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Registros Pagados</p>
                <p className="text-3xl font-bold">
                  {stats.teamsByPayment.find(p => p.name === "Pagado")?.value || 0}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-amber-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Estados</p>
                <p className="text-3xl font-bold">{stats.teamsByState.length}</p>
              </div>
              <MapPin className="w-10 h-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {trendData.length > 0 && (
        <TrendChart data={trendData} period={trendPeriod} />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Equipos por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.teamsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  dataKey="value"
                >
                  {stats.teamsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Registros por Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.teamsByPayment}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  dataKey="value"
                >
                  {stats.teamsByPayment.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-primary" />
              Documentos de Jugadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.documentStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  dataKey="value"
                >
                  {stats.documentStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Equipos por Estado (Top 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.teamsByState} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0f4c81" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Registros por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.teamsByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#ffd100" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
