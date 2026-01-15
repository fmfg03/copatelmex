import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

export const FloatingWhatsApp = () => {
  return (
    <Link
      to="/contact"
      className="fixed bottom-8 left-8 z-40 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-all duration-300 flex items-center gap-2 group"
      aria-label="Contactar"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-semibold">
        ¿Dudas? Contáctanos
      </span>
    </Link>
  );
};
