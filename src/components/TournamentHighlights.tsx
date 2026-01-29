import { Users, Trophy, Shield, Shirt, Star, Award } from "lucide-react";

export const TournamentHighlights = () => {
  const highlights = [
    {
      icon: Trophy,
      title: "4 partidos garantizados",
      description: "Todos los equipos participan en fase de clasificación.",
    },
    {
      icon: Shield,
      title: "Arbitraje Formativo y Certificado",
      description: "Partidos dirigidos por árbitros profesionales.",
    },
    {
      icon: Star,
      title: "Campos de pasto natural",
      description: "Instalaciones de primer nivel en CECAP.",
    },
    {
      icon: Users,
      title: "Balones oficiales",
      description: "Se jugará con balones oficiales proporcionados por el comité organizador.",
    },
    {
      icon: Shirt,
      title: "Seguridad y paramédicos",
      description: "Equipo médico presente en todos los partidos.",
    },
    {
      icon: Award,
      title: "Trofeos y medallas",
      description: "Reconocimiento para campeones y finalistas.",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 animate-fade-in-up">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-america-blue text-sm font-bold uppercase tracking-wider mb-3">
              Copa Telmex Telcel
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold text-secondary mb-6 tracking-tight">
              Lo que Incluye tu Inscripción
            </h2>
            <div className="w-24 h-1 bg-america-blue mx-auto mb-8"></div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed text-justify">
              Todo lo necesario para una experiencia profesional de primer nivel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {highlights.map((highlight, index) => (
              <div
                key={index}
                className="group relative bg-card border-2 border-border rounded-2xl p-10 hover:border-america-blue transition-all duration-base shadow-md hover:shadow-navy hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex flex-col items-center text-center space-y-5">
                  <div className="w-16 h-16 rounded-full bg-america-blue/10 flex items-center justify-center group-hover:bg-america-blue/20 transition-colors duration-base group-hover:scale-110">
                    <highlight.icon className="w-8 h-8 text-america-blue" />
                  </div>
                  <h3 className="text-lg font-bold text-secondary tracking-wide">
                    {highlight.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed font-medium text-justify">
                    {highlight.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
