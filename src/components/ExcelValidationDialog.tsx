import { AlertCircle, AlertTriangle, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ValidationError {
  row: number;
  column: string;
  error: string;
  value?: string;
}

interface ExcelValidationDialogProps {
  open: boolean;
  onClose: () => void;
  errors: ValidationError[];
  warnings: ValidationError[];
  onContinue?: () => void;
}

export const ExcelValidationDialog = ({ 
  open, 
  onClose, 
  errors, 
  warnings,
  onContinue 
}: ExcelValidationDialogProps) => {
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasErrors && <AlertCircle className="h-5 w-5 text-destructive" />}
            {!hasErrors && hasWarnings && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            Validación de Excel
          </DialogTitle>
          <DialogDescription>
            {hasErrors && "Se encontraron errores que deben corregirse antes de continuar"}
            {!hasErrors && hasWarnings && "Se encontraron algunas advertencias"}
            {!hasErrors && !hasWarnings && "Validación exitosa"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {/* Errores */}
            {hasErrors && (
              <div className="space-y-2">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Errores ({errors.length})</AlertTitle>
                  <AlertDescription>
                    Estos problemas deben corregirse en el archivo Excel
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  {errors.map((error, idx) => (
                    <div 
                      key={idx}
                      className="p-3 border border-destructive/50 bg-destructive/5 rounded-lg text-sm"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="font-semibold text-destructive">
                            Fila {error.row}, Columna "{error.column}"
                          </div>
                          <div className="text-foreground mt-1">
                            {error.error}
                          </div>
                          {error.value && (
                            <div className="text-muted-foreground text-xs mt-1">
                              Valor: "{error.value}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Advertencias */}
            {hasWarnings && (
              <div className="space-y-2">
                <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800 dark:text-amber-400">
                    Advertencias ({warnings.length})
                  </AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-500">
                    Revisa estos elementos antes de continuar
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  {warnings.map((warning, idx) => (
                    <div 
                      key={idx}
                      className="p-3 border border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/10 rounded-lg text-sm"
                    >
                      <div className="font-semibold text-amber-800 dark:text-amber-400">
                        Fila {warning.row}, Columna "{warning.column}"
                      </div>
                      <div className="text-foreground mt-1">
                        {warning.error}
                      </div>
                      {warning.value && (
                        <div className="text-muted-foreground text-xs mt-1">
                          Valor: "{warning.value}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {hasErrors ? 'Cerrar y Corregir' : 'Cerrar'}
          </Button>
          {!hasErrors && onContinue && (
            <Button onClick={onContinue}>
              Continuar con la Carga
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
