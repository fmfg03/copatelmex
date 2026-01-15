import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Phone, MapPin, Send, HelpCircle } from "lucide-react";

const FAQS = [
  {
    question: "¿Cómo me inscribo al torneo?",
    answer: "Para inscribirte, debes crear una cuenta en nuestra plataforma, registrar tu equipo y completar el proceso de pago. Una vez confirmado el pago, recibirás un correo de confirmación."
  },
  {
    question: "¿Cuánto cuesta la inscripción?",
    answer: "El costo de inscripción varía según la categoría. Consulta la sección de información del torneo para conocer los precios actualizados."
  },
  {
    question: "¿Cuáles son las categorías disponibles?",
    answer: "El torneo cuenta con categorías varoniles y femeniles para diferentes años de nacimiento. Consulta la sección de categorías para ver todas las opciones disponibles."
  },
  {
    question: "¿Cuántos jugadores puedo inscribir por equipo?",
    answer: "Cada equipo puede inscribir un máximo de jugadores según la categoría. Consulta las bases del torneo para conocer el límite específico de tu categoría."
  },
  {
    question: "¿Cuál es la fecha límite de inscripción?",
    answer: "La fecha límite de inscripción se publicará próximamente. Te recomendamos inscribirte con anticipación ya que los lugares son limitados."
  },
  {
    question: "¿Dónde se llevará a cabo el torneo?",
    answer: "El torneo se realizará en las instalaciones del CECAP (Centro de Capacitación y Desarrollo). Consulta la sección de sedes para más detalles."
  },
  {
    question: "¿Qué documentos necesito para inscribir a mi equipo?",
    answer: "Se requiere acta de nacimiento, CURP, fotografía reciente y carta responsiva firmada por el padre o tutor de cada jugador."
  },
  {
    question: "¿Cuándo se realizará el torneo?",
    answer: "Las fechas del torneo se publicarán próximamente. Mantente atento a nuestras redes sociales y sitio web para conocer el calendario oficial."
  },
  {
    question: "¿Qué incluye la inscripción?",
    answer: "La inscripción incluye la participación en todos los partidos de la fase de grupos, acceso a las instalaciones, arbitraje, servicios médicos básicos y kit de bienvenida."
  },
  {
    question: "¿Puedo inscribir más de un equipo?",
    answer: "Sí, puedes inscribir múltiples equipos en diferentes categorías. Cada equipo debe completar su proceso de inscripción y pago de forma independiente."
  },
  {
    question: "¿Cuáles son los métodos de pago aceptados?",
    answer: "Aceptamos pagos con tarjeta de crédito/débito a través de nuestra plataforma segura. También puedes realizar transferencias bancarias."
  },
  {
    question: "¿Hay reembolsos si no puedo participar?",
    answer: "Las políticas de reembolso dependen de la fecha de cancelación. Consulta los términos y condiciones o contáctanos para más información."
  },
  {
    question: "¿Cuántos partidos jugará cada equipo?",
    answer: "Cada equipo jugará un mínimo de partidos en la fase de grupos. La cantidad total dependerá del avance en el torneo."
  },
  {
    question: "¿Qué pasa si un jugador no puede asistir a un partido?",
    answer: "Los jugadores pueden ser sustituidos por otros jugadores previamente registrados en la plantilla del equipo. No se permiten jugadores no registrados."
  },
  {
    question: "¿Hay premios para los ganadores?",
    answer: "Sí, habrá premios para los equipos ganadores de cada categoría. Los detalles de los premios se anunciarán próximamente."
  }
];

const ESTADOS_MEXICO = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México",
  "Guanajuato", "Guerrero", "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    estado: "",
    municipio: "",
    correo: "",
    mensaje: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEstadoChange = (value: string) => {
    setFormData((prev) => ({ ...prev, estado: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simular envío (sin envío real por ahora)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Mensaje enviado",
      description: "Hemos recibido tu mensaje. Te contactaremos pronto.",
    });

    setFormData({
      nombre: "",
      telefono: "",
      estado: "",
      municipio: "",
      correo: "",
      mensaje: "",
    });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
              Contáctanos
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
              ¿Tienes alguna duda, queja o sugerencia? Contacta con nuestro Director General y te responderá a la brevedad.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {/* Contact Info & FAQ */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6 order-2 lg:order-1">
              <div className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-border">
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">
                  Información de Contacto
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm sm:text-base">Teléfono</p>
                      <a 
                        href="tel:+525555555555" 
                        className="text-muted-foreground hover:text-primary transition-colors text-sm"
                      >
                        +52 55 5555 5555
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm sm:text-base">Ubicación</p>
                      <p className="text-muted-foreground text-sm">
                        Ciudad de México, México
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-secondary rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg">
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3">
                  Horario de Atención
                </h3>
                <div className="space-y-1.5 sm:space-y-2 text-white/80 text-sm">
                  <p>Lunes a Viernes: 9:00 - 18:00</p>
                  <p>Sábados: 9:00 - 14:00</p>
                  <p>Domingos: Cerrado</p>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-lg border border-border">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  <h3 className="text-base sm:text-lg font-bold text-foreground">Preguntas Frecuentes</h3>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {FAQS.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left text-xs sm:text-sm">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-xs sm:text-sm">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2 order-1 lg:order-2">
              <div className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-6 md:p-8 shadow-lg border border-border">
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">
                  Envíanos un Mensaje
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombre" className="text-sm">Nombre Completo *</Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        placeholder="Tu nombre completo"
                        required
                        className="text-sm sm:text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telefono" className="text-sm">Teléfono *</Label>
                      <Input
                        id="telefono"
                        name="telefono"
                        type="tel"
                        value={formData.telefono}
                        onChange={handleChange}
                        placeholder="10 dígitos"
                        required
                        className="text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estado" className="text-sm">Estado *</Label>
                      <Select value={formData.estado} onValueChange={handleEstadoChange} required>
                        <SelectTrigger className="text-sm sm:text-base">
                          <SelectValue placeholder="Selecciona tu estado" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover max-h-[300px]">
                          {ESTADOS_MEXICO.map((estado) => (
                            <SelectItem key={estado} value={estado} className="text-sm">
                              {estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="municipio" className="text-sm">Municipio/Alcaldía *</Label>
                      <Input
                        id="municipio"
                        name="municipio"
                        value={formData.municipio}
                        onChange={handleChange}
                        placeholder="Tu municipio o alcaldía"
                        required
                        className="text-sm sm:text-base"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="correo" className="text-sm">Correo Electrónico *</Label>
                    <Input
                      id="correo"
                      name="correo"
                      type="email"
                      value={formData.correo}
                      onChange={handleChange}
                      placeholder="tu@correo.com"
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mensaje" className="text-sm">Mensaje *</Label>
                    <Textarea
                      id="mensaje"
                      name="mensaje"
                      value={formData.mensaje}
                      onChange={handleChange}
                      placeholder="Escribe tu mensaje, duda, queja o sugerencia..."
                      rows={4}
                      required
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full text-sm sm:text-base"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Enviando..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Mensaje
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contact;
