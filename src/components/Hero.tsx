import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "./CountdownTimer";
import { Calendar, Users, Download } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import heroImage from "@/assets/hero-copa-telmex.jpg";
import heroAmericaFans from "@/assets/hero-america-fans-new.jpg";
import tournamentCeremony from "@/assets/tournament-ceremony.jpg";
import tournamentField from "@/assets/tournament-field.jpg";
import copaTelmexLogo from "@/assets/copa-telmex-logo.png";


const heroSlides = [
  { image: heroImage, alt: "Copa Telmex Telcel" },
  { image: heroAmericaFans, alt: "Aficionados Copa Telmex" },
  { image: tournamentCeremony, alt: "Ceremonia del Torneo" },
  { image: tournamentField, alt: "Campo del Torneo" },
];

export const Hero = () => {
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  // Key dates for Copa Telmex
  const registrationEndDate = new Date("2026-04-30T23:59:59");
  const tournamentStartDate = new Date("2026-06-01T12:00:00");

  // YouTube video ID
  const youtubeVideoId = "eic4VntNlXw";
  const videoStartTime = 74;

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  const scrollTo = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);
  
  return (
    <>
      <section id="inicio" className="relative min-h-screen flex items-center pt-20">
        {/* Background Slider */}
        <div className="absolute inset-0 overflow-hidden">
          <Carousel
            setApi={setApi}
            opts={{
              loop: true,
              align: "start",
            }}
            plugins={[
              Autoplay({
                delay: 5000,
                stopOnInteraction: false,
                stopOnMouseEnter: true,
              }),
            ]}
            className="w-full h-full"
          >
            <CarouselContent className="h-full ml-0">
              {heroSlides.map((slide, index) => (
                <CarouselItem key={index} className="h-full pl-0">
                  <img 
                    src={slide.image} 
                    alt={slide.alt} 
                    title="El torneo aficionado más grande del mundo" 
                    fetchPriority={index === 0 ? "high" : "low"}
                    width="1920" 
                    height="1080" 
                    className="w-full h-full object-cover min-h-screen" 
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="absolute inset-0 bg-gradient-hero opacity-70 pointer-events-none" />
          
          {/* Slide Indicators */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  current === index 
                    ? "bg-white w-8" 
                    : "bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Ir a slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-6xl mx-auto space-y-8 md:space-y-12">
            {/* Logo */}
            <div className="flex justify-center items-center mb-6 md:mb-12">
              <img 
                src={copaTelmexLogo} 
                alt="Copa Telmex Telcel" 
                title="Copa Telmex Telcel" 
                width="280" 
                height="280" 
                fetchPriority="high" 
                className="w-40 sm:w-48 md:w-56 lg:w-72 h-auto object-contain drop-shadow-2xl animate-fade-in" 
              />
            </div>

            {/* Main Title */}
            <div className="text-center mb-10 md:mb-16 lg:mb-20 space-y-4 md:space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-white mb-4 md:mb-6 leading-tight font-display tracking-tight">
                COPA TELMEX TELCEL
              </h1>
              <p className="text-white text-lg sm:text-xl md:text-2xl max-w-4xl mx-auto font-bold mb-3 md:mb-4 leading-relaxed text-center px-2">
                El torneo aficionado más grande del mundo
              </p>
              <p className="text-white/90 text-base sm:text-lg md:text-xl max-w-3xl mx-auto font-medium leading-relaxed text-center px-2">
                Vigésimo sexta edición impulsando la asistencia social mediante el deporte
              </p>
            </div>

            {/* Key Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8 mb-10 md:mb-16 lg:mb-20 max-w-2xl mx-auto">
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-5 md:p-8 border-2 border-white/80 shadow-lg">
                <Calendar className="w-6 h-6 md:w-8 md:h-8 text-white mb-3 md:mb-4" />
                <h3 className="text-white font-bold text-base md:text-lg mb-2 md:mb-3 tracking-wide">Fases</h3>
                <ul className="text-white/95 font-medium text-xs md:text-sm space-y-1">
                  <li>• Fase Colectiva</li>
                  <li>• Fase Estatal</li>
                  <li>• Fase Nacional</li>
                </ul>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-xl p-5 md:p-8 border-2 border-white/80 shadow-lg">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-white mb-3 md:mb-4" />
                <h3 className="text-white font-bold text-base md:text-lg mb-2 md:mb-3 tracking-wide">Categorías</h3>
                <p className="text-white/95 text-xs md:text-sm font-medium">Femenil 2012, Juvenil 2009-2011, Varonil 2008</p>
              </div>
            </div>

            {/* Countdown Timers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 mb-10 md:mb-16">
              <CountdownTimer targetDate={registrationEndDate} label="Cierre de Inscripciones" accentColor="white" />
              <CountdownTimer targetDate={tournamentStartDate} label="Fase Nacional" accentColor="white" />
            </div>

            {/* Download Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center px-2">
              <Button 
                size="lg" 
                asChild
                className="bg-accent hover:bg-accent/90 text-white font-bold text-sm md:text-lg px-6 md:px-8 py-5 md:py-6 w-full sm:w-auto rounded-full shadow-lg"
              >
                <a href="/convocatoria.pdf" download>
                  <Download className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Descarga Convocatoria
                </a>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                asChild
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-secondary font-bold text-sm md:text-lg px-6 md:px-8 py-5 md:py-6 w-full sm:w-auto rounded-full"
              >
                <a href="/cedula-inscripcion.pdf" download>
                  <Download className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Cédula de Inscripción
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome Section with Video */}
      <section className="py-16 md:py-24 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-4 font-display">
                ¡Bienvenido Jugador!
              </h2>
              <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto">
                Revive los mejores momentos de la Final Copa Telmex Telcel
              </p>
            </div>
            
            {/* YouTube Video Embed */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20">
              <iframe
                src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0&start=${videoStartTime}`}
                title="Final Copa Telmex Telcel"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
