import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MexicoMap } from "@/components/MexicoMap";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";

export interface StateOperator {
  id: string;
  name: string;
  email: string;
  phone?: string;
  stateName: string;
  subOperators?: Array<{
    zone: string;
    name: string;
    email: string;
    phone?: string;
  }>;
}

// Datos de Asociaciones Estatales - Responsables por estado
export const stateOperators: Record<string, StateOperator> = {
  "aguascalientes": { id: "ags", stateName: "Aguascalientes", name: "Gilberto Saucedo", email: "gilsau_14@hotmail.com" },
  "baja-california": { id: "bc", stateName: "Baja California", name: "Jesús Appel", email: "appel.surf@gmail.com" },
  "baja-california-sur": { id: "bcs", stateName: "Baja California Sur", name: "Jorge Alvarado", email: "jorge94@hotmail.com" },
  "campeche": { id: "cam", stateName: "Campeche", name: "Emmanuel Talango", email: "asociaciondefutboldelestadodecampeche@hotmail.com" },
  "chiapas": { id: "chis", stateName: "Chiapas", name: "José Tacías", email: "tacias_gallegos@hotmail.com" },
  "chihuahua": { id: "chih", stateName: "Chihuahua", name: "Por confirmar", email: "contacto@copatelmex.mx" },
  "ciudad-de-mexico": { id: "cdmx", stateName: "Ciudad de México", name: "Araceli Márquez", email: "asocfut@hotmail.com" },
  "coahuila": { id: "coah", stateName: "Coahuila", name: "Juan Elizalde", email: "elizaldejuan031@gmail.com" },
  "colima": { id: "col", stateName: "Colima", name: "Alejandro Ponce", email: "alejandropc17266@hotmail.com" },
  "durango": { id: "dgo", stateName: "Durango", name: "Jesús Vargas", email: "cuquisfutbol_dgo@hotmail.com" },
  "guanajuato": { id: "gto", stateName: "Guanajuato", name: "Christian Gómez", email: "tuzospachuca_leon@hotmail.com" },
  "guerrero": { id: "gro", stateName: "Guerrero", name: "Guillermo Moreno", email: "gallo_futbol@hotmail.com" },
  "hidalgo": { id: "hgo", stateName: "Hidalgo", name: "Mayra Cruz", email: "mec79jb@gmail.com" },
  "jalisco": { id: "jal", stateName: "Jalisco", name: "Mauricio Figueroa", email: "mauricio.fimo.ufd@gmail.com" },
  "estado-de-mexico": { id: "mex", stateName: "Estado de México", name: "Juliana Martín / Jesús Mondragón", email: "asoc_mex@yahoo.com.mx", subOperators: [
    { zone: "Valle de México", name: "Juliana Martín", email: "asoc_mex@yahoo.com.mx" },
    { zone: "Valle de Toluca", name: "Jesús Mondragón", email: "jesusmondragon66@hotmail.com", phone: "7223581093" },
  ] },
  "michoacan": { id: "mich", stateName: "Michoacán", name: "Felipe Nery Luna", email: "apodacaupn@live.com.mx" },
  "morelos": { id: "mor", stateName: "Morelos", name: "José Antonio Albarrán Salazar", email: "jaqueline.afaem@gmail.com" },
  "nayarit": { id: "nay", stateName: "Nayarit", name: "Jose Antonio Huizar", email: "nubia_camacho@hotmail.com" },
  "nuevo-leon": { id: "nl", stateName: "Nuevo León", name: "Paola Sánchez", email: "pao8786@gmail.com" },
  "oaxaca": { id: "oax", stateName: "Oaxaca", name: "Roberto Castellanos", email: "ghos_31@hotmail.com" },
  "puebla": { id: "pue", stateName: "Puebla", name: "Braulio Casco / Antonio Iriarte", email: "braucarey@gmail.com" },
  "queretaro": { id: "qro", stateName: "Querétaro", name: "Mario Villanueva", email: "marioavd@hotmail.com" },
  "quintana-roo": { id: "qroo", stateName: "Quintana Roo", name: "Ismael Pulido", email: "ismael_medina1@hotmail.com" },
  "san-luis-potosi": { id: "slp", stateName: "San Luis Potosí", name: "Pedro Cadena", email: "pedro_cadenag@hotmail.com" },
  "sinaloa": { id: "sin", stateName: "Sinaloa", name: "Paul Milan", email: "afoesac@hotmail.com" },
  "sonora": { id: "son", stateName: "Sonora", name: "Por confirmar", email: "contacto@copatelmex.mx" },
  "tabasco": { id: "tab", stateName: "Tabasco", name: "Por confirmar", email: "contacto@copatelmex.mx" },
  "tamaulipas": { id: "tam", stateName: "Tamaulipas", name: "José Mansur", email: "pepecorre@hotmail.com" },
  "tlaxcala": { id: "tlax", stateName: "Tlaxcala", name: "Miguel Águila", email: "matlacuilom@hotmail.com" },
  "veracruz": { id: "ver", stateName: "Veracruz", name: "José Luis Espejo", email: "asandovalg35@gmail.com" },
  "yucatan": { id: "yuc", stateName: "Yucatán", name: "Manuel Martín", email: "afeyac@hotmail.com" },
  "zacatecas": { id: "zac", stateName: "Zacatecas", name: "Manuel Ruiz Guzman", email: "manuelruizguzmann@gmail.com" },
};

