import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import copaTelmexLogo from "@/assets/copa-telmex-logo.png";
import fundacionLogo from "@/assets/fundacion-telmex-logo-white.png";

export const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer id="contacto" className="bg-secondary dark:bg-secondary/90 text-white border-t border-transparent dark:border-border">
      <div className="container mx-auto px-4 py-10 sm:py-12 md:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 mb-10 sm:mb-12 md:mb-16">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src={copaTelmexLogo} alt="Copa Telmex Telcel" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
                <div>
                  <h3 className="font-bold text-base sm:text-lg">COPA TELMEX TELCEL</h3>
                  <p className="text-xs text-white/70">26ª Edición</p>
                </div>
              </div>
              <p className="text-white/80 text-sm leading-relaxed text-justify">
                El torneo aficionado más grande del mundo, impulsando la asistencia social mediante el deporte.
              </p>
              <div className="mt-4 w-full text-center">
                <img src={fundacionLogo} alt="Fundación Telmex, A.C." className="h-7 sm:h-8 object-contain opacity-80 mx-auto" />
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2">
                {[
                  { name: "Inicio", href: "#inicio" },
                  { name: "Información", href: "#informacion" },
                  { name: "Categorías", href: "#categorias" },
                ].map((link) => (
                  <li key={link.name}>
                    <a href={link.href} className="text-white/80 hover:text-primary transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Síguenos</h4>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <a 
                  href="https://www.facebook.com/oficialCopaTelmex" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-primary transition-colors flex items-center justify-center group border border-white/20"
                  title="Facebook"
                >
                  <Facebook className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-white" />
                </a>
                <a 
                  href="https://www.instagram.com/copatelmextelcel_oficial" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-primary transition-colors flex items-center justify-center group border border-white/20"
                  title="Instagram"
                >
                  <Instagram className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-white" />
                </a>
                <a 
                  href="https://x.com/Copatelmex" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-primary transition-colors flex items-center justify-center group border border-white/20"
                  title="X (Twitter)"
                >
                  <Twitter className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-white" />
                </a>
                <a 
                  href="https://www.youtube.com/@CopaTelmexTelcelFutbol" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-primary transition-colors flex items-center justify-center group border border-white/20"
                  title="YouTube"
                >
                  <Youtube className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:text-white" />
                </a>
              </div>
              <p className="text-white/60 text-xs mt-3 sm:mt-4 text-justify">
                Mantente actualizado con las últimas noticias del torneo.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/20 pt-6 sm:pt-8 text-center">
            <p className="text-white/60 text-xs sm:text-sm">
              © {currentYear} Copa Telmex Telcel. Todos los derechos reservados.
            </p>
            <p className="text-white/40 text-xs mt-2">
              Operado por <a href="https://www.plataformasports.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors underline">Plataforma Sports</a>.
            </p>
            <div className="mt-3 sm:mt-4">
              <a href="/privacy" className="text-white/60 hover:text-primary text-xs transition-colors">
                Aviso de Privacidad
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
