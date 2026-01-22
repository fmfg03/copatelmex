import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Calendar, Trophy, Shield, Users, FileText, Clock, Award, CheckCircle, Star, Download, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import galleryGoalCelebration from "@/assets/gallery-goal-celebration.jpg";
import galleryGoalkeeperSave from "@/assets/gallery-goalkeeper-save.jpg";
import galleryMatchAction from "@/assets/gallery-match-action.jpg";
import galleryTeamPhoto from "@/assets/gallery-team-photo.jpg";
import galleryTrophyCelebration from "@/assets/gallery-trophy-celebration.jpg";
import galleryFemenil1 from "@/assets/gallery-femenil-1.jpg";
import galleryVaronil1 from "@/assets/gallery-varonil-1.jpg";
import galleryJuvenil1 from "@/assets/gallery-juvenil-1.jpg";
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
                Quiero Inscribirme
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-secondary" asChild>
                <a href="/bases-torneo.pdf" download>
                  <Download className="w-5 h-5 mr-2" />
                  Descargar Convocatoria
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
                  <p className="text-muted-foreground mb-4 text-justify">
                    Copa Telmex Telcel es un torneo que tiene como principales objetivos la asistencia social a personas, sectores y regiones de escasos recursos, comunidades indígenas y grupos vulnerables.
                  </p>
                  <p className="text-muted-foreground text-justify">
                    Impulsa la asistencia social a personas y comunidades de escasos recursos mediante el deporte. Incluye a grupos vulnerables para fomentar la activación física y la integración social, previniendo problemas de carácter social que afectan a la población mexicana.
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <h2 className="text-4xl font-bold text-secondary mb-4">Fases del Torneo</h2>
              <div className="w-24 h-1 bg-primary mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-2 hover:border-primary transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-primary">1</span>
                    </div>
                    <h3 className="text-xl font-bold text-secondary mb-3">FASE COLECTIVA</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-america-blue mt-0.5 flex-shrink-0" />
                        <span>Registro de equipos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-america-blue mt-0.5 flex-shrink-0" />
                        <span>Conformación de grupos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-america-blue mt-0.5 flex-shrink-0" />
                        <span>Partidos locales</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-america-blue mt-0.5 flex-shrink-0" />
                        <span>Clasificación a fase estatal</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-primary">2</span>
                    </div>
                    <h3 className="text-xl font-bold text-secondary mb-3">FASE ESTATAL</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-america-blue mt-0.5 flex-shrink-0" />
                        <span>Competencia a nivel estado</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-america-blue mt-0.5 flex-shrink-0" />
                        <span>Los mejores equipos de cada zona</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-america-blue mt-0.5 flex-shrink-0" />
                        <span>Sistema de eliminación</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-america-blue mt-0.5 flex-shrink-0" />
                        <span>Clasificación a fase nacional</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                      <span className="text-2xl font-bold text-primary">3</span>
                    </div>
                    <h3 className="text-xl font-bold text-secondary mb-3">FASE NACIONAL</h3>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-america-blue mt-0.5 flex-shrink-0" />
                        <span>Los mejores equipos del país</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-america-blue mt-0.5 flex-shrink-0" />
                        <span>Sede: León, Guanajuato</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-america-blue mt-0.5 flex-shrink-0" />
                        <span>Finales por categoría</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-america-blue mt-0.5 flex-shrink-0" />
                        <span>Coronación de campeones</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

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
                { src: galleryTrophyCelebration, alt: "Celebración del campeón", title: "Campeones Varonil" },
                { src: galleryTeamPhoto, alt: "Foto de equipo", title: "Equipos participantes" },
                { src: galleryMatchAction, alt: "Campeonas Femenil", title: "Campeonas Femenil" },
                { src: galleryGoalCelebration, alt: "Equipo Femenil", title: "Categoría Femenil" },
                { src: galleryGoalkeeperSave, alt: "Subcampeonas", title: "Subcampeonas Femenil" },
                { src: galleryFemenil1, alt: "Medallistas Femenil", title: "Medallistas Femenil" },
                { src: galleryVaronil1, alt: "Equipo Varonil", title: "Categoría Varonil" },
                { src: galleryJuvenil1, alt: "Equipo Juvenil", title: "Categoría Juvenil" },
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
                    loading="lazy"
                    decoding="async"
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