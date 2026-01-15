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
}

// Datos de ejemplo para operadores por estado
export const stateOperators: Record<string, StateOperator> = {
  "aguascalientes": { id: "ags", stateName: "Aguascalientes", name: "Juan Pérez García", email: "aguascalientes@copatelmex.mx", phone: "449 123 4567" },
  "baja-california": { id: "bc", stateName: "Baja California", name: "María López Hernández", email: "bajacalifornia@copatelmex.mx", phone: "664 234 5678" },
  "baja-california-sur": { id: "bcs", stateName: "Baja California Sur", name: "Carlos Mendoza Ruiz", email: "bajacaliforniasur@copatelmex.mx", phone: "612 345 6789" },
  "campeche": { id: "cam", stateName: "Campeche", name: "Ana Martínez Soto", email: "campeche@copatelmex.mx", phone: "981 456 7890" },
  "chiapas": { id: "chis", stateName: "Chiapas", name: "Roberto Díaz Luna", email: "chiapas@copatelmex.mx", phone: "961 567 8901" },
  "chihuahua": { id: "chih", stateName: "Chihuahua", name: "Laura Sánchez Mora", email: "chihuahua@copatelmex.mx", phone: "614 678 9012" },
  "ciudad-de-mexico": { id: "cdmx", stateName: "Ciudad de México", name: "Fernando Torres Vega", email: "cdmx@copatelmex.mx", phone: "55 7890 1234" },
  "coahuila": { id: "coah", stateName: "Coahuila", name: "Patricia Ramírez Cruz", email: "coahuila@copatelmex.mx", phone: "844 890 1234" },
  "colima": { id: "col", stateName: "Colima", name: "Miguel Ángel Flores", email: "colima@copatelmex.mx", phone: "312 901 2345" },
  "durango": { id: "dgo", stateName: "Durango", name: "Gabriela Ortiz Peña", email: "durango@copatelmex.mx", phone: "618 012 3456" },
  "guanajuato": { id: "gto", stateName: "Guanajuato", name: "José Luis Hernández", email: "guanajuato@copatelmex.mx", phone: "477 123 4567" },
  "guerrero": { id: "gro", stateName: "Guerrero", name: "Verónica Castro Ríos", email: "guerrero@copatelmex.mx", phone: "747 234 5678" },
  "hidalgo": { id: "hgo", stateName: "Hidalgo", name: "Alejandro Morales", email: "hidalgo@copatelmex.mx", phone: "771 345 6789" },
  "jalisco": { id: "jal", stateName: "Jalisco", name: "Sandra González Luna", email: "jalisco@copatelmex.mx", phone: "33 4567 8901" },
  "estado-de-mexico": { id: "mex", stateName: "Estado de México", name: "Ricardo Juárez Téllez", email: "edomex@copatelmex.mx", phone: "722 567 8901" },
  "michoacan": { id: "mich", stateName: "Michoacán", name: "Claudia Vargas Núñez", email: "michoacan@copatelmex.mx", phone: "443 678 9012" },
  "morelos": { id: "mor", stateName: "Morelos", name: "Arturo Reyes Silva", email: "morelos@copatelmex.mx", phone: "777 789 0123" },
  "nayarit": { id: "nay", stateName: "Nayarit", name: "Elena Medina Rojas", email: "nayarit@copatelmex.mx", phone: "311 890 1234" },
  "nuevo-leon": { id: "nl", stateName: "Nuevo León", name: "Héctor Guzmán Ávila", email: "nuevoleon@copatelmex.mx", phone: "81 9012 3456" },
  "oaxaca": { id: "oax", stateName: "Oaxaca", name: "Mariana Jiménez López", email: "oaxaca@copatelmex.mx", phone: "951 012 3456" },
  "puebla": { id: "pue", stateName: "Puebla", name: "Eduardo Salazar Mora", email: "puebla@copatelmex.mx", phone: "222 123 4567" },
  "queretaro": { id: "qro", stateName: "Querétaro", name: "Lucía Fernández Ruiz", email: "queretaro@copatelmex.mx", phone: "442 234 5678" },
  "quintana-roo": { id: "qroo", stateName: "Quintana Roo", name: "Óscar Mendez García", email: "quintanaroo@copatelmex.mx", phone: "998 345 6789" },
  "san-luis-potosi": { id: "slp", stateName: "San Luis Potosí", name: "Teresa Aguilar Vega", email: "sanluispotosi@copatelmex.mx", phone: "444 456 7890" },
  "sinaloa": { id: "sin", stateName: "Sinaloa", name: "Jorge Ramos Ochoa", email: "sinaloa@copatelmex.mx", phone: "667 567 8901" },
  "sonora": { id: "son", stateName: "Sonora", name: "Adriana Lara Campos", email: "sonora@copatelmex.mx", phone: "662 678 9012" },
  "tabasco": { id: "tab", stateName: "Tabasco", name: "Francisco Navarro Díaz", email: "tabasco@copatelmex.mx", phone: "993 789 0123" },
  "tamaulipas": { id: "tam", stateName: "Tamaulipas", name: "Mónica Estrada Solís", email: "tamaulipas@copatelmex.mx", phone: "834 890 1234" },
  "tlaxcala": { id: "tlax", stateName: "Tlaxcala", name: "Raúl Cortés Méndez", email: "tlaxcala@copatelmex.mx", phone: "246 901 2345" },
  "veracruz": { id: "ver", stateName: "Veracruz", name: "Isabel Herrera Paz", email: "veracruz@copatelmex.mx", phone: "229 012 3456" },
  "yucatan": { id: "yuc", stateName: "Yucatán", name: "Daniel Pacheco Luna", email: "yucatan@copatelmex.mx", phone: "999 123 4567" },
  "zacatecas": { id: "zac", stateName: "Zacatecas", name: "Rosa María Delgado", email: "zacatecas@copatelmex.mx", phone: "492 234 5678" },
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
                              <div>
                                <p className="text-sm text-muted-foreground mb-1">Nombre del Operador</p>
                                <p className="font-semibold text-secondary dark:text-white">{operator.name}</p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-primary" />
                                <a 
                                  href={`mailto:${operator.email}`}
                                  className="text-primary hover:underline font-medium"
                                >
                                  {operator.email}
                                </a>
                              </div>
                              
                              {operator.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-primary" />
                                  <a 
                                    href={`tel:${operator.phone.replace(/\s/g, '')}`}
                                    className="text-primary hover:underline font-medium"
                                  >
                                    {operator.phone}
                                  </a>
                                </div>
                              )}
                            </div>

                            <div className="pt-4 border-t">
                              <a
                                href={`mailto:${operator.email}?subject=Inscripción Copa Telmex Telcel - ${operator.stateName}`}
                                className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                              >
                                <Mail className="w-4 h-4" />
                                Contactar Operador
                              </a>
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
