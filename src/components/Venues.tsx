import { MapPin, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import cecapImage from "@/assets/cecap-facilities.jpg";

export const Venues = () => {
  return (
    <section id="sedes" className="py-24 bg-background">
      <div className="container mx-auto px-4 animate-fade-in-up">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-secondary mb-6 tracking-tight">
              Sede del Torneo
            </h2>
            <div className="w-24 h-1 bg-america-blue mx-auto mb-8"></div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed text-justify">
              Instalaciones de primer nivel para una experiencia profesional.
            </p>
          </div>

          {/* Main Venue Card */}
          <div className="bg-card dark:bg-card rounded-2xl shadow-navy overflow-hidden mb-16 animate-scale-in border border-border">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Image */}
              <div className="relative h-64 lg:h-full">
                <img
                  src={cecapImage}
                  alt="Instalaciones CECAP"
                  loading="lazy"
                  width="600"
                  height="400"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 to-transparent"></div>
              </div>

              {/* Content */}
              <div className="p-10 md:p-14">
                <div className="flex items-center space-x-3 mb-8">
                  <MapPin className="w-6 h-6 text-america-blue" />
                  <h3 className="text-3xl font-bold text-secondary">
                    CECAP - Centro de entrenamiento del Nido Águila Club América
                  </h3>
                </div>

                <p className="text-muted-foreground mb-4 leading-relaxed text-justify">
                  CECAP - Centro de entrenamiento del Nido Águila Club América. Centro de Alto Rendimiento con canchas de pasto natural de última generación, 
                  diseñadas específicamente para el desarrollo de futbolistas juveniles.
                </p>
                
                <div className="bg-muted rounded-lg p-4 mb-6 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">
                    <span className="font-semibold text-secondary">Dirección:</span>
                  </p>
                  <p className="text-sm text-secondary">
                    Av. del Imán, Bosques de Tetlameya, Coyoacán<br />
                    04730 Ciudad de México, CDMX
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-america-blue mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-secondary mb-1">CECAP - Centro de entrenamiento del Nido Águila Club América</h4>
                      <p className="text-sm text-muted-foreground text-justify">
                        Centro de Alto Rendimiento del Club América.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-america-blue mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-secondary mb-1">Canchas Profesionales</h4>
                      <p className="text-sm text-muted-foreground text-justify">
                        Pasto NATURAL.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-america-blue mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-secondary mb-1">Seguridad 24/7</h4>
                      <p className="text-sm text-muted-foreground text-justify">
                        Personal de seguridad privada en todo momento.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <Button
                  className="w-full bg-secondary hover:bg-secondary/90 text-white font-bold"
                  size="lg"
                  asChild
                >
                  <a 
                    href="https://www.google.com/maps/place/Nido+%C3%81guila+Coapa+(CECAP+FMF)/@19.3043,-99.1347,17z/data=!3m1!4b1!4m6!3m5!1s0x85ce01002ce468dd:0x2c716ccbbecbb46e" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <MapPin className="w-5 h-5 mr-2" />
                    Ver Ubicación en Google Maps
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Google Maps Embed */}
          <div className="rounded-2xl overflow-hidden shadow-navy border border-border">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3764.1234567890123!2d-99.13683468509615!3d19.30428768695425!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85ce01002ce468dd%3A0x2c716ccbbecbb46e!2sNido%20%C3%81guila%20Coapa%20(CECAP%20FMF)!5e0!3m2!1ses-419!2smx!4v1733000000000!5m2!1ses-419!2smx"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="CECAP - Nido Águila Coapa - Av. del Imán, Coyoacán"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
