import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

export const FloatingWhatsApp = () => {
  return (
    <Link
      to="/contacto"
      className="fixed bottom-8 left-8 z-40 bg-white hover:bg-gray-100 text-secondary rounded-full p-4 shadow-2xl hover:scale-110 transition-all duration-300 flex items-center gap-2 group border border-gray-200"
      aria-label="Contactar"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-semibold">
        ¿Dudas? Contáctanos
      </span>
    </Link>
  );
};
