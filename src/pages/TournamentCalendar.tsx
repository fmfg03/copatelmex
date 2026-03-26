import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Calendar, MapPin, Trophy, Users, ClipboardCheck, Shuffle, Hotel } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const phases = [
  {
    id: "inscripcion",
    label: "Inscripciones",
    color: "bg-primary",
    textColor: "text-primary",
    borderColor: "border-primary",
    dateRange: "2 de enero – 30 de junio",
    icon: ClipboardCheck,
    description: "Periodo oficial de registro para todas las categorías: Femenil, Juvenil y Varonil.",
  },
  {
    id: "colectiva",
    label: "Fase Colectiva",
    color: "bg-secondary",
    textColor: "text-secondary",
    borderColor: "border-secondary",
    dateRange: "13 de abril – 9 de agosto",
    icon: Users,
    description: "Partidos locales organizados por cada equipo en sus respectivas comunidades.",
  },
  {
    id: "revision",
    label: "Revisión Administrativa",
    color: "bg-muted-foreground",
    textColor: "text-muted-foreground",
    borderColor: "border-muted-foreground",
    dateRange: "10 – 23 de agosto / 26 oct – 28 nov",
    icon: ClipboardCheck,
    description: "Periodos de revisión y trabajo administrativo previos a la Fase Estatal y Fase Nacional.",
  },
  {
    id: "estatal",
    label: "Fase Estatal",
    color: "bg-accent",
    textColor: "text-accent",
    borderColor: "border-accent",
    dateRange: "24 de agosto – 25 de octubre",
    icon: MapPin,
    description: "Eliminatorias a nivel estatal para definir a los representantes de cada entidad.",
  },
  {
    id: "sorteo",
    label: "Sorteo Fase Nacional",
    color: "bg-primary",
    textColor: "text-primary",
    borderColor: "border-primary",
    dateRange: "10 de noviembre",
    icon: Shuffle,
    description: "Sorteo oficial para definir los grupos y enfrentamientos de la Fase Nacional.",
  },
];

const nationalPhaseEvents = [
  {
    category: "JUVENIL / FEMENIL",
    events: [
      { date: "29 nov", label: "Recepción en hoteles sede", icon: Hotel },
      { date: "30 nov", label: "Juego de clasificación 1", icon: Trophy },
      { date: "1 dic", label: "Juego de clasificación 2", icon: Trophy },
      { date: "2 dic", label: "Juego de clasificación 3", icon: Trophy },
      { date: "3 dic", label: "Cuartos de Final", icon: Trophy },
      { date: "4 dic", label: "Semifinales", icon: Trophy },
      { date: "5 dic", label: "Finales", icon: Trophy },
    ],
  },
  {
    category: "VARONIL",
    events: [
      { date: "7 dic", label: "Recepción de equipos", icon: Hotel },
      { date: "8 dic", label: "Juego de clasificación 1", icon: Trophy },
      { date: "9 dic", label: "Juego de clasificación 2", icon: Trophy },
      { date: "10 dic", label: "Juego de clasificación 3 y Cuartos de Final", icon: Trophy },
      { date: "11 dic", label: "Semifinal", icon: Trophy },
      { date: "12 dic", label: "Final", icon: Trophy },
    ],
  },
];

const TournamentCalendar = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-secondary to-primary pt-28 pb-16 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 border-2 border-white/30 rounded-full" />
          <div className="absolute bottom-10 right-10 w-60 h-60 border-2 border-white/20 rounded-full" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Calendar className="w-5 h-5" />
            <span className="text-sm font-medium">Calendario Oficial 2026</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            Calendario de Fases y Fechas
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            Copa Telmex Telcel 2026 — Categoría Femenil, Juvenil y Varonil
          </p>
        </div>
      </section>

      {/* Timeline de Fases */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Fases del Torneo
          </h2>

          <div className="relative">
            {/* Línea vertical */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-px" />

            {phases.map((phase, idx) => {
              const Icon = phase.icon;
              const isEven = idx % 2 === 0;

              return (
                <div
                  key={phase.id}
                  className={`relative flex items-start mb-10 md:mb-14 ${
                    isEven ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Dot */}
                  <div className="absolute left-6 md:left-1/2 w-4 h-4 rounded-full border-4 border-background z-10 -translate-x-1/2 mt-2"
                    style={{ backgroundColor: `hsl(var(--primary))` }}
                  />

                  {/* Content card */}
                  <div
                    className={`ml-14 md:ml-0 md:w-[calc(50%-2rem)] ${
                      isEven ? "md:pr-8 md:text-right" : "md:pl-8 md:text-left"
                    }`}
                  >
                    <div className={`bg-card border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${phase.borderColor} border-l-4 md:border-l md:border-t-0`}>
                      <div className={`flex items-center gap-2 mb-2 ${isEven ? "md:justify-end" : ""}`}>
                        <Icon className={`w-5 h-5 ${phase.textColor}`} />
                        <Badge variant="outline" className={`${phase.textColor} font-semibold`}>
                          {phase.label}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold text-foreground mb-1">
                        {phase.dateRange}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {phase.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Fase Nacional detallada */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-accent/10 rounded-full px-4 py-2 mb-4">
              <Trophy className="w-5 h-5 text-accent" />
              <span className="text-sm font-semibold text-accent">Fase Nacional</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Noviembre – Diciembre 2026
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Calendario detallado de la Fase Nacional por categoría
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {nationalPhaseEvents.map((group) => (
              <div
                key={group.category}
                className="bg-card border rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="bg-gradient-to-r from-secondary to-primary px-6 py-4">
                  <h3 className="text-lg font-bold text-primary-foreground flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {group.category}
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {group.events.map((evt, i) => {
                    const EvtIcon = evt.icon;
                    const isFinal = evt.label.toLowerCase().includes("final") && !evt.label.toLowerCase().includes("clasificación") && !evt.label.toLowerCase().includes("cuartos");
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50 ${
                          isFinal ? "bg-accent/5" : ""
                        }`}
                      >
                        <div className={`flex-shrink-0 w-16 text-center rounded-lg py-1.5 ${
                          isFinal
                            ? "bg-accent/15 text-accent font-bold"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          <span className="text-sm font-semibold">{evt.date}</span>
                        </div>
                        <EvtIcon className={`w-4 h-4 flex-shrink-0 ${
                          isFinal ? "text-accent" : "text-primary"
                        }`} />
                        <span className={`text-sm ${
                          isFinal ? "font-bold text-foreground" : "text-foreground"
                        }`}>
                          {evt.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FloatingWhatsApp />
      <Footer />
    </div>
  );
};

export default TournamentCalendar;
