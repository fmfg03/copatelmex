import { MessageCircle } from "lucide-react";

export const FloatingWhatsApp = () => {
  // Número de WhatsApp Business (formato internacional sin + ni espacios)
  const whatsappNumber = "525512011498";
  const message = "Hola, tengo una pregunta sobre la Copa Club América 2026";

  const handleClick = () => {
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-8 left-8 z-40 bg-[#25D366] hover:bg-[#20BD5A] text-white rounded-full p-4 shadow-2xl hover:scale-110 transition-all duration-300 flex items-center gap-2 group"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-semibold">
        ¿Dudas? Escríbenos
      </span>
    </button>
  );
};
