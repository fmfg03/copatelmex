import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FloatingDownload = () => {
  return (
    <a
      href="/bases-torneo.pdf"
      download
      className="fixed right-4 bottom-24 z-40 group"
    >
      <Button
        size="lg"
        className="bg-accent hover:bg-accent/90 text-white shadow-xl rounded-full h-14 px-5 flex items-center gap-2 transition-all duration-300 hover:scale-105"
      >
        <Download className="w-5 h-5" />
        <span className="hidden sm:inline font-semibold">Descargar Convocatoria</span>
      </Button>
    </a>
  );
};
