import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  paternal_surname: string | null;
  maternal_surname: string | null;
  birth_date: string;
  curp: string | null;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  position: string | null;
  jersey_number: number | null;
}

interface EditPlayerDialogProps {
  open: boolean;
  onClose: () => void;
  player: Player | null;
  onSuccess: () => void;
}

export function EditPlayerDialog({
  open,
  onClose,
  player,
  onSuccess,
}: EditPlayerDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    paternalSurname: "",
    maternalSurname: "",
    birthDate: "",
    curp: "",
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    position: "",
    jerseyNumber: "",
  });

  useEffect(() => {
    if (player) {
      setFormData({
        firstName: player.first_name,
        paternalSurname: player.paternal_surname || "",
        maternalSurname: player.maternal_surname || "",
        birthDate: player.birth_date,
        curp: player.curp || "",
        parentName: player.parent_name,
        parentEmail: player.parent_email,
        parentPhone: player.parent_phone,
        position: player.position || "",
        jerseyNumber: player.jersey_number?.toString() || "",
      });
    }
  }, [player]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!player) return;

    setLoading(true);

    try {
      // Validaciones
      if (!formData.firstName.trim() || !formData.paternalSurname.trim()) {
        throw new Error("El nombre y apellido paterno son requeridos");
      }

      if (!formData.curp.trim()) {
        throw new Error("El CURP es obligatorio");
      }

      if (formData.curp.length !== 18) {
        throw new Error("El CURP debe tener exactamente 18 caracteres");
      }

      // Validar formato de CURP
      const curpRegex = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/;
      if (!curpRegex.test(formData.curp.toUpperCase())) {
        throw new Error("Formato de CURP inválido");
      }

      if (!formData.birthDate) {
        throw new Error("La fecha de nacimiento es requerida");
      }

      if (!formData.parentEmail.includes("@")) {
        throw new Error("El email del tutor es inválido");
      }

      if (formData.parentPhone.length < 10) {
        throw new Error("El teléfono del tutor debe tener al menos 10 dígitos");
      }

      const jerseyNum = formData.jerseyNumber ? parseInt(formData.jerseyNumber) : null;
      if (jerseyNum && (jerseyNum < 1 || jerseyNum > 99)) {
        throw new Error("El número de jersey debe estar entre 1 y 99");
      }

      const { error } = await supabase
        .from("players")
        .update({
          first_name: formData.firstName.trim(),
          last_name: `${formData.paternalSurname.trim()} ${formData.maternalSurname.trim()}`.trim(),
          paternal_surname: formData.paternalSurname.trim(),
          maternal_surname: formData.maternalSurname.trim(),
          birth_date: formData.birthDate,
          curp: formData.curp.toUpperCase(),
          parent_name: formData.parentName.trim(),
          parent_email: formData.parentEmail.trim(),
          parent_phone: formData.parentPhone.trim(),
          position: formData.position || null,
          jersey_number: jerseyNum,
        })
        .eq("id", player.id);

      if (error) throw error;

      toast({
        title: "Jugador actualizado",
        description: "La información del jugador se actualizó correctamente",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al actualizar jugador",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Jugador</DialogTitle>
          <DialogDescription>
            Actualiza la información del jugador. Los documentos no se pueden editar desde aquí.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                Nombre(s) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Juan Carlos"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paternalSurname">
                Apellido Paterno <span className="text-destructive">*</span>
              </Label>
              <Input
                id="paternalSurname"
                value={formData.paternalSurname}
                onChange={(e) => setFormData({ ...formData, paternalSurname: e.target.value })}
                placeholder="García"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maternalSurname">
                Apellido Materno <span className="text-destructive">*</span>
              </Label>
              <Input
                id="maternalSurname"
                value={formData.maternalSurname}
                onChange={(e) => setFormData({ ...formData, maternalSurname: e.target.value })}
                placeholder="López"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">
                Fecha de Nacimiento <span className="text-destructive">*</span>
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="curp">
                CURP <span className="text-destructive">*</span>
              </Label>
              <Input
                id="curp"
                value={formData.curp}
                onChange={(e) => setFormData({ ...formData, curp: e.target.value.toUpperCase() })}
                placeholder="GALJ150315HDFRPN01"
                maxLength={18}
                required
              />
              <p className="text-xs text-muted-foreground">18 caracteres obligatorios</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Posición (Opcional)</Label>
              <Select
                value={formData.position}
                onValueChange={(value) => setFormData({ ...formData, position: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona posición" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Portero">Portero</SelectItem>
                  <SelectItem value="Defensa">Defensa</SelectItem>
                  <SelectItem value="Medio">Medio</SelectItem>
                  <SelectItem value="Delantero">Delantero</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jerseyNumber">Número de Jersey (Opcional)</Label>
              <Input
                id="jerseyNumber"
                type="number"
                min="1"
                max="99"
                value={formData.jerseyNumber}
                onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                placeholder="10"
              />
              <p className="text-xs text-muted-foreground">Entre 1 y 99</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Información del Tutor</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="parentName">
                  Nombre del Tutor <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="parentName"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="María López García"
                  maxLength={100}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentEmail">
                  Email del Tutor <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="parentEmail"
                  type="email"
                  value={formData.parentEmail}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  placeholder="tutor@example.com"
                  maxLength={255}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentPhone">
                  Teléfono del Tutor <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="parentPhone"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value.replace(/\D/g, "") })}
                  placeholder="5512345678"
                  maxLength={20}
                  required
                />
                <p className="text-xs text-muted-foreground">Mínimo 10 dígitos</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Actualizar Jugador
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
