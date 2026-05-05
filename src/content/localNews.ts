import coverImage from "@/assets/news/optimized/jalisco-inscripciones-cover.webp";
import galleryImage1 from "@/assets/news/optimized/jalisco-inscripciones-1.webp";
import galleryImage2 from "@/assets/news/optimized/jalisco-inscripciones-2.webp";
import galleryImage3 from "@/assets/news/optimized/jalisco-inscripciones-3.webp";
import galleryImage4 from "@/assets/news/optimized/jalisco-inscripciones-4.webp";

export interface LocalNewsArticle {
  id: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  location: string;
  coverImage: string;
  lead: string;
  paragraphs: string[];
  regions: string[];
  gallery: Array<{
    src: string;
    alt: string;
  }>;
}

export const localNewsArticles: LocalNewsArticle[] = [
  {
    id: "jalisco-abre-inscripciones",
    title: "Jalisco abre inscripciones en gran parte de sus 12 regiones",
    excerpt: "Copa Telmex Telcel abrió inscripciones en distintas regiones de Jalisco. ¿Tu equipo ya está listo?",
    publishedAt: "2026-05-06T12:00:00",
    location: "Jalisco, México",
    coverImage,
    lead: "Jalisco arrancó mayo con inscripciones abiertas en buena parte del estado para la Copa Telmex Telcel 2026, el torneo aficionado más grande del mundo.",
    paragraphs: [
      "Gracias al trabajo del Comité Organizador encabezado por Mauricio Figueroa, la convocatoria ya está en marcha e invita a ligas, escuelas y clubes a sumarse a uno de los certámenes con mayor tradición y alcance del país.",
      "Jalisco cuenta con 125 municipios. Para facilitar la logística y la operación del torneo, el comité organizador trabaja con una división administrativa por 12 regiones.",
      "También participa el Centro de Readaptación Social en su eliminatoria interna. Ahí se disputa una liga que funciona como certamen municipal y define al representante que buscará avanzar a la fase estatal.",
      "Más de 780 personas privadas de la libertad forman parte de esta dinámica de integración social a través del futbol.",
      "La eliminatoria de la Fase Estatal cerrará con sus finales en Soccerlife Bajío, complejo deportivo de Guadalajara.",
    ],
    regions: [
      "Norte",
      "Altos Norte",
      "Altos Sur",
      "Ciénega",
      "Sureste",
      "Sur",
      "Sierra de Amula",
      "Costa Sur",
      "Costa-Sierra Occidental",
      "Valles",
      "Lagunas",
      "Centro",
    ],
    gallery: [
      {
        src: galleryImage1,
        alt: "Convocatoria de inscripciones de Copa Telmex Telcel en Jalisco",
      },
      {
        src: galleryImage2,
        alt: "Actividad de registro regional en Jalisco",
      },
      {
        src: galleryImage3,
        alt: "Promoción de inscripciones en regiones de Jalisco",
      },
      {
        src: galleryImage4,
        alt: "Difusión de la eliminatoria estatal en Jalisco",
      },
    ],
  },
];

export const featuredLocalNewsArticle = localNewsArticles[0];

export const getLocalNewsArticleById = (id: string) =>
  localNewsArticles.find((article) => article.id === id);
