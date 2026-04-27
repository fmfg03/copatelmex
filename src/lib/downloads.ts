import { toast } from "sonner";

export const CONVOCATORIA_PATH = "/convocatoria.pdf";

export const downloadConvocatoria = async (event?: { preventDefault: () => void }) => {
  event?.preventDefault();

  try {
    const response = await fetch(CONVOCATORIA_PATH, {
      method: "HEAD",
      cache: "no-store",
    });

    if (!response.ok) {
      toast.error("La convocatoria no está disponible por el momento.", {
        description: "Intenta nuevamente más tarde o contáctanos para recibir apoyo.",
      });
      return;
    }

    const link = document.createElement("a");
    link.href = CONVOCATORIA_PATH;
    link.download = "convocatoria.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch {
    toast.error("No pudimos verificar la convocatoria.", {
      description: "Revisa tu conexión e intenta descargarla de nuevo.",
    });
  }
};
