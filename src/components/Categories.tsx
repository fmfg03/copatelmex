import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import categoryVaronil from "@/assets/category-varonil-telmex.jpg";
import categoryJuvenil from "@/assets/category-juvenil-telmex.jpg";
import categoryFemenil from "@/assets/category-femenil-telmex.jpg";

export const Categories = () => {
  const categories = [
    {
      year: "18 y mayores",
      hoverText: "Varonil Libre (18 años y mayores)",
      type: "Varonil",
      ageInfo: "18+ años",
      description: "Categoría Varonil",
      maxPlayers: 35,
      image: categoryVaronil
    },
    {
      year: "15, 16 y 17 años",
      hoverText: "Juvenil (15, 16 y 17 años)",
      type: "Juvenil",
      ageInfo: "15-17 años",
      description: "Categoría Juvenil",
      maxPlayers: 35,
      image: categoryJuvenil
    },
    {
      year: "14 y mayores",
      hoverText: "Femenil (14 años y mayores)",
      type: "Femenil",
      ageInfo: "14+ años",
      description: "Categoría Femenil",
      maxPlayers: 35,
      image: categoryFemenil
    }
  ];

  return (
    <section id="categorias" className="py-12 sm:py-16 md:py-24 bg-muted">
      <div className="container mx-auto px-4 animate-fade-in-up">
        <div className="max-w-5xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10 sm:mb-14 md:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-secondary mb-4 md:mb-6 tracking-tight">
              Categorías del Torneo
            </h2>
            <div className="w-16 sm:w-20 md:w-24 h-1 bg-primary mx-auto mb-5 md:mb-8"></div>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto mb-4 md:mb-6 leading-relaxed text-center font-bold px-2">
              Mínimo 16 · Máximo 35 jugadores por equipo en todas las categorías
            </p>
            <Badge variant="outline" className="text-sm sm:text-base md:text-lg px-4 sm:px-5 md:px-6 py-2 md:py-3 border-2 border-primary text-primary font-semibold">
              Tres Categorías Disponibles
            </Badge>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {categories.map((category, index) => (
              <div 
                key={index} 
                className="group relative overflow-hidden rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-1 md:hover:-translate-y-2 transition-all duration-300 cursor-pointer animate-fade-in" 
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Image Container */}
                <div className="relative h-64 sm:h-72 md:h-80 overflow-hidden">
                  {/* Category Image */}
                  <img 
                    src={category.image} 
                    alt={`Categoría ${category.type} ${category.year}`} 
                    loading="lazy" 
                    width="400" 
                    height="320" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" 
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/95 via-secondary/40 to-transparent"></div>
                  
                  {/* Shimmer Effect on Hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 md:p-6 text-white">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <div className="bg-accent text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-bold text-xl sm:text-2xl shadow-lg relative overflow-hidden min-w-[180px] sm:min-w-[220px]">
                        {/* Year text - visible by default, hidden on hover */}
                        <span className="block transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-full">
                          {category.year}
                        </span>
                        {/* Age info - hidden by default, visible on hover */}
                        <span className="absolute inset-0 flex items-center justify-center px-3 sm:px-4 transition-all duration-300 opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0">
                          {category.hoverText}
                        </span>
                      </div>
                    </div>
                    <p className="text-base sm:text-lg text-white font-semibold mb-1 sm:mb-2">
                      {category.type}
                    </p>
                    <div className="flex items-center gap-2 text-white/80 font-medium text-xs sm:text-sm">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Máximo {category.maxPlayers} jugadores por equipo</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};