import sponsorKeuka from "@/assets/sponsor-keuka.png";
import sponsorZucaritas from "@/assets/sponsor-zucaritas.png";
import sponsorPowerade from "@/assets/sponsor-powerade.png";
import sponsorClaroSports from "@/assets/sponsor-claro-sports.png";

const sponsors = [
  { src: sponsorKeuka, alt: "Keuka", dark: false, url: null },
  { src: sponsorZucaritas, alt: "Zucaritas", dark: false, url: null },
  { src: sponsorPowerade, alt: "Powerade", dark: false, url: "https://www.coca-cola.com/mx/es/brands/powerade" },
  { src: sponsorClaroSports, alt: "Claro Sports", dark: false, url: null },
];

// Duplicate sponsors for seamless infinite loop
const duplicatedSponsors = [...sponsors, ...sponsors];

export const SponsorsCarousel = () => {
  return (
    <section className="py-12 bg-muted overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">Nuestros Patrocinadores</h2>
          <div className="w-24 h-1 bg-primary mx-auto"></div>
        </div>
      </div>
      
      {/* Infinite Carousel */}
      <div className="relative group">
        <div className="flex animate-scroll-x group-hover:[animation-play-state:paused]">
          {duplicatedSponsors.map((sponsor, index) => {
            const content = (
              <div
                className={`flex-shrink-0 mx-6 md:mx-10 p-6 rounded-xl ${sponsor.dark ? 'bg-secondary' : 'bg-white'} shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105`}
              >
                <img
                  src={sponsor.src}
                  alt={sponsor.alt}
                  className="h-10 md:h-14 w-auto object-contain"
                />
              </div>
            );
            return sponsor.url ? (
              <a key={index} href={sponsor.url} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            ) : (
              <div key={index}>{content}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
