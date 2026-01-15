import { memo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

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
  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{
        scale: 1200,
        center: [-102, 23],
      }}
      className="w-full h-auto"
      style={{ width: "100%", height: "auto" }}
    >
      <ZoomableGroup center={[-102, 23]} zoom={1} minZoom={1} maxZoom={1}>
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
                  onMouseEnter={() => onStateHover(stateId)}
                  onMouseLeave={() => onStateHover(null)}
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
                >
                  <title>{stateName}</title>
                </Geography>
              );
            })
          }
        </Geographies>
      </ZoomableGroup>
    </ComposableMap>
  );
});

MexicoMap.displayName = "MexicoMap";
