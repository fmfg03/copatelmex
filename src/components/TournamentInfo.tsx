import { Award, Shield, Star, Users, Calendar, MapPin, Car, Download, CheckCircle, Play, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
export const TournamentInfo = () => {
  const navigate = useNavigate();
  const features = [{
    icon: Shield,
    title: "Experiencia segura y formativa",
    description: "Organización de clase mundial con servicios pensados para familias: seguridad, paramédicos, árbitros certificados e instalaciones profesionales del Club América."
  }, {
    icon: Star,
    title: "Vive la cultura del Club América",
    description: "Experiencias únicas donde los niños viven el Club América en comunidad: entrenan en el CECAP, conocen la historia del club y se inspiran con sus valores."
  }, {
    icon: Users,
    title: "Desarrollo integral con valores",
    description: "Más que fútbol: promovemos respeto, trabajo en equipo y juego limpio en cada partido, creando un ambiente donde cada participante aprende, disfrute y crece."
  }, {
    icon: Eye,
    title: "Visorías del Club América",
    description: "Oportunidad única para que los jugadores sean observados por visores oficiales del Club América, abriendo puertas hacia el desarrollo profesional en fuerzas básicas."
  }];
  const categories = [{
    name: "Sub-5",
    year: "2020",
    players: "16 jugadores máximo."
  }, {
    name: "Sub-6",
    year: "2019",
    players: "16 jugadores máximo."
  }, {
    name: "Sub-7",
    year: "2018",
    players: "16 jugadores máximo."
  }, {
    name: "Sub-8",
    year: "2017",
    players: "16 jugadores máximo."
  }, {
    name: "Sub-9",
    year: "2016",
    players: "16 jugadores máximo."
  }, {
    name: "Sub-10",
    year: "2015",
    players: "16 jugadores máximo."
  }, {
    name: "Sub-11",
    year: "2014",
    players: "16 jugadores máximo."
  }];
  const priceIncludes = ["Inscripción oficial.", "Seguro médico durante el torneo.", "4 partidos garantizados.", "Árbitros formativos y certificados.", "Medalla de participación.", "Experiencias únicas del Club América.", "Kit de bienvenida.", "Hidratación para los jugadores.", "Visores de Club América.", "Campos de pasto natural, CECAP - Centro de entrenamiento del Nido Águila Club América."];
  return <section id="informacion" className="py-24 bg-background">
      <div className="container mx-auto px-4 animate-fade-in-up">
        <div className="max-w-6xl mx-auto space-y-20">
          {/* Section Header */}
          <div className="text-center mb-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-secondary mb-6 tracking-tight">
              Información del Torneo
            </h2>
            <div className="w-24 h-1 bg-america-blue mx-auto mb-8"></div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed text-justify">
              La Copa Club América es más que un torneo, es una experiencia integral de alto nivel formativo.
            </p>
          </div>

          {/* Misión y Visión */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 border-border animate-slide-in-left">
              <CardContent className="p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-america-blue/10 flex items-center justify-center">
                    <Star className="w-6 h-6 text-america-blue" />
                  </div>
                  <h3 className="text-2xl font-bold text-secondary">Misión</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  Crear experiencias de fútbol seguras, formativas y emocionantes donde los niños y sus familias vivan el Club América en comunidad: competencia de calidad, valores (respeto, trabajo en equipo y juego limpio) y servicios pensados para que cada participante disfrute, aprenda y regrese a casa inspirado.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-border animate-slide-in-right">
              <CardContent className="p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-america-blue/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-america-blue" />
                  </div>
                  <h3 className="text-2xl font-bold text-secondary">Visión</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed text-justify">
                  Ser el torneo de referencia en México y Norteamérica para el desarrollo integral del fútbol infantil y juvenil, reconocido por su organización de clase mundial, su impacto positivo en las familias y su capacidad de unir comunidades a través del deporte y la cultura del Club América.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Por qué será un gran torneo */}
          <Card className="border-2 border-america-blue/20 bg-gradient-to-br from-background to-america-blue/5 animate-scale-in">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-secondary mb-6 text-center">¿Por qué será un gran torneo?</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {features.map((feature, index) => <div key={index} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-america-blue/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-secondary mb-1">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground text-justify">{feature.description}</p>
                    </div>
                  </div>)}
              </div>
            </CardContent>
          </Card>

          {/* Bases y Reglamento */}
          <Card className="border-2 border-border">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-america-blue/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-america-blue" />
                </div>
                <h3 className="text-2xl font-bold text-secondary">Bases y Reglamento</h3>
              </div>
              <p className="text-muted-foreground mb-6 text-justify">
                Descarga el documento completo con las bases, condiciones, reglas y normativas oficiales del torneo.
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button className="w-full sm:w-auto" asChild>
                      <a href="/bases-torneo.pdf" download>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar Bases del Torneo (PDF)
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Haz clic para descargar el archivo PDF con todas las bases oficiales del torneo</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Separator className="my-6" />
              <div className="space-y-3">
                <h4 className="font-semibold text-secondary">Reglas Principales:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-america-blue flex-shrink-0 mt-0.5" />
                    <span>Formato: Fútbol 5 (categorías 2020, 2019, 2018) y Fútbol 7 (categorías 2017, 2016, 2015, 2014).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-america-blue flex-shrink-0 mt-0.5" />
                    <span>Duración: 2 tiempos de 20 minutos con 5 minutos de descanso.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-america-blue flex-shrink-0 mt-0.5" />
                    <span>Sustituciones ilimitadas durante el partido.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-america-blue flex-shrink-0 mt-0.5" />
                    <span>4 partidos asegurados, entre ellas, una semifinal.</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Fechas Clave */}
          <Card className="border-2 border-border bg-gradient-to-br from-secondary/5 to-primary/5">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-america-blue/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-america-blue" />
                </div>
                <h3 className="text-2xl font-bold text-secondary">Fechas Clave</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Inicio de Inscripciones</p>
                  <p className="text-xl font-bold text-secondary">24 Noviembre 2025</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Cierre de Inscripciones</p>
                  <p className="text-xl font-bold text-secondary">15 Febrero 2026</p>
                </div>
                <div className="bg-background rounded-lg p-4 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Inicio del Torneo</p>
                  <p className="text-xl font-bold text-secondary">27 Febrero - 1 Marzo 2026</p>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Cómo Inscribirse */}
          <Card className="border-2 border-america-blue/20 bg-gradient-to-br from-america-blue/5 to-background">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-america-blue/10 flex items-center justify-center">
                  <Play className="w-6 h-6 text-america-blue" />
                </div>
                <h3 className="text-2xl font-bold text-secondary">¿Cómo Inscribirse?</h3>
              </div>
              {/* Pasos de Inscripción */}
              <div className="space-y-4">
                <h4 className="font-bold text-secondary mb-4">Pasos para inscribirte:</h4>
                {[{
                step: 1,
                title: "Crea tu cuenta",
                desc: "Regístrate en la plataforma con tus datos básicos."
              }, {
                step: 2,
                title: "Registra los datos del equipo y Entrenadores",
                desc: "Ingresa la información de tu equipo y jugadores."
              }, {
                step: 3,
                title: "Realiza el pago",
                desc: "Completa el pago de inscripción mediante transferencia o depósito."
              }, {
                step: 4,
                title: "Envía tu comprobante de pago",
                desc: "Envía tu comprobante de pago referenciado por WhatsApp para validación.",
                whatsappAction: true
              }, {
                step: 5,
                title: "Completa el formulario",
                desc: "Adjunta actas de nacimiento y autorizaciones requeridas."
              }, {
                step: 6,
                title: "Confirmación",
                desc: "Recibirás tu confirmación por email y WhatsApp."
              }].map(item => <div key={item.step} className="flex items-start gap-4 bg-background rounded-lg p-4 border border-border">
                    <div className="w-10 h-10 rounded-full bg-america-blue flex items-center justify-center flex-shrink-0 text-white font-bold">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-secondary mb-1">{item.title}</h5>
                      <p className="text-sm text-muted-foreground text-justify">{item.desc}</p>
                      {item.whatsappAction && (
                        <a
                          href="https://wa.me/525512011498?text=Hola%2C%20quiero%20enviar%20mi%20comprobante%20de%20pago%20para%20la%20Copa%20Club%20Am%C3%A9rica%202026.%20Mi%20referencia%20de%20pago%20es%3A"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-[#25D366] hover:bg-[#20BD5A] text-white text-sm font-semibold rounded-full transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          Enviar Comprobante
                        </a>
                      )}
                    </div>
                  </div>)}
              </div>

              <Button className="w-full mt-6 bg-primary hover:bg-primary/90 text-secondary font-extrabold text-lg py-6 rounded-full shadow-yellow" size="lg" onClick={() => {
              navigate("/register");
              window.scrollTo(0, 0);
            }}>
                Comenzar Inscripción Ahora
              </Button>
            </CardContent>
          </Card>

          {/* Qué Incluye LA COPA CLUB AMÉRICA */}
          <Card className="border-2 border-border bg-gradient-to-br from-secondary/5 to-background">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-america-blue/10 flex items-center justify-center">
                  <Award className="w-6 h-6 text-america-blue" />
                </div>
                <h3 className="text-2xl font-bold text-secondary">¿Qué Incluye la Copa Club América 2026?</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {priceIncludes.map((item, index) => <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-america-blue flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>)}
              </div>
              <Separator className="my-6" />
              <div className="bg-america-blue/10 rounded-lg p-6">
                <p className="text-xl text-muted-foreground line-through text-center mb-4">Precio regular: $25,000 + IVA</p>
                <div className="grid gap-3 mb-4">
                  <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-bold">-25%</span>
                      <span className="font-semibold text-secondary">$18,750 + IVA</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Hasta el 14 de diciembre</span>
                  </div>
                  <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-america-blue text-white px-3 py-1 rounded-full text-sm font-bold">-15%</span>
                      <span className="font-semibold text-secondary">$21,250 + IVA</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Hasta el 28 de diciembre</span>
                  </div>
                  <div className="flex items-center justify-between bg-background/50 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-sm font-bold">-5%</span>
                      <span className="font-semibold text-secondary">$23,750 + IVA</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Hasta el 11 de enero</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-center text-sm">Por equipo (hasta 16 jugadores)</p>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </section>;
};