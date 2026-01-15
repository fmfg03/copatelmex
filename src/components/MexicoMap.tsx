import { memo, useState } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MexicoMapProps {
  onStateHover: (stateId: string | null) => void;
  onStateClick: (stateId: string) => void;
  hoveredState: string | null;
}

// TopoJSON de México desde fuente confiable
const MEXICO_TOPO_URL = "https://raw.githubusercontent.com/angelnmara/geojson/master/mexicoHigh.json";

// Mapeo de nombres de estados a IDs usados en nuestro sistema
const stateNameToId: Record<string, string> = {
  "Aguascalientes": "aguascalientes",
  "Baja California": "baja-california",
  "Baja California Sur": "baja-california-sur",
  "Campeche": "campeche",
  "Chiapas": "chiapas",
  "Chihuahua": "chihuahua",
  "Coahuila de Zaragoza": "coahuila",
  "Coahuila": "coahuila",
  "Colima": "colima",
  "Ciudad de México": "ciudad-de-mexico",
  "Distrito Federal": "ciudad-de-mexico",
  "CDMX": "ciudad-de-mexico",
  "Durango": "durango",
  "Guanajuato": "guanajuato",
  "Guerrero": "guerrero",
  "Hidalgo": "hidalgo",
  "Jalisco": "jalisco",
  "México": "estado-de-mexico",
  "Estado de México": "estado-de-mexico",
  "Michoacán de Ocampo": "michoacan",
  "Michoacán": "michoacan",
  "Morelos": "morelos",
  "Nayarit": "nayarit",
  "Nuevo León": "nuevo-leon",
  "Oaxaca": "oaxaca",
  "Puebla": "puebla",
  "Querétaro": "queretaro",
  "Quintana Roo": "quintana-roo",
  "San Luis Potosí": "san-luis-potosi",
  "Sinaloa": "sinaloa",
  "Sonora": "sonora",
  "Tabasco": "tabasco",
  "Tamaulipas": "tamaulipas",
  "Tlaxcala": "tlaxcala",
  "Veracruz de Ignacio de la Llave": "veracruz",
  "Veracruz": "veracruz",
  "Yucatán": "yucatan",
  "Zacatecas": "zacatecas",
};

const getStateId = (properties: any): string => {
  const name = properties.name || properties.NAME || properties.estado || properties.ESTADO || properties.NAME_1 || "";
  return stateNameToId[name] || name.toLowerCase().replace(/\s+/g, '-').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const getStateName = (properties: any): string => {
  return properties.name || properties.NAME || properties.estado || properties.ESTADO || properties.NAME_1 || "Estado";
};

export const MexicoMap = memo(({ onStateHover, onStateClick, hoveredState }: MexicoMapProps) => {
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([-102, 23]);
  const [tooltipContent, setTooltipContent] = useState("");
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleZoomIn = () => {
    if (zoom < 8) setZoom(zoom * 1.5);
  };

  const handleZoomOut = () => {
    if (zoom > 1) setZoom(zoom / 1.5);
  };

  const handleReset = () => {
    setZoom(1);
    setCenter([-102, 23]);
  };

  const handleMoveEnd = (position: { coordinates: [number, number]; zoom: number }) => {
    setCenter(position.coordinates);
    setZoom(position.zoom);
  };

  const handleMouseMove = (event: React.MouseEvent, stateName: string) => {
    setTooltipContent(stateName);
    setTooltipPosition({ x: event.clientX, y: event.clientY });
  };

  const handleMouseLeave = () => {
    setTooltipContent("");
  };

  return (
    <div className="relative">
      {/* Tooltip flotante */}
      {tooltipContent && (
        <div
          className="fixed z-50 px-3 py-2 text-sm font-semibold text-white bg-secondary rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y - 10,
          }}
        >
          {tooltipContent}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-secondary" />
        </div>
      )}

      {/* Controles de zoom */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          disabled={zoom >= 8}
          className="bg-white/90 hover:bg-white shadow-md"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          disabled={zoom <= 1}
          className="bg-white/90 hover:bg-white shadow-md"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleReset}
          className="bg-white/90 hover:bg-white shadow-md"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Indicador de zoom */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/90 px-3 py-1.5 rounded-full text-xs font-medium text-secondary shadow-md">
        Zoom: {Math.round(zoom * 100)}%
      </div>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1200,
          center: [-102, 23],
        }}
        className="w-full h-auto"
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup
          center={center}
          zoom={zoom}
          minZoom={1}
          maxZoom={8}
          onMoveEnd={handleMoveEnd}
          translateExtent={[
            [-200, -100],
            [800, 500],
          ]}
        >
          <Geographies geography={MEXICO_TOPO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const stateId = getStateId(geo.properties);
                const stateName = getStateName(geo.properties);
                const isHovered = hoveredState === stateId;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(event) => {
                      onStateHover(stateId);
                      handleMouseMove(event as unknown as React.MouseEvent, stateName);
                    }}
                    onMouseMove={(event) => {
                      handleMouseMove(event as unknown as React.MouseEvent, stateName);
                    }}
                    onMouseLeave={() => {
                      onStateHover(null);
                      handleMouseLeave();
                    }}
                    onClick={() => onStateClick(stateId)}
                    style={{
                      default: {
                        fill: isHovered ? "hsl(var(--primary))" : "hsl(var(--secondary) / 0.2)",
                        stroke: isHovered ? "hsl(var(--primary) / 0.8)" : "hsl(var(--secondary) / 0.4)",
                        strokeWidth: isHovered ? 1.5 : 0.5,
                        outline: "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                      },
                      hover: {
                        fill: "hsl(var(--primary) / 0.7)",
                        stroke: "hsl(var(--primary))",
                        strokeWidth: 1.5,
                        outline: "none",
                        cursor: "pointer",
                      },
                      pressed: {
                        fill: "hsl(var(--primary))",
                        stroke: "hsl(var(--primary))",
                        strokeWidth: 2,
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Instrucciones */}
      <p className="text-center text-xs text-muted-foreground mt-2">
        Usa la rueda del mouse o los botones para hacer zoom • Arrastra para mover el mapa
      </p>
    </div>
  );
});

MexicoMap.displayName = "MexicoMap";
