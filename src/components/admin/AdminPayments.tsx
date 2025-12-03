import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { DollarSign, Filter, X, CalendarIcon, CheckCircle2, XCircle, Search, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Registration = {
  id: string;
  payment_status: string;
  payment_amount: number;
  payment_date: string;
  payment_reference: string;
  team_id: string;
  registration_date: string;
  teams: {
    team_name: string;
    state: string;
  };
  categories: {
    name: string;
  };
};

export const AdminPayments = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchReference, setSearchReference] = useState<string>("");
  
  // Confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    registrationId: string;
    action: 'paid' | 'unpaid';
    teamName: string;
    reference: string;
  }>({
    open: false,
    registrationId: "",
    action: 'paid',
    teamName: "",
    reference: "",
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    let filtered = registrations;

    // Search by reference filter
    if (searchReference.trim()) {
      filtered = filtered.filter((r) => 
        r.payment_reference?.toLowerCase().includes(searchReference.toLowerCase())
      );
    }

    // Payment status filter
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter((r) => r.payment_status === paymentStatusFilter);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((r) => new Date(r.registration_date) >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter((r) => new Date(r.registration_date) <= dateTo);
    }

    // Amount range filter
    if (minAmount) {
      filtered = filtered.filter((r) => (r.payment_amount || 0) >= parseFloat(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter((r) => (r.payment_amount || 0) <= parseFloat(maxAmount));
    }

    setFilteredRegistrations(filtered);
  }, [registrations, paymentStatusFilter, dateFrom, dateTo, minAmount, maxAmount, searchReference]);

  const clearFilters = () => {
    setPaymentStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setMinAmount("");
    setMaxAmount("");
    setSearchReference("");
  };

  const hasActiveFilters = paymentStatusFilter !== "all" || dateFrom || dateTo || minAmount || maxAmount || searchReference.trim();

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("registrations")
        .select(`
          *,
          teams:team_id (
            team_name,
            state
          ),
          categories:category_id (
            name
          )
        `)
        .order("registration_date", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
      setFilteredRegistrations(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pagos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openConfirmDialog = (registrationId: string, action: 'paid' | 'unpaid', teamName: string, reference: string) => {
    setConfirmDialog({
      open: true,
      registrationId,
      action,
      teamName,
      reference,
    });
  };

  const handleConfirmAction = async () => {
    const { registrationId, action } = confirmDialog;
    try {
      if (action === 'paid') {
        const { error } = await supabase
          .from("registrations")
          .update({
            payment_status: "paid",
            payment_date: new Date().toISOString(),
          })
          .eq("id", registrationId);

        if (error) throw error;

        toast({
          title: "Pago Confirmado",
          description: "El pago ha sido marcado como completado",
        });
      } else {
        const { error } = await supabase
          .from("registrations")
          .update({
            payment_status: "pending",
            payment_date: null,
          })
          .eq("id", registrationId);

        if (error) throw error;

        toast({
          title: "Pago Revertido",
          description: "El pago ha sido marcado como pendiente",
        });
      }

      setConfirmDialog({ open: false, registrationId: "", action: 'paid', teamName: "", reference: "" });
      fetchPayments();
    } catch (error) {
      console.error("Error updating payment:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el pago",
        variant: "destructive",
      });
      setConfirmDialog({ open: false, registrationId: "", action: 'paid', teamName: "", reference: "" });
    }
  };

  const getTotalPaid = () => {
    return filteredRegistrations
      .filter((r) => r.payment_status === "paid" || r.payment_status === "completed")
      .reduce((sum, r) => sum + (r.payment_amount || 0), 0);
  };

  const getTotalPending = () => {
    return filteredRegistrations.filter((r) => r.payment_status === "pending").length;
  };

  if (loading) {
    return <div className="text-center py-8">Cargando pagos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search by Reference - Destacado */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-lg border-2 border-primary/30">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Buscar por Referencia de Pago</h3>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ingresa los 6 dígitos de la referencia..."
              value={searchReference}
              onChange={(e) => setSearchReference(e.target.value)}
              className="pl-10 font-mono text-lg"
              maxLength={6}
            />
          </div>
          {searchReference && (
            <Button variant="ghost" size="icon" onClick={() => setSearchReference("")}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        {searchReference && filteredRegistrations.length > 0 && (
          <p className="text-sm text-muted-foreground mt-2">
            {filteredRegistrations.length} {filteredRegistrations.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 justify-end">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          Filtros Avanzados
          {hasActiveFilters && (
            <Badge variant="default" className="ml-1 px-1 py-0 text-xs">
              {[paymentStatusFilter !== "all", dateFrom, dateTo, minAmount, maxAmount, searchReference.trim()].filter(Boolean).length}
            </Badge>
          )}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Limpiar Filtros
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg bg-muted/50">
          <div>
            <Label>Estado de Pago</Label>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="paid">Pagado</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
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

          <div>
            <Label>Monto Mínimo</Label>
            <Input
              type="number"
              placeholder="0"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
          </div>

          <div>
            <Label>Monto Máximo</Label>
            <Input
              type="number"
              placeholder="999999"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold">Total Cobrado</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">
            ${getTotalPaid().toLocaleString()} MXN
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold">Pagos Pendientes</h3>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{getTotalPending()}</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold">Total Registros</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">{filteredRegistrations.length}</p>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado Pago</TableHead>
              <TableHead>Fecha Registro</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRegistrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No se encontraron registros
                </TableCell>
              </TableRow>
            ) : (
              filteredRegistrations.map((reg) => (
                <TableRow key={reg.id}>
                  <TableCell className="font-medium">
                    {reg.teams?.team_name || "N/A"}
                  </TableCell>
                  <TableCell>
                    {reg.teams?.state || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {reg.categories?.name || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm font-bold">
                    {reg.payment_reference || "N/A"}
                  </TableCell>
                  <TableCell className="font-medium">
                    ${reg.payment_amount?.toLocaleString() || 0} MXN
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        reg.payment_status === "paid" || reg.payment_status === "completed"
                          ? "default"
                          : reg.payment_status === "failed"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {reg.payment_status === "paid" || reg.payment_status === "completed"
                        ? "Pagado"
                        : reg.payment_status === "failed"
                        ? "Fallido"
                        : "Pendiente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(reg.registration_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      {(reg.payment_status === "pending" || !reg.payment_status) && (
                        <Button
                          size="sm"
                          onClick={() => openConfirmDialog(reg.id, 'paid', reg.teams?.team_name || '', reg.payment_reference || '')}
                          className="gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Verificar Pago
                        </Button>
                      )}
                      {(reg.payment_status === "paid" || reg.payment_status === "completed") && (
                        <>
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {reg.payment_date
                              ? `Verificado: ${new Date(reg.payment_date).toLocaleDateString()}`
                              : "Verificado"}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openConfirmDialog(reg.id, 'unpaid', reg.teams?.team_name || '', reg.payment_reference || '')}
                            className="gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Revertir Verificación
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {confirmDialog.action === 'paid' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Confirmar Verificación de Pago
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-amber-600" />
                  Revertir Verificación de Pago
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                {confirmDialog.action === 'paid' 
                  ? '¿Confirmas que has verificado el pago para este equipo?' 
                  : '¿Estás seguro de revertir la verificación de este pago?'}
              </p>
              
              <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Equipo:</span>
                  <span className="font-medium">{confirmDialog.teamName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Referencia:</span>
                  <span className="font-mono font-bold text-primary">{confirmDialog.reference}</span>
                </div>
              </div>

              {confirmDialog.action === 'paid' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                  <p className="text-green-700 dark:text-green-400 text-sm">
                    Al confirmar, el equipo podrá continuar con el registro de sus jugadores.
                  </p>
                </div>
              )}

              {confirmDialog.action === 'unpaid' && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                  <p className="text-amber-700 dark:text-amber-400 text-sm">
                    Al revertir, el equipo no podrá continuar con el registro hasta que se verifique nuevamente el pago.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmAction}
              className={confirmDialog.action === 'paid' ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {confirmDialog.action === 'paid' ? 'Confirmar Verificación' : 'Revertir Verificación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
