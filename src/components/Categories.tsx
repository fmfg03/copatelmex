import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import categoryImage from "@/assets/nido-aguila-mascot-new.png";
import womenTournamentTeaser from "@/assets/women-tournament-teaser.jpg";
export const Categories = () => {
  const categories = [{
    year: "2020",
    age: "Fut 5",
    description: "Categoría mas pequeña",
    image: categoryImage
  }, {
    year: "2019",
    age: "Fut 5",
    description: "Iniciación al fútbol competitivo.",
    image: categoryImage
  }, {
    year: "2018",
    age: "Fut 5",
    description: "Desarrollo de habilidades básicas.",
    image: categoryImage
  }, {
    year: "2017",
    age: "Fut 7",
    description: "Técnica y trabajo en equipo.",
    image: categoryImage
  }, {
    year: "2016",
    age: "Fut 7",
    description: "Desarrollo táctico avanzado.",
    image: categoryImage
  }, {
    year: "2015",
    age: "Fut 7",
    description: "Competencia y técnica avanzadas",
    image: categoryImage
  }, {
    year: "2014",
    age: "Fut 7",
    description: "Categoría de mayor competencia.",
    image: categoryImage
  }];
  return <section id="categorias" className="py-24 bg-muted">
      <div className="container mx-auto px-4 animate-fade-in-up">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-secondary mb-6 tracking-tight">
              Categorías
            </h2>
            <div className="w-24 h-1 bg-america-blue mx-auto mb-8"></div>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-6 leading-relaxed text-center font-bold">
              Categorías 2020, 2019 y 2018 juegan <strong>Fútbol 5</strong>
              <br />
              Categorías 2017, 2016, 2015 y 2014 juegan <strong>Fútbol 7</strong>
            </p>
            <Badge variant="outline" className="text-lg px-6 py-3 border-2 border-america-blue text-america-blue font-semibold">
              Siete Categorías Disponibles
            </Badge>
            <p className="text-sm text-muted-foreground mt-6 font-medium text-center">
          </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {categories.map((category, index) => <div key={index} className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer animate-fade-in" style={{
            animationDelay: `${index * 0.15}s`
          }}>
                {/* Image Container */}
                <div className="relative h-96 overflow-hidden">
                  <img src={category.image} alt={`Categoría ${category.year}`} loading="lazy" width="400" height="384" className="w-full h-full object-cover object-center group-hover:scale-110 group-hover:rotate-1 transition-all duration-700" />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-secondary/95 via-secondary/60 to-transparent group-hover:from-secondary/85 transition-all duration-300"></div>
                  
                  {/* Shimmer Effect on Hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-america-yellow text-secondary px-4 py-2 rounded-lg font-bold text-2xl shadow-lg">
                        {category.year}
                      </div>
                      <Badge className="bg-america-blue text-white text-sm px-3 py-1 font-semibold shadow-lg">
                        {category.age}
                      </Badge>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed font-medium mb-3">
                      {category.description}
                    </p>
                    <div className="flex items-center gap-2 text-america-yellow font-semibold text-sm">
                      <Users className="w-4 h-4" />
                      <span>Máximo 16 jugadores</span>
                    </div>
                  </div>
                </div>
              </div>)}
            
            {/* Women's Tournament Teaser */}
            <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer animate-fade-in md:col-span-2" style={{
            animationDelay: `${categories.length * 0.15}s`
          }}>
              <div className="relative h-96 overflow-hidden bg-muted">
                <img src={womenTournamentTeaser} alt="Torneo Femenil Próximamente" loading="lazy" width="400" height="384" className="w-full h-full object-contain group-hover:scale-105 transition-all duration-700" />
                {/* Shimmer Effect on Hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};