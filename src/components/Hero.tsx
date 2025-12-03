import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "./CountdownTimer";
import { Calendar, Trophy, Users } from "lucide-react";
import heroImage from "@/assets/hero-america-mascots-new.png";
import clubAmericaCupHeroLogo from "@/assets/copa-club-america-2026-logo.png";
export const Hero = () => {
  const navigate = useNavigate();

  // Discount deadlines
  const discountDates = [{
    date: new Date("2025-12-14T23:59:59"),
    label: "Descuento por tiempo limitado",
    discount: "25%"
  }, {
    date: new Date("2025-12-28T23:59:59"),
    label: "Descuento por tiempo limitado",
    discount: "15%"
  }, {
    date: new Date("2026-01-11T23:59:59"),
    label: "Descuento por tiempo limitado",
    discount: "5%"
  }];

  // Get the next active discount
  const now = new Date();
  const activeDiscount = discountDates.find(d => d.date > now) || discountDates[discountDates.length - 1];
  const paymentDeadlineDate = new Date("2026-02-15T12:00:00");
  const tournamentStartDate = new Date("2026-02-27T12:00:00");
  return <section id="inicio" className="relative min-h-screen flex items-center pt-20">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <img src={heroImage} alt="Copa Club América 2026" title="" fetchPriority="high" width="1920" height="1080" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-hero opacity-40" />
      </div>

          {/* Content */}
          <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
            <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
          {/* Official Club América Logo */}
          <div className="flex justify-center mb-8 md:mb-12">
            <div className="relative">
              <img src={clubAmericaCupHeroLogo} alt="Copa Club América 2026 CDMX" title="" width="320" height="320" fetchPriority="high" className="w-64 h-auto md:w-80 md:h-auto object-contain drop-shadow-2xl animate-fade-in" />
            </div>
          </div>

          {/* Main Title */}
          <div className="text-center mb-16 md:mb-20 space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight font-display tracking-tight">
              COPA CLUB AMÉRICA 2026
            </h1>
            <p className="text-white text-lg md:text-xl max-w-3xl mx-auto font-medium mb-4 leading-relaxed text-center">
              El torneo de fútbol base más importante. Una experiencia única para jóvenes talentos.
            </p>
            <p className="text-white text-lg md:text-xl max-w-3xl mx-auto font-medium leading-relaxed text-center">
          </p>
          </div>

          {/* Key Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16 md:mb-20">
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-8 border-2 border-white/80 shadow-lg">
              <Calendar className="w-8 h-8 text-white mb-4" />
              <h3 className="text-white font-bold text-lg mb-3 tracking-wide">Formato</h3>
              <p className="text-white/95 font-medium text-justify">Fútbol 5 (2020-2018) y Fútbol 7 (2017-2014).</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-8 border-2 border-white/80 shadow-lg">
              <Users className="w-8 h-8 text-white mb-4" />
              <h3 className="text-white font-bold text-lg mb-3 tracking-wide">Categorías</h3>
              <p className="text-white/95 text-sm font-medium text-justify">Varonil: 2020, 2019, 2018, 2017, 2016, 2015, 2014.</p>
            </div>
            <div className="bg-white/15 backdrop-blur-md rounded-xl p-8 border-2 border-white/80 shadow-lg">
              <Trophy className="w-8 h-8 text-white mb-4" />
              <h3 className="text-white font-bold text-lg mb-3 tracking-wide">Sede</h3>
              <p className="text-white/95 font-medium text-justify">CECAP - Centro de entrenamiento del Nido Águila Club América.</p>
            </div>
          </div>

          {/* Countdown Timers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
            <CountdownTimer targetDate={activeDiscount.date} label={activeDiscount.label} accentColor="white" />
            <CountdownTimer targetDate={paymentDeadlineDate} label="Cierre de Inscripciones" accentColor="white" />
            <CountdownTimer targetDate={tournamentStartDate} label="Inicio del Torneo" accentColor="white" />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={() => {
            navigate("/register");
            window.scrollTo(0, 0);
          }} className="bg-primary hover:bg-primary/90 text-secondary font-extrabold text-lg px-8 py-6 shadow-yellow w-full sm:w-auto rounded-full">
              Inscríbete Ahora
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/tournament-info")} className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-secondary font-bold text-lg px-8 py-6 w-full sm:w-auto rounded-full">
              Bases del Torneo
            </Button>
          </div>
        </div>
      </div>
    </section>;
};