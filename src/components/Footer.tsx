import { Facebook, Instagram, Mail, Phone, MessageCircle } from "lucide-react";
import clubAmericaLogo from "@/assets/copa-club-america-2026-logo.png";
export const Footer = () => {
  const currentYear = new Date().getFullYear();
  return <footer id="contacto" className="bg-secondary dark:bg-secondary/90 text-white border-t border-transparent dark:border-border">
      <div className="container mx-auto px-4 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src={clubAmericaLogo} alt="Club América Logo" className="w-12 h-12 object-contain" />
                <div>
                  <h3 className="font-bold text-lg">COPA CLUB AMÉRICA 2026</h3>
                  <p className="text-xs text-white/70">Torneo Juvenil 2026</p>
                </div>
              </div>
              <p className="text-white/80 text-sm leading-relaxed text-justify">
                Torneo de fútbol formativo, organizado oficialmente por el Club América.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2">
                {[{
                name: "Inicio",
                href: "#inicio"
              }, {
                name: "Información",
                href: "#informacion"
              }, {
                name: "Categorías",
                href: "#categorias"
              }, {
                name: "Sede",
                href: "#sedes"
              }].map(link => <li key={link.name}>
                    <a href={link.href} className="text-white/80 hover:text-primary transition-colors text-sm">
                      {link.name}
                    </a>
                  </li>)}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-lg mb-4">Contacto</h4>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3 text-sm">
                  <Mail className="w-4 h-4 text-america-blue flex-shrink-0" />
                  <a href="mailto:copa@clubamerica.com.mx" className="text-white/80 hover:text-primary transition-colors">
                    copa@clubamerica.com.mx
                  </a>
                </li>
                <li className="flex items-center space-x-3 text-sm">
                  <Phone className="w-4 h-4 text-america-blue flex-shrink-0" />
                  <a href="tel:+525512011498" className="text-white/80 hover:text-primary transition-colors">
                    +52 55 1201 1498
                  </a>
                </li>
              </ul>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-bold text-lg mb-4">Síguenos</h4>
              <div className="flex space-x-3">
                <a href="https://facebook.com/copaclubamerica" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-primary transition-colors flex items-center justify-center group border border-white/20">
                  <Facebook className="w-5 h-5 text-white group-hover:text-secondary" />
                </a>
                <a href="https://instagram.com/copaclubamerica" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-primary transition-colors flex items-center justify-center group border border-white/20">
                  <Instagram className="w-5 h-5 text-white group-hover:text-secondary" />
                </a>
                <a href="https://wa.me/525512011498?text=Hola,%20me%20interesa%20información%20sobre%20la%20Copa%20Club%20América%202026" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-primary transition-colors flex items-center justify-center group border border-white/20">
                  <MessageCircle className="w-5 h-5 text-white group-hover:text-secondary" />
                </a>
              </div>
              <p className="text-white/60 text-xs mt-4 text-justify">
                Mantente actualizado con las últimas noticias del torneo.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/20 pt-8 text-center">
            <p className="text-white/60 text-sm">
              © {currentYear} Copa Club América 2026. Todos los derechos reservados.
            </p>
              <p className="text-white/40 text-xs mt-2">
              Organizado por el Club América y <a href="https://goatmkt.com" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors underline">GOAT MKT</a>.
            </p>
            <div className="mt-4">
              <a href="/privacy" className="text-white/60 hover:text-primary text-xs transition-colors">
                Aviso de Privacidad
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};