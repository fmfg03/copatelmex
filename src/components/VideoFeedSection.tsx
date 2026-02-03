import { Play, Trophy, Users, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import tournamentFeed from "@/assets/tournament-feed.mp4";

export const VideoFeedSection = () => {
  const stats = [
    { icon: Trophy, value: "26", label: "Ediciones" },
    { icon: Users, value: "12,000+", label: "Equipos" },
    { icon: Star, value: "34", label: "Entidades" },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-secondary via-secondary/95 to-secondary relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(252,211,77,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Vive la Experiencia Copa Telmex Telcel
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              El torneo amateur más grande del mundo
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Video Feed */}
            <div className="flex justify-center order-2 lg:order-1">
              <div className="w-full max-w-[280px]">
                <div className="bg-card rounded-2xl shadow-2xl overflow-hidden border-2 border-primary/30">
                  {/* Video Header */}
                  <div className="bg-gradient-to-r from-primary to-primary/80 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-secondary font-bold text-base">Copa Telmex Telcel</h3>
                      <p className="text-secondary/70 text-sm">Lo mejor del torneo</p>
                    </div>
                  </div>
                  
                  {/* Video Container */}
                  <div className="relative aspect-[9/16] bg-black">
                    <video
                      src={tournamentFeed}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  </div>

                  {/* Video Footer */}
                  <div className="p-4 bg-card">
                    <p className="text-muted-foreground text-sm text-center font-medium">
                      ¡Únete a la 26ª edición!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats and Info */}
            <div className="space-y-8 order-1 lg:order-2">
              <div className="grid grid-cols-3 gap-4">
                {stats.map((stat, index) => (
                  <Card key={index} className="bg-white/10 border-white/20 backdrop-blur-sm">
                    <CardContent className="p-4 text-center">
                      <stat.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
                      <p className="text-white/70 text-sm">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-4 text-white/90">
                <p className="text-lg leading-relaxed">
                  La <strong className="text-primary">Copa Telmex Telcel</strong> es el torneo de fútbol infantil 
                  y juvenil más importante de México, reuniendo a miles de equipos de todo el país.
                </p>
                <p className="text-lg leading-relaxed">
                  Ofrecemos una experiencia competitiva y única, que promueve el desarrollo deportivo como una alternativa 
                  para alejar a los jóvenes de la calle y de los vicios, y así se comprometan a continuar entrenando dentro 
                  de las canchas, y con ello, piensen en ser mejores todos los días.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-primary/20 rounded-full text-primary font-semibold text-sm">
                  🏆 Fase Nacional en León
                </span>
                <span className="px-4 py-2 bg-white/10 rounded-full text-white font-semibold text-sm">
                  👥 3 Categorías
                </span>
                <span className="px-4 py-2 bg-white/10 rounded-full text-white font-semibold text-sm">
                  🗺️ 34 Entidades
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
