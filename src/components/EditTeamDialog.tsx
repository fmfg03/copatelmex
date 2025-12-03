import { useState } from "react";
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

interface EditTeamDialogProps {
  open: boolean;
  onClose: () => void;
  team: {
    id: string;
    team_name: string;
    academy_name: string | null;
    state: string;
    phone_number: string;
    phone_country_code: string | null;
    facebook_url: string | null;
    instagram_url: string | null;
  };
  onSuccess: () => void;
}

const MEXICAN_STATES = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México",
  "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

export function EditTeamDialog({ open, onClose, team, onSuccess }: EditTeamDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    team_name: team.team_name,
    academy_name: team.academy_name || "",
    state: team.state,
    phone_number: team.phone_number,
    phone_country_code: team.phone_country_code || "+52",
    facebook_url: team.facebook_url || "",
    instagram_url: team.instagram_url || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validaciones básicas
      if (!formData.team_name.trim()) {
        throw new Error("El nombre del equipo es requerido");
      }

      if (formData.phone_number.length < 10) {
        throw new Error("El teléfono debe tener al menos 10 dígitos");
      }

      const { error } = await supabase
        .from("teams")
        .update({
          team_name: formData.team_name.trim(),
          academy_name: formData.academy_name.trim() || null,
          state: formData.state,
          phone_number: formData.phone_number.trim(),
          phone_country_code: formData.phone_country_code,
          facebook_url: formData.facebook_url.trim() || null,
          instagram_url: formData.instagram_url.trim() || null,
        })
        .eq("id", team.id);

      if (error) throw error;

      toast({
        title: "Equipo actualizado",
        description: "La información del equipo se actualizó correctamente",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Equipo</DialogTitle>
          <DialogDescription>
            Actualiza la información de tu equipo. Los cambios se aplicarán inmediatamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="team_name">
              Nombre del Equipo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="team_name"
              value={formData.team_name}
              onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
              placeholder="Ej: Águilas FC"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="academy_name">Academia/Escuela (Opcional)</Label>
            <Input
              id="academy_name"
              value={formData.academy_name}
              onChange={(e) => setFormData({ ...formData, academy_name: e.target.value })}
              placeholder="Ej: Academia Deportiva"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="state">
              Estado <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.state}
              onValueChange={(value) => setFormData({ ...formData, state: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {MEXICAN_STATES.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">
              Teléfono <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="phone_country_code"
                value={formData.phone_country_code}
                onChange={(e) => setFormData({ ...formData, phone_country_code: e.target.value })}
                className="w-20"
                placeholder="+52"
              />
              <Input
                id="phone_number"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value.replace(/\D/g, "") })}
                placeholder="5512345678"
                maxLength={20}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Mínimo 10 dígitos
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="facebook_url">Facebook URL (Opcional)</Label>
            <Input
              id="facebook_url"
              type="url"
              value={formData.facebook_url}
              onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
              placeholder="https://facebook.com/tu-equipo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instagram_url">Instagram URL (Opcional)</Label>
            <Input
              id="instagram_url"
              type="url"
              value={formData.instagram_url}
              onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
              placeholder="https://instagram.com/tu-equipo"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
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
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
