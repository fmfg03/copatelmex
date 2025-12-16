import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import categoryFemenil2012 from "@/assets/category-femenil-2012.jpg";
import categoryVaronil2008 from "@/assets/category-varonil-2008.jpg";
import categoryJuvenil2009 from "@/assets/category-juvenil-2009.jpg";
import categoryJuvenil2010 from "@/assets/category-juvenil-2010.jpg";
import categoryJuvenil2011 from "@/assets/category-juvenil-2011.jpg";

export const Categories = () => {
  const categories = [
    {
      year: "2012",
      type: "Femenil",
      format: "Fútbol 11",
      description: "Categoría Femenil",
      maxPlayers: 22,
      image: categoryFemenil2012
    },
    {
      year: "2011",
      type: "Juvenil",
      format: "Fútbol 11",
      description: "Categoría Juvenil",
      maxPlayers: 22,
      image: categoryJuvenil2011
    },
    {
      year: "2010",
      type: "Juvenil",
      format: "Fútbol 11",
      description: "Categoría Juvenil",
      maxPlayers: 22,
      image: categoryJuvenil2010
    },
    {
      year: "2009",
      type: "Juvenil",
      format: "Fútbol 11",
      description: "Categoría Juvenil",
      maxPlayers: 22,
      image: categoryJuvenil2009
    },
    {
      year: "2008",
      type: "Varonil",
      format: "Fútbol 11",
      description: "Categoría Varonil",
      maxPlayers: 22,
      image: categoryVaronil2008
    }
  ];

  return (
    <section id="categorias" className="py-24 bg-muted">
      <div className="container mx-auto px-4 animate-fade-in-up">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-secondary mb-6 tracking-tight">
              Categorías
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto mb-8"></div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-6 leading-relaxed text-center font-bold">
              Todas las categorías juegan <strong className="text-primary">Fútbol 11</strong>
            </p>
            <Badge variant="outline" className="text-lg px-6 py-3 border-2 border-primary text-primary font-semibold">
              Cinco Categorías Disponibles
            </Badge>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {categories.map((category, index) => (
              <div 
                key={index} 
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer animate-fade-in" 
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Image Container */}
                <div className="relative h-80 overflow-hidden">
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
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-accent text-white px-4 py-2 rounded-lg font-bold text-2xl shadow-lg">
                        {category.year}
                      </div>
                      <Badge className="bg-white/20 backdrop-blur-sm text-white text-sm px-3 py-1 font-semibold shadow-lg border border-white/30">
                        {category.format}
                      </Badge>
                    </div>
                    <p className="text-lg text-white font-semibold mb-2">
                      {category.type}
                    </p>
                    <div className="flex items-center gap-2 text-white/80 font-medium text-sm">
                      <Users className="w-4 h-4" />
                      <span>Máximo {category.maxPlayers} jugadores</span>
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
