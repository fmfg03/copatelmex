import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingWhatsApp } from "@/components/FloatingWhatsApp";
import { Shield, Mail, Lock, Users, FileText, RefreshCw, Baby, AlertTriangle, Camera } from "lucide-react";

const Privacy = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-secondary via-secondary/95 to-secondary/90 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Aviso de Privacidad
              </h1>
              <p className="text-xl text-white/90">
                Copa Club América 2026 - Protección de Datos Personales
              </p>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              
              {/* Aviso Oficial Club América */}
              <div className="bg-gradient-to-br from-america-blue/10 to-america-blue/5 rounded-xl shadow-lg p-8 mb-8 border-2 border-america-blue/20">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-america-blue rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-secondary mb-2">
                      Aviso de Privacidad Oficial
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Plataforma Sports SC y/o Fundación Telmex Telcel SC
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  La Copa Club América 2026 es organizada bajo los estándares y políticas del Club América. Para información completa sobre el tratamiento de datos personales, consulte el aviso de privacidad oficial del Club América.
                </p>
                <a
                  href="https://www.clubamerica.com.mx/aviso-de-privacidad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-america-blue hover:bg-america-blue/90 text-white font-bold px-6 py-3 rounded-full transition-colors"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Ver Aviso de Privacidad Completo
                </a>
              </div>

              {/* Responsable */}
              <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-america-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-america-blue" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-secondary mb-2">
                      Responsable de los Datos Personales
                    </h2>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>Plataforma Sports SC y/o Fundación Telmex Telcel SC</strong>, con domicilio en Ciudad de México, México, es el responsable del tratamiento de sus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
                </p>
              </div>
              
              {/* Finalidades del Tratamiento */}
              <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-america-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-america-blue" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-secondary mb-2">
                      Finalidades del Tratamiento
                    </h2>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  Los datos personales recabados para la Copa Club América 2026 tienen como finalidad:
                </p>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start">
                    <span className="text-america-blue mr-2 mt-1">•</span>
                    <span>Gestión de inscripciones y participación en el torneo</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-america-blue mr-2 mt-1">•</span>
                    <span>Comunicaciones relacionadas con el evento</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-america-blue mr-2 mt-1">•</span>
                    <span>Publicación de resultados y estadísticas del torneo</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-america-blue mr-2 mt-1">•</span>
                    <span>Envío de información relevante del Club América</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-america-blue mr-2 mt-1">•</span>
                    <span>Participación en dinámicas y experiencias organizadas por el Club</span>
                  </li>
                </ul>
              </div>

              {/* Datos Personales Recabados */}
              <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-america-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-america-blue" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-secondary mb-2">
                      Datos Personales Recabados
                    </h2>
                  </div>
                </div>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p className="font-semibold text-secondary">Datos de identificación:</p>
                  <p>Nombre completo</p>
                  
                  <p className="font-semibold text-secondary">Datos de contacto:</p>
                  <p>Correo electrónico y número celular</p>
                  
                  <p className="font-semibold text-secondary">Datos demográficos:</p>
                  <p>Fecha de nacimiento y sexo</p>
                  
                  <p className="font-semibold text-secondary">Datos de ubicación:</p>
                  <p>País, código postal, estado, ciudad y municipio o alcaldía de residencia</p>
                </div>
              </div>

              {/* Derechos ARCO */}
              <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-america-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-america-blue" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-secondary mb-2">
                      Derechos ARCO
                    </h2>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos personales, así como a Limitar su uso o divulgación. Para ejercer estos derechos, envíe su solicitud a:
                </p>
                <a 
                  href="mailto:datos@clubamerica.com.mx"
                  className="inline-flex items-center text-america-blue hover:text-america-blue/80 font-semibold transition-colors"
                >
                  <Mail className="w-5 h-5 mr-2" />
                  datos@clubamerica.com.mx
                </a>
              </div>

              {/* Seguridad de los Datos */}
              <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-america-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6 text-america-blue" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-secondary mb-2">
                      Medidas de Seguridad
                    </h2>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  El Club América cuenta con medidas físicas, técnicas y administrativas para la protección de sus datos personales contra daño, pérdida, alteración, destrucción o el uso, acceso o tratamiento no autorizado.
                </p>
              </div>

              {/* Transferencia de Datos */}
              <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-america-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <RefreshCw className="w-6 h-6 text-america-blue" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-secondary mb-2">
                      Transferencia de Datos Personales
                    </h2>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  El Club América podrá, conforme a lo establecido en la Ley, revelar, divulgar y/o transferir dentro y fuera de México sus datos personales a empresas filiales, subsidiarias y/o relacionadas, así como para dar cumplimiento con disposiciones legales que así lo requieran.
                </p>
              </div>

              {/* Cambios al Aviso */}
              <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-america-blue/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-america-blue" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-secondary mb-2">
                      Cambios al Aviso de Privacidad
                    </h2>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Nos reservamos el derecho de realizar cambios o actualizaciones al presente Aviso de Privacidad para cumplir con modificaciones legislativas, políticas internas o para adaptarlo a nuevas circunstancias.
                </p>
              </div>

              {/* Aviso Cuidado a Menores */}
              <div id="cuidado-menores" className="bg-white rounded-xl shadow-sm p-8 mb-8 border-2 border-orange-200">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Baby className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-secondary mb-2">
                      Aviso de Cuidado a Menores
                    </h2>
                  </div>
                </div>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Copa Club América 2026 desea enfatizar que la seguridad y el cuidado de los niños participantes durante el torneo son responsabilidad exclusiva de los representantes de cada equipo, así como de los padres de familia o tutores legales. Aunque nos esforzamos por proporcionar un entorno seguro y supervisado durante las actividades del torneo, no asumimos la responsabilidad directa del cuidado y la vigilancia de los menores fuera del campo de juego.
                  </p>
                  <p>
                    Instamos a los representantes de equipos, padres de familia y tutores a tomar las precauciones necesarias para garantizar la seguridad y el bienestar de los niños durante su participación en Copa Club América 2026. Esto incluye la supervisión fuera de los horarios de juego, la atención a las necesidades médicas individuales, y la coordinación de la llegada y salida de los participantes.
                  </p>
                  <p>
                    Al registrarse para el torneo, los representantes de equipos y los padres/tutores aceptan y comprenden que Copa Club América 2026 no asume responsabilidad por incidentes que ocurran fuera de las actividades oficiales del torneo.
                  </p>
                  <p className="font-semibold text-secondary">
                    Agradecemos la colaboración y comprensión de todos los participantes, y estamos comprometidos a trabajar juntos para garantizar un ambiente seguro y positivo para todos los niños involucrados en Copa Club América 2026.
                  </p>
                </div>
              </div>

              {/* Descargo de Responsabilidad General */}
              <div id="descargo" className="bg-white rounded-xl shadow-sm p-8 mb-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-secondary mb-2">
                      Descargo de Responsabilidad
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Copa Club América 2026
                    </p>
                  </div>
                </div>
                <div className="space-y-6 text-muted-foreground">
                  <p className="leading-relaxed">
                    La Copa Club América 2026 es un torneo de fútbol infantil y juvenil. Al participar en este evento, los equipos, jugadores, entrenadores, y cualquier otra parte involucrada, aceptan plenamente los términos y condiciones establecidos a continuación:
                  </p>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-secondary mb-2">
                      Responsabilidad del Participante
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="text-america-blue mr-2 mt-1">•</span>
                        <span>Los participantes y sus representantes legales reconocen y aceptan que la participación en la Copa Club América 2026 conlleva riesgos inherentes asociados con la práctica del fútbol.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-america-blue mr-2 mt-1">•</span>
                        <span>Cada equipo es responsable de garantizar que sus jugadores y personal cumplan con todas las reglas y regulaciones establecidas por la Copa Club América 2026 y las autoridades locales.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-secondary mb-2">
                      Salud y Seguridad
                    </h3>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="text-america-blue mr-2 mt-1">•</span>
                        <span>Se espera que todos los participantes gocen de buena salud física y estén aptos para participar en actividades deportivas. Cualquier condición médica existente debe ser comunicada al equipo organizador.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-america-blue mr-2 mt-1">•</span>
                        <span>La organización no se hace responsable de lesiones, accidentes o enfermedades que puedan ocurrir durante el torneo.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-secondary mb-2">
                      Regulaciones del Torneo
                    </h3>
                    <p>
                      Los equipos deben seguir las reglas y regulaciones del torneo establecidas por la Copa Club América 2026. Cualquier incumplimiento puede resultar en sanciones, descalificación o acciones disciplinarias.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-secondary mb-2">
                      Fotografías y Grabaciones
                    </h3>
                    <p>
                      Al participar en la Copa Club América 2026, los equipos otorgan el derecho a la organización para tomar fotografías, grabaciones de video u otros medios de los eventos relacionados con el torneo. Estos materiales pueden ser utilizados con fines promocionales y de marketing.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-secondary mb-2">
                      Cambios y Cancelaciones
                    </h3>
                    <p>
                      La organización se reserva el derecho de realizar cambios en las fechas, ubicaciones, reglas y cualquier otro aspecto del torneo en caso de circunstancias imprevistas. En caso de cancelación del torneo por razones fuera de nuestro control, la organización no será responsable de los costos incurridos por los participantes.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-secondary mb-2">
                      Condiciones Meteorológicas
                    </h3>
                    <p>
                      En caso de condiciones meteorológicas adversas, la organización puede tomar decisiones respecto a la suspensión o cancelación de partidos con el objetivo de garantizar la seguridad de los participantes.
                    </p>
                  </div>

                  <p className="text-sm italic pt-4 border-t border-muted">
                    Al inscribirse en la Copa Club América 2026, todos los participantes aceptan y comprenden estos términos y condiciones. La organización hará todo lo posible por garantizar un torneo seguro y exitoso para todos los involucrados.
                  </p>
                </div>
              </div>

              {/* Descargo de Responsabilidad - Fotografías */}
              <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Camera className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-secondary mb-2">
                      Descargo de Responsabilidad: Fotografías de Menores de Edad
                    </h2>
                  </div>
                </div>
                <div className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed">
                    La Copa Club América 2026 es un torneo de fútbol infantil y juvenil. En relación con la publicación de fotografías que incluyen a niños y jóvenes menores de edad, solicitamos a todos los participantes, padres, tutores y espectadores que tomen en cuenta lo siguiente:
                  </p>

                  <div>
                    <h3 className="text-lg font-semibold text-secondary mb-2">
                      Consentimiento Informado
                    </h3>
                    <p>
                      Al inscribirse en la Copa Club América 2026, los participantes y sus representantes legales otorgan su consentimiento para la toma de fotografías y grabaciones de video que incluyan a los menores de edad con fines relacionados con el torneo, como la promoción y documentación del evento.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-secondary mb-2">
                      Uso Responsable
                    </h3>
                    <p>
                      Las imágenes capturadas durante la Copa Club América 2026 se utilizarán de manera responsable y ética. Se evitará cualquier uso que pudiera resultar inapropiado, invasivo o perjudicial para la integridad de los menores.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-secondary mb-2">
                      Derechos de Privacidad
                    </h3>
                    <p>
                      Respetamos plenamente los derechos de privacidad de los menores y nos comprometemos a no publicar información sensible que pueda identificar directamente a un participante sin el consentimiento explícito de los padres o tutores.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-secondary mb-2">
                      Contacto para Retirar Imágenes
                    </h3>
                    <p>
                      En caso de que los padres o tutores deseen retirar alguna imagen específica de su hijo(a) de nuestras plataformas, les instamos a que se comuniquen con el equipo organizador proporcionando detalles precisos de la imagen en cuestión a través de <a href="mailto:hola@superfns.com" className="text-america-blue hover:text-america-blue/80 font-semibold">hola@superfns.com</a>
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-secondary mb-2">
                      Uso de Terceros
                    </h3>
                    <p>
                      La organización no se hace responsable del uso indebido de imágenes por parte de terceros ajenos al torneo. Se recomienda a los participantes y sus familias ser cautelosos al compartir imágenes en plataformas externas.
                    </p>
                  </div>

                  <p className="text-sm italic pt-4 border-t border-muted">
                    Al participar en la Copa Club América 2026, todos los participantes y sus representantes legales aceptan y comprenden estas pautas con respecto a la fotografía de menores de edad.
                  </p>
                </div>
              </div>

              {/* Contacto */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-8">
                <div className="text-center">
                  <Mail className="w-12 h-12 text-america-blue mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-secondary mb-4">
                    Contacto
                  </h2>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    Para cualquier duda o aclaración respecto al tratamiento de sus datos personales, puede ponerse en contacto con nosotros a través de:
                  </p>
                  <a 
                    href="mailto:hola@superfns.com"
                    className="inline-flex items-center bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    hola@superfns.com
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default Privacy;
