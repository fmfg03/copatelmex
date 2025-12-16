import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "./CountdownTimer";
import { Calendar, Trophy, Users } from "lucide-react";
import heroImage from "@/assets/hero-copa-telmex.jpg";
import copaTelmexLogo from "@/assets/copa-telmex-logo.png";
import fundacionLogo from "@/assets/fundacion-telmex-logo-white.png";

export const Hero = () => {
  const navigate = useNavigate();

  // Key dates for Copa Telmex
  const registrationStartDate = new Date("2026-01-01T00:00:00");
  const tournamentStartDate = new Date("2026-06-01T12:00:00"); // TBD
  
  return (
    <section id="inicio" className="relative min-h-screen flex items-center pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={heroImage} 
          alt="Copa Telmex Telcel" 
          title="El torneo aficionado más grande del mundo" 
          fetchPriority="high" 
          width="1920" 
          height="1080" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-70" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
        <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
          {/* Logos */}
          <div className="flex justify-center items-center gap-8 md:gap-12 mb-8 md:mb-12">
            <img 
              src={copaTelmexLogo} 
              alt="Copa Telmex Telcel" 
              title="Copa Telmex Telcel" 
              width="280" 
              height="280" 
              fetchPriority="high" 
              className="w-48 h-auto md:w-64 object-contain drop-shadow-2xl animate-fade-in" 
            />
            <img 
              src={fundacionLogo} 
              alt="Fundación Telmex Telcel" 
              title="Fundación Telmex Telcel" 
              width="280" 
              height="280" 
              fetchPriority="high" 
              className="w-48 h-auto md:w-64 object-contain drop-shadow-2xl animate-fade-in" 
            />
          </div>

          {/* Main Title */}
          <div className="text-center mb-16 md:mb-20 space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight font-display tracking-tight">
              COPA TELMEX TELCEL
            </h1>
            <p className="text-white text-xl md:text-2xl max-w-4xl mx-auto font-bold mb-4 leading-relaxed text-center">
              El torneo aficionado más grande del mundo
            </p>
            <p className="text-white/90 text-lg md:text-xl max-w-3xl mx-auto font-medium leading-relaxed text-center">
              Vigésimo sexta edición impulsando la asistencia social mediante el deporte
            </p>
          </div>

          {/* Key Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16 md:mb-20">
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-8 border-2 border-white/80 shadow-lg">
              <Calendar className="w-8 h-8 text-white mb-4" />
              <h3 className="text-white font-bold text-lg mb-3 tracking-wide">Formato</h3>
              <p className="text-white/95 font-medium text-justify">Fútbol 11</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-8 border-2 border-white/80 shadow-lg">
              <Users className="w-8 h-8 text-white mb-4" />
              <h3 className="text-white font-bold text-lg mb-3 tracking-wide">Categorías</h3>
              <p className="text-white/95 text-sm font-medium text-justify">Femenil 2012, Juvenil 2009-2011, Varonil 2008</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-8 border-2 border-white/80 shadow-lg">
              <Trophy className="w-8 h-8 text-white mb-4" />
              <h3 className="text-white font-bold text-lg mb-3 tracking-wide">Sede</h3>
              <p className="text-white/95 font-medium text-justify">República Mexicana</p>
            </div>
          </div>

          {/* Countdown Timers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-16">
            <CountdownTimer targetDate={registrationStartDate} label="Inicio de Inscripciones" accentColor="white" />
            <CountdownTimer targetDate={tournamentStartDate} label="Fase Nacional" accentColor="white" />
          </div>

          {/* CTA Buttons */}
          <div className="flex justify-center">
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate("/tournament-info")} 
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-secondary font-bold text-lg px-8 py-6 w-full sm:w-auto rounded-full"
            >
              Convocatoria
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
