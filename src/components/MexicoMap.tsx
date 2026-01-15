import { memo } from "react";

interface MexicoMapProps {
  onStateHover: (stateId: string | null) => void;
  onStateClick: (stateId: string) => void;
  hoveredState: string | null;
}

// Mexico states SVG paths - simplified representation
const mexicoStates = [
  { id: "baja-california", name: "Baja California", d: "M45,40 L65,35 L70,80 L55,120 L40,110 L35,70 Z" },
  { id: "baja-california-sur", name: "Baja California Sur", d: "M40,120 L55,125 L60,180 L50,220 L35,210 L30,160 Z" },
  { id: "sonora", name: "Sonora", d: "M70,40 L130,35 L140,100 L100,130 L70,110 Z" },
  { id: "chihuahua", name: "Chihuahua", d: "M130,40 L190,45 L200,130 L140,140 L130,100 Z" },
  { id: "coahuila", name: "Coahuila", d: "M190,50 L250,60 L260,140 L200,150 L190,100 Z" },
  { id: "nuevo-leon", name: "Nuevo León", d: "M250,70 L290,80 L295,150 L260,155 L250,110 Z" },
  { id: "tamaulipas", name: "Tamaulipas", d: "M290,85 L330,100 L335,190 L295,200 L285,150 Z" },
  { id: "sinaloa", name: "Sinaloa", d: "M70,115 L110,130 L115,200 L80,210 L65,170 Z" },
  { id: "durango", name: "Durango", d: "M115,135 L170,140 L180,210 L130,220 L115,180 Z" },
  { id: "zacatecas", name: "Zacatecas", d: "M170,145 L220,150 L230,210 L180,220 L170,180 Z" },
  { id: "san-luis-potosi", name: "San Luis Potosí", d: "M220,155 L275,160 L280,230 L230,240 L220,200 Z" },
  { id: "nayarit", name: "Nayarit", d: "M80,215 L115,220 L120,260 L90,270 L75,250 Z" },
  { id: "jalisco", name: "Jalisco", d: "M90,225 L155,230 L165,290 L110,300 L85,275 Z" },
  { id: "aguascalientes", name: "Aguascalientes", d: "M170,225 L195,228 L200,255 L175,260 L168,245 Z" },
  { id: "guanajuato", name: "Guanajuato", d: "M175,260 L225,265 L235,300 L190,310 L175,290 Z" },
  { id: "queretaro", name: "Querétaro", d: "M235,265 L265,270 L270,300 L245,305 L235,285 Z" },
  { id: "hidalgo", name: "Hidalgo", d: "M265,275 L300,280 L305,315 L275,320 L265,300 Z" },
  { id: "colima", name: "Colima", d: "M95,305 L125,308 L130,335 L105,340 L95,325 Z" },
  { id: "michoacan", name: "Michoacán", d: "M110,295 L175,300 L185,355 L130,365 L105,340 Z" },
  { id: "estado-de-mexico", name: "Estado de México", d: "M235,310 L275,315 L280,350 L245,355 L235,335 Z" },
  { id: "ciudad-de-mexico", name: "Ciudad de México", d: "M255,330 L270,332 L272,348 L258,350 L255,342 Z" },
  { id: "tlaxcala", name: "Tlaxcala", d: "M280,320 L300,322 L302,340 L283,342 L280,332 Z" },
  { id: "puebla", name: "Puebla", d: "M280,345 L320,350 L330,400 L295,410 L280,380 Z" },
  { id: "morelos", name: "Morelos", d: "M245,360 L275,362 L280,385 L250,390 L245,378 Z" },
  { id: "guerrero", name: "Guerrero", d: "M130,370 L220,375 L240,440 L160,450 L120,410 Z" },
  { id: "veracruz", name: "Veracruz", d: "M300,285 L340,200 L380,260 L370,400 L330,410 L310,350 Z" },
  { id: "oaxaca", name: "Oaxaca", d: "M220,420 L310,415 L330,470 L250,490 L210,460 Z" },
  { id: "tabasco", name: "Tabasco", d: "M350,365 L400,360 L410,395 L365,405 L350,385 Z" },
  { id: "chiapas", name: "Chiapas", d: "M330,420 L400,410 L420,490 L360,510 L325,470 Z" },
  { id: "campeche", name: "Campeche", d: "M390,320 L440,310 L455,380 L420,400 L390,370 Z" },
  { id: "yucatan", name: "Yucatán", d: "M420,270 L480,265 L490,320 L445,330 L420,300 Z" },
  { id: "quintana-roo", name: "Quintana Roo", d: "M480,270 L520,275 L530,400 L490,420 L475,350 L485,300 Z" },
];

