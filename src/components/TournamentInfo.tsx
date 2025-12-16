import { Award, Shield, Star, Users, Calendar, MapPin, Download, CheckCircle, Play, Eye, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";

export const TournamentInfo = () => {
  const navigate = useNavigate();
  
  const features = [
    {
      icon: Trophy,
      title: "17 Récords Guinness",
      description: "El torneo aficionado más reconocido del mundo con 17 certificaciones de Guinness World Records."
    },
    {
      icon: Star,
      title: "Vitrina de Talentos",
      description: "Principal vitrina de talentos juveniles y femeniles para el fútbol profesional de México."
    },
    {
      icon: Users,
      title: "Impacto en Liga MX Femenil",
      description: "Más del 75% de las futbolistas activas de la Liga MX Femenil participaron en Copa Telmex Telcel."
    },
    {
      icon: Shield,
      title: "Asistencia Social",
      description: "Impulsa la integración social y previene problemas como alcoholismo, drogadicción y delincuencia."
    }
  ];

  const categories = [
    { name: "Femenil", year: "2012", players: "Por definir" },
    { name: "Juvenil", year: "2009", players: "Por definir" },
    { name: "Juvenil", year: "2010", players: "Por definir" },
    { name: "Juvenil", year: "2011", players: "Por definir" },
    { name: "Varonil", year: "2008", players: "Por definir" },
  ];

  return (
    <section id="informacion" className="py-24 bg-background">
      <div className="container mx-auto px-4 animate-fade-in-up">
        <div className="max-w-6xl mx-auto space-y-20">
          {/* Section Header */}
          <div className="text-center mb-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-secondary mb-6 tracking-tight">
              Información del Torneo
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-8"></div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed text-justify">
              Copa Telmex Telcel es un torneo que tiene como principales objetivos la asistencia social a personas, sectores y regiones de escasos recursos, comunidades indígenas y grupos vulnerables.
            </p>
          </div>

          {/* Misión y Visión */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-border animate-slide-in-left">
              <CardContent className="p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-secondary">Misión</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  Impulsar la asistencia social a personas y comunidades de escasos recursos mediante el deporte. Incluir a grupos vulnerables para fomentar la activación física y la integración social, previniendo problemas de carácter social que afectan a la población mexicana.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border animate-slide-in-right">
              <CardContent className="p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-secondary">Visión</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  Ser el torneo aficionado más grande del mundo, reconocido por su impacto social positivo y su capacidad de transformar vidas a través del deporte, promoviendo valores como el respeto, trabajo en equipo y juego limpio.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Por qué es el más grande */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 animate-scale-in">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-secondary mb-6 text-center">¿Por qué es el torneo aficionado más grande y mejor del mundo?</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-secondary mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground text-justify">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Convocatoria */}
          <Card className="border-2 border-border">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-secondary">Convocatoria y Cédula de Inscripción</h3>
              </div>
              <p className="text-muted-foreground mb-6 text-justify">
                Descarga el documento completo con la convocatoria, bases, condiciones y cédula de inscripción oficial del torneo.
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90" asChild>
                      <a href="/convocatoria.pdf" download>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar Convocatoria (PDF)
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Haz clic para descargar el archivo PDF con la convocatoria oficial</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Separator className="my-6" />
              <div className="space-y-3">
                <h4 className="font-semibold text-secondary">Formato del Torneo:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Fase Colectiva</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Fase Estatal</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>Fase Nacional</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Fechas Clave */}
          <Card className="border-2 border-border bg-gradient-to-br from-secondary/5 to-primary/5">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-secondary">Fechas Clave</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Inicio de Inscripciones</p>
                  <p className="text-xl font-bold text-secondary">01 Enero 2026</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Cierre de Inscripciones</p>
                  <p className="text-xl font-bold text-secondary">Por Definir</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Inicio Fase Nacional</p>
                  <p className="text-xl font-bold text-secondary">Por Definir</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Premiación */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-secondary">Premiación</h3>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-background rounded-lg p-6 border border-border text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-secondary mb-2">Trofeo y Medallas</h4>
                  <p className="text-sm text-muted-foreground">Campeón y Subcampeón</p>
                </div>
                <div className="bg-background rounded-lg p-6 border border-border text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-secondary mb-2">Reconocimientos</h4>
                  <p className="text-sm text-muted-foreground">MVP y Mejor Portero (Zucaritas)</p>
                </div>
                <div className="bg-background rounded-lg p-6 border border-border text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-bold text-secondary mb-2">Viaje de Campeones</h4>
                  <p className="text-sm text-muted-foreground">A una playa nacional</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categorías */}
          <Card className="border-2 border-border">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-secondary">Categorías</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category, index) => (
                  <div key={index} className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg p-4 border border-border">
                    <p className="text-lg font-bold text-secondary">{category.name} {category.year}</p>
                    <p className="text-sm text-muted-foreground">{category.players}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cómo Inscribirse */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Play className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-secondary">¿Cómo Inscribirse?</h3>
              </div>
              {/* Pasos de Inscripción */}
              <div className="space-y-4">
                <h4 className="font-bold text-secondary mb-4">Pasos para inscribirte:</h4>
                {[
                  { step: 1, title: "Crea tu cuenta", desc: "Regístrate en la plataforma con tus datos básicos." },
                  { step: 2, title: "Registra los datos del equipo", desc: "Ingresa la información de tu equipo y entrenadores." },
                  { step: 3, title: "Registra a tus jugadores", desc: "Captura los datos de cada jugador de tu equipo." },
                  { step: 4, title: "Completa documentación", desc: "Adjunta los documentos requeridos para cada jugador." },
                  { step: 5, title: "Confirmación", desc: "Recibirás tu confirmación por email una vez validada tu inscripción." }
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-4 bg-background rounded-lg p-4 border border-border">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white font-bold">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-secondary mb-1">{item.title}</h5>
                      <p className="text-sm text-muted-foreground text-justify">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full mt-6 bg-accent hover:bg-accent/90 text-white font-extrabold text-lg py-6 rounded-full" 
                size="lg" 
                onClick={() => {
                  navigate("/register");
                  window.scrollTo(0, 0);
                }}
              >
                Comenzar Inscripción Ahora
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
