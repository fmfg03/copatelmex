import { CountdownTimer } from "@/components/CountdownTimer";
import { SponsorsCarousel } from "@/components/SponsorsCarousel";
import { NewsSection } from "@/components/NewsSection";
import copaTelmexLogo from "@/assets/copa-telmex-logo.png";
import heroImage from "@/assets/hero-copa-telmex.jpg";
import { Instagram, Facebook, Mail } from "lucide-react";

const ComingSoon = () => {
  // 4 days from now → July 1, 2026 launch
  const launchDate = new Date("2026-04-01T00:00:00-06:00");

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(225,100%,15%)/0.92] via-[hsl(225,100%,20%)/0.88] to-[hsl(197,100%,20%)/0.95]" />

      {/* Animated particles/dots effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/10 animate-pulse"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 3 + 2}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-12 w-full max-w-4xl mx-auto text-center space-y-8 md:space-y-12">
        {/* Logo */}
        <div className="animate-fade-in">
          <img
            src={copaTelmexLogo}
            alt="Copa Telmex Telcel"
            className="h-28 sm:h-36 md:h-44 w-auto drop-shadow-2xl mx-auto"
          />
        </div>

        {/* Title */}
        <div className="space-y-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tight leading-none">
            PRÓXIMAMENTE
          </h1>
          <div className="h-1 w-24 md:w-32 mx-auto bg-gradient-to-r from-primary via-accent to-primary rounded-full" />
          <p className="text-white/80 text-base sm:text-lg md:text-xl max-w-lg mx-auto leading-relaxed mt-4">
            Estamos preparando algo increíble. El sitio oficial de la{" "}
            <span className="text-red-500 font-semibold">Copa Telmex Telcel 2026</span>{" "}
            estará disponible muy pronto.
          </p>
        </div>

        {/* Countdown */}
        <div
          className="w-full max-w-md mx-auto bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 animate-fade-in"
          style={{ animationDelay: "0.4s" }}
        >
          <CountdownTimer
            targetDate={launchDate}
            label="Lanzamiento del Sitio"
            accentColor="yellow"
          />
        </div>

        {/* Social links */}
        <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: "0.6s" }}>
          <a
            href="https://www.instagram.com/copatelmextelcel/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-primary/30 border border-white/20 hover:border-primary/50 text-white transition-all duration-300 hover:scale-110"
          >
            <Instagram className="w-5 h-5" />
          </a>
          <a
            href="https://www.facebook.com/CopaTelmexTelcel/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-primary/30 border border-white/20 hover:border-primary/50 text-white transition-all duration-300 hover:scale-110"
          >
            <Facebook className="w-5 h-5" />
          </a>
          <a
            href="mailto:info@copatelmex.com"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 hover:bg-primary/30 border border-white/20 hover:border-primary/50 text-white transition-all duration-300 hover:scale-110"
          >
            <Mail className="w-5 h-5" />
          </a>
        </div>

        {/* Sponsors */}
        <div className="w-full animate-fade-in" style={{ animationDelay: "0.8s" }}>
          <p className="text-white/50 text-xs uppercase tracking-widest mb-4">Patrocinadores</p>
          <SponsorsCarousel />
        </div>
      </div>

      {/* News Section */}
      <div className="relative z-10 w-full">
        <NewsSection />
      </div>

      {/* Footer */}
      <div className="relative z-10 w-full text-center py-4 mt-auto">
        <p className="text-white/40 text-xs">
          © 2026 Copa Telmex Telcel. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;
