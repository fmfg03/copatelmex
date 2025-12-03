import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Search, Filter, X, Calendar as CalendarIcon, Eye } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

type AuditLog = {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: unknown;
  user_agent: string | null;
  created_at: string;
};

export const AdminAudit = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    // Extract unique tables and actions
    const uniqueTables = [...new Set(logs.map((l) => l.table_name))].sort();
    const uniqueActions = [...new Set(logs.map((l) => l.action))].sort();
    setTables(uniqueTables);
    setActions(uniqueActions);
  }, [logs]);

  useEffect(() => {
    let filtered = logs;

    // Search filter
    if (search.trim()) {
      filtered = filtered.filter(
        (log) =>
          log.user_email?.toLowerCase().includes(search.toLowerCase()) ||
          log.action.toLowerCase().includes(search.toLowerCase()) ||
          log.table_name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Action filter
    if (actionFilter !== "all") {
      filtered = filtered.filter((log) => log.action === actionFilter);
    }

    // Table filter
    if (tableFilter !== "all") {
      filtered = filtered.filter((log) => log.table_name === tableFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((log) => new Date(log.created_at) >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((log) => new Date(log.created_at) <= dateTo);
    }

    setFilteredLogs(filtered);
  }, [search, logs, actionFilter, tableFilter, dateFrom, dateTo]);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      setLogs(data || []);
      setFilteredLogs(data || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los registros de auditoría",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setActionFilter("all");
    setTableFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setSearch("");
  };

  const hasActiveFilters = actionFilter !== "all" || tableFilter !== "all" || dateFrom || dateTo || search;

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("INSERT") || action.includes("CREATE")) return "default";
    if (action.includes("UPDATE") || action.includes("APPROVE")) return "secondary";
    if (action.includes("DELETE") || action.includes("REJECT")) return "destructive";
    return "outline";
  };

  if (loading) {
    return <div className="text-center py-8">Cargando registros de auditoría...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Registro de Auditoría</h2>
          <p className="text-muted-foreground">
            Historial completo de acciones realizadas por administradores
          </p>
        </div>
        <Button onClick={fetchLogs} variant="outline">
          Actualizar
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por usuario, acción o tabla..."
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
              {[actionFilter !== "all", tableFilter !== "all", dateFrom, dateTo, search].filter(Boolean).length}
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

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
          <div>
            <Label>Acción</Label>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {actions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tabla</Label>
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {tables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Fecha Desde</Label>
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
            <Label>Fecha Hasta</Label>
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
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Tabla</TableHead>
              <TableHead>Detalles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No hay registros de auditoría
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>{log.user_email || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={getActionBadgeVariant(log.action)}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <code className="px-2 py-1 bg-muted rounded text-xs">
                      {log.table_name}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog para ver detalles del log */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalles del Registro de Auditoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Fecha y Hora</Label>
                <p className="font-medium">
                  {selectedLog && new Date(selectedLog.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Usuario</Label>
                <p className="font-medium">{selectedLog?.user_email || "N/A"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Acción</Label>
                <Badge variant={getActionBadgeVariant(selectedLog?.action || "")}>
                  {selectedLog?.action}
                </Badge>
              </div>
              <div>
                <Label className="text-muted-foreground">Tabla</Label>
                <code className="px-2 py-1 bg-muted rounded text-sm">
                  {selectedLog?.table_name}
                </code>
              </div>
              {selectedLog?.record_id && (
                <div className="col-span-2">
                  <Label className="text-muted-foreground">ID del Registro</Label>
                  <code className="px-2 py-1 bg-muted rounded text-xs block mt-1">
                    {selectedLog.record_id}
                  </code>
                </div>
              )}
            </div>

            {selectedLog?.old_values && (
              <Card>
                <CardContent className="pt-6">
                  <Label className="text-muted-foreground mb-2 block">Valores Anteriores</Label>
                  <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {selectedLog?.new_values && (
              <Card>
                <CardContent className="pt-6">
                  <Label className="text-muted-foreground mb-2 block">Valores Nuevos</Label>
                  <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {selectedLog?.ip_address && (
              <div>
                <Label className="text-muted-foreground">Dirección IP</Label>
                <p className="font-medium">{String(selectedLog.ip_address)}</p>
              </div>
            )}

            {selectedLog?.user_agent && (
              <div>
                <Label className="text-muted-foreground">User Agent</Label>
                <p className="font-mono text-xs">{selectedLog.user_agent}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