export const MexicoMap = memo(({ onStateHover, onStateClick, hoveredState }: MexicoMapProps) => {
  return (
    <svg
      viewBox="0 0 560 530"
      className="w-full h-auto max-h-[500px]"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background */}
      <rect x="0" y="0" width="560" height="530" fill="transparent" />
      
      {/* States */}
      {mexicoStates.map((state) => (
        <path
          key={state.id}
          d={state.d}
          className={`transition-all duration-200 cursor-pointer stroke-2 ${
            hoveredState === state.id
              ? "fill-primary stroke-primary/80 drop-shadow-lg"
              : "fill-secondary/20 stroke-secondary/40 hover:fill-primary/60 hover:stroke-primary/70 dark:fill-white/10 dark:stroke-white/30 dark:hover:fill-primary/60"
          }`}
          onMouseEnter={() => onStateHover(state.id)}
          onMouseLeave={() => onStateHover(null)}
          onClick={() => onStateClick(state.id)}
        >
          <title>{state.name}</title>
        </path>
      ))}
      
      {/* State labels for larger states */}
      <g className="pointer-events-none text-[8px] font-medium fill-secondary/70 dark:fill-white/70">
        <text x="52" y="75" textAnchor="middle">BC</text>
        <text x="47" y="170" textAnchor="middle">BCS</text>
        <text x="105" y="85" textAnchor="middle">SON</text>
        <text x="165" y="95" textAnchor="middle">CHIH</text>
        <text x="225" y="105" textAnchor="middle">COAH</text>
        <text x="272" y="115" textAnchor="middle">NL</text>
        <text x="310" y="145" textAnchor="middle">TAMPS</text>
        <text x="90" y="165" textAnchor="middle">SIN</text>
        <text x="145" y="180" textAnchor="middle">DGO</text>
        <text x="200" y="185" textAnchor="middle">ZAC</text>
        <text x="250" y="200" textAnchor="middle">SLP</text>
        <text x="95" y="245" textAnchor="middle">NAY</text>
        <text x="125" y="265" textAnchor="middle">JAL</text>
        <text x="185" y="245" textAnchor="middle">AGS</text>
        <text x="205" y="285" textAnchor="middle">GTO</text>
        <text x="250" y="290" textAnchor="middle">QRO</text>
        <text x="285" y="300" textAnchor="middle">HGO</text>
        <text x="110" y="325" textAnchor="middle">COL</text>
        <text x="145" y="335" textAnchor="middle">MICH</text>
        <text x="255" y="335" textAnchor="middle">MEX</text>
        <text x="263" y="342" textAnchor="middle" className="text-[6px]">CDMX</text>
        <text x="290" y="335" textAnchor="middle" className="text-[6px]">TLAX</text>
        <text x="305" y="380" textAnchor="middle">PUE</text>
        <text x="260" y="378" textAnchor="middle" className="text-[6px]">MOR</text>
        <text x="175" y="415" textAnchor="middle">GRO</text>
        <text x="350" y="320" textAnchor="middle">VER</text>
        <text x="270" y="455" textAnchor="middle">OAX</text>
        <text x="380" y="385" textAnchor="middle">TAB</text>
        <text x="370" y="460" textAnchor="middle">CHIS</text>
        <text x="420" y="355" textAnchor="middle">CAM</text>
        <text x="455" y="300" textAnchor="middle">YUC</text>
        <text x="505" y="345" textAnchor="middle">QROO</text>
      </g>
    </svg>
  );
});

MexicoMap.displayName = "MexicoMap";
