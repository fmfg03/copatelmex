import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Calendar, Trophy, Shield, Users, FileText, MapPin, Clock, Award, CheckCircle, Star, Download, Hotel, Bed, Car, ExternalLink, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import cecapFacilities from "@/assets/cecap-facilities.jpg";
import galleryGoalCelebration from "@/assets/gallery-goal-celebration.jpg";
import galleryGoalkeeperSave from "@/assets/gallery-goalkeeper-save.jpg";
import galleryMatchAction from "@/assets/gallery-match-action.jpg";
import galleryTeamPhoto from "@/assets/gallery-team-photo.jpg";
import galleryTrophyCelebration from "@/assets/gallery-trophy-celebration.jpg";
import tournamentCeremony from "@/assets/tournament-ceremony.jpg";
import tournamentField from "@/assets/tournament-field.jpg";
import tournamentTeams from "@/assets/tournament-teams.jpg";
import sponsorKeuka from "@/assets/sponsor-keuka.png";
import sponsorZucaritas from "@/assets/sponsor-zucaritas.png";
import sponsorPowerade from "@/assets/sponsor-powerade.png";
import sponsorPlataformaSports from "@/assets/sponsor-plataforma-sports.png";
import sponsorClaroSports from "@/assets/sponsor-claro-sports.png";
export default function TournamentInfo() {
  const navigate = useNavigate();
  return <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(252,211,77,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.2),transparent_50%)]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              Información del Torneo
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Todo lo que necesitas saber sobre la Copa Telmex Telcel
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90 text-secondary font-bold shadow-yellow">
                Inscribirse Ahora
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-secondary" asChild>
                <a href="/bases-torneo.pdf" download>
                  <Download className="w-5 h-5 mr-2" />
                  Descargar Bases (PDF)
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Video de Bienvenida */}
      <section className="py-16 bg-gradient-to-br from-background via-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-secondary mb-4">Bienvenida del Jugador</h2>
              <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Vive la experiencia única de jugar en instalaciones de clase mundial y competir al más alto nivel
              </p>
            </div>
            <div className="aspect-video bg-muted rounded-xl shadow-2xl overflow-hidden">
              <iframe className="w-full h-full" src="https://www.youtube.com/embed/eic4VntNlXw?rel=0&start=74" title="Final Copa Telmex Telcel" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
            </div>
            <div className="mt-8 text-center">
              <Card className="max-w-3xl mx-auto">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-secondary mb-4">Una Oportunidad Única</h3>
                  <p className="text-muted-foreground mb-4">
                    La Copa Telmex Telcel es más que un torneo: es una experiencia formativa donde jóvenes talentos 
                    tienen la oportunidad de desarrollar sus habilidades en un ambiente competitivo y profesional.
                  </p>
                  <p className="text-muted-foreground">
                    Nuestro torneo ofrece instalaciones de primer nivel, arbitraje profesional certificado, 
                    y la oportunidad de competir contra los mejores equipos de la región. Es el escenario perfecto 
                    para que los jugadores demuestren su talento y continúen su desarrollo futbolístico.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Facts */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="text-center border-2 hover:border-primary transition-all duration-300 hover:shadow-lg bg-gradient-card hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-america-blue/10 flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-6 h-6 text-america-blue" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Fechas</h3>
                  <p className="text-muted-foreground">1 de Junio 2025</p>
                  <p className="text-muted-foreground text-sm">Inicio Fase Nacional</p>
                </CardContent>
              </Card>
              <Card className="text-center border-2 hover:border-primary transition-all duration-300 hover:shadow-lg bg-gradient-card hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-america-blue/10 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-6 h-6 text-america-blue" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Sede</h3>
                  <p className="text-muted-foreground">Sede Nacional</p>
                  <p className="text-muted-foreground text-sm">Por definir</p>
                </CardContent>
              </Card>
              <Card className="text-center border-2 hover:border-primary transition-all duration-300 hover:shadow-lg bg-gradient-card hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-america-blue/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-america-blue" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Categorías</h3>
                  <p className="text-muted-foreground">3 categorías</p>
                  <p className="text-muted-foreground text-sm">Varonil, Juvenil y Femenil</p>
                </CardContent>
              </Card>
              <Card className="text-center border-2 hover:border-primary transition-all duration-300 hover:shadow-lg bg-gradient-card hover:-translate-y-1">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-america-blue/10 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-6 h-6 text-america-blue" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Formato</h3>
                  <p className="text-muted-foreground">Fútbol 11</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Tournament Format */}
      <section className="py-16 bg-gradient-to-br from-muted via-background to-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-secondary mb-4">Fase del Torneo</h2>
              <div className="w-24 h-1 bg-primary mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-america-blue/10 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-6 h-6 text-america-blue" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary mb-3">FASE DE CLASIFICACIÓN</h3>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-america-blue mt-0.5 flex-shrink-0" />
                          <span>Todos los equipos participan</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-america-blue mt-0.5 flex-shrink-0" />
                          <span>Mínimo 4 partidos garantizados</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-america-blue mt-0.5 flex-shrink-0" />
                          <span>Sistema de puntos: victoria 3 pts, empate 1 pt</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-america-blue mt-0.5 flex-shrink-0" />
                          <span>Clasifican los mejores 16 equipos por categoría según orden de la tabla general      </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-america-blue/10 flex items-center justify-center flex-shrink-0">
                      <Award className="w-6 h-6 text-america-blue" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-secondary mb-3">FASE DE LIGUILLA</h3>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-america-blue mt-0.5 flex-shrink-0" />
                          <span>Cuatro grupos de cuatro equipos por orden de la tabla general      </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-america-blue mt-0.5 flex-shrink-0" />
                          <span>Semifinales: 1 vs 4 y 2 vs 3</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-america-blue mt-0.5 flex-shrink-0" />
                          <span>Perdedores juegan por el 3er lugar</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-america-blue mt-0.5 flex-shrink-0" />
                          <span>Ganadores juegan por el campeonato</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 border-2 border-america-blue/20">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-america-blue/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-america-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-secondary mb-3">Duración de Partidos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                      <div>
                        <p className="font-semibold text-secondary mb-2">FASE DE CLASIFICACIÓN:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>2 tiempos de 20 mins con descanso intermedio de 5 mins</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-secondary mb-2">FASE DE LIGUILLA:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>2 tiempos de 20 minutos y descanso intermedio de 5 minutos, en caso de empate se ejecutarán penales de desempate</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-secondary mb-4">Reglas del Torneo</h2>
              <div className="w-24 h-1 bg-primary mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-america-blue/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-america-blue" />
                    </div>
                    <h3 className="text-2xl font-bold text-secondary">Reglas Generales</h3>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-america-blue rounded-full mt-2 flex-shrink-0"></span>
                      <span>Formato Fútbol 11 para todas las categorías (once jugadores en campo incluido portero)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-america-blue rounded-full mt-2 flex-shrink-0"></span>
                      <span>Registro mínimo de 7 jugadores y máximo 22 jugadores por equipo</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-america-blue rounded-full mt-2 flex-shrink-0"></span>
                      <span>Sustituciones ilimitadas</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-america-blue rounded-full mt-2 flex-shrink-0"></span>
                      <span>Reglas de Juego generales del Fútbol 11</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-america-blue rounded-full mt-2 flex-shrink-0"></span>
                      <span>No aplica el fuera de juego en ninguna categoría</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-america-blue rounded-full mt-2 flex-shrink-0"></span>
                      <span>Uniforme completo obligatorio (jersey, short, medias) y uso de espinilleras obligatorio</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-america-blue rounded-full mt-2 flex-shrink-0"></span>
                      <span>Prohibido el uso de calzado de futbol de tachones</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-america-blue/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-america-blue" />
                    </div>
                    <h3 className="text-2xl font-bold text-secondary">Fair Play</h3>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-america-blue rounded-full mt-2 flex-shrink-0"></span>
                      <span>Torneo que promueve el respeto, valores deportivos y juego limpio</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-america-blue rounded-full mt-2 flex-shrink-0"></span>
                      <span>Arbitraje preventivo</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-america-blue rounded-full mt-2 flex-shrink-0"></span>
                      <span>Penalización por conducta antideportiva</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-america-blue rounded-full mt-2 flex-shrink-0"></span>
                      <span>Tarjeta amarilla: advertencia al jugador</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-america-blue rounded-full mt-2 flex-shrink-0"></span>
                      <span>Tarjeta roja: 1 partido de suspensión (mínimo)</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>


      {/* Galería de Torneos Anteriores */}
      <section className="py-16 bg-gradient-to-br from-secondary via-secondary/95 to-secondary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(252,211,77,0.1),transparent_50%)]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Camera className="w-8 h-8 text-primary" />
                <h2 className="text-4xl font-bold">Galería de Torneos Anteriores</h2>
              </div>
              <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
              <p className="text-white/80 text-lg">Revive los mejores momentos de ediciones pasadas</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { src: galleryTrophyCelebration, alt: "Celebración del campeón", title: "Campeones 2024" },
                { src: galleryTeamPhoto, alt: "Foto de equipo", title: "Equipos participantes" },
                { src: galleryMatchAction, alt: "Acción del partido", title: "Jugadas memorables" },
                { src: galleryGoalkeeperSave, alt: "Atajada del portero", title: "Grandes atajadas" },
                { src: galleryGoalCelebration, alt: "Celebración de gol", title: "Festejos de gol" },
                { src: tournamentCeremony, alt: "Ceremonia del torneo", title: "Ceremonia inaugural" },
                { src: tournamentField, alt: "Campo del torneo", title: "Instalaciones" },
                { src: tournamentTeams, alt: "Equipos del torneo", title: "Competencia" },
              ].map((photo, index) => (
                <div 
                  key={index}
                  className="group relative overflow-hidden rounded-xl aspect-square cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <img 
                    src={photo.src} 
                    alt={photo.alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                    <p className="text-white font-semibold p-4">{photo.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categorías del Torneo */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-secondary mb-4">Categorías del Torneo</h2>
              <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
              <p className="text-muted-foreground">Tres categorías - Fútbol 11</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[{
              name: "Categoría Varonil",
              years: "2008 o anteriores",
              max: 22,
              format: "Fútbol 11"
            }, {
              name: "Categoría Varonil Juvenil",
              years: "2009, 2010, 2011",
              max: 22,
              format: "Fútbol 11"
            }, {
              name: "Categoría Femenil",
              years: "2012 y anteriores",
              max: 22,
              format: "Fútbol 11"
            }].map((category, index) => <Card key={category.name} className="group border-2 hover:border-primary hover:-translate-y-2 transition-all duration-300 hover:shadow-xl cursor-pointer animate-fade-in overflow-hidden relative" style={{
              animationDelay: `${index * 0.1}s`
            }}>
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-primary/10 to-transparent"></div>
                  
                  {/* Year Badge */}
                  <div className="absolute top-3 right-3 bg-accent px-3 py-1 rounded-full shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <span className="text-white font-bold text-xs">{category.years}</span>
                  </div>
                  
                  <CardContent className="p-6 relative z-10">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                        <Trophy className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <h3 className="text-xl font-bold text-secondary mb-2 group-hover:text-primary transition-colors duration-300">{category.name}</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="flex items-center justify-center gap-2 group-hover:translate-x-1 transition-transform duration-300">
                          <Users className="w-4 h-4 text-primary group-hover:scale-125 transition-transform duration-300" />
                          Máximo {category.max} jugadores
                        </p>
                        <p className="flex items-center justify-center gap-2 group-hover:translate-x-1 transition-transform duration-300" style={{
                      transitionDelay: '50ms'
                    }}>
                          <Shield className="w-4 h-4 text-primary group-hover:scale-125 transition-transform duration-300" />
                          Formato {category.format}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  
                  {/* Bottom Accent Line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </Card>)}
            </div>
          </div>
        </div>
      </section>


      {/* Estacionamiento */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-america-blue/20">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-xl bg-america-blue/10 flex items-center justify-center flex-shrink-0">
                    <Car className="w-8 h-8 text-america-blue" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-secondary mb-4">Estacionamiento</h3>
                    <p className="text-muted-foreground mb-4">
                      Las instalaciones de CECAP cuentan con amplio estacionamiento gratuito para todos los participantes, 
                      padres de familia y espectadores.
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-america-blue" />
                        <span>Estacionamiento gratuito</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-america-blue" />
                        <span>El estacionamiento se encuentra a 800m de la sede, en la puerta 4 del Estadio Banorte</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-america-blue" />
                        <span>Estacionamiento con vigilancia</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-america-blue" />
                        <span>Amplia capacidad</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Registration Requirements */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-secondary mb-4">Requisitos de Inscripción</h2>
              <div className="w-24 h-1 bg-america-blue mx-auto"></div>
            </div>

            <Card className="border-2">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-secondary mb-4">Documentación Requerida</h3>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-america-blue mt-0.5 flex-shrink-0" />
                        <span>Acta de nacimiento o identificación oficial de cada jugador</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-america-blue mt-0.5 flex-shrink-0" />
                        <span>Carta responsiva firmada por padre/tutor</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-america-blue mt-0.5 flex-shrink-0" />
                        <span>Foto digital tamaño infantil de cada jugador</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-america-blue mt-0.5 flex-shrink-0" />
                        <span>Comprobante de pago de inscripción</span>
                      </li>
                    </ul>
                  </div>

                  <div className="pt-6 border-t">
                    <h3 className="text-xl font-bold text-secondary mb-4">Fechas Importantes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-america-blue/10 rounded-lg p-4">
                        <Calendar className="w-6 h-6 text-america-blue mb-2" />
                        <p className="text-sm font-semibold text-secondary">Inicio Inscripciones</p>
                        <p className="text-lg font-bold text-america-blue">Por definir</p>
                      </div>
                      <div className="bg-america-blue/10 rounded-lg p-4">
                        <Clock className="w-6 h-6 text-america-blue mb-2" />
                        <p className="text-sm font-semibold text-secondary">Cierre de Inscripciones</p>
                        <p className="text-lg font-bold text-america-blue">Por definir</p>
                      </div>
                      <div className="bg-america-blue/10 rounded-lg p-4">
                        <Trophy className="w-6 h-6 text-america-blue mb-2" />
                        <p className="text-sm font-semibold text-secondary">Inicio Fase Nacional</p>
                        <p className="text-lg font-bold text-america-blue">1 de Junio 2025</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-center mt-8">
              <Button size="lg" onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90 text-secondary font-bold text-lg px-8 shadow-yellow">
                Comenzar Inscripción
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Patrocinadores */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-secondary mb-4">Nuestros Patrocinadores</h2>
              <div className="w-24 h-1 bg-primary mx-auto mb-6"></div>
              <p className="text-muted-foreground text-lg">Gracias a quienes hacen posible este torneo</p>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              {[
                { src: sponsorKeuka, alt: "Keuka", name: "Keuka" },
                { src: sponsorZucaritas, alt: "Zucaritas", name: "Zucaritas", dark: true },
                { src: sponsorPowerade, alt: "Powerade", name: "Powerade" },
                { src: sponsorPlataformaSports, alt: "Plataforma Sports", name: "Plataforma Sports" },
                { src: sponsorClaroSports, alt: "Claro Sports", name: "Claro Sports" },
              ].map((sponsor, index) => (
                <div 
                  key={index}
                  className={`group p-6 rounded-xl transition-all duration-300 hover:scale-110 ${sponsor.dark ? 'bg-secondary' : 'bg-white'} shadow-md hover:shadow-xl`}
                >
                  <img 
                    src={sponsor.src} 
                    alt={sponsor.alt}
                    className="h-12 md:h-16 w-auto object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FloatingWhatsApp />
    </div>;
}