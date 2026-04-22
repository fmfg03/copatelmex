import { Download } from "lucide-react";

export const FloatingDownload = () => {
  return (
    <a
      href="/bases-torneo.pdf"
      download
      className="fixed bottom-8 right-8 z-40 bg-accent hover:bg-accent/90 text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-all duration-300 flex items-center gap-2 group"
    >
      <Download className="w-6 h-6" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-semibold">
        Descargar Convocatoria
      </span>
    </a>
  );
};
