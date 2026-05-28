import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();

  useEffect(() => {
    toast.info("La inscripcion en linea no esta disponible. Te llevamos al directorio de operadores estatales.");
    navigate("/inscripcion", { replace: true });
  }, [navigate]);

  return null;
}