const StateOperators = () => {
  const [selectedState, setSelectedState] = useState<StateOperator | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-black text-secondary dark:text-white mb-4 font-display">
              Inscribe a tu Equipo
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
              Selecciona tu estado para conocer al operador del torneo en tu región
            </p>
          </div>

          {/* Map Section */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
            {/* Map */}
            <div className="xl:col-span-3">
              <div className="bg-card rounded-2xl p-4 md:p-6 shadow-lg border">
                <MexicoMap 
                  onStateHover={setHoveredState}
                  onStateClick={(stateId) => {
                    const operator = stateOperators[stateId];
                    if (operator) setSelectedState(operator);
                  }}
                  hoveredState={hoveredState}
                />
              </div>
              <p className="text-center text-sm text-muted-foreground mt-4">
                Pasa el cursor sobre un estado para ver la información del operador
              </p>
            </div>

            {/* Info Panel */}
            <div className="xl:col-span-1 xl:sticky xl:top-24">
              <Card className={`transition-all duration-300 ${selectedState || hoveredState ? 'opacity-100 translate-y-0' : 'opacity-50'}`}>
                <CardContent className="p-6">
                  {(selectedState || (hoveredState && stateOperators[hoveredState])) ? (
                    <>
                      {(() => {
                        const operator = selectedState || (hoveredState ? stateOperators[hoveredState] : null);
                        if (!operator) return null;
                        return (
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 pb-4 border-b">
                              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-bold text-xl text-secondary dark:text-white">
                                  {operator.stateName}
                                </h3>
                                <p className="text-sm text-muted-foreground">Operador del Torneo</p>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              {operator.subOperators ? (
                                operator.subOperators.map((sub, idx) => (
                                  <div key={idx} className={`space-y-2 ${idx > 0 ? 'pt-3 border-t' : ''}`}>
                                    <p className="text-xs font-semibold text-primary uppercase tracking-wide">{sub.zone}</p>
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">Operador</p>
                                      <p className="font-semibold text-secondary dark:text-white">{sub.name}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Mail className="w-4 h-4 text-primary" />
                                      <a href={`mailto:${sub.email}`} className="text-primary hover:underline font-medium text-sm break-all">
                                        {sub.email}
                                      </a>
                                    </div>
                                    {sub.phone && (
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-primary" />
                                        <a href={`tel:${sub.phone}`} className="text-primary hover:underline font-medium text-sm">
                                          {sub.phone}
                                        </a>
                                      </div>
                                    )}
                                    <a
                                      href={`mailto:${sub.email}?subject=Inscripción Copa Telmex Telcel - ${operator.stateName} (${sub.zone})`}
                                      className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-2 px-3 rounded-lg transition-colors text-sm"
                                    >
                                      <Mail className="w-3 h-3" />
                                      Contactar
                                    </a>
                                  </div>
                                ))
                              ) : (
                                <>
                                  <div>
                                    <p className="text-sm text-muted-foreground mb-1">Nombre del Operador</p>
                                    <p className="font-semibold text-secondary dark:text-white">{operator.name}</p>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-primary" />
                                    <a href={`mailto:${operator.email}`} className="text-primary hover:underline font-medium">
                                      {operator.email}
                                    </a>
                                  </div>
                                  
                                  {operator.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-4 h-4 text-primary" />
                                      <a href={`tel:${operator.phone.replace(/\s/g, '')}`} className="text-primary hover:underline font-medium">
                                        {operator.phone}
                                      </a>
                                    </div>
                                  )}

                                  <div className="pt-4 border-t">
                                    <a
                                      href={`mailto:${operator.email}?subject=Inscripción Copa Telmex Telcel - ${operator.stateName}`}
                                      className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                                    >
                                      <Mail className="w-4 h-4" />
                                      Contactar Operador
                                    </a>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Selecciona un estado en el mapa para ver la información del operador
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StateOperators;
